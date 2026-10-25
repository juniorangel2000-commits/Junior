import {nearRiverBank,isFiberPlant} from './data/fiber-plants';
import {paintedWaterPoint} from './data/terrain-paint';
import type {MapArea} from './data/default-maps';
import { NATURE_KINDS, NATURE_ART, natureArt } from './data/nature-catalog';
import Phaser from 'phaser';
import { MapEditorUI } from './map-editor-ui';
import type { EditorAction, EditorTool } from './map-editor-ui';
import { MapEditHistory, cloneMapEdits, createEditorObjectId, isProtectedMapTile, isProtectedTerrainTile, loadMapDraft, parseMapEdits, saveMapDraft } from './systems/map-editor';
import type { EditorObjectKind, MapEditData } from './systems/map-editor';
import { isWaterTile, TILE, WORLD_HEIGHT, WORLD_WIDTH } from './data/regions';
import type { WorldEditorObject } from './world';
import {isTreeKind,treeGroundClear} from './systems/tree-ground';

export interface MapEditorAdapter {
  rebuild(edits: MapEditData): void;
  objects(): WorldEditorObject[];
  originalObjects: WorldEditorObject[];
  protectedTile(x: number, y: number): boolean;
  protectedTerrainTile?(x:number,y:number):boolean;
  canPlace(x: number, y: number, ignoreId?: string, kind?: EditorObjectKind): boolean;
  baseWater?(x:number,y:number):boolean;
  baseWaterPoint?(x:number,y:number):boolean;
  defaultPoints?: {entry:{x:number;y:number};exit:{x:number;y:number}};
  apply(edits: MapEditData): boolean;
  cancel(): void;
  switchArea?(area:MapArea,current:MapEditData):void;
  resourcesHidden?: boolean;
  setResourcesHidden?(hidden:boolean):void;
}
type Point = { x: number; y: number };
const labels = {
  ...Object.fromEntries(NATURE_KINDS.map(kind=>[kind,NATURE_ART[kind].label])),
  standingTree: 'Árvore', pine: 'Pinheiro', stone: 'Pedras', vein: 'Rocha',
  tree: 'Galhos', fiber: 'Fibras', seeds: 'Sementes', scrap: 'Sucata',
} as Record<EditorObjectKind,string>;
const colors = { grass: 0x76965d, path: 0xc4a278, water: 0x619aaf, sand: 0xd8c499, soil: 0x997455,meadow:0x8a9d55,forest:0x345738,moss:0x3e6835,forestPath:0x4f6c3a,wetPath:0x7c6445,wood:0x996f41,paving:0x9d9a81 };
const key = (p: Point): string => `${p.x},${p.y}`;

/** Edit the real world while the scene's simulation and save writes are paused. */
export class MapEditor {
  private readonly ui: MapEditorUI;
  private readonly history: MapEditHistory;
  private readonly initial: string;
  private readonly canvas: HTMLCanvasElement;
  private guides!: Phaser.GameObjects.Graphics;
  private cursor!: Phaser.GameObjects.Graphics;
  private strokePreview!: Phaser.GameObjects.Graphics;
  private tool: EditorTool = { mode: 'select' };
  private brush = 1;
  private grid = true;
  private resourcesHidden = false;
  private space = false;
  private alive = true;
  private selected: string | null = null;
  private hover: Point | null = null;
  private stroke?: MapEditData;
  private lastTile?: Point;
  private pointerId?: number;
  private pan?: { screen: Point; scroll: Point };
  private moving?: WorldEditorObject;
  private strokeBlocked = false;
  private status = 'Troque os pisos livres. Construções, plantas e canteiros preparados ficam protegidos.';
  private storedDraft:MapEditData|null=null;

  constructor(private readonly scene: Phaser.Scene, initial: MapEditData, private readonly adapter: MapEditorAdapter, history?:MapEditHistory, initialJSON?:string) {
    this.history = history??new MapEditHistory(initial);
    this.resourcesHidden = !!adapter.resourcesHidden;
    this.storedDraft=loadMapDraft(undefined,initial.area);
    this.initial = initialJSON??JSON.stringify(cloneMapEdits(initial));
    this.canvas = scene.game.canvas;
    this.ui = new MapEditorUI({
      action: action => this.action(action),
      tool: tool => {
        this.finishStroke();
        if(this.resourcesHidden&&['select','object','remove'].includes(tool.mode))this.setResourcesHidden(false);
        this.tool = tool; this.selected = null; this.drawCursor(); this.refresh();
      },
      brush: size => { this.brush = size; this.drawCursor(); },
      import: text => this.importMap(text),
    });
    this.ui.element.querySelector('h1')!.textContent=initial.area==='forest'?'Editor · Floresta Antiga':'Editor · Propriedade';
    if(initial.area==='forest')this.status='Edite a floresta. As clareiras dos animais ficam protegidas.';
    for(const button of this.ui.element.querySelectorAll<HTMLButtonElement>('[data-map-area]')){button.disabled=!adapter.switchArea||button.dataset.mapArea===(initial.area??'property');button.setAttribute('aria-pressed',String(button.dataset.mapArea===(initial.area??'property')));}
    this.createGuides();
    this.fit();
    const images: Partial<Record<EditorObjectKind, string>> = {};
    for (const object of adapter.objects()) if (!images[object.kind] && !object.depleted) {
      images[object.kind] = scene.textures.getBase64(object.texture);
    }
    for(const kind of NATURE_KINDS)if(scene.textures.exists(NATURE_ART[kind].texture))images[kind]=scene.textures.getBase64(NATURE_ART[kind].texture);
    this.ui.setThumbnails(images);
    const materials:Record<string,string>={grass:'grass',meadow:'meadow',forest:'forest',moss:'moss',forestPath:'forest',path:'path-dry',wetPath:'path-wet',water:'water',sand:'sand',soil:'soil',wood:'wood',paving:'paving'};
    for(const [kind,material] of Object.entries(materials)){
      const swatch=this.ui.element.querySelector<HTMLElement>(`.me-swatch-${kind}`),texture=`asset-ground-${material}`;
      if(swatch&&scene.textures.exists(texture)){swatch.style.backgroundImage=`url("${scene.textures.getBase64(texture)}")`;swatch.style.backgroundSize='cover';}
    }
    this.ui.element.dataset.mapArea=initial.area??'property';
    this.canvas.addEventListener('pointerdown', this.pointerDown);
    this.canvas.addEventListener('pointermove', this.pointerMove);
    this.canvas.addEventListener('pointerup', this.pointerUp);
    this.canvas.addEventListener('pointercancel', this.pointerCancel);
    this.canvas.addEventListener('lostpointercapture', this.pointerCancel);
    this.canvas.addEventListener('wheel', this.wheel, { passive: false });
    window.addEventListener('keydown', this.keyDown, true);
    window.addEventListener('keyup', this.keyUp, true);
    window.addEventListener('blur', this.blur);
    this.refresh();
  }

  private createGuides(): void {
    const camera = this.scene.cameras.main;
    camera.stopFollow().removeBounds().setRotation(0);
    this.guides?.destroy();this.cursor?.destroy();this.strokePreview?.destroy();
    this.guides = this.scene.add.graphics().setDepth(9000);
    this.strokePreview = this.scene.add.graphics().setDepth(9001);
    this.cursor = this.scene.add.graphics().setDepth(9002);
    this.drawGrid();
  }

  private drawGrid(): void {
    this.guides.clear().setVisible(this.grid);
    if (!this.grid) return;
    const zoom = this.scene.cameras.main.zoom;
    this.guides.lineStyle(1 / zoom, 0x233b32, .17);
    for (let x = 0; x <= WORLD_WIDTH; x++) this.guides.lineBetween(x * TILE, 0, x * TILE, WORLD_HEIGHT * TILE);
    for (let y = 0; y <= WORLD_HEIGHT; y++) this.guides.lineBetween(0, y * TILE, WORLD_WIDTH * TILE, y * TILE);
    const points={...this.adapter.defaultPoints,...this.history.current.points};
    for(const [type,p] of Object.entries(points))if(p){this.guides.lineStyle(3/zoom,type==='entry'?0x80e8cd:0xf7c97c,1).strokeCircle(p.x*TILE+16,p.y*TILE+16,18);this.guides.lineBetween(p.x*TILE+8,p.y*TILE+16,p.x*TILE+24,p.y*TILE+16);if(type==='entry')this.guides.lineBetween(p.x*TILE+16,p.y*TILE+8,p.x*TILE+16,p.y*TILE+24);}
    this.guides.lineStyle(2 / zoom, 0xe8d9ae, .8).strokeRect(0, 0, WORLD_WIDTH * TILE, WORLD_HEIGHT * TILE);
    this.guides.fillStyle(0xd5ac5d, .14);
    for (let y = 1; y < WORLD_HEIGHT - 1; y++) for (let x = 1; x < WORLD_WIDTH - 1; x++) {
      if (this.adapter.protectedTile(x, y)) this.guides.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }

  private viewport(): { x: number; y: number; width: number; height: number } {
    const bounds = this.canvas.getBoundingClientRect();
    const palette = this.ui.element.querySelector('.me-palette')!.getBoundingClientRect();
    const header = this.ui.element.querySelector('.me-header')!.getBoundingClientRect();
    const footer = this.ui.element.querySelector('.me-footer')!.getBoundingClientRect();
    const sx = this.scene.scale.width / bounds.width, sy = this.scene.scale.height / bounds.height;
    const x = Math.max(0, palette.right - bounds.left + 16) * sx;
    const y = Math.max(0, header.bottom - bounds.top + 16) * sy;
    return { x, y, width: Math.max(100, this.scene.scale.width - x - 16 * sx), height: Math.max(100, (footer.top - bounds.top - 16) * sy - y) };
  }

  private fit(): void {
    const view = this.viewport(), camera = this.scene.cameras.main;
    camera.setZoom(Math.max(.08, Math.min(view.width / (WORLD_WIDTH * TILE), view.height / (WORLD_HEIGHT * TILE))));
    camera.centerOn(WORLD_WIDTH * TILE / 2 - (view.x + view.width / 2 - camera.width / 2) / camera.zoom,
      WORLD_HEIGHT * TILE / 2 - (view.y + view.height / 2 - camera.height / 2) / camera.zoom);
    camera.preRender();
    this.drawGrid(); this.drawCursor(); this.refresh();
  }

  resize(): void { if (this.alive) this.fit(); }

  private zoom(factor: number, anchor?: Point): void {
    const camera = this.scene.cameras.main, view = this.viewport();
    const screen = anchor ?? { x: view.x + view.width / 2, y: view.y + view.height / 2 };
    camera.preRender();
    const before = camera.getWorldPoint(screen.x, screen.y);
    camera.setZoom(Phaser.Math.Clamp(camera.zoom * factor, .08, 3));
    camera.preRender();
    const after = camera.getWorldPoint(screen.x, screen.y);
    camera.scrollX += before.x - after.x; camera.scrollY += before.y - after.y;
    camera.preRender(); this.drawGrid(); this.drawCursor(); this.refresh();
  }

  private point(event: MouseEvent): { screen: Point; tile: Point } {
    const rect = this.canvas.getBoundingClientRect();
    const screen = { x: (event.clientX - rect.left) * this.scene.scale.width / rect.width,
      y: (event.clientY - rect.top) * this.scene.scale.height / rect.height };
    const p = this.scene.cameras.main.getWorldPoint(screen.x, screen.y);
    return { screen, tile: { x: Math.floor(p.x / TILE), y: Math.floor(p.y / TILE) } };
  }

  private protected(p: Point, terrain = false): boolean {
    return terrain ? isProtectedTerrainTile(p.x,p.y,this.history.current.area,this.tool.mode==='restore'?undefined:this.tool.terrain)
      || (this.adapter.protectedTerrainTile ?? this.adapter.protectedTile)(p.x,p.y)
      : isProtectedMapTile(p.x,p.y,this.history.current.area) || this.adapter.protectedTile(p.x,p.y);
  }
  private objectAt(p: Point): WorldEditorObject | undefined { return this.adapter.objects().find(o => o.x === p.x && o.y === p.y); }
  private free(p: Point, ignoreId?: string): boolean {
    return !this.protected(p) && !this.adapter.objects().some(o => o.id !== ignoreId && o.x === p.x && o.y === p.y)
      && this.adapter.canPlace(p.x, p.y, ignoreId,ignoreId?this.adapter.objects().find(o=>o.id===ignoreId)?.kind:this.tool.object);
  }

  private pointerDown = (event: PointerEvent): void => {
    if (this.pointerId !== undefined || !this.alive) return;
    if (event.button !== 0 && event.button !== 1 && event.button !== 2) return;
    event.preventDefault();
    const { screen, tile } = this.point(event);
    this.hover = tile;
    this.pointerId = event.pointerId;
    this.canvas.setPointerCapture(event.pointerId);
    if (this.space || event.button !== 0) {
      this.pan = { screen, scroll: { x: this.scene.cameras.main.scrollX, y: this.scene.cameras.main.scrollY } };
      this.canvas.style.cursor = 'grabbing'; return;
    }
    this.strokeBlocked = false;
    if (this.tool.mode === 'select') {
      if(this.resourcesHidden){this.selected=null;this.status='Recursos ocultos. Escolha um piso para pintar ou clique em Mostrar recursos.';this.drawCursor();this.refresh();return;}
      const object = this.objectAt(tile);
      this.selected = object?.id ?? null;
      if (object && !this.protected(tile)) this.moving = { ...object };
      this.status = object ? `${labels[object.kind]}: arraste pela base para mover.` : 'Clique na base de uma árvore ou de um recurso para selecioná-lo.';
    } else {
      this.stroke = this.history.current;
      this.paint(tile);
      this.lastTile = tile;
    }
    this.drawCursor(); this.refresh();
  };

  private pointerMove = (event: PointerEvent): void => {
    const { screen, tile } = this.point(event);
    this.hover = tile;
    if (this.pan) {
      const camera = this.scene.cameras.main;
      camera.scrollX = this.pan.scroll.x - (screen.x - this.pan.screen.x) / camera.zoom;
      camera.scrollY = this.pan.scroll.y - (screen.y - this.pan.screen.y) / camera.zoom;
    } else if (this.stroke && this.lastTile) {
      const a = this.lastTile, steps = Math.max(Math.abs(tile.x - a.x), Math.abs(tile.y - a.y));
      // Interpolate sparse pointer events so a quick stroke has no holes.
      for (let i = 1; i <= Math.min(steps, 300); i++) this.paint({ x: Math.round(a.x + (tile.x - a.x) * i / steps), y: Math.round(a.y + (tile.y - a.y) * i / steps) });
      this.lastTile = tile;
    }
    this.drawCursor(); this.ui.update({ tile });
  };

  private pointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    this.hover = this.point(event).tile;
    if (this.moving && this.hover) {
      if (this.free(this.hover, this.moving.id)) {
        const data = this.history.current, object = this.moving;
        data.objects[object.id] = { ...data.objects[object.id], x: this.hover.x, y: this.hover.y };
        this.commit(data, `${labels[object.kind]} movido.`);
      } else this.status = 'Esse ponto está ocupado, protegido ou tem água. Escolha um chão livre.';
    }
    this.finishStroke();
    this.releasePointer(); this.drawCursor(); this.refresh();
  };

  private releasePointer(): void {
    const id = this.pointerId;
    this.pointerId = undefined; this.pan = undefined; this.moving = undefined; this.lastTile = undefined;
    this.canvas.style.cursor = this.space ? 'grab' : '';
    if (id !== undefined && this.canvas.hasPointerCapture(id)) this.canvas.releasePointerCapture(id);
  }
  private pointerCancel = (): void => {
    if (this.pointerId === undefined) return;
    this.stroke = undefined; this.strokePreview.clear(); this.releasePointer(); this.drawCursor();
  };
  private blur = (): void => { this.pointerCancel(); this.space = false; this.canvas.style.cursor = ''; };

  private paint(center: Point): void {
    if (!this.stroke) return;
    const radius = this.tool.mode === 'terrain' || this.tool.mode === 'restore' ? Math.floor(this.brush / 2) : 0;
    for (let y = center.y - radius; y <= center.y + radius; y++) for (let x = center.x - radius; x <= center.x + radius; x++) {
      const p = { x, y };
      if (this.protected(p,this.tool.mode==='terrain'||this.tool.mode==='restore')) { this.strokeBlocked = true; continue; }
      const cell = key(p), object = this.objectAt(p);
      if(this.tool.mode==='entry'||this.tool.mode==='exit'){
        if(!this.free(p)){this.strokeBlocked=true;continue;}
        this.stroke.points={...this.stroke.points,[this.tool.mode]:{x,y}};
      } else if (this.tool.mode === 'terrain' && this.tool.terrain) {
        const plant=object&&(isFiberPlant(object.kind)||object.kind==='berryBush'||object.kind==='fiber'||object.kind==='seeds');
        if (this.tool.terrain === 'water' && object && !plant && !natureArt(object.kind)?.water) { this.strokeBlocked = true; continue; }
        if(plant&&object)this.stroke.objects[object.id]={...this.stroke.objects[object.id],x:object.x,y:object.y,removed:true};
        this.stroke.terrain[cell] = this.tool.terrain;
        this.strokePreview.fillStyle(colors[this.tool.terrain], .7).fillRect(x * TILE, y * TILE, TILE, TILE);
      } else if (this.tool.mode === 'restore') {
        if (object && (this.adapter.baseWater??isWaterTile)(x,y) && !natureArt(object.kind)?.water) { this.strokeBlocked = true; continue; }
        delete this.stroke.terrain[cell];
        this.strokePreview.fillStyle(0xf0dfb6, .4).fillRect(x * TILE, y * TILE, TILE, TILE);
      } else if (this.tool.mode === 'remove' && object) {
        this.stroke.objects[object.id] = { ...this.stroke.objects[object.id], x, y, removed: true };
        this.strokePreview.fillStyle(0xbb5352, .65).fillRect(x * TILE, y * TILE, TILE, TILE);
      } else if (this.tool.mode === 'object' && this.tool.object) {
        if (!this.free(p) || Object.values(this.stroke.objects).some(o => !o.removed && o.x === x && o.y === y)) { this.strokeBlocked = true; continue; }
        this.stroke.objects[createEditorObjectId(this.tool.object)] = { x, y, kind: this.tool.object };
        this.strokePreview.fillStyle(0xe6d495, .8).fillRect(x * TILE + 4, y * TILE + 4, TILE - 8, TILE - 8);
      }
    }
  }

  private finishStroke(): void {
    const data = this.stroke; this.stroke = undefined;
    if (data) this.commit(data, this.strokeBlocked ? 'Alteração guardada. Pontos protegidos, ocupados ou com água foram preservados.' : 'Alteração guardada no rascunho.');
    this.strokePreview.clear();
  }

  private drawCursor(): void {
    this.cursor.clear();
    const camera = this.scene.cameras.main, zoom = camera.zoom;
    const selected = this.adapter.objects().find(o => o.id === this.selected);
    if (selected) this.cursor.lineStyle(2 / zoom, 0xffdc87).strokeRect(selected.x * TILE, selected.y * TILE, TILE, TILE);
    if (!this.hover || this.pan) return;
    const p = this.hover;
    const allowed = this.tool.mode === 'object' || this.moving ? this.free(p, this.moving?.id) : !this.protected(p,this.tool.mode==='terrain'||this.tool.mode==='restore');
    const radius = ['terrain', 'restore'].includes(this.tool.mode) ? Math.floor(this.brush / 2) : 0;
    this.cursor.lineStyle(2 / zoom, allowed ? 0xffedbd : 0xe37366).strokeRect((p.x - radius) * TILE, (p.y - radius) * TILE, (radius * 2 + 1) * TILE, (radius * 2 + 1) * TILE);
    if (this.moving) this.cursor.fillStyle(allowed ? 0xc8e5a9 : 0xe37366, .35).fillRect(p.x * TILE, p.y * TILE, TILE, TILE);
  }

  private rebuild(data: MapEditData): void {
    const camera = this.scene.cameras.main;
    const view = { zoom: camera.zoom, x: camera.scrollX, y: camera.scrollY };
    this.adapter.rebuild(data);
    this.createGuides();
    camera.setZoom(view.zoom).setScroll(view.x, view.y); camera.preRender();
    this.drawGrid(); this.drawCursor();
  }

  private commit(data: MapEditData, status: string): void {
    if (this.history.commit(data)) {
      this.rebuild(data);
      this.status = saveMapDraft(data) ? status : 'Rascunho em memória. O armazenamento está indisponível; use Exportar para guardar.';
      this.storedDraft = loadMapDraft(undefined,this.history.current.area);
    } else if (this.strokeBlocked) this.status = 'Ponto protegido, ocupado ou com água. Escolha outro local.';
    this.refresh();
  }

  /** Resolve imports against the actual original map, not just their JSON shape. */
  private layoutError(data: MapEditData): string | null {
    if(data.area!==this.history.current.area)return 'Este arquivo pertence a outro cenário. Abra o editor no cenário correspondente.';
    const original = new Map(this.adapter.originalObjects.map(o => [o.id, o]));
    const resolved = new Map([...original].filter(([, o]) => !o.depleted || o.kind === 'standingTree' || o.kind === 'pine'));
    for (const [id, edit] of Object.entries(data.objects)) {
      if (!id.startsWith('editor-') && !original.has(id)) return 'O arquivo contém um objeto que não pertence a este mapa.';
      if (edit.removed) { resolved.delete(id); continue; }
      if (this.protected(edit)) return 'O arquivo altera uma área protegida ou uma construção da partida.';
      resolved.set(id, { ...original.get(id), id, x: edit.x, y: edit.y, kind: edit.kind ?? original.get(id)!.kind, texture: '' });
    }
    const current = this.history.current;
    for (const cell of new Set([...Object.keys(data.terrain), ...Object.keys(current.terrain)])) {
      const [x, y] = cell.split(',').map(Number);
      if ((this.adapter.protectedTerrainTile ?? this.adapter.protectedTile)(x,y) && data.terrain[cell] !== current.terrain[cell]) return 'Preserve o terreno sob construções, plantas e canteiros preparados. Desfaça o canteiro antes de trocar o piso.';
    }
    for(const point of Object.values({...this.adapter.defaultPoints,...data.points})){
      if(!point)continue;const ground=data.terrain[key(point)];
      if(ground==='water'||(ground===undefined&&(this.adapter.baseWater??isWaterTile)(point.x,point.y))||[...resolved.values()].some(o=>o.x===point.x&&o.y===point.y))return 'O ponto de chegada ou saída precisa ficar em chão livre.';
    }
    const occupied = new Set<string>();
    for (const object of resolved.values()) {
      const cell = key(object);
      if(object.kind==='reeds'&&(data.area==='forest'||!nearRiverBank(object.x,object.y)))return 'Os juncos precisam ficar nas margens do rio da propriedade.';
      if(isTreeKind(object.kind)&&!treeGroundClear(object.x,object.y,(px,py)=>{
        return paintedWaterPoint(data.terrain,px,py,(x,y)=>this.adapter.baseWaterPoint?.(x,y)??(this.adapter.baseWater??isWaterTile)(Math.floor(x/TILE),Math.floor(y/TILE)));
      }))return 'As árvores precisam de terra firme em toda a base, fora da água e das margens alagadas.';
      if (occupied.has(cell)) return 'Dois objetos ficariam no mesmo ponto. Mova ou remova um deles antes.';
      occupied.add(cell);
      const ground = data.terrain[cell];
      if (!natureArt(object.kind)?.water && (ground === 'water' || (data.objects[object.id] && ground === undefined && (this.adapter.baseWater??isWaterTile)(object.x, object.y)))) return 'Há objetos sobre água nesse arquivo. Ajuste o terreno ou mova os objetos.';
    }
    return null;
  }

  private importMap(text: string): void {
    this.finishStroke();
    const data = parseMapEdits(text);
    const error = data ? this.layoutError(data) : 'Arquivo inválido. Importe um JSON exportado por este editor (mapa 96 × 72).';
    if (!data || error) { this.status = error!; this.refresh(true); return; }
    this.commit(data, 'Mapa importado como rascunho. Confira o resultado antes de aplicar.');
  }

  private action(action: EditorAction): void {
    this.finishStroke();
    if(action==='map-property'||action==='map-forest'){
      const error=this.layoutError(this.history.current);if(error){this.status=error;this.refresh(true);return;}
      this.adapter.switchArea?.(action==='map-forest'?'forest':'property',this.history.current);return;
    }
    if (action === 'cancel') { this.adapter.cancel(); return; }
    if (action === 'apply') {
      const error = this.layoutError(this.history.current);
      if (error) { this.status = error; this.refresh(true); return; }
      if (!this.adapter.apply(this.history.current)) {
        // A failed save can rebuild the preview and replace all scene children.
        this.createGuides(); this.fit();
        this.status = 'Não foi possível salvar a partida. O rascunho está aberto; exporte o mapa para guardá-lo.';
        this.refresh(true);
      }
      return;
    }
    if (action === 'undo' || action === 'redo') {
      const data = action === 'undo' ? this.history.undo() : this.history.redo();
      if (data) {
        this.rebuild(data); this.selected = null;
        this.status = saveMapDraft(data) ? (action === 'undo' ? 'Alteração desfeita.' : 'Alteração refeita.') : 'Alteração em memória. Exporte para guardar.';
        this.storedDraft = loadMapDraft(undefined,this.history.current.area);
      }
    } else if (action === 'grid') { this.grid = !this.grid; this.drawGrid(); }
    else if(action==='resources')this.setResourcesHidden(!this.resourcesHidden);
    else if (action === 'zoom-in') this.zoom(1.25);
    else if (action === 'zoom-out') this.zoom(1 / 1.25);
    else if (action === 'zoom-fit') this.fit();
    else if (action === 'load-draft') {
      const data = loadMapDraft(undefined,this.history.current.area);
      if (data) this.importMap(JSON.stringify(data));
      else this.status = 'Nenhum rascunho válido foi encontrado neste navegador.';
    } else if (action === 'export') {
      const url = URL.createObjectURL(new Blob([JSON.stringify(this.history.current, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = `After-Rain-${this.history.current.area??'propriedade'}-mapa.json`; a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.status = 'Mapa exportado. Guarde o JSON para continuar ou enviar suas alterações.';
    }
    this.refresh();
  }

  private setResourcesHidden(hidden:boolean):void {
    this.resourcesHidden=hidden;this.selected=null;this.adapter.setResourcesHidden?.(hidden);
    this.status=hidden?'Recursos ocultos apenas nesta visualização. Escolha um piso para editar.':'Recursos visíveis novamente.';
    this.drawCursor();
  }

  private wheel = (event: WheelEvent): void => {
    event.preventDefault();
    if (!event.deltaY || event.ctrlKey || this.pointerId !== undefined) return;
    this.zoom(Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * .0025), this.point(event).screen);
  };
  private keyDown = (event: KeyboardEvent): void => {
    if (event.target instanceof HTMLElement && event.target.matches('input, textarea, select, [contenteditable="true"]')) return;
    const key = event.key.toLowerCase();
    if (event.code === 'Space' || ['delete', 'backspace', '+', '=', '-', '_', 'home'].includes(key)
      || ((event.ctrlKey || event.metaKey) && ['z', 'y'].includes(key))) event.stopPropagation();
    if (event.code === 'Space') { event.preventDefault(); this.space = true; this.canvas.style.cursor = 'grab'; }
    else if ((event.ctrlKey || event.metaKey) && ['z', 'y'].includes(key)) {
      event.preventDefault(); this.action(key === 'y' || event.shiftKey ? 'redo' : 'undo');
    } else if (key === 'delete' || key === 'backspace') {
      event.preventDefault();
      const object = this.adapter.objects().find(o => o.id === this.selected);
      if (object && !this.protected(object)) {
        const data = this.history.current;
        data.objects[object.id] = { ...data.objects[object.id], x: object.x, y: object.y, removed: true };
        this.commit(data, 'Objeto removido do rascunho.'); this.selected = null;
      }
    } else if (key === 'escape') { event.preventDefault(); this.pointerCancel(); this.selected = null; this.drawCursor(); this.refresh(); }
    else if (key === '+' || key === '=') { event.preventDefault(); this.zoom(1.25); }
    else if (key === '-' || key === '_') { event.preventDefault(); this.zoom(1 / 1.25); }
    else if (key === 'home') { event.preventDefault(); this.fit(); }
  };
  private keyUp = (event: KeyboardEvent): void => { if (event.code === 'Space') { this.space = false; this.canvas.style.cursor = ''; } };

  private refresh(error = false): void {
    if (!this.alive) return;
    const selected = this.adapter.objects().find(o => o.id === this.selected);
    this.ui.update({ undo: this.history.canUndo, redo: this.history.canRedo,
      dirty: JSON.stringify(this.history.current) !== this.initial, status: this.status,
      zoom: this.scene.cameras.main.zoom, grid: this.grid, resourcesHidden:this.resourcesHidden, canLoadDraft: !!this.storedDraft,
      selected: selected ? `${labels[selected.kind]} · ${selected.x}, ${selected.y}${selected.depleted ? ' · já coletado' : ''}` : null,
      tile: this.hover, error });
  }

  destroy(): void {
    if (!this.alive) return;
    this.alive = false; this.releasePointer();
    this.canvas.removeEventListener('pointerdown', this.pointerDown);
    this.canvas.removeEventListener('pointermove', this.pointerMove);
    this.canvas.removeEventListener('pointerup', this.pointerUp);
    this.canvas.removeEventListener('pointercancel', this.pointerCancel);
    this.canvas.removeEventListener('lostpointercapture', this.pointerCancel);
    this.canvas.removeEventListener('wheel', this.wheel);
    window.removeEventListener('keydown', this.keyDown, true); window.removeEventListener('keyup', this.keyUp, true); window.removeEventListener('blur', this.blur);
    this.guides.destroy(); this.cursor.destroy(); this.strokePreview.destroy(); this.ui.destroy();
    this.canvas.style.cursor = '';
  }
}

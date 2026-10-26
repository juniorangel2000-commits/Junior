import {
  FURNITURE_CATALOG, FLOOR_STYLES, WALL_STYLES, HOME_WIDTH, HOME_HEIGHT,
  furnitureFootprint,RESIDENTIAL_FURNITURE_KINDS,
} from './systems/home';
import type { HomeData, HomeEditAction, FurnitureKind } from './systems/home';
export type { HomeEditAction } from './systems/home';
import './home-ui.css';

export interface HomeEditResponse { ok: boolean; message: string; home: HomeData }
export interface HomeEditor { refresh(home: HomeData, message?: string, ok?: boolean): void; destroy(): void }
export interface HomeEditorOptions {title?:string;eyebrow?:string;catalog?:readonly FurnitureKind[];legend?:string;note?:string}

/** Editor de planta: só o sistema Home decide se uma alteração pode ser aplicada. */
export function createHomeEditor(
  holder: HTMLElement,
  initial: HomeData,
  onAction: (action: HomeEditAction) => HomeEditResponse,
  options:HomeEditorOptions={},
): HomeEditor {
  let home = initial;
  let selected: string | undefined;
  let mode: 'select' | 'place' | 'move' = 'select';
  const palette=options.catalog??RESIDENTIAL_FURNITURE_KINDS;
  let kind: FurnitureKind = palette[0]??'chair';
  let disposed = false;
  const root = document.createElement('div');
  root.className = 'home-editor';
  root.innerHTML = `<div class="home-editor-body"><div class="home-plan-column"><p class="home-editor-help">Escolha um móvel para adicionar ou selecione uma peça da casa. Clique na planta para posicionar.</p><div class="home-grid" role="group" aria-label="Planta da casa"></div><p class="home-plan-legend">Entrada ao sul · mantenha livre o caminho até a cama.</p><p class="home-edit-status" role="status" aria-live="polite">Selecione uma peça ou adicione um móvel.</p></div><div class="home-options"><section><h3>Móveis da casa</h3><p class="home-editor-note">Acervo da casa. Recolha e reorganize seus móveis; consulte as quantidades disponíveis.</p><div class="home-catalog"></div></section><section class="home-selected"><h3>Peça selecionada</h3><p class="home-selection-label">Nenhuma peça.</p><div class="home-piece-actions"><button class="button button-light" data-home-move disabled>Mover</button><button class="button button-light" data-home-remove disabled>Recolher</button><button class="text-button" data-home-cancel>Cancelar seleção</button></div><div class="home-piece-list" role="group" aria-label="Móveis colocados"></div></section><section><h3>Acabamentos</h3><span class="home-style-label">Assoalho</span><div class="home-floor-styles"></div><span class="home-style-label">Paredes</span><div class="home-wall-styles"></div></section></div></div>`;
  holder.append(root);
  if(options.legend)root.querySelector<HTMLElement>('.home-plan-legend')!.textContent=options.legend;
  if(options.note)root.querySelector<HTMLElement>('.home-editor-note')!.textContent=options.note;
  if(options.catalog){root.querySelector<HTMLElement>('.home-options h3')!.textContent='Objetos do interior';root.querySelector<HTMLElement>('.home-editor-help')!.textContent='Escolha um objeto do catálogo ou uma peça colocada. Use a planta para posicionar, mover ou recolher.';}
  const grid = root.querySelector<HTMLElement>('.home-grid')!;
  const status = root.querySelector<HTMLElement>('.home-edit-status')!;
  const moveButton = root.querySelector<HTMLButtonElement>('[data-home-move]')!;
  const removeButton = root.querySelector<HTMLButtonElement>('[data-home-remove]')!;
  grid.style.gridTemplateColumns = `repeat(${HOME_WIDTH}, minmax(0, 1fr))`;

  const report = (message: string, ok = true): void => {
    status.textContent = message;
    status.classList.toggle('is-error', !ok);
  };
  const apply = (action: HomeEditAction): void => {
    const result = onAction(action);
    home = result.home;
    if (result.ok) mode = 'select';
    render();
    report(result.message, result.ok);
  };
  function render(): void {
    if (disposed) return;
    if (selected && !home.furniture.some(piece => piece.id === selected)) selected = undefined;
    const chosen = home.furniture.find(piece => piece.id === selected);
    root.querySelector<HTMLElement>('.home-selection-label')!.textContent = mode === 'place'
      ? `Adicionar: ${FURNITURE_CATALOG[kind].name}. Clique no canto superior esquerdo do destino.`
      : chosen ? `${FURNITURE_CATALOG[chosen.kind].name} · coluna ${chosen.x + 1}, linha ${chosen.y + 1}${mode === 'move' ? '. Clique no novo destino.' : ''}`
        : 'Nenhuma peça. Clique em um móvel na planta ou na lista.';
    moveButton.disabled = !chosen;
    removeButton.disabled = !chosen;
    grid.style.setProperty('--home-floor', FLOOR_STYLES[home.floor].color);
    grid.style.setProperty('--home-wall', WALL_STYLES[home.wall].color);
    grid.replaceChildren();
    for (let y = 0; y < HOME_HEIGHT; y++) for (let x = 0; x < HOME_WIDTH; x++) {
      const entry = y === HOME_HEIGHT - 1 && (x === 5 || x === 6);
      const floor = x >= 1 && x <= HOME_WIDTH - 2 && y >= 2 && y <= HOME_HEIGHT - 2;
      const piece = home.furniture.find(candidate => furnitureFootprint(candidate).some(tile => tile.x === x && tile.y === y));
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `home-cell${floor ? ' home-cell-floor' : ''}${entry ? ' home-cell-entry' : ''}${piece ? ` home-cell-furniture home-cell-${piece.kind}` : ''}${piece?.id === selected ? ' is-selected' : ''}`;
      button.dataset.homeX = String(x);
      button.dataset.homeY = String(y);
      const name = piece ? FURNITURE_CATALOG[piece.kind].name : entry ? 'Saída' : floor ? 'Espaço livre' : 'Parede';
      button.setAttribute('aria-label', `${name}, coluna ${x + 1}, linha ${y + 1}`);
      button.title = name;
      const wallPlacement=(mode==='place'&&FURNITURE_CATALOG[kind].surface==='wall')||(mode==='move'&&chosen&&FURNITURE_CATALOG[chosen.kind].surface==='wall');
      button.disabled = wallPlacement?!(x>=1&&x<=HOME_WIDTH-2&&y<=1):!floor&&!entry&&!piece;
      if (piece && piece.x === x && piece.y === y) {
        const label = document.createElement('span');
        label.className = 'home-furniture-label';
        label.textContent = FURNITURE_CATALOG[piece.kind].name;
        label.style.width=`calc(${FURNITURE_CATALOG[piece.kind].width} * 100% - 6px)`;
        button.append(label);
      } else if (entry) button.textContent = '↓';
      button.addEventListener('click', () => {
        if (mode === 'place') apply({ type: 'place', kind, x, y });
        else if (mode === 'move' && selected) apply({ type: 'move', id: selected, x, y });
        else {
          selected = piece?.id;
          render();
          report(piece ? `${FURNITURE_CATALOG[piece.kind].name} selecionado. Use Mover ou Recolher.` : 'Espaço livre. Escolha um móvel para adicionar.');
        }
      });
      grid.append(button);
    }
    const catalog = root.querySelector<HTMLElement>('.home-catalog')!;
    catalog.replaceChildren();
    for (const id of palette) {
      const item = FURNITURE_CATALOG[id];
      const count = home.furniture.filter(piece => piece.kind === id).length;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `home-catalog-button${mode === 'place' && id === kind ? ' is-selected' : ''}`;
      button.dataset.homeKind = id;
      button.textContent = `${item.name}  ${count}/${item.limit}`;
      button.disabled = count >= item.limit;
      button.setAttribute('aria-label', `Adicionar ${item.name}, ${count} de ${item.limit}`);
      button.addEventListener('click', () => {
        kind = id; mode = 'place'; selected = undefined; render();
        report(`Escolha na planta onde colocar ${item.name.toLocaleLowerCase('pt-BR')}. Ocupa ${item.width} × ${item.height} espaços.`);
      });
      catalog.append(button);
    }
    const list = root.querySelector<HTMLElement>('.home-piece-list')!;
    list.replaceChildren();
    home.furniture.forEach((piece, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `home-piece-button${piece.id === selected ? ' is-selected' : ''}`;
      button.textContent = `${index + 1}. ${FURNITURE_CATALOG[piece.kind].name}`;
      button.dataset.homePiece = piece.id;
      button.addEventListener('click', () => { selected = piece.id; mode = 'select'; render(); });
      list.append(button);
    });
    const renderStyles = <K extends string>(holderClass: string, choices: Record<K, { name: string; color: string }>, current: K, change: (id: K) => void): void => {
      const target = root.querySelector<HTMLElement>(holderClass)!;
      target.replaceChildren();
      for (const id of Object.keys(choices) as K[]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'home-style-button';
        button.setAttribute('aria-pressed', String(id === current));
        button.style.setProperty('--style-color', choices[id].color);
        button.textContent = choices[id].name;
        button.addEventListener('click', () => change(id));
        target.append(button);
      }
    };
    renderStyles('.home-floor-styles', FLOOR_STYLES, home.floor, floor => apply({ type: 'style', floor, wall: home.wall }));
    renderStyles('.home-wall-styles', WALL_STYLES, home.wall, wall => apply({ type: 'style', floor: home.floor, wall }));
  }
  moveButton.addEventListener('click', () => {
    mode = 'move'; render(); report('Clique no canto superior esquerdo do novo lugar para esta peça.');
  });
  removeButton.addEventListener('click', () => { if (selected) apply({ type: 'remove', id: selected }); });
  root.querySelector('[data-home-cancel]')!.addEventListener('click', () => {
    mode = 'select'; selected = undefined; render(); report('Seleção cancelada.');
  });
  render();
  return {
    refresh(data, message, ok = true): void { home = data; render(); if (message) report(message, ok); },
    destroy(): void { disposed = true; root.remove(); },
  };
}

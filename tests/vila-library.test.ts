import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import catalog from '../public/dev/vila-v31/biblioteca.json';
import shop from '../public/dev/vila-v31/bento/manifest.json';
import atlas from '../public/dev/vila-v31/bento/atlas/aprovados.json';
import fresh from '../public/dev/vila-v31/bento/novas-sprites.json';
import preserved from '../public/dev/vila-v31/preservados-jogo/manifest.json';

describe('biblioteca auditada da vila', () => {
  it('inclui os objetos ausentes da referência com IDs próprios', () => {
    const additions=new Set(fresh.fidelityObjects.map(a=>a.id));
    for(const id of ['folha_encomendas','vaso_flores_brancas','lampiao_balcao','escudo_parede','caixa_ferramentas','expositor_alto_ferramentas','suporte_ferramentas_longas','caixa_carvao_madeira','armario_carvao_ferro','bancada_ferraria','balde_tenazes','toco_martelo','pedra_amolar'])expect(additions.has(id)).toBe(true);
    expect(fresh.fidelity.additionalInstances).toBe(18);
    expect([...fresh.objects,...fresh.fidelityObjects].filter(a=>!('sceneVisible' in a)||a.sceneVisible!==false)).toHaveLength(32);
  });
  it('preserva pixels e versões anteriores também nos objetos de fidelidade', () => {
    for(const a of [...fresh.fidelityObjects,...fresh.fidelity.preservedVariants]){
      const file=readFileSync(new URL('../public/dev/vila-v31/'+a.file,import.meta.url));
      expect(createHash('sha256').update(file).digest('hex')).toBe(a.sha256);
    }
    expect(fresh.fidelityObjects.filter(a=>a.sourceKind==='existing_preserved_art')).toHaveLength(5);
  });
  it('mantém os apoios do balcão e da bancada sem colisões independentes', () => {
    for(const id of ['folha_encomendas','vaso_flores_brancas','lampiao_balcao']){
      const a=fresh.fidelityObjects.find(a=>a.id===id)!;
      expect(a.supportId).toBe('mesa_atendimento');expect(a.collision).toBeNull();
    }
    expect(fresh.objects.find(a=>a.id==='porta_ferramentas')?.supportId).toBe('bancada_ferraria');
    const ids=new Set([...fresh.objects,...fresh.fidelityObjects].map(a=>a.id));
    for(const a of [...fresh.objects,...fresh.fidelityObjects])if('supportId'in a && a.supportId)expect(ids.has(a.supportId)).toBe(true);
  });
  it('redesenha o balcão sem gavetas e aproxima o topo da fornalha da parede', () => {
    expect(fresh.objects.find(a=>a.id==='mesa_atendimento')?.file).toBe('bento/fidelidade/balcao_referencia.png');
    const furnace=fresh.objects.find(a=>a.id==='fornalha_completa')!;
    const [,top,,bottom]=furnace.visibleBoundsAlpha128;
    expect(furnace.recommendedPosition.y-(bottom-top)*furnace.scale).toBeCloseTo(39.5);
    expect(furnace.referenceBBox).toEqual([652,39,801,301]);
  });
  it('encosta as bordas visíveis dos móveis nas paredes sem usar as margens transparentes', () => {
    for(const anchor of fresh.fidelity.wallAnchors){
      const a=[...fresh.objects,...fresh.fidelityObjects].find(a=>a.id===anchor.id)!;
      const [x0,,x1]=a.visibleBoundsAlpha128;
      const sx='scaleX'in a && a.scaleX?a.scaleX:a.scale;
      const edge=anchor.edge==='bottom'?a.recommendedPosition.y:a.recommendedPosition.x+(anchor.edge==='left'?-1:1)*(x1-x0)*sx/2;
      expect(edge).toBeCloseTo(anchor.value,5);
    }
    const box=fresh.fidelityObjects.find(a=>a.id==='caixa_ferramentas')!;
    const stand=fresh.fidelityObjects.find(a=>a.id==='expositor_alto_ferramentas')!;
    expect(box.recommendedPosition.x-stand.recommendedPosition.x).toBeCloseTo(84-90.25+6);
  });
  it('recuou os conjuntos até os contornos e manteve a junção do balcão com o expositor', () => {
    const all=[...fresh.objects,...fresh.fidelityObjects];
    const counter=all.find(a=>a.id==='mesa_atendimento')!,display=all.find(a=>a.id==='prateleira_ferramentas')!;
    const width=(a:typeof counter)=>{const [left,,right]=a.visibleBoundsAlpha128;return(right-left)*('scaleX'in a&&a.scaleX?a.scaleX:a.scale);};
    expect(counter.recommendedPosition.x-width(counter)/2).toBeLessThanOrEqual(display.recommendedPosition.x+width(display)/2);
    expect(fresh.sideWallOcclusion).toEqual([{x:0,y:0,width:60,height:352},{x:527,y:0,width:49,height:352}]);
    expect(fresh.fidelity.wallAnchors.find(a=>a.id==='bancada_ferraria')?.value).toBeGreaterThan(527);
    expect(fresh.fidelity.wallAnchors.find(a=>a.id==='expositor_alto_ferramentas')?.value).toBeLessThan(60);
  });
  it('disfarça a junção dos pisos com uma soleira plana e sem colisão', () => {
    expect(fresh.floorTransitions).toHaveLength(1);
    const t=fresh.floorTransitions[0];
    expect(t.collision).toBeNull();expect(t.depth).toBeLessThan(0);
    expect(t.position).toEqual({x:289.5,y:275});
    expect(t.visibleHeight).toBe(156);expect(t.visibleWidth).toBe(11);
    const file=readFileSync(new URL('../public/dev/vila-v31/'+t.file,import.meta.url));
    expect(createHash('sha256').update(file).digest('hex')).toBe(t.sourceSha256);
    expect(t.pixelsChanged).toBe(0);
  });
  it('entrega 14 novas sprites independentes sem recortar ou alterar os PNGs gerados', () => {
    expect(fresh.objects).toHaveLength(15);
    expect(new Set(fresh.objects.filter(a=>a.id!=='meia-divisoria').map(a => a.id))).toEqual(new Set(shop.objects.map(a => a.id)));
    for (const a of fresh.objects) {
      const file=readFileSync(new URL('../public/dev/vila-v31/'+a.file, import.meta.url));
      expect(createHash('sha256').update(file).digest('hex')).toBe(a.sourceSha256);
      expect(a.croppedFromInterior).toBe(false);expect(a.pixelsChanged).toBe(0);
      if('technicalValidation' in a && a.technicalValidation){expect(a.technicalValidation.fullyContainedAlpha128).toBe(true);expect(a.technicalValidation.transparentPixels).toBeGreaterThan(0);}
    }
  });
  it('mantém a nova arte em revisão separada da coleção auditada', () => {
    expect(fresh.objects.every(a=>a.previewReady && !a.gameReady && a.status==='precisa_revisao')).toBe(true);
    expect(fresh.stats.existingSpritesReplaced).toBe(0);
  });
  it('conserva todas as 21 sprites e configurações anteriores do jogo', () => {
    expect(preserved.unchangedFiles).toHaveLength(21);
    for(const a of preserved.unchangedFiles){
      const current=readFileSync(new URL('../public/assets/visual/'+a.file,import.meta.url));
      const copy=readFileSync(new URL('../public/dev/vila-v31/preservados-jogo/'+a.file,import.meta.url));
      expect(createHash('sha256').update(current).digest('hex')).toBe(a.sha256);
      expect(copy.equals(current)).toBe(true);
    }
  });
  it('identifica os nove pacotes ausentes sem inventar interiores', () => {
    expect(catalog.stores).toHaveLength(10);
    expect(catalog.stores.filter(s => s.received).map(s => s.id)).toEqual(['bento']);
    expect(catalog.stores.filter(s => !s.received).every(s => s.manifest === null)).toBe(true);
    expect(shop.layers.finalInteriorApproved).toBe(false);
  });
  it('impede candidatos e incompletos de entrar no atlas aprovado', () => {
    const approved = shop.objects.filter(a => a.gameReady);
    expect(approved).toHaveLength(3);
    expect(new Set(Object.keys(atlas.frames))).toEqual(new Set(approved.map(a => a.id)));
    expect(approved.every(a => a.status === 'aprovado' && a.file?.startsWith('bento/aprovados/'))).toBe(true);
    expect(shop.objects.filter(a => a.status === 'incompleto').every(a => a.file === null && !a.gameReady)).toBe(true);
  });
  it('conserva os arquivos corrigidos com hashes rastreáveis', () => {
    for (const a of shop.objects) {
      if (!a.file || !('sha256' in a)) continue;
      const file = readFileSync(new URL('../public/dev/vila-v31/'+a.file, import.meta.url));
      expect(createHash('sha256').update(file).digest('hex')).toBe(a.sha256);
    }
  });
  it('mantém fachadas e interiores originais idênticos aos recebidos', () => {
    for (const a of Object.values(shop.sources)) {
      const file=readFileSync(new URL('../public/dev/vila-v31/'+a.file, import.meta.url));
      expect(createHash('sha256').update(file).digest('hex')).toBe(a.sha256);
    }
    expect(catalog.officials).toHaveLength(24);
  });
  it('preserva alinhamento de todos os recortes e não afirma recuperar superfícies ocultas', () => {
    expect(Object.values(shop.alignment.matches)).toHaveLength(14);
    expect(Object.values(shop.alignment.matches).every(a => a.exactRGB && a.mismatchedPixels === 0)).toBe(true);
    expect(shop.objects.every(a => !a.hiddenSurfaceReconstructed)).toBe(true);
  });
  it('mantém tapete sem colisão e registra pivôs e colisões dentro de cada PNG', () => {
    expect(shop.objects.find(a => a.id === 'tapete_ferraria')?.collision).toBeNull();
    for (const a of shop.objects) {
      if (!a.file || !a.width || !a.height || !a.origin) continue;
      expect(a.origin.x).toBeGreaterThanOrEqual(0); expect(a.origin.y).toBeLessThanOrEqual(1);
      if (a.collision) {
        expect(a.collision.x+a.collision.width).toBeLessThanOrEqual(a.width);
        expect(a.collision.y+a.collision.height).toBeLessThanOrEqual(a.height);
      }
    }
  });
});

"""Verify original bytes, foreground RGB, masks, atlas isolation and metadata."""
import json, hashlib, argparse
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def verify(library, entry):
    audit = json.loads((library/'auditoria.json').read_text())
    manifest = json.loads((library/'bento/manifest.json').read_text())
    specs = json.loads((ROOT/'scripts/vila-reconstrucao/bento-mascaras.json').read_text())
    catalog = json.loads((library/'biblioteca.json').read_text())
    checks = []
    def ok(name, result):
        assert result, name
        checks.append(name)
    ok('72 arquivos de entrada com hash preservado', len(audit['inputFiles']) == 72 and all(
        digest(entry/r['file']) == r['sha256'] for r in audit['inputFiles']))
    ok('Originais distribuídos idênticos aos recebidos', all(digest(library/(
        'bento/originais/'+r['file'][6:] if r['file'].startswith('bento/') else
        'compartilhado/pacote_base/'+r['file'][11:])) == r['sha256'] for r in audit['inputFiles']))
    objects = manifest['objects']
    ok('14 objetos únicos, sem contar variantes', len(objects)==len({r['id'] for r in objects})==14)
    ok('14 alinhamentos RGB exatos', all(r['exactRGB'] and r['mismatchedPixels']==0 for r in manifest['alignment']['matches'].values()))
    stats = {s:sum(r['status']==s for r in objects) for s in ['aprovado','precisa_revisao','incompleto']}
    ok('Contagem 3 aprovados / 4 em revisão / 7 incompletos', stats == {'aprovado':3,'precisa_revisao':4,'incompleto':7} == manifest['stats'])
    atlas_json = json.loads((library/'bento/atlas/aprovados.json').read_text())
    atlas = Image.open(library/'bento/atlas/aprovados.png').convert('RGBA')
    ok('Atlas contém somente os três aprovados', set(atlas_json['frames']) == {r['id'] for r in objects if r['gameReady']})
    original = np.array(Image.open(entry/'bento/interior.png').convert('RGB'))
    for r in objects:
        if not r['file']:
            ok(r['id']+': sem falso sprite final', not r['gameReady'])
            continue
        file = library/r['file']; im = Image.open(file).convert('RGBA'); a=np.array(im)
        x,y,x1,y1=r['sourceBBox']; active=a[8:-8,8:-8,3]>0
        ok(r['id']+': RGB original sem reamostragem', np.array_equal(a[8:-8,8:-8,:3][active], original[y:y1,x:x1][active]))
        ok(r['id']+': margem transparente e alpha binário', im.size==(x1-x+16,y1-y+16) and not np.any(a[:8,:,3]) and not np.any(a[-8:,:,3]) and not np.any(a[:,:8,3]) and not np.any(a[:,-8:,3]) and set(np.unique(a[:,:,3])).issubset({0,255}))
        ok(r['id']+': hash e máscara documentados', digest(file)==r['sha256'] and r['maskPolygon']==specs[r['id']]['polygon'])
        ok(r['id']+': pivô dentro da imagem', 0<=r['origin']['x']<=1 and 0<=r['origin']['y']<=1)
        if r['collision']:
            c=r['collision'];ok(r['id']+': colisão dentro da imagem', c['x']>=0 and c['y']>=0 and c['width']>0 and c['height']>0 and c['x']+c['width']<=im.width and c['y']+c['height']<=im.height)
        if r['gameReady']:
            f=atlas_json['frames'][r['id']]['frame'];ok(r['id']+': atlas idêntico ao PNG independente', np.array_equal(a,np.array(atlas.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h'])))))
        else:ok(r['id']+': separado dos aprovados', '/em_revisao/' in r['file'])
    ok('24 oficiais preservados, sem aprovação automática', len(catalog['officials'])==24 and all(digest(library/r['file'])==r['sha256'] and r['status']=='precisa_revisao' for r in catalog['officials']))
    ok('Nove pacotes ausentes sinalizados', sum(not s['received'] for s in catalog['stores'])==9)
    ok('Interior parcial explicitamente não finalizado', not manifest['layers']['finalInteriorApproved'])
    ok('1759 pixels alpha recuperados', sum(r.get('restoredAlphaPixels',0) for r in objects)==1759)
    fresh_file=library/'bento/novas-sprites.json'
    if fresh_file.exists():
        fresh=json.loads(fresh_file.read_text());new_art=fresh['objects']+fresh['roomMaterials']+fresh.get('fidelityObjects',[])+fresh.get('floorTransitions',[])
        ok('14 objetos refeitos, meia divisória e três materiais novos',len(fresh['objects'])==15 and len(fresh['roomMaterials'])==3)
        for r in new_art:
            p=library/r['file'];im=Image.open(p)
            ok(r['id']+': nova imagem integral, sem alterar pixels',digest(p)==r['sha256']==r['sourceSha256'] and r['pixelsChanged']==0 and im.size==(r['width'],r['height']))
        kept=json.loads((library/'preservados-jogo/manifest.json').read_text())['unchangedFiles']
        ok('19 PNGs e duas configurações anteriores preservados',len(kept)==21 and sum(r['file'].endswith('.png') for r in kept)==19 and all(digest(library/'preservados-jogo'/r['file'])==r['sha256']==digest(ROOT/'public/assets/visual'/r['file']) for r in kept))
        ok('Nova arte não substitui sprites existentes',fresh['stats']['existingSpritesReplaced']==0)
        if 'fidelity' in fresh:
            f=fresh['fidelity'];all_objects=fresh['objects']+fresh['fidelityObjects'];ids={a['id'] for a in all_objects}
            ok('32 objetos na composição e 18 instâncias adicionais',sum(a.get('sceneVisible',True) for a in all_objects)==f['visibleInstances']==32 and len(fresh['fidelityObjects'])==18)
            ok('Sem IDs duplicados ou apoio ausente',len(ids)==len(all_objects) and all(not a.get('supportId') or a['supportId'] in ids for a in all_objects))
            ok('Referência inalterada e variantes anteriores preservadas',digest(library/f['reference'])==f['referenceSha256'] and all(digest(library/a['file'])==a['sha256'] for a in f['preservedVariants']))
    result={'passed':len(checks),'failed':0,'checks':checks,'stats':audit['stats']}
    (library/'validacao-tecnica.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--library',type=Path,default=ROOT/'public/dev/vila-v31');p.add_argument('--input',type=Path,default=Path('/workspace/after-rain-vila-v31/entrada'));a=p.parse_args();verify(a.library,a.input)

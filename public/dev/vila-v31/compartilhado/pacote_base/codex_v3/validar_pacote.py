from pathlib import Path
from PIL import Image
import json,sys
p=Path(__file__).resolve().parents[2]
manifest=json.loads((Path(__file__).parent/'balcoes_recortes_v3.json').read_text())
errors=[]
for item in manifest:
 f=p/item['file']
 if not f.exists():errors.append(f'Missing: {f}');continue
 try:
  im=Image.open(f);im.load()
  if im.mode!='RGBA':errors.append(f'Not RGBA: {f}')
  if im.getchannel('A').getextrema()[0]!=0:errors.append(f'No transparency: {f}')
 except Exception as e:errors.append(f'Failed: {f}: {e}')
print('Sprites verificados:',len(manifest),'; erros:',len(errors))
for e in errors:print('ERRO:',e)
if errors:sys.exit(1)

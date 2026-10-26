"""Make an offline HTML inspector. Embed only data; never execute supplied scripts."""
import base64, json, re, argparse
from pathlib import Path

def make(build):
    page=(build/'vila-assets.html').read_text()
    js=re.search(r'<script[^>]+src="([^"]+)"[^>]*></script>',page)
    css=re.search(r'<link[^>]+href="([^"]+\.css)"[^>]*>',page)
    assert js and css
    data={}
    root=build/'dev/vila-v31'
    for p in root.rglob('*'):
        if not p.is_file() or p.suffix not in ('.png','.json'): continue
        mime='image/png' if p.suffix=='.png' else 'application/json'
        data[str(p.relative_to(root))]='data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode()
    payload='window.__VILA_PACKAGE='+json.dumps(data,ensure_ascii=True,separators=(',',':'))+';\n'
    source=(build/js[1]).read_text()
    inline='<script type="module">'+(payload+source).replace('</script','<\\/script')+'</script>'
    page=page.replace(js[0],inline).replace(css[0],'<style>'+(build/css[1]).read_text()+'</style>')
    destination=build/'After-Rain-Bento-Visualizador.html';destination.write_text(page)
    print(json.dumps({'file':str(destination),'bytes':destination.stat().st_size,'embeddedDataFiles':len(data)}))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--build',type=Path,default=Path('/workspace/after-rain-vila-v31/viewer-build'));make(parser.parse_args().build)

#!/usr/bin/env python3
"""Keep documentation links usable after the reviewed historical-preview archive."""
import json
import posixpath
from pathlib import Path
import re
from urllib.parse import quote, unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / 'docs/manutencao/arquivos-arquivados.json').read_text())
removed = {entry['path'] for entry in manifest['files']}
commit = manifest['baseCommit']
repository = 'https://github.com/juniorangel2000-commits/Junior'
raw = 'https://raw.githubusercontent.com/juniorangel2000-commits/Junior'


def archived_url(path):
    base = f'{raw}/{commit}' if Path(path).suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.webm'} else f'{repository}/blob/{commit}'
    return base + '/' + quote(path, safe='/')


def replace_target(owner, target):
    angled = target.startswith('<') and target.endswith('>')
    value = target[1:-1] if angled else target
    url = urlsplit(value)
    if url.scheme or url.netloc or not url.path:
        return target
    path = unquote(url.path)
    resolved = posixpath.normpath(path.lstrip('/') if path.startswith('/') else posixpath.join(owner.parent.as_posix(), path))
    if resolved not in removed:
        return target
    result = archived_url(resolved)
    if url.query:
        result += '?' + url.query
    if url.fragment:
        result += '#' + url.fragment
    return '<' + result + '>' if angled else result


markdown = re.compile(r'(!?\[[^\]\n]*\]\()(<[^>\n]+>|[^\s)\n]+)([^)\n]*\))')
html = re.compile(r'((?:src|href|poster)\s*=\s*)([\"\'])(.*?)(\2)', re.I)
css = re.compile(r'(url\(\s*)([\"\']?)([^)\"\']+)(\2\s*\))', re.I)
changed = []
for path in [ROOT / 'README.md', ROOT / 'LEIA_PRIMEIRO.md', *(ROOT / 'docs').rglob('*')]:
    if not path.is_file() or path.suffix not in {'.md', '.html'}:
        continue
    owner = path.relative_to(ROOT)
    before = path.read_bytes().decode('utf-8')
    after = markdown.sub(lambda m: m[1] + replace_target(owner, m[2]) + m[3], before)
    after = html.sub(lambda m: m[1] + m[2] + replace_target(owner, m[3]) + m[4], after)
    after = css.sub(lambda m: m[1] + m[2] + replace_target(owner, m[3]) + m[4], after)
    if before != after:
        path.write_bytes(after.encode('utf-8'))
        changed.append(owner.as_posix())
print(json.dumps({'changedDocuments': changed}, ensure_ascii=False, indent=2))

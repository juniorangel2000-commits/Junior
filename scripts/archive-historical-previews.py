#!/usr/bin/env python3
"""Archive only the reviewed manifest; default is read-only. Requires Python 3."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'docs/manutencao/arquivos-arquivados.json'
MEDIA = {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.webm', '.html'}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def load_manifest():
    data = json.loads(MANIFEST.read_text(encoding='utf-8'))
    seen = set()
    for entry in data['files']:
        rel = PurePosixPath(entry['path'])
        if (rel.is_absolute() or '..' in rel.parts or rel.parts[0] != 'docs'
                or rel.suffix.lower() not in MEDIA or str(rel) in seen):
            raise ValueError('Manifest contains an unsafe or duplicate path.')
        seen.add(str(rel))
    return data


def check_current(manifest):
    present = []
    for entry in manifest['files']:
        path = ROOT / entry['path']
        if not path.exists():
            continue
        if path.is_symlink() or not path.is_file() or ROOT not in path.resolve().parents:
            raise ValueError('Refusing an unexpected file: ' + entry['path'])
        content = path.read_bytes()
        if len(content) != entry['bytes'] or digest(content) != entry['sha256']:
            raise ValueError('File changed since review; preserved: ' + entry['path'])
        present.append(entry)
    return present


def check_archive(backup, manifest):
    with zipfile.ZipFile(backup) as archive:
        if json.loads(archive.read('MANIFEST.json')) != manifest:
            raise ValueError('Archive manifest differs from the reviewed selection.')
        expected = {'MANIFEST.json'} | {entry['path'] for entry in manifest['files']}
        if len(archive.namelist()) != len(expected) or set(archive.namelist()) != expected:
            raise ValueError('Archive has missing or additional entries.')
        for entry in manifest['files']:
            content = archive.read(entry['path'])
            if len(content) != entry['bytes'] or digest(content) != entry['sha256']:
                raise ValueError('Archive checksum failed: ' + entry['path'])


def make_archive(backup, manifest, present):
    if backup.exists():
        check_archive(backup, manifest)
        return
    if len(present) != len(manifest['files']):
        raise ValueError('Cannot create a complete archive: source files are missing.')
    backup.parent.mkdir(parents=True, exist_ok=True)
    temporary = backup.with_suffix(backup.suffix + '.partial')
    if temporary.exists():
        raise ValueError('A partial backup already exists; inspect it before retrying.')
    with zipfile.ZipFile(temporary, 'x', compression=zipfile.ZIP_STORED) as archive:
        archive.writestr('MANIFEST.json', json.dumps(manifest, ensure_ascii=False, indent=2))
        for entry in present:
            archive.write(ROOT / entry['path'], entry['path'])
    check_archive(temporary, manifest)
    temporary.rename(backup)


def restore(destination, backup, manifest):
    if destination == ROOT or ROOT in destination.parents:
        raise ValueError('Restore to a separate folder, then compare before copying back.')
    check_archive(backup, manifest)
    targets = [(entry, destination / entry['path']) for entry in manifest['files']]
    for entry, target in targets:
        if target.exists() or target.is_symlink():
            raise ValueError('Restore refuses to overwrite: ' + entry['path'])
        parent = target.parent
        while parent != destination.parent:
            if parent.is_symlink():
                raise ValueError('Restore refuses symlinked folders.')
            parent = parent.parent
    with zipfile.ZipFile(backup) as archive:
        for entry, target in targets:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(archive.read(entry['path']))
            if digest(target.read_bytes()) != entry['sha256']:
                raise ValueError('Restored checksum failed: ' + entry['path'])
    print(f"Restored and verified {len(targets)} files at {destination}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true', help='Archive, verify, then remove reviewed files')
    parser.add_argument('--backup', type=Path, help='ZIP path outside the repository')
    parser.add_argument('--restore-to', type=Path, help='Restore ZIP to a separate folder without overwriting')
    args = parser.parse_args()
    manifest = load_manifest()
    backup = args.backup.resolve() if args.backup else None
    if backup and (backup == ROOT or ROOT in backup.parents):
        raise ValueError('Keep the backup outside the repository.')
    if args.restore_to:
        if args.apply or not backup:
            raise ValueError('Restore requires --backup and cannot be combined with --apply.')
        restore(args.restore_to.resolve(), backup, manifest)
        return
    present = check_current(manifest)
    print(f"Reviewed: {len(manifest['files'])}; present: {len(present)}; "
          f"archive size: {manifest['bytes'] / 1024**2:.2f} MiB")
    if not args.apply:
        print('Read-only audit. No files changed.')
        return
    if not backup:
        raise ValueError('--apply requires --backup outside the repository.')
    make_archive(backup, manifest, present)
    # Recheck all source files after writing/verifying the complete backup.
    present = check_current(manifest)
    for entry in present:
        (ROOT / entry['path']).unlink()
    print(f"Archived and removed {len(present)} historical previews. Verified backup: {backup}")


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, zipfile.BadZipFile, KeyError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)

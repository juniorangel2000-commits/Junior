#!/usr/bin/env bash
# Roda os mesmos testes do CI (smoke interno e smoke do jogo) com a Godot 4.4 para Linux.
# Uso: GODOT=/caminho/Godot_v4.4-stable_linux.x86_64 native/test-linux.sh
# Rode antes native/build-linux.sh.
set -euo pipefail
cd "$(dirname "$0")/.."
GODOT=${GODOT:-godot}
[ -f bin/libafter_rain_native.so ] || { echo "Rode native/build-linux.sh antes." >&2; exit 1; }
log=$(mktemp -d)
"$GODOT" --headless --path . --editor --import >"$log/import.log" 2>&1 || true
"$GODOT" --headless --path . --log-file "$log/smoke.log" --script res://tests/native_smoke.gd
"$GODOT" --headless --path . --log-file "$log/export.log" -- --native-export-smoke
fail=0
for m in $(grep -o "'NATIVE_[A-Z_]*_OK'" ../.github/workflows/native-windows.yml | tr -d "'" | grep -v EXPORT | sort -u); do
  grep -q "$m" "$log/smoke.log" || { echo "Falta o marcador $m"; fail=1; }
done
grep -q NATIVE_EXPORT_SMOKE_OK "$log/export.log" || { echo "Falta NATIVE_EXPORT_SMOKE_OK"; fail=1; }
if grep -qE 'SCRIPT ERROR:|^ERROR:' "$log/smoke.log" "$log/export.log"; then
  echo "Erro de script ou execução nos logs ($log)."; fail=1
fi
[ $fail -eq 0 ] && echo "TESTES NATIVOS OK" || { echo "TESTES NATIVOS FALHARAM (logs em $log)"; exit 1; }

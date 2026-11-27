#!/usr/bin/env bash
# Compila a extensão C++ para Linux x64 (testes locais; o jogo oficial é o de Windows).
# Requer: git, python3 com SCons (python3 -m pip install scons) e g++ com C++20.
set -euo pipefail
cd "$(dirname "$0")"
if [ ! -f godot-cpp/SConstruct ]; then
  git clone --depth 1 --branch godot-4.4-stable https://github.com/godotengine/godot-cpp.git godot-cpp
fi
tag=$(git -C godot-cpp describe --tags --exact-match HEAD)
[ "$tag" = "godot-4.4-stable" ] || { echo "godot-cpp precisa estar na tag godot-4.4-stable." >&2; exit 1; }
mkdir -p ../bin
python3 -m SCons platform=linux arch=x86_64 target=template_debug -j"$(nproc)"
[ -f ../bin/libafter_rain_native.so ] || { echo "Biblioteca esperada não foi gerada." >&2; exit 1; }
cp after_rain.gdextension.in ../after_rain.gdextension

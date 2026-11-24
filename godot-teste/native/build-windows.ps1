$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    if (-not (Test-Path 'godot-cpp/SConstruct')) {
        git clone --depth 1 --branch godot-4.4-stable https://github.com/godotengine/godot-cpp.git godot-cpp
        if ($LASTEXITCODE -ne 0) { throw 'Falha ao obter godot-cpp.' }
    }
    $tag = git -C godot-cpp describe --tags --exact-match HEAD
    if ($LASTEXITCODE -ne 0 -or $tag -ne 'godot-4.4-stable') { throw 'godot-cpp precisa estar na tag godot-4.4-stable.' }
    New-Item -ItemType Directory -Force ../bin | Out-Null
    python -m SCons platform=windows arch=x86_64 target=template_debug -j4
    if ($LASTEXITCODE -ne 0) { throw 'Falha na compilação C++.' }
    if (-not (Test-Path '../bin/after_rain_native.dll')) { throw 'DLL esperada não foi gerada.' }
    Copy-Item after_rain.gdextension.in ../after_rain.gdextension -Force
} finally {
    Pop-Location
}

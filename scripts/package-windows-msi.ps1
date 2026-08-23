# Build Windows NSIS + MSI (x64 + ARM64) on a Windows host.
# Requires: Node.js, Rust, WiX Toolset v3 (candle/light on PATH).
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$Version = (Get-Content package.json | ConvertFrom-Json).version
$Out = Join-Path $PWD "releases\$Version"
New-Item -ItemType Directory -Force -Path $Out | Out-Null

function Stage-Arch($Target, $ArchLabel) {
  Write-Host "==> Building Windows $ArchLabel ($Target)"
  npm run tauri -- build --target $Target --bundles nsis,msi
  $Nsis = Join-Path $PWD "src-tauri\target\$Target\release\bundle\nsis"
  $Msi = Join-Path $PWD "src-tauri\target\$Target\release\bundle\msi"
  $Setup = Get-ChildItem "$Nsis\Leafio_${Version}_*-setup.exe" | Select-Object -First 1
  $MsiFile = Get-ChildItem "$Msi\Leafio_${Version}_*.msi" | Select-Object -First 1
  if (-not $Setup) { throw "NSIS setup not found under $Nsis" }
  if (-not $MsiFile) { throw "MSI not found under $Msi" }
  Copy-Item $Setup.FullName (Join-Path $Out "Leafio_${Version}_Windows_${ArchLabel}-setup.exe") -Force
  Copy-Item $MsiFile.FullName (Join-Path $Out "Leafio_${Version}_Windows_${ArchLabel}.msi") -Force
  Get-ChildItem $Out | Format-Table Name, Length
}

Stage-Arch "x86_64-pc-windows-msvc" "x64"
Stage-Arch "aarch64-pc-windows-msvc" "arm64"
Write-Host "Released to $Out"

# 3~4주차 3D 영상 전부 만들기: 지오보드 장면 1~8 → videos/03-1/1~8.mp4, 파이프 블록 장면 11~17 → videos/04-1/1~7.mp4
# 사용: powershell -File render_w34.ps1 [장면번호들]   (번호 없으면 전부)
param([int[]]$Scenes = @(1,2,3,4,5,6,7,8,11,12,13,14,15,16,17))
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$env:GPU = '1'; $env:PAGE = 'w34.html'
$tmp = Join-Path $env:TEMP 'w34_frames'
foreach ($s in $Scenes) {
  if ($s -le 10) { $dir = '..\..\deliverable\videos\03-1'; $n = $s } else { $dir = '..\..\deliverable\videos\04-1'; $n = $s - 10 }
  New-Item -ItemType Directory -Force $dir | Out-Null
  $p = Join-Path $tmp "s$s"; if (Test-Path $p) { Get-ChildItem $p -File | Remove-Item -Force }
  node render.js $s $p | Select-Object -Last 1
  python -I sfx.py "$p\events.json" "$p\sfx.wav" | Out-Null
  ffmpeg -y -loglevel error -framerate 30 -i "$p\f%04d.png" -i "$p\sfx.wav" -c:v libx264 -pix_fmt yuv420p -crf 21 -c:a aac -b:a 128k -shortest -movflags +faststart "$dir\$n.mp4"
  "done $s -> $dir\$n.mp4"
}

# 8~10주차 3D 영상 전부 만들기 (김유천 대리님 카톡 2026-11-23)
#  산가지 81~87 → videos/08-2/1~7, 스트로우 블록 91~99 → videos/09-1/1~9, 매듭풀기 101~105 → videos/09-2/1~5, 고리블록 111~117 → videos/10-2/1~7
# 사용: powershell -File render_w810.ps1 [장면번호들]   (번호 없으면 전부). 먼저 bash build_w810.sh 로 빌드.
param([int[]]$Scenes = @(81,82,83,84,85,86,87,91,92,93,94,95,96,97,98,99,101,102,103,104,105,111,112,113,114,115,116,117))
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$env:GPU = '1'; $env:PAGE = 'w810.html'
$tmp = Join-Path $env:TEMP 'w810_frames'
foreach ($s in $Scenes) {
  if ($s -lt 90) { $dir = '..\..\deliverable\videos\08-2'; $n = $s - 80 }
  elseif ($s -lt 100) { $dir = '..\..\deliverable\videos\09-1'; $n = $s - 90 }
  elseif ($s -lt 110) { $dir = '..\..\deliverable\videos\09-2'; $n = $s - 100 }
  else { $dir = '..\..\deliverable\videos\10-2'; $n = $s - 110 }
  New-Item -ItemType Directory -Force $dir | Out-Null
  $p = Join-Path $tmp "s$s"; if (Test-Path $p) { Remove-Item -Recurse -Force $p }
  node render.js $s $p | Select-Object -Last 1
  python -I sfx.py "$p\events.json" "$p\sfx.wav" | Out-Null
  ffmpeg -y -loglevel error -framerate 30 -i "$p\f%04d.png" -i "$p\sfx.wav" -c:v libx264 -pix_fmt yuv420p -crf 21 -c:a aac -b:a 128k -shortest -movflags +faststart "$dir\$n.mp4"
  Remove-Item -Recurse -Force $p
  "done $s -> $dir\$n.mp4"
}

# ============================================================
# 바탕화면에 '🏫 AI 일진방 전체 깨우기' 원클릭 아이콘 생성 스크립트
# - 데스크톱 / 노트북 어느 PC에서든 1회 실행하면 바탕화면에 바로가기 생성
# ============================================================

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir   = Split-Path -Parent $ScriptDir
$BatPath   = Join-Path $RootDir "AI일진방_전체깨우기.bat"
$Desktop   = [Environment]::GetFolderPath("Desktop")
if (-not $Desktop) { $Desktop = Join-Path $env:USERPROFILE "Desktop" }
$LinkPath  = Join-Path $Desktop "AI 일진방 전체 깨우기.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($LinkPath)
$Shortcut.TargetPath       = $BatPath
$Shortcut.WorkingDirectory = $RootDir
$Shortcut.Description      = "껌씹는 AI 일진방 모든 AI(안티고·홍보부·CS·비서실·지피고·올라고) 원클릭 전체 깨우기"
# Windows 기본 아이콘 중 번개/별 느낌의 선명한 아이콘 사용 (shell32.dll 43번 별 또는 imageres.dll 109번)
$Shortcut.IconLocation     = "$env:SystemRoot\System32\shell32.dll,43"
$Shortcut.Save()

Write-Host "✅ 바탕화면 아이콘 생성 완료: $LinkPath" -ForegroundColor Green

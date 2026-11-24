# ============================================================
# 안티그래비티 4개 인격 전용 3분 자동 순찰 등록 스크립트
# - Submit 팝업 없음 / 검은 창 없음 / 재부팅 후 자동 재개
# ============================================================

$ErrorActionPreference = "Stop"
$ScriptDir    = Split-Path -Parent $MyInvocation.MyCommand.Path
$PatrolScript = Join-Path $ScriptDir "antigravity_patrol.ps1"
$VbsLauncher  = Join-Path $ScriptDir "run_antigravity_hidden.vbs"
$TaskName     = "BujaAiRoom_AntigravityPatrol"

$vbsCode = "CreateObject(`"WScript.Shell`").Run `"powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"`"$PatrolScript`"`"`", 0, False"
Set-Content -Path $VbsLauncher -Value $vbsCode -Encoding ASCII

& schtasks.exe /Create /F /SC MINUTE /MO 3 /TN $TaskName /TR "wscript.exe `"$VbsLauncher`""
if ($LASTEXITCODE -ne 0) {
    throw "작업 스케줄러 등록 실패 (exit code: $LASTEXITCODE)"
}

Write-Host "✅ 안티그래비티 4개 인격 자동 순찰 등록 완료! (3분 주기 · 작업명: $TaskName)" -ForegroundColor Green

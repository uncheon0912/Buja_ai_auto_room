# ============================================================
# Windows 작업 스케줄러 자동 실행 등록 (일반 사용자 권한 OK!)
# - 3분마다 창 없이 백그라운드로 jipigo_patrol.ps1 + 대화 백업 실행
# - PC를 껐다 켜고 로그인해도 자동으로 계속 동작
# ============================================================

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PatrolScript = Join-Path $ScriptDir "jipigo_patrol.ps1"
$VbsLauncher  = Join-Path $ScriptDir "run_hidden.vbs"
$TaskName     = "BujaAiRoom_JipigoPatrol"

# 검은 콘솔 창이 전혀 깜빡이지 않도록 숨김 실행 VBS 래퍼 생성
$vbsCode = "CreateObject(`"WScript.Shell`").Run `"powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"`"$PatrolScript`"`"`", 0, False"
Set-Content -Path $VbsLauncher -Value $vbsCode -Encoding ASCII

# 일반 사용자 권한으로 3분마다 반복 실행 작업 등록
& schtasks.exe /Create /F /SC MINUTE /MO 3 /TN $TaskName /TR "wscript.exe `"$VbsLauncher`""
if ($LASTEXITCODE -ne 0) {
    throw "작업 스케줄러 등록 실패 (exit code: $LASTEXITCODE)"
}

Write-Host "✅ 등록 완료! 이제 Submit 팝업이나 검은 창 없이 3분마다 완전 자동으로 순찰합니다. (작업명: $TaskName)" -ForegroundColor Green

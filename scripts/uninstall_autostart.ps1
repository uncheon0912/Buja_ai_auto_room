# ============================================================
# Windows 작업 스케줄러 자동 실행 해제 스크립트
# ============================================================

$TaskName = "BujaAiRoom_JipigoPatrol"
& schtasks.exe /Delete /F /TN $TaskName
Write-Host "🛑 자동 순찰 작업($TaskName)을 해제했습니다." -ForegroundColor Yellow

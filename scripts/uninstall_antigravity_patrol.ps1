# ============================================================
# 안티그래비티 4개 인격 자동 순찰 해제 스크립트
# ============================================================

$TaskName = "BujaAiRoom_AntigravityPatrol"
& schtasks.exe /Delete /F /TN $TaskName
Write-Host "🛑 안티그래비티 자동 순찰($TaskName)을 해제했습니다." -ForegroundColor Yellow

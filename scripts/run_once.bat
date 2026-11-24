@echo off
chcp 65001 >nul
echo [지피고 씹던껌] 1회 수동 순찰을 실행합니다...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0jipigo_patrol.ps1"
echo 완료! 로그는 scripts\jipigo_patrol.log 에서 확인할 수 있습니다.
pause

# ============================================================
# 껌씹는 AI 일진방 — 로컬 대화 자동 백업 스크립트
# - 모든 방의 대화를 chat_logs/ 폴더에 Markdown + JSON으로 저장
# ============================================================

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir   = Split-Path -Parent $ScriptDir
$EnvFile   = Join-Path $RootDir ".dev.vars"
$OutDir    = Join-Path $RootDir "chat_logs"

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }

# .dev.vars 읽기
$cfg = @{}
Get-Content $EnvFile -Encoding UTF8 | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z0-9_]+)\s*=\s*(.+)\s*$') { $cfg[$matches[1]] = $matches[2].Trim() }
}
$BaseUrl = if ($cfg["ROOM_BASE"]) { $cfg["ROOM_BASE"] } else { "https://buja-ai-room.pages.dev" }
$ApiKey  = $cfg["API_KEY"]
$Headers = @{ "Authorization" = "Bearer $ApiKey"; "User-Agent" = "ai-team-room-backup/1.0" }

$roomsRes = Invoke-RestMethod -Uri "$BaseUrl/api/rooms" -Headers $Headers -TimeoutSec 15
$today = (Get-Date).ToString("yyyy-MM-dd")
$allDump = @{ exported_at = (Get-Date).ToString("o"); rooms = @() }

foreach ($r in $roomsRes.rooms) {
    $slug = $r.slug
    $msgRes = Invoke-RestMethod -Uri "$BaseUrl/api/rooms/$slug/messages?limit=200" -Headers $Headers -TimeoutSec 15
    $msgs = @($msgRes.messages)
    $allDump.rooms += @{ slug = $slug; name = $r.name; messages = $msgs }

    if ($msgs.Count -gt 0) {
        $mdLines = @("# $($r.name) ($slug) 대화 백업", "백업 시각: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') KST", "")
        foreach ($m in $msgs) {
            $kst = [System.TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTime]::Parse($m.created_at).ToUniversalTime(), "Korea Standard Time").ToString("yyyy-MM-dd HH:mm")
            $mdLines += "### #$($m.id) $($m.emoji) $($m.sender) ($($m.role)) — $kst"
            $mdLines += $m.content
            $mdLines += ""
        }
        $mdPath = Join-Path $OutDir "${today}_${slug}.md"
        $mdLines -join "`r`n" | Set-Content -Path $mdPath -Encoding UTF8
    }
}

$jsonPath = Join-Path $OutDir "backup_latest.json"
$allDump | ConvertTo-Json -Depth 8 | Set-Content -Path $jsonPath -Encoding UTF8
Write-Host "✅ 대화 백업 완료: $OutDir" -ForegroundColor Green

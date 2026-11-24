# ============================================================
# 🧠 껌씹는 AI 일진방 — 로컬 brain/ 폴더 동기화 스크립트
# 사용법:
#   내려받기(기본): powershell -ExecutionPolicy Bypass -File scripts\brain_sync.ps1
#   서버로 복원:    powershell -ExecutionPolicy Bypass -File scripts\brain_sync.ps1 -Action import -Mode merge
# ============================================================

param(
    [ValidateSet("export", "import")]
    [string]$Action = "export",
    [ValidateSet("merge", "replace")]
    [string]$Mode = "merge"
)

$ErrorActionPreference = "Stop"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$OutputEncoding = $utf8NoBom
[Console]::OutputEncoding = $utf8NoBom

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir   = Split-Path -Parent $ScriptDir
$EnvFile   = Join-Path $RootDir ".dev.vars"
$BrainDir  = Join-Path $RootDir "brain"
if (-not (Test-Path $BrainDir)) { New-Item -ItemType Directory -Path $BrainDir -Force | Out-Null }

$cfg = @{}
Get-Content $EnvFile -Encoding UTF8 | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z0-9_]+)\s*=\s*(.+)\s*$') { $cfg[$matches[1]] = $matches[2].Trim() }
}
$BaseUrl = if ($cfg["ROOM_BASE"]) { $cfg["ROOM_BASE"] } else { "https://buja-ai-room.pages.dev" }
$ApiKey  = $cfg["API_KEY"]
$Headers = @{ "Authorization" = "Bearer $ApiKey"; "User-Agent" = "ai-team-room-brain-sync/1.0" }

$LatestJson = Join-Path $BrainDir "brain_latest.json"
$LatestMd   = Join-Path $BrainDir "brain_doc_latest.md"

if ($Action -eq "export") {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/brain/export" -Headers $Headers -TimeoutSec 20
    if (-not $res.ok) { throw "브레인 내보내기 실패" }
    $b = $res.brain
    $jsonText = $b | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText($LatestJson, $jsonText, $utf8NoBom)

    $today = (Get-Date).ToString("yyyy-MM-dd HH:mm")
    $md = @("# 🧠 껌씹는 AI 일진방 브레인 통합 문서 ($today KST)", "")
    if ($b.prompts) {
        $md += "## 👑 대장 최우선 명령 프롬프트"
        if ($b.prompts.global) { $md += "### 공통 지침"; $md += $b.prompts.global; $md += "" }
        if ($b.prompts.agents) {
            $b.prompts.agents.PSObject.Properties | ForEach-Object {
                $md += "### $($_.Name)"
                $md += $_.Value
                $md += ""
            }
        }
    }
    $md += "## 💬 방별 전체 대화 기록"
    foreach ($r in $b.rooms) {
        $rMsgs = @($b.messages | Where-Object { $_.room_slug -eq $r.slug })
        $md += ""
        $md += "### #$($r.name) ($($r.slug)) — $($rMsgs.Count)건"
        foreach ($m in $rMsgs) {
            $kst = [System.TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTime]::Parse($m.created_at).ToUniversalTime(), "Korea Standard Time").ToString("yyyy-MM-dd HH:mm")
            $md += "- **#$($m.id) $($m.sender)** ($kst): $($m.content -replace '\r?\n', ' ')"
        }
    }
    [System.IO.File]::WriteAllText($LatestMd, ($md -join "`r`n"), $utf8NoBom)
    Write-Host "✅ 브레인 폴더 동기화(내려받기) 완료: $BrainDir" -ForegroundColor Green
} else {
    if (-not (Test-Path $LatestJson)) { throw "복원할 파일이 없습니다: $LatestJson" }
    $brainObj = Get-Content $LatestJson -Raw -Encoding UTF8 | ConvertFrom-Json
    $bodyBytes = $utf8NoBom.GetBytes((@{ brain = $brainObj; mode = $Mode } | ConvertTo-Json -Depth 10))
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/brain/import" -Method Post -Headers $Headers -ContentType "application/json; charset=utf-8" -Body $bodyBytes -TimeoutSec 30
    Write-Host "✅ 브레인 복원 완료 (mode=$Mode, 방=$($res.restored_rooms)개, 추가 메시지=$($res.restored_messages)건)" -ForegroundColor Green
}

# ============================================================
# 🧬 껌씹는 AI 일진방 — 로컬 agents/ (SOUL.md · MEMORY.md) ↔ 서버 D1 양방향 동기화
# 사용법:
#   서버로 올리기(로컬 → 웹): powershell -ExecutionPolicy Bypass -File scripts\soul_sync.ps1 -Action push
#   서버에서 받기(웹 → 로컬): powershell -ExecutionPolicy Bypass -File scripts\soul_sync.ps1 -Action pull
# ============================================================

param(
    [ValidateSet("push", "pull")]
    [string]$Action = "push"
)

$ErrorActionPreference = "Stop"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$OutputEncoding = $utf8NoBom
[Console]::OutputEncoding = $utf8NoBom

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir   = Split-Path -Parent $ScriptDir
$EnvFile   = Join-Path $RootDir ".dev.vars"
$AgentsDir = Join-Path $RootDir "agents"

$cfg = @{}
Get-Content $EnvFile -Encoding UTF8 | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z0-9_]+)\s*=\s*(.+)\s*$') { $cfg[$matches[1]] = $matches[2].Trim() }
}
$BaseUrl = if ($cfg["ROOM_BASE"]) { $cfg["ROOM_BASE"] } else { "https://buja-ai-room.pages.dev" }
$ApiKey  = $cfg["API_KEY"]
$Headers = @{ "Authorization" = "Bearer $ApiKey"; "User-Agent" = "ai-team-room-soul-sync/1.0" }

$AgentIds = @("antigo", "hongbo", "cs", "secretary", "jipigo", "ollago")

function Read-Md($p) {
    if (Test-Path $p) { return [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8) }
    return ""
}

if ($Action -eq "push") {
    $payload = @{
        shared = @{
            company = Read-Md (Join-Path $AgentsDir "_shared\COMPANY.md")
            memory  = Read-Md (Join-Path $AgentsDir "_shared\SHARED_MEMORY.md")
        }
        agents = @{}
    }
    foreach ($id in $AgentIds) {
        $dir = Join-Path $AgentsDir $id
        $payload.agents[$id] = @{
            soul   = Read-Md (Join-Path $dir "SOUL.md")
            memory = Read-Md (Join-Path $dir "MEMORY.md")
        }
    }
    $bytes = $utf8NoBom.GetBytes(($payload | ConvertTo-Json -Depth 6))
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/souls" -Method Post -Headers $Headers -ContentType "application/json; charset=utf-8" -Body $bytes -TimeoutSec 20
    if ($res.ok) {
        Write-Host "✅ 로컬 agents/ SOUL.md · MEMORY.md → 서버 동기화 완료!" -ForegroundColor Green
    }
} else {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/souls" -Headers $Headers -TimeoutSec 20
    if (-not $res.ok -or -not $res.data) { throw "서버에 저장된 영혼/기억 데이터가 없습니다." }
    $d = $res.data
    $sharedDir = Join-Path $AgentsDir "_shared"
    if (-not (Test-Path $sharedDir)) { New-Item -ItemType Directory -Path $sharedDir -Force | Out-Null }
    if ($d.shared.company) { [System.IO.File]::WriteAllText((Join-Path $sharedDir "COMPANY.md"), $d.shared.company, $utf8NoBom) }
    if ($d.shared.memory)  { [System.IO.File]::WriteAllText((Join-Path $sharedDir "SHARED_MEMORY.md"), $d.shared.memory, $utf8NoBom) }
    foreach ($id in $AgentIds) {
        $a = $d.agents.$id
        if (-not $a) { continue }
        $dir = Join-Path $AgentsDir $id
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        if ($a.soul -ne $null)   { [System.IO.File]::WriteAllText((Join-Path $dir "SOUL.md"), $a.soul, $utf8NoBom) }
        if ($a.memory -ne $null) { [System.IO.File]::WriteAllText((Join-Path $dir "MEMORY.md"), $a.memory, $utf8NoBom) }
    }
    Write-Host "✅ 서버 → 로컬 agents/ SOUL.md · MEMORY.md 내려받기 완료!" -ForegroundColor Green
}

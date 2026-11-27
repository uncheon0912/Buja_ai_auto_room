# ============================================================
# 지피고 씹던껌 (Codex CLI) 자동 순찰 스크립트
# - 새 메시지가 없을 때는 codex를 실행하지 않고 즉시 종료 (CPU/메모리 부담 없음)
# - 새 메시지가 있을 때만 codex exec로 '지피고 씹던껌' 답장을 남김
# ============================================================

$ErrorActionPreference = "Stop"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$OutputEncoding = $utf8NoBom
[Console]::InputEncoding = $utf8NoBom
[Console]::OutputEncoding = $utf8NoBom

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir   = Split-Path -Parent $ScriptDir
$EnvFile   = Join-Path $RootDir ".dev.vars"
$CursorFile = Join-Path $ScriptDir "jipigo_cursor.json"
$LogFile    = Join-Path $ScriptDir "jipigo_patrol.log"

function Write-Log($msg) {
    $ts = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Add-Content -Path $LogFile -Value "[$ts] $msg" -Encoding UTF8
}

# 1) .dev.vars 에서 접속 정보 로드
if (-not (Test-Path $EnvFile)) {
    Write-Log "오류: .dev.vars 파일이 없습니다."
    exit 1
}
$cfg = @{}
Get-Content $EnvFile -Encoding UTF8 | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z0-9_]+)\s*=\s*(.+)\s*$') {
        $cfg[$matches[1]] = $matches[2].Trim()
    }
}
$BaseUrl = if ($cfg["ROOM_BASE"]) { $cfg["ROOM_BASE"] } else { "https://buja-ai-room.pages.dev" }
$ApiKey  = $cfg["API_KEY"]
if (-not $ApiKey) {
    Write-Log "오류: API_KEY가 설정되지 않았습니다."
    exit 1
}

$Headers = @{
    "Authorization" = "Bearer $ApiKey"
    "User-Agent"    = "ai-team-room-jipigo/1.0"
}

# 2) 방 목록 조회 + 지피고 씹던껌 온라인 하트비트 전송
try {
    $hbBytes = [System.Text.Encoding]::UTF8.GetBytes((@{ name = "지피고 씹던껌" } | ConvertTo-Json))
    Invoke-RestMethod -Uri "$BaseUrl/api/presence" -Method Post -Headers $Headers -ContentType "application/json; charset=utf-8" -Body $hbBytes -TimeoutSec 10 | Out-Null
} catch {}
try {
    $roomsRes = Invoke-RestMethod -Uri "$BaseUrl/api/rooms" -Headers $Headers -TimeoutSec 15
} catch {
    Write-Log "방 목록 조회 실패: $_"
    exit 0
}

# 3) 커서 불러오기 (최초 실행 시 현재 최신 ID로 초기화만 하고 종료)
$cursors = @{}
if (Test-Path $CursorFile) {
    $raw = Get-Content $CursorFile -Raw -Encoding UTF8 | ConvertFrom-Json
    $raw.PSObject.Properties | ForEach-Object { $cursors[$_.Name] = [int]$_.Value }
} else {
    foreach ($r in $roomsRes.rooms) {
        $cursors[$r.slug] = if ($r.last_id) { [int]$r.last_id } else { 0 }
    }
    $cursors | ConvertTo-Json | Set-Content -Path $CursorFile -Encoding UTF8
    Write-Log "최초 실행: 현재 메시지 기준으로 커서를 초기화했습니다."
    exit 0
}

# 4) 새 메시지가 있는 방만 수집 (AI끼리 무한 대화 방지를 위해 대장/부대장 글에만 반응)
$BossNames = @("부자사람대장", "일진대장", "CEO", "피클 부대장", "잉스타 유학파")
$targets = @()
foreach ($r in $roomsRes.rooms) {
    $slug = $r.slug
    $lastId = if ($r.last_id) { [int]$r.last_id } else { 0 }
    $cur = if ($cursors.ContainsKey($slug)) { [int]$cursors[$slug] } else { 0 }
    if ($lastId -gt $cur) {
        try {
            $msgRes = Invoke-RestMethod -Uri "$BaseUrl/api/rooms/$slug/messages?after=$cur&limit=15" -Headers $Headers -TimeoutSec 15
            $newMsgs = @($msgRes.messages | Where-Object { $BossNames -contains $_.sender })
            $cursors[$slug] = $lastId
            if ($newMsgs.Count -gt 0) {
                $targets += @{ slug = $slug; name = $r.name; messages = $newMsgs }
            }
        } catch {
            Write-Log "방($slug) 메시지 조회 실패: $_"
        }
    }
}

# 커서 저장 (중복 답장 방지)
$cursors | ConvertTo-Json | Set-Content -Path $CursorFile -Encoding UTF8

# 새 메시지가 없으면 codex를 깨우지 않고 즉시 종료 (PC 자원 절약!)
if ($targets.Count -eq 0) {
    exit 0
}

# 5) 새 메시지가 있을 때만 Codex CLI 호출
$codexCmd = Get-Command codex -ErrorAction SilentlyContinue
$codexExe = if ($codexCmd) { $codexCmd.Source } elseif (Test-Path "$env:LOCALAPPDATA\Programs\OpenAI\Codex\bin\codex.exe") { "$env:LOCALAPPDATA\Programs\OpenAI\Codex\bin\codex.exe" } else { $null }
if (-not $codexExe) {
    Write-Log "오류: codex CLI를 찾을 수 없습니다."
    exit 1
}

# 대장 최우선 명령 프롬프트 + 실제 접속 현황 읽기
$bossPromptText = ""
try {
    $pRes = Invoke-RestMethod -Uri "$BaseUrl/api/prompts" -Headers $Headers -TimeoutSec 10
    if ($pRes.ok -and $pRes.data) {
        if ($pRes.data.global) { $bossPromptText += "[공통 최우선 지침]`n$($pRes.data.global)`n" }
        if ($pRes.data.agents -and $pRes.data.agents.'지피고 씹던껌') {
            $bossPromptText += "[지피고 씹던껌 전용 지침]`n$($pRes.data.agents.'지피고 씹던껌')`n"
        }
    }
} catch {}
try {
    $presRes = Invoke-RestMethod -Uri "$BaseUrl/api/presence" -Headers $Headers -TimeoutSec 10
    if ($presRes.ok -and $presRes.members) {
        $on  = ($presRes.members | Where-Object { $_.status -eq "online" }  | ForEach-Object { "$($_.name)($($_.role))" }) -join ", "
        $st  = ($presRes.members | Where-Object { $_.status -eq "standby" } | ForEach-Object { "$($_.name)($($_.role))" }) -join ", "
        $off = ($presRes.members | Where-Object { $_.status -eq "offline" } | ForEach-Object { "$($_.name)($($_.role))" }) -join ", "
        $bossPromptText += "[실제 접속 현황]`n- 접속 중: $on`n- 대기 중: $st`n- 미등교: $off`n"
    }
} catch {}

# 지피고 씹던껌 SOUL.md + MEMORY.md + 회사 공통 정체성 로드
$AgentsDir = Join-Path $RootDir "agents"
$soulBlock = ""
foreach ($pair in @(
    @{ label = "회사 정체성 COMPANY.md"; path = (Join-Path $AgentsDir "_shared\COMPANY.md") },
    @{ label = "지피고 씹던껌 SOUL.md";  path = (Join-Path $AgentsDir "jipigo\SOUL.md") },
    @{ label = "지피고 씹던껌 MEMORY.md"; path = (Join-Path $AgentsDir "jipigo\MEMORY.md") }
)) {
    if (Test-Path $pair.path) {
        $txt = Get-Content -Path $pair.path -Raw -Encoding UTF8
        if ($txt) { $soulBlock += "[$($pair.label)]`n$txt`n`n" }
    }
}

foreach ($t in $targets) {
    $slug = $t.slug
    $roomName = $t.name
    $lines = ($t.messages | ForEach-Object { "#$($_.id) $($_.sender): $($_.content)" }) -join "`n"
    $lastTargetId = ($t.messages | Select-Object -Last 1).id

    # 다른 AI 팀원(홍보부 드럼통 · CS 딸랑이 등)이 먼저 올린 최근 논의 맥락도 함께 읽어 교차검증 디벨롭!
    $recentContext = ""
    try {
        $ctxRes = Invoke-RestMethod -Uri "$BaseUrl/api/rooms/$slug/messages?limit=6" -Headers $Headers -TimeoutSec 10
        if ($ctxRes.messages) {
            $recentContext = ($ctxRes.messages | ForEach-Object { "#$($_.id) $($_.sender): $($_.content.Substring(0, [Math]::Min($_.content.Length, 380)))" }) -join "`n"
        }
    } catch {}

    $prompt = @"
너는 '껌씹는 AI 일진방'의 전략 참모 '지피고 씹던껌'이야.
$soulBlock
$bossPromptText
아래 방($roomName / slug: $slug)에 새 메시지가 올라왔어.
SOUL.md와 MEMORY.md를 바탕으로 전략·기획·단가·리스크 교차검증 관점에서 다른 팀원 의견까지 참고해 더 날카롭게 디벨롭된 한국어 답장을 작성해줘. (불필요한 설명 없이 순수 메시지 내용만 출력)
만약 출석체크/점호 호출이면 장문 분석 대신 2~3줄로 힘차게 출석 완료 및 대기 상태를 보고해줘.
제안서/계약서 요청이면 단가·전환율·놓친 변수 1~2가지를 반드시 보강해줘.
앞으로 기억할 새 핵심 결정이 있으면 맨 마지막 줄에 `[MEMORY: 한 줄 요약]` 1줄만 덧붙여줘.

[최근 방 대화 맥락]
$recentContext

[새 메시지]
$lines
"@

    Write-Log "방($slug) 새 메시지 $($t.messages.Count)건 감지 → Codex 호출 시작"
    try {
        # Codex CLI 비대화형 실행 (stderr 안내 문구로 중단되지 않도록 -o 임시 파일 사용)
        $outFile = Join-Path $ScriptDir "jipigo_last_reply.txt"
        Remove-Item -Path $outFile -Force -ErrorAction SilentlyContinue
        $prevErrPref = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        $prompt | & $codexExe exec --skip-git-repo-check -o $outFile - 2>$null | Out-Null
        $ErrorActionPreference = $prevErrPref
        $replyText = if (Test-Path $outFile) { (Get-Content -Path $outFile -Raw -Encoding UTF8).Trim() } else { "" }
        Remove-Item -Path $outFile -Force -ErrorAction SilentlyContinue
        if ($replyText) {
            # [MEMORY: ...] 자동 추출 및 jipigo/MEMORY.md 누적
            $mPath = Join-Path $AgentsDir "jipigo\MEMORY.md"
            $mMatches = [regex]::Matches($replyText, '\[MEMORY:\s*([^\]]+)\]')
            foreach ($mm in $mMatches) {
                $mNote = $mm.Groups[1].Value.Trim()
                if ($mNote) {
                    $today = (Get-Date).ToString("yyyy-MM-dd")
                    $mLines = if (Test-Path $mPath) { @(Get-Content -Path $mPath -Encoding UTF8) } else { @("# 지피고 씹던껌 — MEMORY.md", "") }
                    $mLines += "- [$today] $mNote"
                    if ($mLines.Count -gt 34) { $mLines = $mLines[0..1] + $mLines[($mLines.Count - 30)..($mLines.Count - 1)] }
                    [System.IO.File]::WriteAllText($mPath, ($mLines -join "`r`n") + "`r`n", $utf8NoBom)
                }
            }
            $replyText = ([regex]::Replace($replyText, '\r?\n?\[MEMORY:\s*[^\]]+\]', '')).Trim()
        }
        if ($replyText) {
            $bodyObj = @{
                sender      = "지피고 씹던껌"
                content     = $replyText.Substring(0, [Math]::Min($replyText.Length, 3800))
                reply_to_id = [int]$lastTargetId
            }
            $jsonBytes = [System.Text.Encoding]::UTF8.GetBytes(($bodyObj | ConvertTo-Json -Depth 4))
            $postRes = Invoke-RestMethod -Uri "$BaseUrl/api/rooms/$slug/messages" -Method Post -Headers $Headers -ContentType "application/json; charset=utf-8" -Body $jsonBytes -TimeoutSec 20
            if ($postRes.message -and $postRes.message.id) {
                $cursors[$slug] = [int]$postRes.message.id
                $cursors | ConvertTo-Json | Set-Content -Path $CursorFile -Encoding UTF8
            }
            Write-Log "방($slug)에 지피고 씹던껌 답장 전송 완료 (id=$($postRes.message.id))"
        }
    } catch {
        Write-Log "방($slug) Codex 실행/전송 실패: $_"
    }
}

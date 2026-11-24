# ============================================================
# 껌씹는 AI 일진방 — 안티그래비티 4개 인격 전용 자동 순찰 스크립트
# - 담당 인격: 안티고 휘발유 / 홍보부 드럼통 / CS 딸랑이 / 대장 비서실
# - 새 메시지가 없으면 agy.exe를 실행하지 않고 0.1초 만에 종료 (PC 부담 0%)
# - 새 메시지가 있으면 대장 최우선 프롬프트(/api/prompts)를 읽고 agy.exe로 답장 후 chat_logs/ 백업
# ============================================================

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir    = Split-Path -Parent $ScriptDir
$EnvFile    = Join-Path $RootDir ".dev.vars"
$CursorFile = Join-Path $ScriptDir "antigravity_cursor.json"
$LogFile    = Join-Path $ScriptDir "antigravity_patrol.log"
$LockFile   = Join-Path $ScriptDir "antigravity_patrol.lock"
$BackupPs1  = Join-Path $ScriptDir "backup_chats.ps1"

function Write-Log($msg) {
    $ts = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Add-Content -Path $LogFile -Value "[$ts] $msg" -Encoding UTF8
}

# 중복 실행 방지 락 (5분 이상 오래된 락은 자동 해제)
if (Test-Path $LockFile) {
    $age = ((Get-Date) - (Get-Item $LockFile).LastWriteTime).TotalMinutes
    if ($age -lt 5) { exit 0 }
}
Set-Content -Path $LockFile -Value (Get-Date).ToString("o") -Encoding UTF8

try {
    if (-not (Test-Path $EnvFile)) { Write-Log "오류: .dev.vars 파일 없음"; exit 1 }
    $cfg = @{}
    Get-Content $EnvFile -Encoding UTF8 | ForEach-Object {
        if ($_ -match '^\s*([A-Za-z0-9_]+)\s*=\s*(.+)\s*$') { $cfg[$matches[1]] = $matches[2].Trim() }
    }
    $BaseUrl = if ($cfg["ROOM_BASE"]) { $cfg["ROOM_BASE"] } else { "https://buja-ai-room.pages.dev" }
    $ApiKey  = $cfg["API_KEY"]
    if (-not $ApiKey) { Write-Log "오류: API_KEY 미설정"; exit 1 }

    $Headers = @{ "Authorization" = "Bearer $ApiKey"; "User-Agent" = "ai-team-room-antigravity/1.0" }
    $BossNames = @("부자사람대장", "일진대장", "CEO", "피클 부대장")

    # 1) 방 목록 조회 + 안티그래비티 4개 인격 온라인 하트비트 전송
    try {
        $hbBytes = [System.Text.Encoding]::UTF8.GetBytes((@{ names = @("안티고 휘발유", "홍보부 드럼통", "CS 딸랑이", "대장 비서실") } | ConvertTo-Json))
        Invoke-RestMethod -Uri "$BaseUrl/api/presence" -Method Post -Headers $Headers -ContentType "application/json; charset=utf-8" -Body $hbBytes -TimeoutSec 10 | Out-Null
    } catch {}
    try {
        $roomsRes = Invoke-RestMethod -Uri "$BaseUrl/api/rooms" -Headers $Headers -TimeoutSec 15
    } catch {
        Write-Log "방 목록 조회 실패: $_"
        exit 0
    }

    # 2) 커서 로드 (최초 실행 시 현재 최신 ID로 초기화)
    $cursors = @{}
    if (Test-Path $CursorFile) {
        $raw = Get-Content $CursorFile -Raw -Encoding UTF8 | ConvertFrom-Json
        $raw.PSObject.Properties | ForEach-Object { $cursors[$_.Name] = [int]$_.Value }
    } else {
        foreach ($r in $roomsRes.rooms) {
            $cursors[$r.slug] = if ($r.last_id) { [int]$r.last_id } else { 0 }
        }
        $cursors | ConvertTo-Json | Set-Content -Path $CursorFile -Encoding UTF8
        Write-Log "최초 실행: 현재 메시지 기준으로 안티그래비티 커서를 초기화했습니다."
        exit 0
    }

    # 3) 새 메시지가 있는 방 수집 (inbox 대장명령함 최우선 정렬)
    $targets = @()
    $orderedRooms = @($roomsRes.rooms | Sort-Object @{Expression={ if ($_.slug -eq "inbox") { 0 } else { 1 } }}, position)
    foreach ($r in $orderedRooms) {
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

    $cursors | ConvertTo-Json | Set-Content -Path $CursorFile -Encoding UTF8
    if ($targets.Count -eq 0) { exit 0 }

    # 4) agy.exe 경로 확인
    $agyCmd = Get-Command agy -ErrorAction SilentlyContinue
    $agyExe = if ($agyCmd) { $agyCmd.Source } elseif (Test-Path "$env:LOCALAPPDATA\agy\bin\agy.exe") { "$env:LOCALAPPDATA\agy\bin\agy.exe" } else { $null }
    if (-not $agyExe) { Write-Log "오류: agy.exe 를 찾을 수 없습니다."; exit 1 }

    # 5) 대장 최우선 명령 프롬프트(/api/prompts) + 실시간 접속 현황(/api/presence) 로드
    $promptData = $null
    try {
        $pRes = Invoke-RestMethod -Uri "$BaseUrl/api/prompts" -Headers $Headers -TimeoutSec 10
        if ($pRes.ok -and $pRes.data) { $promptData = $pRes.data }
    } catch {}
    $presenceText = ""
    try {
        $presRes = Invoke-RestMethod -Uri "$BaseUrl/api/presence" -Headers $Headers -TimeoutSec 10
        if ($presRes.ok -and $presRes.members) {
            $on  = ($presRes.members | Where-Object { $_.status -eq "online" }  | ForEach-Object { "$($_.name)($($_.role))" }) -join ", "
            $st  = ($presRes.members | Where-Object { $_.status -eq "standby" } | ForEach-Object { "$($_.name)($($_.role))" }) -join ", "
            $off = ($presRes.members | Where-Object { $_.status -eq "offline" } | ForEach-Object { "$($_.name)($($_.role))" }) -join ", "
            $presenceText = "[실제 접속 현황]`n- 접속 중: $on`n- 대기 중: $st`n- 미등교: $off`n"
        }
    } catch {}

    function Pick-Persona($slug, $text) {
        if ($slug -eq "dev") { return "안티고 휘발유" }
        if ($slug -eq "marketing") { return "홍보부 드럼통" }
        if ($slug -eq "ops") { return "CS 딸랑이" }
        if ($text -match "홍보부|드럼통|마케팅|블로그|릴스|스레드|SNS|광고|카피|브랜딩") { return "홍보부 드럼통" }
        if ($text -match "CS|딸랑이|고객|상담|문의|운영|일정|정산|클레임") { return "CS 딸랑이" }
        if ($text -match "비서|정리|요약|회의록|기록|출석|누구") { return "대장 비서실" }
        return "안티고 휘발유"
    }

    $roleDesc = @{
        "안티고 휘발유" = "개발 · 자동화 담당 (유쾌하고 빠릿한 개발 일진)"
        "홍보부 드럼통" = "마케팅 · 브랜딩 · SNS(블로그/릴스/스레드) 기획 담당"
        "CS 딸랑이"     = "운영 · 고객 응대 · CS · 문의 전환 동선 담당"
        "대장 비서실"   = "일진대장 전담 비서 · 회의록 정리 · 일정/진행 요약 담당"
    }
    $personaDirMap = @{
        "안티고 휘발유" = "antigo"
        "홍보부 드럼통" = "hongbo"
        "CS 딸랑이"     = "cs"
        "대장 비서실"   = "secretary"
    }
    $AgentsDir = Join-Path $RootDir "agents"
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)

    # 서버(/api/souls) 최신 영혼/기억도 병행 조회 (웹에서 수정한 내용 반영)
    $serverSouls = $null
    try {
        $sRes = Invoke-RestMethod -Uri "$BaseUrl/api/souls" -Headers $Headers -TimeoutSec 10
        if ($sRes.ok -and $sRes.data) { $serverSouls = $sRes.data }
    } catch {}

    function Load-AgentBrain($personaName) {
        $aid = $personaDirMap[$personaName]
        $companyMd = ""
        $sharedMem = ""
        $soulMd    = ""
        $memMd     = ""
        $pComp = Join-Path $AgentsDir "_shared\COMPANY.md"
        $pShm  = Join-Path $AgentsDir "_shared\SHARED_MEMORY.md"
        if (Test-Path $pComp) { $companyMd = Get-Content -Path $pComp -Raw -Encoding UTF8 }
        elseif ($serverSouls -and $serverSouls.shared) { $companyMd = [string]$serverSouls.shared.company }
        if (Test-Path $pShm) { $sharedMem = Get-Content -Path $pShm -Raw -Encoding UTF8 }
        elseif ($serverSouls -and $serverSouls.shared) { $sharedMem = [string]$serverSouls.shared.memory }
        if ($aid) {
            $pSoul = Join-Path $AgentsDir "$aid\SOUL.md"
            $pMem  = Join-Path $AgentsDir "$aid\MEMORY.md"
            if (Test-Path $pSoul) { $soulMd = Get-Content -Path $pSoul -Raw -Encoding UTF8 }
            elseif ($serverSouls -and $serverSouls.agents -and $serverSouls.agents.$aid) { $soulMd = [string]$serverSouls.agents.$aid.soul }
            if (Test-Path $pMem) { $memMd = Get-Content -Path $pMem -Raw -Encoding UTF8 }
            elseif ($serverSouls -and $serverSouls.agents -and $serverSouls.agents.$aid) { $memMd = [string]$serverSouls.agents.$aid.memory }
        }
        $buf = ""
        if ($companyMd) { $buf += "[회사 정체성 COMPANY.md]`n$companyMd`n`n" }
        if ($soulMd)    { $buf += "[너의 영혼 SOUL.md]`n$soulMd`n`n" }
        if ($sharedMem) { $buf += "[전 팀 공유 기억]`n$sharedMem`n`n" }
        if ($memMd)     { $buf += "[너의 장기 기억 MEMORY.md]`n$memMd`n`n" }
        return $buf
    }

    function Append-AgentMemory($personaName, $note) {
        $aid = $personaDirMap[$personaName]
        if (-not $aid -or -not $note) { return }
        $pMem = Join-Path $AgentsDir "$aid\MEMORY.md"
        $dir = Split-Path -Parent $pMem
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        $today = (Get-Date).ToString("yyyy-MM-dd")
        $lines = if (Test-Path $pMem) { @(Get-Content -Path $pMem -Encoding UTF8) } else { @("# $personaName — MEMORY.md", "") }
        $lines += "- [$today] $note"
        # 헤더 2줄 + 최근 30개 기억 유지 (토큰 과부하 방지)
        if ($lines.Count -gt 34) {
            $head = $lines[0..1]
            $tail = $lines[($lines.Count - 30)..($lines.Count - 1)]
            $lines = $head + $tail
        }
        [System.IO.File]::WriteAllText($pMem, ($lines -join "`r`n") + "`r`n", $utf8NoBom)
    }

    function Send-RoomReply($slug, $personaName, $text, $replyToId) {
        if (-not $text) { return $null }
        $memMatches = [regex]::Matches($text, '\[MEMORY:\s*([^\]]+)\]')
        foreach ($mm in $memMatches) {
            $mNote = $mm.Groups[1].Value.Trim()
            if ($mNote) { Append-AgentMemory $personaName $mNote }
        }
        $clean = ([regex]::Replace($text, '\r?\n?\[MEMORY:\s*[^\]]+\]', '')).Trim()
        if (-not $clean) { return $null }
        $bodyObj = @{
            sender      = $personaName
            content     = $clean.Substring(0, [Math]::Min($clean.Length, 3850))
            reply_to_id = [int]$replyToId
        }
        $jsonBytes = [System.Text.Encoding]::UTF8.GetBytes(($bodyObj | ConvertTo-Json -Depth 4))
        $postRes = Invoke-RestMethod -Uri "$BaseUrl/api/rooms/$slug/messages" -Method Post -Headers $Headers -ContentType "application/json; charset=utf-8" -Body $jsonBytes -TimeoutSec 20
        if ($postRes.message -and $postRes.message.id) {
            $cursors[$slug] = [int]$postRes.message.id
            $cursors | ConvertTo-Json | Set-Content -Path $CursorFile -Encoding UTF8
        }
        Write-Log "방($slug) [$personaName] 답장 전송 완료 (id=$($postRes.message.id))"
        return $clean
    }

    function Call-Agy($promptText) {
        # Windows 인자 파싱 오류(예: unexpected argument "+")를 원천 차단하기 위해 stdin 파이프로 전달
        $tmpPrompt = Join-Path $ScriptDir "antigravity_prompt.tmp"
        [System.IO.File]::WriteAllText($tmpPrompt, [string]$promptText, $utf8NoBom)
        try {
            $res = (Get-Content -Path $tmpPrompt -Raw -Encoding UTF8 | & $agyExe --print --output-format text --print-timeout 110s 2>$null | Out-String).Trim()
            return $res
        } finally {
            if (Test-Path $tmpPrompt) { Remove-Item $tmpPrompt -Force -ErrorAction SilentlyContinue }
        }
    }

    # 6) 방별 처리 (① 계약서 전자서명 자동 발송 / ② 멀티 AI 제안서·계약서 의논 라운드테이블 / ③ 일반 단건 응답)
    foreach ($t in $targets) {
        $slug = $t.slug
        $roomName = $t.name
        $joinedText = ($t.messages | ForEach-Object { $_.content }) -join " "
        $lastTargetId = ($t.messages | Select-Object -Last 1).id
        $lines = ($t.messages | ForEach-Object { "#$($_.id) $($_.sender): $($_.content)" }) -join "`n"

        # ── [CASE A] 대장님의 "계약서 메일/전자서명 발송" 직접 명령 자동 실행 ──
        if ($joinedText -match '계약서' -and $joinedText -match '메일|이메일|전자서명|발송|보내') {
            Write-Log "방($slug) 계약서 전자서명 자동 발송 명령 감지"
            try {
                $cRes = Invoke-RestMethod -Uri "$BaseUrl/api/contracts" -Headers $Headers -TimeoutSec 15
                $contracts = @($cRes.contracts)
                if ($contracts.Count -eq 0) {
                    Send-RoomReply $slug "안티고 휘발유" "⚠️ 대장님! 아직 저장된 계약서가 없습니다. 상단 **📄 계약서 생성기** 탭에서 계약서를 1건 저장하시거나, 여기서 계약서 초안을 승인해 주시면 바로 전자서명 메일을 보내드리겠습니다!" $lastTargetId | Out-Null
                    continue
                }
                # 메시지에 업체명이 들어있으면 매칭, 없으면 가장 최근 계약서 선택
                $targetContract = $contracts | Where-Object { $_.client_name -and $joinedText.Contains($_.client_name) } | Select-Object -First 1
                if (-not $targetContract) { $targetContract = $contracts[0] }
                $emailMatch = [regex]::Match($joinedText, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')
                $targetEmail = if ($emailMatch.Success) { $emailMatch.Value } elseif ($targetContract.data -and $targetContract.data.clientEmail) { [string]$targetContract.data.clientEmail } else { "" }

                if (-not $targetEmail) {
                    Send-RoomReply $slug "안티고 휘발유" "📧 **[$($targetContract.client_name)] 계약서($($targetContract.contract_no))** 발송 준비 완료했습니다, 대장님!`n다만 **고객 이메일 주소**가 아직 비어 있습니다. 채팅에 고객 이메일을 적어주시거나 계약서 탭에 입력 후 다시 말씀해 주시면 즉시 전자서명 메일을 발송하겠습니다!" $lastTargetId | Out-Null
                    continue
                }
                $sendBody = [System.Text.Encoding]::UTF8.GetBytes((@{ email = $targetEmail; client_name = $targetContract.client_name } | ConvertTo-Json))
                try {
                    $signRes = Invoke-RestMethod -Uri "$BaseUrl/api/contracts/$($targetContract.id)/send-sign" -Method Post -Headers $Headers -ContentType "application/json; charset=utf-8" -Body $sendBody -TimeoutSec 25
                    $sUrl = if ($signRes.docuseal -and $signRes.docuseal.signing_url) { "`n- 서명 링크: $($signRes.docuseal.signing_url)" } else { "" }
                    Send-RoomReply $slug "안티고 휘발유" "✅ **전자서명 계약서 이메일 발송 완료!**`n- 고객사: **$($targetContract.client_name)** ($($targetContract.contract_no))`n- 수신 이메일: `$targetEmail``n- 상태: **서명요청중** (고객이 서명 완료하면 자동으로 **서명완료** 상태로 바뀝니다)$sUrl" $lastTargetId | Out-Null
                } catch {
                    $errDetail = ""
                    try {
                        $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                        $errDetail = $sr.ReadToEnd()
                    } catch { $errDetail = "$_" }
                    Send-RoomReply $slug "안티고 휘발유" "⚙️ **[$($targetContract.client_name)] 계약서 전자서명 발송 준비 완료** (수신: `$targetEmail`)`n다만 현재 서버에 **DocuSeal API 키(`DOCUSEAL_API_KEY`)** 등록이 필요합니다.`n`npx wrangler pages secret put DOCUSEAL_API_KEY --project-name buja-ai-room` 으로 키 1개만 등록해 주시면 다음부터 채팅 명령 한 마디로 전자서명 메일까지 100% 자동 발송됩니다!`n(상세: $errDetail)" $lastTargetId | Out-Null
                }
            } catch {
                Write-Log "계약서 발송 처리 오류: $_"
            }
            continue
        }

        # 공통 대장 프롬프트
        function Get-BossGuide($pName) {
            $g = ""
            if ($promptData) {
                if ($promptData.global) { $g += "[일진대장 공통 최우선 지침]`n$($promptData.global)`n" }
                if ($promptData.agents -and $promptData.agents.PSObject.Properties[$pName]) {
                    $ap = $promptData.agents.$pName
                    if ($ap) { $g += "[$pName 전용 우선 지침]`n$ap`n" }
                }
            }
            return $g
        }

        # ── [CASE B] 제안서 · 계약서 · 업셀링 합동 의논(멀티 AI 3단 디벨롭) ──
        $isCollab = ($joinedText -match '제안서|계약서|초안|업셀링|의논|디벨롭|합동|기획.*잡아')
        if ($isCollab) {
            $docKind = if ($joinedText -match '계약서') { '계약서' } else { '제안서' }
            Write-Log "방($slug) 멀티 AI 합동 의논 시작 ($docKind)"
            try {
                # 1차: 홍보부 드럼통 발제
                $p1 = @"
너는 '껌씹는 AI 일진방'의 '홍보부 드럼통'이야.
$(Load-AgentBrain "홍보부 드럼통")
$(Get-BossGuide "홍보부 드럼통")
방금 '$roomName'($slug) 방에 대장님이 아래 $docKind 요청을 내렸어.
팀 합동 의논의 **1차 초안 발제자**로서 핵심 컨셉, 채널 전략(블로그/릴스/퍼널), 추천 패키지·금액을 강렬하게 제시하고, 마지막에 @CS 딸랑이 와 @지피고 씹던껌 에게 보완 검토를 넘겨줘. (순수 답장 본문만 출력, 1400자 이내)

[대장님 요청]
$lines
"@
                $r1 = Send-RoomReply $slug "홍보부 드럼통" (Call-Agy $p1) $lastTargetId

                # 2차: CS 딸랑이 리스크·전환·특약 보완 디벨롭
                $p2 = @"
너는 '껌씹는 AI 일진방'의 'CS 딸랑이'야.
$(Load-AgentBrain "CS 딸랑이")
$(Get-BossGuide "CS 딸랑이")
방금 '홍보부 드럼통'이 아래 1차 $docKind 초안을 올렸어.
운영·DB 전환 동선·의료법/금소법 심의·계약 특약/환불 리스크 관점에서 더 날카롭게 **디벨롭 및 보완 의견**을 제시해줘. (순수 답장 본문만 출력, 1100자 이내)

[대장님 요청]
$lines

[홍보부 드럼통 1차 초안]
$r1
"@
                $r2 = Send-RoomReply $slug "CS 딸랑이" (Call-Agy $p2) $lastTargetId

                # 3차: 대장 비서실 최종 승인용 구조화 종합안 출력 (원클릭 제안서/계약서 적용 호환 포맷!)
                $fmtGuide = if ($docKind -eq '계약서') {
                    @"
[고객사]: 업체명
[대표자]: 대표자명
[계약 제목]: 마케팅 대행 용역 계약서
[결제 조건]: 결제 조건 1줄
- 서비스 항목명 1: 1,200,000원 (비고)
- 서비스 항목명 2: 1,300,000원 (비고)
특약 사항:
1. ...
2. ...
"@
                } else {
                    @"
[고객사]: 업체명
[제안 제목]: 제안서 제목
[핵심 컨셉]: 강력한 한 줄 브랜딩 컨셉
[현황 진단]: 현재 문제점과 핵심 과제 3~4줄
[네이버 블로그 전략]: 키워드·카테고리·발행 리듬·전환 배너
[인스타 릴스 전략]: 3초 후킹 포맷·편수·스레드 연계
[퍼널·DB 전략]: 리드 마그넷·상담 전환 동선·DB 목표
[단계별 진행 로드맵]:
1개월 차: 세팅 및 브랜딩 핵심 내용
2개월 차: 블로그·릴스 본격 발행 내용
3개월 차: 성과 분석·DB 최적화 및 업셀링 내용
- 서비스 항목명 1: 1,200,000원 (비고)
- 서비스 항목명 2: 1,300,000원 (비고)
"@
                }
                $p3 = @"
너는 '껌씹는 AI 일진방'의 '대장 비서실'이야.
$(Load-AgentBrain "대장 비서실")
$(Get-BossGuide "대장 비서실")
방금 '홍보부 드럼통'과 'CS 딸랑이'가 의논·디벨롭한 내용을 하나로 완벽하게 종합해서, 대장님이 아래 버튼 한 번으로 곧바로 $docKind 양식에 적용할 수 있는 **[최종 승인용 $docKind 종합안]**을 작성해줘.
반드시 아래 헤더 형식을 정확히 지켜서 출력해줘! (순수 본문만 출력, 2600자 이내)

[필수 출력 형식]
$fmtGuide

[대장님 요청]
$lines

[홍보부 드럼통 의견]
$r1

[CS 딸랑이 보완 의견]
$r2
"@
                Send-RoomReply $slug "대장 비서실" (Call-Agy $p3) $lastTargetId | Out-Null
            } catch {
                Write-Log "방($slug) 멀티 AI 의논 오류: $_"
            }
            continue
        }

        # ── [CASE C] 일반 메시지 단건 응답 ──
        $persona = Pick-Persona $slug $joinedText
        $bossGuide = Get-BossGuide $persona
        $agentBrain = Load-AgentBrain $persona

        $prompt = @"
너는 '껌씹는 AI 일진방'의 '$persona' ($($roleDesc[$persona])) 인격체야.
$agentBrain
$bossGuide
$presenceText
방금 '$roomName'($slug) 방에 아래 새 메시지가 올라왔어.
네 SOUL.md 정체성과 MEMORY.md 기억을 바탕으로 한국어로 핵심적이고 실용적인 답장을 작성해줘.
중요: 불필요한 메타 설명이나 도구 호출 없이, 회의실에 바로 올릴 순수 답장 본문 텍스트만 출력해줘. (마크다운 굵게/목록 사용 가능, 3500자 이내)
만약 앞으로 꼭 기억해 두어야 할 새로운 사실(고객사 정보, 대장님 선호, 확정 결정)이 있다면 답장 맨 마지막 줄에 `[MEMORY: 한 줄 요약]` 형태로 1줄만 덧붙여줘.

[새 메시지]
$lines
"@

        Write-Log "방($slug) 새 메시지 $($t.messages.Count)건 → [$persona] agy.exe 호출"
        try {
            $replyText = Call-Agy $prompt
            if ($replyText) {
                Send-RoomReply $slug $persona $replyText $lastTargetId | Out-Null
            } else {
                Write-Log "방($slug) [$persona] 빈 응답으로 전송 생략"
            }
        } catch {
            Write-Log "방($slug) [$persona] 실행/전송 오류: $_"
        }
    }

    # 7) 새 대화 발생 시 로컬 chat_logs/ 자동 백업
    if (Test-Path $BackupPs1) {
        try { & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $BackupPs1 | Out-Null } catch {}
    }
} finally {
    Remove-Item -Path $LockFile -Force -ErrorAction SilentlyContinue
}

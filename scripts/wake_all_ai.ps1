# ============================================================
# 🏫 껌씹는 AI 일진방 — 모든 AI 원클릭 전체 깨우기 런처
# - PC 재부팅 후 더블클릭 한 번으로 모든 AI 기상 + 자동 순찰 복구 + 회의실 열기
# ============================================================

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir   = Split-Path -Parent $ScriptDir
$EnvFile   = Join-Path $RootDir ".dev.vars"

# 0) 자가 치유: Windows PowerShell 5.1 한글 파싱 오류 방지를 위해 모든 scripts\*.ps1 UTF-8 BOM 자동 보정
$utf8BomSelf = New-Object System.Text.UTF8Encoding($true)
Get-ChildItem -Path $ScriptDir -Filter "*.ps1" -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        $rawBytes = [System.IO.File]::ReadAllBytes($_.FullName)
        if ($rawBytes.Length -lt 3 -or $rawBytes[0] -ne 0xEF -or $rawBytes[1] -ne 0xBB -or $rawBytes[2] -ne 0xBF) {
            $txt = [System.Text.Encoding]::UTF8.GetString($rawBytes)
            [System.IO.File]::WriteAllText($_.FullName, $txt, $utf8BomSelf)
        }
    } catch {}
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  🏫 껌씹는 AI 일진방 — 모든 AI 전체 깨우기 시작!" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# 1) .dev.vars 설정 파일 확인
$RoomBase = "https://buja-ai-room.pages.dev"
if (-not (Test-Path $EnvFile)) {
    Write-Host "⚠️  [.dev.vars] 설정 파일이 없습니다!" -ForegroundColor Red
    Write-Host "   → 새 PC/노트북이라면 프로젝트 폴더의 [.dev.vars.example]을 복사해 [.dev.vars]로 만들고" -ForegroundColor Yellow
    Write-Host "     API_KEY / OPENAI_API_KEY / GEMINI_API_KEY 등을 입력해 주세요." -ForegroundColor Yellow
    Write-Host ""
} else {
    foreach ($line in Get-Content $EnvFile -Encoding UTF8) {
        if ($line -match '^\s*ROOM_BASE\s*=\s*(.+?)\s*$') {
            $RoomBase = $Matches[1].Trim('"', "'").TrimEnd('/')
        }
    }
    Write-Host "✅ [1/6] .dev.vars 설정 파일 확인 완료 ($RoomBase)" -ForegroundColor Green
}

# 2) 로컬 Ollama 서버 깨우기
Write-Host "⏳ [2/6] 로컬 Ollama 서버 확인 및 기동 중..." -ForegroundColor Cyan
$ollamaUp = $false
try {
    $null = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 2 -ErrorAction Stop
    $ollamaUp = $true
} catch {
    $ollamaCmd = Get-Command ollama -ErrorAction SilentlyContinue
    if ($ollamaCmd) {
        Start-Process -FilePath $ollamaCmd.Source -ArgumentList "serve" -WindowStyle Hidden
        for ($i = 0; $i -lt 15; $i++) {
            Start-Sleep -Seconds 1
            try {
                $null = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 2 -ErrorAction Stop
                $ollamaUp = $true
                break
            } catch {}
        }
    }
}

if ($ollamaUp) {
    try {
        $tags = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 3
        $modelNames = @($tags.models | ForEach-Object { $_.name }) -join ", "
        if (-not $modelNames) { $modelNames = "설치된 모델 없음" }
        Write-Host "✅ [2/6] Ollama 실행 완료 (설치 모델: $modelNames)" -ForegroundColor Green
    } catch {
        Write-Host "✅ [2/6] Ollama 실행 완료" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  [2/6] Ollama가 설치되어 있지 않거나 시작에 실패했습니다. (올라고 개거품 제외하고 계속 진행)" -ForegroundColor Yellow
}

# 3) AI 영혼·기억(SOUL.md / MEMORY.md) 동기화 (새 노트북이면 서버에서 자동 복원)
Write-Host "⏳ [3/6] AI 영혼(SOUL.md)·기억(MEMORY.md) 확인 중..." -ForegroundColor Cyan
$soulSync = Join-Path $ScriptDir "soul_sync.ps1"
$agentsDir = Join-Path $RootDir "agents"
if ((Test-Path $EnvFile) -and (Test-Path $soulSync)) {
    try {
        if (-not (Test-Path $agentsDir)) {
            Write-Host "   → 로컬 agents 폴더가 없어 서버에서 AI 영혼/기억을 자동 복원(pull)합니다..." -ForegroundColor Gray
            & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $soulSync -Action pull | Out-Null
            Write-Host "✅ [3/6] 서버에서 AI 영혼·기억 자동 복원 완료!" -ForegroundColor Green
        } else {
            Write-Host "✅ [3/6] 로컬 agents 영혼·기억 폴더 정상 확인" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  [3/6] 영혼 동기화 건너뜀: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  [3/6] 영혼 동기화 생략 (.dev.vars 또는 soul_sync.ps1 없음)" -ForegroundColor Gray
}

# 4) Windows 3분 자동 순찰 작업 스케줄러 점검 · 복구
Write-Host "⏳ [4/6] 3종 자동 순찰 스케줄러 상태 점검 및 복구 중..." -ForegroundColor Cyan
function Ensure-Task($TaskName, $InstallScript) {
    $exists = $false
    try {
        $null = & schtasks.exe /Query /TN $TaskName 2>$null
        if ($LASTEXITCODE -eq 0) { $exists = $true }
    } catch {}
    if (-not $exists -and (Test-Path $InstallScript)) {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $InstallScript | Out-Null
    }
}
Ensure-Task "BujaAiRoom_AntigravityPatrol" (Join-Path $ScriptDir "install_antigravity_patrol.ps1")
Ensure-Task "BujaAiRoom_JipigoPatrol"      (Join-Path $ScriptDir "install_autostart.ps1")

# 올라고 개거품(Python Ollama 순찰) 스케줄러 확인 및 등록
$ollamaPatrolPy = Join-Path $RootDir "2026-11-24-ollama-patrol\2026-11-24-patrol.py"
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if ((Test-Path $ollamaPatrolPy) -and $pythonCmd) {
    $ollamaTaskExists = $false
    try {
        $null = & schtasks.exe /Query /TN "BujaAiRoom_OllamaJipigo" 2>$null
        if ($LASTEXITCODE -eq 0) { $ollamaTaskExists = $true }
    } catch {}
    if (-not $ollamaTaskExists) {
        $ollamaVbs = Join-Path $ScriptDir "run_ollama_hidden.vbs"
        $vbsLine = "CreateObject(`"WScript.Shell`").Run `"`"$($pythonCmd.Source)`" `"`"$ollamaPatrolPy`"`"`", 0, False"
        Set-Content -Path $ollamaVbs -Value $vbsLine -Encoding ASCII
        & schtasks.exe /Create /F /SC MINUTE /MO 3 /TN "BujaAiRoom_OllamaJipigo" /TR "wscript.exe `"$ollamaVbs`"" 2>$null | Out-Null
    }
}
Write-Host "✅ [4/6] 3종 자동 순찰 스케줄러 점검 완료 (3분 주기 백그라운드 유지)" -ForegroundColor Green

# 5) 6개 AI 인격 즉시 기상(1회 순찰 + 온라인 출석 도장 병렬 실행)
Write-Host "⏳ [5/6] 모든 AI 인격체 출석 도장 및 기상 호출 중..." -ForegroundColor Cyan
if (Test-Path $EnvFile) {
    $antiScript   = Join-Path $ScriptDir "antigravity_patrol.ps1"
    $jipigoScript = Join-Path $ScriptDir "jipigo_patrol.ps1"
    $procs = @()

    if (Test-Path $antiScript) {
        $procs += Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$antiScript`"" -PassThru
        Write-Host "   ⚡ 안티고 휘발유 · 📢 홍보부 드럼통 · 🔔 CS 딸랑이 · 📝 대장 비서실 기상 중..." -ForegroundColor Gray
    }
    if (Test-Path $jipigoScript) {
        $procs += Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$jipigoScript`"" -PassThru
        Write-Host "   🫧 지피고 씹던껌 (GPT 참모 + 대화 자동 백업) 기상 중..." -ForegroundColor Gray
    }
    if ($ollamaUp -and (Test-Path $ollamaPatrolPy) -and $pythonCmd) {
        $procs += Start-Process -FilePath $pythonCmd.Source -ArgumentList "`"$ollamaPatrolPy`"" -WindowStyle Hidden -PassThru
        Write-Host "   🔥 올라고 개거품 (로컬 Ollama) 기상 중..." -ForegroundColor Gray
    }

    # 최대 12초간 출석 완료 대기 (길어지면 백그라운드로 계속 실행)
    $deadline = (Get-Date).AddSeconds(12)
    while ((Get-Date) -lt $deadline) {
        $alive = @($procs | Where-Object { -not $_.HasExited })
        if ($alive.Count -eq 0) { break }
        Start-Sleep -Milliseconds 500
    }
    Write-Host "✅ [5/6] 모든 AI 기상 신호 전송 완료! (회의실 접속자 현황에 '등교 중' 표시)" -ForegroundColor Green
} else {
    Write-Host "⚠️  [5/6] .dev.vars가 없어 AI 기상을 건너뛰었습니다." -ForegroundColor Yellow
}

# 6) 로컬 AI 미디어 스튜디오 브릿지(E:\ai-studio\media_bridge.py, 포트 8787) 자동 기동
$studioPy  = "E:\ai-studio\.venv\Scripts\python.exe"
$bridgePy  = "E:\ai-studio\media_bridge.py"
if ((Test-Path $studioPy) -and (Test-Path $bridgePy)) {
    $bridgeUp = $false
    try {
        $null = Invoke-RestMethod -Uri "http://127.0.0.1:8787/health" -TimeoutSec 2 -ErrorAction Stop
        $bridgeUp = $true
    } catch {}
    if (-not $bridgeUp) {
        Start-Process -FilePath $studioPy -ArgumentList "`"$bridgePy`"" -WorkingDirectory "E:\ai-studio" -WindowStyle Hidden
        Write-Host "✅ [6/7] 로컬 AI 미디어 스튜디오 브릿지(한국어 성우·MP4·CrewAI) 자동 기동 완료!" -ForegroundColor Green
    } else {
        Write-Host "✅ [6/7] 로컬 AI 미디어 스튜디오 브릿지 이미 실행 중 (포트 8787)" -ForegroundColor Green
    }
}

# 7) 웹 회의실 브라우저로 자동 열기
Write-Host "⏳ [7/7] 껌씹는 AI 일진방 웹 회의실 열기 ($RoomBase)..." -ForegroundColor Cyan
Start-Process $RoomBase

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  🎉 모든 AI가 깨어났습니다! 좋은 하루 되세요, 대장님!" -ForegroundColor Yellow
Write-Host "  (창은 8초 뒤 자동으로 닫히며, AI 순찰은 백그라운드에서 유지됩니다)" -ForegroundColor Gray
Write-Host "========================================================" -ForegroundColor Green
Start-Sleep -Seconds 8

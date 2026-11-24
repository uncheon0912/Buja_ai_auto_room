# ============================================================
# 💻 노트북 / PC 하드웨어 사양 · 버전 진단 및 오프라인 AI 3종 추천 스크립트
# - 대상 모델군: DeepSeek-R1 (딥시크) · EXAONE 3.5 (LG ⭐ 한국어 최강) · Qwen 2.5
# - Codex 등 LLM 에이전트가 사용자 승인 후 실행하는 공식 점검 도구
# ============================================================

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  💻 껌씹는 AI 일진방 — 노트북 사양·버전 진단 & AI 모델 추천" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# 1) OS 및 RAM 정보 수집
$osName = "확인 불가"
$osVer  = ""
$totalRamGB = 0.0
$freeRamGB  = 0.0
try {
    $os = Get-CimInstance Win32_OperatingSystem -ErrorAction Stop
    $osName = $os.Caption
    $osVer  = "$($os.Version) (Build $($os.BuildNumber))"
    $totalRamGB = [math]::Round($os.TotalVisibleMemorySize / 1MB, 1)
    $freeRamGB  = [math]::Round($os.FreePhysicalMemory / 1MB, 1)
} catch {
    $osName = [System.Environment]::OSVersion.VersionString
}

# 2) GPU 모델명 및 VRAM 수집 (NVIDIA는 nvidia-smi 우선, 그 외 Win32_VideoController 폴백)
$gpuList = @()
$maxVramGB = 0.0
$hasNvidia = $false

$nvsmi = Get-Command nvidia-smi -ErrorAction SilentlyContinue
if ($nvsmi) {
    try {
        $nvOut = & nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader,nounits 2>$null
        foreach ($line in $nvOut) {
            if ($line -and $line.Contains(',')) {
                $parts = $line.Split(',') | ForEach-Object { $_.Trim() }
                $vramGB = [math]::Round(([double]$parts[1]) / 1024.0, 1)
                if ($vramGB -gt $maxVramGB) { $maxVramGB = $vramGB }
                $hasNvidia = $true
                $gpuList += [PSCustomObject]@{
                    Name   = $parts[0]
                    VramGB = $vramGB
                    Driver = $parts[2]
                    Type   = "NVIDIA 전용 GPU"
                }
            }
        }
    } catch {}
}

if ($gpuList.Count -eq 0) {
    try {
        $gpus = Get-CimInstance Win32_VideoController -ErrorAction Stop
        foreach ($g in $gpus) {
            $vramGB = 0.0
            if ($g.AdapterRAM -and $g.AdapterRAM -gt 0) {
                $vramGB = [math]::Round($g.AdapterRAM / 1GB, 1)
            }
            if ($vramGB -gt $maxVramGB) { $maxVramGB = $vramGB }
            $typeLabel = if ($g.Name -match 'Intel|Radeon\(TM\)\s*Graphics|Iris|UHD') { "내장/통합 GPU" } else { "외장 GPU" }
            $gpuList += [PSCustomObject]@{
                Name   = $g.Name
                VramGB = $vramGB
                Driver = $g.DriverVersion
                Type   = $typeLabel
            }
        }
    } catch {}
}

# 3) 드라이브별 여유 공간 수집
$drives = @()
try {
    $fsDrives = Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Free -gt 0 -or $_.Used -gt 0 }
    foreach ($d in $fsDrives) {
        $drives += [PSCustomObject]@{
            Drive  = "$($d.Name):"
            UsedGB = [math]::Round($d.Used / 1GB, 1)
            FreeGB = [math]::Round($d.Free / 1GB, 1)
        }
    }
} catch {}

# 4) 핵심 소프트웨어 버전 점검
function Get-ToolVer($cmdName, $verArgs) {
    $c = Get-Command $cmdName -ErrorAction SilentlyContinue
    if (-not $c) { return "미설치" }
    try {
        $out = & $c.Source $verArgs 2>&1 | Select-Object -First 1
        return ($out | Out-String).Trim()
    } catch {
        return "설치됨 (버전 확인 불가)"
    }
}

$ollamaVer = Get-ToolVer "ollama" "--version"
$pythonVer = Get-ToolVer "python" "--version"
$gitVer    = Get-ToolVer "git" "--version"
$nodeVer   = Get-ToolVer "node" "-v"
$ollamaModelsEnv = [Environment]::GetEnvironmentVariable("OLLAMA_MODELS", "User")
if (-not $ollamaModelsEnv) { $ollamaModelsEnv = "(기본값: C:\Users\$env:USERNAME\.ollama\models)" }

# 5) 리포트 출력
Write-Host "[1] 시스템 & 메모리(RAM)" -ForegroundColor Cyan
Write-Host "  - OS       : $osName $osVer"
Write-Host "  - 총 RAM   : $totalRamGB GB (현재 여유: $freeRamGB GB)"
Write-Host ""

Write-Host "[2] 그래픽카드(GPU) & VRAM" -ForegroundColor Cyan
if ($gpuList.Count -gt 0) {
    foreach ($g in $gpuList) {
        Write-Host "  - $($g.Name) | VRAM: $($g.VramGB) GB | 드라이버: $($g.Driver) | 구분: $($g.Type)"
    }
} else {
    Write-Host "  - GPU 정보를 읽지 못했습니다 (내장 그래픽 또는 권한 제한)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "[3] 드라이브 여유 공간" -ForegroundColor Cyan
$bestDrive = $null
$cFreeGB = 0.0
foreach ($d in $drives) {
    Write-Host ("  - {0} 드라이브 : 사용 {1} GB / 여유 {2} GB" -f $d.Drive, $d.UsedGB, $d.FreeGB)
    if ($d.Drive -eq "C:") { $cFreeGB = $d.FreeGB }
    if (-not $bestDrive -or $d.FreeGB -gt $bestDrive.FreeGB) { $bestDrive = $d }
}
Write-Host "  - OLLAMA_MODELS 설정 : $ollamaModelsEnv"
Write-Host ""

Write-Host "[4] 핵심 프로그램 버전" -ForegroundColor Cyan
Write-Host "  - Ollama : $ollamaVer"
Write-Host "  - Python : $pythonVer"
Write-Host "  - Git    : $gitVer"
Write-Host "  - Node   : $nodeVer"
Write-Host ""

# 현재 설치된 Ollama 모델 목록
if ($ollamaVer -ne "미설치") {
    Write-Host "[5] 현재 설치된 Ollama 모델" -ForegroundColor Cyan
    try {
        $listOut = & ollama list 2>&1
        $listOut | ForEach-Object { Write-Host "  $_" }
    } catch {
        Write-Host "  (Ollama 서버가 꺼져 있어 목록을 조회하지 못했습니다)" -ForegroundColor Gray
    }
    Write-Host ""
}

# 6) 사양 기반 최적 오프라인 AI 3종 자동 판정 및 추천
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  🎯 이 PC/노트북 사양에 딱 맞는 오프라인 AI 3종 추천" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Green

$tier = "STANDARD"
$tierLabel = ""
$recDeepSeek = ""
$recExaone   = ""
$recQwen     = ""
$totalSizeGB = 0.0
$recNote     = ""

if (($hasNvidia -and $maxVramGB -ge 12) -or ($totalRamGB -ge 32 -and $hasNvidia -and $maxVramGB -ge 10)) {
    $tier        = "HIGH"
    $tierLabel   = "고성능 등급 (VRAM 12GB+ / RAM 32GB+)"
    $recDeepSeek = "deepseek-r1:14b (9.0 GB)"
    $recExaone   = "exaone3.5:7.8b (4.8 GB) [여유 시 32b 19GB]"
    $recQwen     = "qwen2.5:14b (9.0 GB)"
    $totalSizeGB = 22.8
    $recNote     = "14B급 고지능 모델을 쾌적하게 구동할 수 있습니다."
    $cmds = @(
        "ollama pull deepseek-r1:14b",
        "ollama pull exaone3.5:7.8b",
        "ollama pull qwen2.5:14b"
    )
} elseif (($hasNvidia -and $maxVramGB -ge 6) -or ($totalRamGB -ge 15.5)) {
    $tier        = "STANDARD"
    $tierLabel   = "표준 추천 등급 (RAM 16GB+ 또는 VRAM 6~8GB)"
    $recDeepSeek = "deepseek-r1:8b (5.2 GB)"
    $recExaone   = "exaone3.5:7.8b (4.8 GB)"
    $recQwen     = "qwen2.5:7b (4.7 GB)"
    $totalSizeGB = 14.7
    $recNote     = "한국어 품질·추론·속도 균형이 가장 뛰어난 표준 3종 조합입니다."
    $cmds = @(
        "ollama pull deepseek-r1:8b",
        "ollama pull exaone3.5:7.8b",
        "ollama pull qwen2.5:7b"
    )
} else {
    $tier        = "LIGHT"
    $tierLabel   = "경량 노트북 등급 (RAM 8~12GB / 내장 GPU)"
    $recDeepSeek = "deepseek-r1:7b (4.7 GB · 선택 설치)"
    $recExaone   = "exaone3.5:2.4b (1.6 GB · 강력 추천)"
    $recQwen     = "qwen2.5:3b (1.9 GB · 강력 추천)"
    $totalSizeGB = 3.5
    $recNote     = "가벼운 모델 위주로 받아야 발열·버벅임 없이 즉답 속도가 나옵니다."
    $cmds = @(
        "ollama pull exaone3.5:2.4b",
        "ollama pull qwen2.5:3b",
        "# (선택) 추론용: ollama pull deepseek-r1:7b"
    )
}

Write-Host "  판정 등급 : $tierLabel" -ForegroundColor White
Write-Host "  추천 사유 : $recNote" -ForegroundColor Gray
Write-Host ""
Write-Host "  1) DeepSeek-R1 (딥시크)       : $recDeepSeek"
Write-Host "  2) EXAONE 3.5 (LG ⭐ 한국어)  : $recExaone"
Write-Host "  3) Qwen 2.5 (현재 사용 중)    : $recQwen"
Write-Host "  예상 총 다운로드 용량         : 약 $totalSizeGB GB (필수 기준)"
Write-Host ""
Write-Host "  [권장 설치 명령어 — 사용자 승인 후 실행]" -ForegroundColor Cyan
foreach ($c in $cmds) {
    Write-Host "    $c" -ForegroundColor Yellow
}
Write-Host ""

# 드라이브 용량 경고 및 이동 제안
if ($cFreeGB -gt 0 -and $cFreeGB -lt 40 -and $bestDrive -and $bestDrive.Drive -ne "C:" -and $bestDrive.FreeGB -ge 50) {
    Write-Host "⚠️  [용량 주의] C 드라이브 여유 공간($cFreeGB GB)이 부족합니다!" -ForegroundColor Red
    Write-Host "   → 모델 다운로드 전에 여유가 넉넉한 $($bestDrive.Drive) 드라이브($($bestDrive.FreeGB) GB 여유)에 폴더를 만들고" -ForegroundColor Yellow
    Write-Host "     setx OLLAMA_MODELS `"$($bestDrive.Drive)\ollamadrive`" 로 경로를 먼저 옮기는 것을 권장합니다." -ForegroundColor Yellow
    Write-Host ""
}

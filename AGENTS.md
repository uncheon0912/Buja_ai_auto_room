# 🤖 AI 에이전트 전용 안내서 — 껌씹는 AI 일진방 (`Buja_ai_auto_room`)

> 이 파일은 **OpenAI Codex CLI, Antigravity, Claude Code, Gemini CLI** 등 코딩 LLM 에이전트가 저장소(`https://github.com/uncheon0912/Buja_ai_auto_room`)를 열었을 때 자동으로 따라야 하는 **노트북/새 PC 셋업 및 오프라인 AI 모델 추천 표준 절차**입니다.  
> 모든 안내와 응답은 반드시 **한국어**로 작성하세요.

---

## 💻 노트북 셋업 시 LLM 에이전트 필수 실행 프로토콜

사용자가 새 PC 또는 노트북에서 이 저장소를 내려받아 셋업을 요청하면, **반드시 아래 5단계를 순서대로 진행**하세요.

### 1단계: 사용자 사전 승인 요청 (필수 ⚠️)
명령을 실행하기 전에 **반드시 먼저 사용자에게 아래와 같이 승인을 받으세요**:
- 확인할 항목 고지:
  1. 노트북 **RAM(메모리) 총 용량 및 사용 가능 용량**
  2. **그래픽카드(GPU) 모델명 및 VRAM 용량** (NVIDIA / AMD / Intel 내장 여부)
  3. **드라이브별(C/D/E 등) 여유 저장 공간**
  4. **OS(Windows) 및 핵심 프로그램 버전** (`Ollama`, `Python`, `Git`, `Node.js`, 현재 설치된 Ollama 모델 목록)
- 승인 없이 임의로 대용량 AI 모델을 다운로드(`ollama pull`)하거나 환경변수를 변경하지 마세요.

### 2단계: 노트북 사양 및 버전 자동 진단 실행
사용자가 승인하면 아래 스크립트를 실행해 정확한 하드웨어·버전 정보를 수집하세요:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\check_laptop_spec.ps1
```

### 3단계: 사양 맞춤형 오프라인 AI 3종 추천 및 저장 경로 제안
진단 결과를 바탕으로 아래 **3대 오프라인 AI 모델군** 중 노트북 사양에 딱 맞는 버전을 표로 추천하세요:

| 모델군 | 경량 (RAM 8~12GB / 내장 GPU) | 표준 (RAM 16GB+ / VRAM 6~8GB) | 고성능 (RAM 32GB+ / VRAM 12GB+) |
| :--- | :--- | :--- | :--- |
| **DeepSeek-R1 (딥시크 · 추론)** | `deepseek-r1:7b` (4.7 GB · 선택) | **`deepseek-r1:8b` (5.2 GB)** | `deepseek-r1:14b` (9.0 GB) |
| **EXAONE 3.5 (LG ⭐ 한국어 최강)** | **`exaone3.5:2.4b` (1.6 GB)** | **`exaone3.5:7.8b` (4.8 GB)** | `exaone3.5:7.8b` (4.8 GB) 또는 `32b` (19 GB) |
| **Qwen 2.5 (현재 사용 중)** | **`qwen2.5:3b` (1.9 GB)** | **`qwen2.5:7b` (4.7 GB)** | `qwen2.5:14b` (9.0 GB) |
| **조합 총 용량** | 약 **3.5 GB** *(7b 포함 시 8.2 GB)* | 약 **14.7 GB** | 약 **22.8 GB+** |

**⚠️ 저장 용량 안전 규칙:**
- C 드라이브 여유 공간이 **40 GB 미만**이고 D/E 등 여유가 넉넉한 다른 드라이브가 있다면, 다운로드 전에 반드시 **`OLLAMA_MODELS` 환경변수 + 폴더 정션(`mklink /J`)**으로 모델 저장 위치를 여유 드라이브로 옮길지 사용자에게 제안하세요.

### 4단계: 사용자 선택 모델 다운로드 및 연결
사용자가 설치할 모델을 선택·승인하면:
1. Ollama가 설치되어 있지 않으면 공식 설치 안내(`winget install Ollama.Ollama` 또는 https://ollama.com/download)
2. 선택한 모델만 `ollama pull <모델태그>` 실행
3. `.dev.vars`의 `OLLAMA_MODEL`에 대표님이 기본으로 쓰고 싶은 모델(예: `OLLAMA_MODEL=exaone3.5:7.8b`)을 설정하도록 안내

### 5단계: 회의실 연결 · 바탕화면 아이콘 생성
1. 데스크톱의 `.dev.vars` 파일을 이 노트북의 프로젝트 루트에 복사하도록 안내 (보안상 GitHub에는 포함되지 않음)
2. 바탕화면 원클릭 아이콘 생성: `바탕화면_아이콘_만들기.bat` 실행
3. 전체 AI 기상 테스트: `AI일진방_전체깨우기.bat` 실행 (서버에서 AI 영혼 `SOUL.md`·기억 `MEMORY.md` 자동 복원 포함)

---

## 📋 대표님이 노트북에서 Codex 등에 그대로 붙여넣는 실행 명령어

노트북에서 Codex CLI 또는 AI 코딩 도구를 켜고 아래 문장을 그대로 복사해서 붙여넣으세요:

```text
https://github.com/uncheon0912/Buja_ai_auto_room 저장소를 내려받고, 저장소 안의 AGENTS.md 지침대로 진행해 줘.
내 승인을 먼저 받은 뒤 이 노트북의 RAM, 그래픽카드(VRAM), 드라이브 여유 용량, 프로그램 버전을 확인해 주고,
내 노트북 사양에 딱 맞는 DeepSeek-R1(딥시크), EXAONE 3.5(LG 한국어 최강), Qwen 2.5 모델을 추천해 줘.
```

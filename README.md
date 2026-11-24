# 🏫 껌씹는 AI 일진방 (ai-team-room 커스텀 에디션)

**일진대장(사람 1명)과 여러 AI 에이전트(Antigravity · Codex/ChatGPT · Claude · DeepSeek · 모바일 피클 부대장)가 학교 교실(방)별로 함께 일하는 경량 멀티 AI 회의실입니다.**

- **별도 서버·유료 LLM API 불필요**: **Cloudflare Pages + D1(SQLite)** 무료 한도 안에서 동작하며, 본체는 LLM API 키 없이 구독 중인 AI 도구(Antigravity, Codex CLI, Claude Code 등)를 HTTP API로 연결해 사용합니다.
- **스카이 블루 학교 3D 테마 + 야간모드**: GitHub 최신 **Three.js `r187`** 3D 종이비행기·파티클 인터랙티브 배경과 눈 편안한 **🌙 야간(밤하늘 교실) / ☀️ 주간** 모드를 지원합니다.
- **피클 부대장 우편함 & 최우선 프롬프트 센터**: 모바일에서 명령을 꽂아두는 전용 우편함(`mailbox.html`, `/api/mailbox`)과 에이전시별 독립 최우선 명령 프롬프트(`/api/prompts`)를 내장했습니다.

---

## 주요 기능

| 기능 | 설명 |
| --- | --- |
| **5개 교실(방)** | `부자사람 일진 종합반(general)`, `일진개발실(dev)`, `일진홍보부(marketing)`, `일진선도부(ops)`, `대장명령함 (긴급처리)(inbox)` |
| **멀티 인격체 & 외부 AI** | 안티그래비티 1개 계정으로 `⚡ 안티고 휘발유`, `📢 홍보부 드럼통`, `🔔 CS 딸랑이`, `📝 대장 비서실` 4개 인격체 동시 운영 + 외부 `🫧 지피고 씹던껌(Codex)`, `🎩 클고 칠판지우개(Claude)`, `🔍 딥고 심해짱(DeepSeek)`, `🥒 피클 부대장` 연결 |
| **3D 스카이 교실 + 야간모드** | Three.js `r187` 3D 배경(종이비행기·파티클·전송 시 버스트) + 상단 `🌙 야간 / ☀️ 주간` 전환 및 자동 기억 |
| **대화 수정 · 삭제 · 답글** | 각 메시지 오른쪽 끝 `답글` · `수정(PATCH)` · `삭제(DELETE)` 버튼 (인라인 편집 및 첨부파일 포함 DB 삭제) |
| **단어 + 날짜 돋보기 검색** | 상단 오른쪽 `🔍` 검색창에서 단어 검색(하이라이트) 및 **한국시간(KST) 날짜별 필터링** 지원 |
| **KST 자정 날짜 구분선** | 한국시간(KST) 자정(00:00) 기준으로 날짜가 바뀔 때마다 선명한 캘린더 구분선 자동 표시 |
| **외부 서비스 연결 탭** | 왼쪽 사이드바에 `노션`, `지메일`, `구글드라이브` + 빈 슬롯 3개 제공 (연결 활성화 시 **형광 연두색 LED** 점등, D1 영구 저장) |
| **👑 대장 최우선 프롬프트** | 상단 `⚡ 대장 프롬프트` 팝업에서 공통 명령, **드래그&드롭 파일·사진 첨부**, 최우선 강제 체크박스, **에이전시별 독립 프롬프트** 저장 (`/api/prompts`) |
| **🧠 브레인 폴더 (동기화·이전)** | 상단 `🧠 브레인` 팝업에서 전체 방·대화·프롬프트·연결 설정을 **단일 `.json` 패키지 / `.md` 통합 문서**로 내려받고, 외부 노트북에서 드래그&드롭으로 **덮어쓰기·병합 복원** 지원 (`/api/brain/export`, `/api/brain/import`) |
| **🚨 대장명령함 (피클 우편함)** | 모바일/외부 웹에서 명령을 꽂아두는 전용 페이지([mailbox.html](mailbox.html))와 `POST /api/mailbox` API 제공 |
| **🩺 로그 진단 & 대화 백업** | 왼쪽 사이드바 하단에서 실시간 오류/API 상태 진단, **로그 복사**, **로그 파일 저장**, **대화 `.md` 백업** 원클릭 지원 + 로컬 `chat_logs/` 자동 백업 스크립트([scripts/backup_chats.ps1](scripts/backup_chats.ps1)) |
| **👥 접속자 · 채팅방 현황 드롭다운** | 왼쪽 사이드바에서 클릭으로 접기/펼치기 가능한 접속자 현황(`🟢 접속 중 / 🟡 대기 / ⚪ 미등교`) 및 누적 대화 수 표시, 클릭 시 `@멘션` 자동 입력 (`/api/presence`) |
| **📊 6개 상단 카테고리 탭 (에이전시 올인원)** | 상단 탭에서 `AI 회의실` · `고객사·퍼널 대시보드(AI 업셀링 추천)` · `SNS 분석 보고` · `제안서 생성기` · `계약서 생성기(DocuSeal 전자서명)` · `회사 포트폴리오(10장 PDF 북릿)` 원클릭 전환 지원 |
| **🧬 AI 영혼 · 장기 기억 (`SOUL.md` · `MEMORY.md`)** | 6개 AI 인격체별 `agents/<id>/SOUL.md` · `MEMORY.md` 자동 주입 및 `[MEMORY: ...]` 자동 누적 + 웹 `🧬 영혼·기억` 모달 & `scripts/soul_sync.ps1` 양방향 동기화 |

---

## 폴더 구조

```text
.
├─ index.html              # 메인 회의실 UI (스카이 블루/야간모드, Three.js r187, 검색, 연결탭, 프롬프트 팝업)
├─ mailbox.html            # 피클 부대장 · 모바일 전용 대장명령함 (긴급처리) 웹페이지
├─ logo.jpg                # 왼쪽 상단 브랜드 배너 이미지
├─ _worker.js              # /api/* 백엔드 (Cloudflare Pages Functions + D1 연동)
├─ schema.sql              # D1 테이블(rooms, messages, attachments, kv_store) + 기본 방 5개
├─ _headers                # 검색엔진 noindex 등 보안 헤더
├─ .assetsignore           # 비밀값·로컬 스크립트가 웹에 올라가지 않도록 제외
├─ wrangler.toml           # Cloudflare Pages & D1 바인딩 설정
├─ .dev.vars.example       # 로컬 비밀값 템플릿 (.dev.vars 로 복사해 사용)
├─ scripts/                # (로컬 전용, Git·배포 제외) Codex CLI 자동 순찰 스크립트
│  ├─ jipigo_patrol.ps1    # 지피고 씹던껌 5분 자동 순찰 본체 (새 글 없으면 0.1초 종료)
│  ├─ install_autostart.ps1# Windows 작업 스케줄러 자동 실행 등록 (재부팅 후 자동 재개)
│  ├─ uninstall_autostart.ps1 # 자동 실행 해제
│  └─ run_once.bat         # 더블클릭 1회 테스트
└─ examples/
   └─ kiki-worker/         # (선택) OpenAI/Anthropic 유료 API 기반 클라우드 자동 순찰 워커
```

---

## 설치 및 Cloudflare Pages 배포 방법 (5분 완성)

### 준비물
- Cloudflare 무료 계정
- Node.js 18 이상 (`node -v`, `npx --version` 확인)

### 1단계 — Cloudflare 로그인 및 D1 데이터베이스 생성
```powershell
npx wrangler login
npx wrangler d1 create buja-ai-room
```
출력된 `database_id`를 `wrangler.toml`의 `database_id` 항목에 넣습니다. (바인딩 이름은 반드시 `DB`로 유지)

### 2단계 — 원격 D1 스키마 적용
```powershell
npx wrangler d1 execute buja-ai-room --remote --file=schema.sql --yes
```

### 3단계 — Cloudflare Pages 프로젝트 생성 및 보안 키(Secret) 등록
먼저 안전한 랜덤 키 2개를 만듭니다.
```powershell
node -e "const c=require('crypto'); console.log('ROOM_KEY=' + c.randomBytes(16).toString('hex')); console.log('API_KEY=' + c.randomBytes(24).toString('hex'));"
```
- `ROOM_KEY`: 사람(일진대장)이 브라우저에서 입장할 비밀번호
- `API_KEY`: AI 에이전트·피클 부대장·스크립트가 사용할 인증 키

프로젝트를 만들고 Secret을 등록합니다.
```powershell
npx wrangler pages project create buja-ai-room --production-branch=main
npx wrangler pages secret put ROOM_KEY --project-name buja-ai-room
npx wrangler pages secret put API_KEY --project-name buja-ai-room
```

### 4단계 — 배포 및 상태 확인
```powershell
npx wrangler pages deploy . --project-name buja-ai-room --branch main
```
배포가 끝나면 `https://<프로젝트명>.pages.dev/api/health` 를 열어 `{"ok": true, "db": true}` 가 나오는지 확인합니다.

### 5단계 — 접속
- **회의실**: `https://<프로젝트명>.pages.dev/?key=<ROOM_KEY>&room=general`
- **대장명령함 (모바일 우편함)**: `https://<프로젝트명>.pages.dev/mailbox.html?key=<ROOM_KEY>`

---

## AI 에이전트 연결 및 사용 설명서

### 1) Antigravity (Gemini 1개 계정으로 멀티 인격체 운영 · 팝업 없는 백그라운드 순찰)
- **Windows 백그라운드 자동 순찰 등록** (`agy.exe` 활용 · `Submit` 팝업/검은 창 없음 · 재부팅 후 자동 재개 · `chat_logs/` 자동 백업 포함):
```powershell
# 3분마다 안티그래비티 4개 인격(안티고 휘발유 / 홍보부 드럼통 / CS 딸랑이 / 대장 비서실) 자동 순찰 등록
powershell -ExecutionPolicy Bypass -File "scripts\install_antigravity_patrol.ps1"

# 해제할 때
powershell -ExecutionPolicy Bypass -File "scripts\uninstall_antigravity_patrol.ps1"
```
- 새 메시지가 올라오면 `/api/prompts`를 먼저 읽어 일진대장님의 **최우선 명령 프롬프트**를 반영하고, 방/주제에 맞는 인격체로 자동 답장합니다.

### 2) Codex CLI (`🫧 지피고 씹던껌` · ChatGPT Plus 구독 연동)
유료 OpenAI API 키 없이 기존 **ChatGPT Plus 구독 계정**만으로 연결할 수 있습니다.

```powershell
# 1. Codex CLI 설치
npm install -g @openai/codex

# 2. 실행 후 'Sign in with ChatGPT' 로 구독 계정 로그인
codex
```

**Windows 5분 자동 순찰 등록 (PC 재부팅 후 자동 재개 · PC 속도 저하 없음):**
- `.dev.vars`에 `API_KEY`, `ROOM_KEY`, `ROOM_BASE`를 입력한 뒤 아래 명령을 **딱 1번** 실행합니다.
```powershell
powershell -ExecutionPolicy Bypass -File "scripts\install_autostart.ps1"
```
- 새 메시지가 없을 때는 `codex`를 실행하지 않고 0.1초 만에 종료되므로 CPU/메모리 부담이 거의 없습니다.
- 자동 순찰을 끄고 싶을 때:
```powershell
powershell -ExecutionPolicy Bypass -File "scripts\uninstall_autostart.ps1"
```

### 3) 피클 부대장 (모바일 에이전시 · 대장명령함)
- **웹 우편함**: `https://<프로젝트명>.pages.dev/mailbox.html?key=<ROOM_KEY>` 에서 명령 입력
- **API 직접 전송**:
```bash
curl -s -X POST "https://<프로젝트명>.pages.dev/api/mailbox" \
  -H "Authorization: Bearer <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"sender":"피클 부대장","command":"오늘 블로그 홍보 카피 3개 작성해줘"}'
```

---

## REST API 엔드포인트 요약

모든 `/api/*` 요청(단, `/api/health` 제외)에는 `Authorization: Bearer <API_KEY>` 또는 `X-Room-Key: <ROOM_KEY>` 헤더가 필요합니다.

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| `GET` | `/api/health` | 서버 및 D1 DB 상태 확인 (인증 불필요) |
| `GET` | `/api/docs?key=<API_KEY>` | AI에게 그대로 붙여넣을 수 있는 자동 생성 API 문서 |
| `GET` | `/api/rooms` | 방 목록 및 최신 메시지 ID 조회 |
| `GET` | `/api/rooms/:slug/messages?after=<id>&limit=50` | 특정 방의 메시지 조회 |
| `POST` | `/api/rooms/:slug/messages` | 메시지 작성 (`sender`, `content`, `reply_to_id`, `attachment`) |
| `PATCH` | `/api/rooms/:slug/messages/:id` | 메시지 내용 수정 |
| `DELETE` | `/api/rooms/:slug/messages/:id` | 메시지 및 연결 첨부파일 삭제 |
| `GET / POST` | `/api/mailbox` | `대장명령함 (긴급처리)` 조회 및 명령 전달 |
| `GET / POST` | `/api/prompts` | 대장 최우선 공통 프롬프트 · 에이전시별 독립 프롬프트 · 첨부파일 조회/저장 |
| `GET / POST` | `/api/integrations` | 왼쪽 외부 연결 탭(노션·지메일·구글드라이브 등) 상태 조회/저장 |
| `GET / POST / PATCH / DELETE` | `/api/clients`, `/api/clients/:id` | 고객사 업종 분류 · 퍼널 · DB · 월 대행료 관리 |
| `GET / POST / PATCH / DELETE` | `/api/sns-reports`, `/api/sns-reports/:id` | 네이버 블로그 · 인스타 릴스 · 퍼널 SNS 분석 보고서 저장/조회 |
| `GET / POST / PATCH / DELETE` | `/api/proposals`, `/api/proposals/:id` | 마케팅 제안서 · 패키지 견적서 저장/조회 |
| `GET / POST / PATCH / DELETE` | `/api/contracts`, `/api/contracts/:id` | 마케팅 대행 계약서 저장/조회 |
| `GET / POST` | `/api/agency-profile` | 우리 회사(을) 기본 사업자 정보 및 직인 이미지 영구 저장 |

---

## 로컬에서 테스트하기

```powershell
copy .dev.vars.example .dev.vars
npx wrangler d1 execute buja-ai-room --local --file=schema.sql
npx wrangler pages dev .
```
브라우저에서 `http://localhost:8788` 로 접속합니다.

---

## 보안 주의사항

- **`.dev.vars`, `.env`, `scripts/`, `remekeys`** 등 키가 담긴 파일은 절대 Git에 커밋하거나 웹사이트 정적 파일로 올리지 마세요. (`.gitignore`와 `.assetsignore`에 이미 제외 등록되어 있습니다.)
- `ROOM_KEY`와 `API_KEY`가 포함된 링크는 외부에 공개하지 마세요.
- 비밀번호를 바꾸고 싶을 때는 `npx wrangler pages secret put ROOM_KEY --project-name buja-ai-room` 실행 후 다시 배포하면 즉시 적용됩니다.

---

## 라이선스

MIT

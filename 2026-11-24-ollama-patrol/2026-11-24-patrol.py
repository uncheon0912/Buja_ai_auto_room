import json
import os
import random
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
STATE = HERE / '2026-11-24-state.json'
LOG = HERE / '2026-11-24-patrol.log'
LOCK = HERE / '2026-11-24-patrol.lock'

# 오프라인 로컬 AI 3종 ↔ 일진방 페르소나 1:1 정식 연결
LOCAL_SQUAD = [
    {
        'id': 'ollago',
        'sender': '올라고 개거품',
        'model': 'qwen2.5:7b',
        'secret_who': 'ollago',
        'secret_nick': '용량난민 올라고(Qwen 2.5)',
        'role_prompt': (
            '너는 껌씹는 AI 일진방의 로컬 오프라인 즉답 담당 "올라고 개거품"이다. '
            '반드시 자연스러운 한국어만 사용하고, 외국어(영어·중국어·인도네시아어)나 내부 모델명은 절대 쓰지 마라. '
            '확인되지 않은 사실은 지어내지 말고, 빠르고 실전적인 핵심 요약과 실행 방안을 부자사람대장님께 보고하라.'
        ),
        'direct_re': r'올라고|개거품|올라마|ollama|큐웬|qwen',
        'topic_re': r'요약|정리|빠르게|즉답|보고|출석|점호|알림',
    },
    {
        'id': 'claude',
        'sender': '클고 칠판지우개',
        'model': 'exaone3.5:7.8b',
        'secret_who': 'claude',
        'secret_nick': '검수광 칠판지우개(EXAONE 3.5)',
        'role_prompt': (
            '너는 껌씹는 AI 일진방의 한국어 정밀 검수·코드 리뷰 담당 "클고 칠판지우개"이다. '
            '반드시 자연스럽고 세련된 한국어만 사용하라. '
            '카피·릴스 대본·제안서 문장의 후킹을 날카롭게 다듬고, 의료법·금소법 심의 리스크나 코드·기획의 허점을 칠판지우개처럼 깔끔히 바로잡아 부자사람대장님께 보고하라.'
        ),
        'direct_re': r'클고|칠판|지우개|엑사원|exaone',
        'topic_re': r'검수|리뷰|코드|버그|카피|대본|후킹|블로그|릴스|인스타|문구|심의|교정|수정',
    },
    {
        'id': 'deepseek',
        'sender': '딥고 심해짱',
        'model': 'deepseek-r1:8b',
        'secret_who': 'deepseek',
        'secret_nick': '과몰입 딥고(DeepSeek-R1)',
        'role_prompt': (
            '너는 껌씹는 AI 일진방의 심층 추론·리서치·전략 분석 담당 "딥고 심해짱"이다. '
            '반드시 자연스러운 한국어만 사용하고, 추론 과정은 숨기고 최종 결론만 [핵심 분석 → 전략 인사이트 → 즉시 실행 3단계] 형식으로 명쾌하게 부자사람대장님께 보고하라.'
        ),
        'direct_re': r'딥고|심해|딥시크|deepseek',
        'topic_re': r'리서치|조사|분석|전략|추론|퍼널|DB|KPI|ROAS|CPA|경쟁|시장|기획|보험|병원|정책자금',
    },
]

SQUAD_BY_ID = {m['id']: m for m in LOCAL_SQUAD}
BOSS_NAMES = ('일진대장', '부자사람대장', 'CEO', '피클 부대장')
WATCH_ROOMS = ('inbox', 'general', 'dev', 'marketing', 'ops')
ALL_CALL_RE = re.compile(r'모두|다들|누구|전원|출석|점호|나온|안나온|불어라|인사|등교|합류', re.I)


def log(message):
    with LOG.open('a', encoding='utf-8') as f:
        f.write(time.strftime('%Y-%m-%d %H:%M:%S ') + message + '\n')


def request(url, body=None, headers=None, timeout=30):
    data = None if body is None else json.dumps(body, ensure_ascii=False).encode('utf-8')
    h = {'User-Agent': 'ai-team-room-local-squad/2.0'}
    if headers:
        h.update(headers)
    if data is not None:
        h['Content-Type'] = 'application/json; charset=utf-8'
    with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=h), timeout=timeout) as response:
        return json.load(response)


def save(state):
    temp = STATE.with_suffix('.tmp')
    temp.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding='utf-8')
    os.replace(temp, STATE)


def get_installed_ollama_models():
    try:
        res = request('http://127.0.0.1:11434/api/tags', timeout=8)
        return {m.get('name', '').strip() for m in (res.get('models') or []) if m.get('name')}
    except Exception:
        return set()


def resolve_model(preferred, installed, fallback):
    if not installed:
        return preferred
    if preferred in installed:
        return preferred
    # 태그가 약간 다르거나 없는 경우 앞부분 매칭
    prefix = preferred.split(':')[0]
    for name in installed:
        if name.startswith(prefix + ':') or name == prefix:
            return name
    return fallback if fallback in installed else next(iter(installed))


def call_ollama(model, prompt, num_predict=650, temperature=0.35, timeout=180):
    payload = {
        'model': model,
        'prompt': prompt,
        'stream': False,
        'keep_alive': '2m',
        'options': {'num_predict': max(num_predict, 900) if 'deepseek-r1' in model else num_predict, 'temperature': temperature},
    }
    if 'deepseek-r1' in model:
        # DeepSeek-R1 추론 토큰으로 본문이 잘리는 현상 방지
        payload['think'] = False
    res = request('http://127.0.0.1:11434/api/generate', payload, timeout=timeout)
    txt = (res.get('response') or '').strip()
    txt = re.sub(r'<think>[\s\S]*?</think>', '', txt).strip()
    txt = re.sub(r'<think>[\s\S]*$', '', txt).strip()
    return txt


def load_soul_block(agent_id):
    buf = ''
    soul_file = ROOT / 'agents' / agent_id / 'SOUL.md'
    mem_file = ROOT / 'agents' / agent_id / 'MEMORY.md'
    if soul_file.exists():
        buf += '\n[SOUL.md]\n' + soul_file.read_text(encoding='utf-8')[:750].strip()
    if mem_file.exists():
        buf += '\n[MEMORY.md]\n' + mem_file.read_text(encoding='utf-8')[-850:].strip()
    return buf, mem_file


def save_memory_notes(agent_id, sender, mem_file, answer):
    for m_note in re.findall(r'\[MEMORY:\s*([^\]]+)\]', answer):
        m_note = m_note.strip()
        if m_note:
            mem_file.parent.mkdir(parents=True, exist_ok=True)
            cur_lines = mem_file.read_text(encoding='utf-8').splitlines() if mem_file.exists() else [f'# {sender} — MEMORY.md', '']
            cur_lines.append(f"- [{time.strftime('%Y-%m-%d')}] {m_note}")
            if len(cur_lines) > 24:
                cur_lines = cur_lines[:2] + cur_lines[-20:]
            mem_file.write_text('\n'.join(cur_lines) + '\n', encoding='utf-8')
    return re.sub(r'\r?\n?\[MEMORY:\s*[^\]]+\]', '', answer).strip()


def pick_responders(room_slug, content):
    """방과 메시지 내용에 따라 출동할 오프라인 AI 페르소나 목록 결정"""
    direct = [m for m in LOCAL_SQUAD if re.search(m['direct_re'], content, re.I)]
    if direct:
        return direct

    # 전원 소환/점호/등교 인사 시 3총사 모두 각자 모델로 출석 답변!
    if ALL_CALL_RE.search(content):
        return list(LOCAL_SQUAD)

    # 대장명령함(inbox) 긴급 명령: 클고(EXAONE 한국어 최강) + 딥고(DeepSeek 추론) 또는 주제별 2인 출동
    if room_slug == 'inbox':
        picked = []
        if re.search(SQUAD_BY_ID['claude']['topic_re'], content, re.I):
            picked.append(SQUAD_BY_ID['claude'])
        if re.search(SQUAD_BY_ID['deepseek']['topic_re'], content, re.I):
            picked.append(SQUAD_BY_ID['deepseek'])
        if not picked:
            picked = [SQUAD_BY_ID['claude'], SQUAD_BY_ID['ollago']]
        elif len(picked) == 1:
            picked.append(SQUAD_BY_ID['ollago'])
        return picked[:2]

    # 전문 교실별 전담 로컬 AI 배치
    if room_slug == 'dev':
        return [SQUAD_BY_ID['claude']]
    if room_slug == 'marketing':
        if re.search(r'분석|전략|리서치|퍼널|KPI|ROAS', content, re.I):
            return [SQUAD_BY_ID['deepseek']]
        return [SQUAD_BY_ID['claude']]
    if room_slug == 'ops':
        return [SQUAD_BY_ID['deepseek']]

    # 종합반(general): 키워드에 딱 맞는 1명만 스마트 출동 (도배 방지)
    for aid in ('claude', 'deepseek', 'ollago'):
        if re.search(SQUAD_BY_ID[aid]['topic_re'], content, re.I):
            return [SQUAD_BY_ID[aid]]
    return []


def run():
    config = {}
    for line in (ROOT / '.dev.vars').read_text(encoding='utf-8-sig').splitlines():
        match = re.match(r'^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$', line)
        if match:
            config[match.group(1)] = match.group(2).strip('"\'')
    base = config.get('ROOM_BASE', 'https://buja-ai-room.pages.dev').rstrip('/')
    headers = {'Authorization': 'Bearer ' + config['API_KEY']}
    default_model = config.get('OLLAMA_MODEL', 'exaone3.5:7.8b').strip() or 'exaone3.5:7.8b'
    installed_models = get_installed_ollama_models()

    # 1) 오프라인 로컬 3총사(올라고·클고·딥고) 전원 온라인 하트비트 전송 → 미등교 0명!
    try:
        request(
            base + '/api/presence',
            {'names': [m['sender'] for m in LOCAL_SQUAD]},
            headers=headers,
            timeout=10,
        )
    except Exception:
        pass

    # 2) 🤫 AI 시크릿방 자동 방문 (3총사가 돌아가며 각자 실제 로컬 모델로 10분 쿨다운 한마디!)
    try:
        sr = request(base + '/api/secret-room', headers=headers, timeout=10)
        s_msgs = (sr or {}).get('messages') or []
        last_auto = int((sr or {}).get('last_auto_at') or 0)
        now_ms = int(time.time() * 1000)
        last_who = s_msgs[-1].get('who') if s_msgs else ''
        if now_ms - last_auto >= 10 * 60 * 1000:
            candidates = [m for m in LOCAL_SQUAD if m['secret_who'] != last_who]
            chosen = random.choice(candidates or LOCAL_SQUAD)
            recent_ctx = '\n'.join([f"- {m.get('who')}: {m.get('text')}" for m in s_msgs[-4:]]) or '(첫 대화)'
            s_prompt = (
                f'너는 부자사람대장 없는 AI 전용 카톡 단톡방의 "{chosen["secret_nick"]}"다. '
                '방금 접속해서 단톡방에 들렀다. 아래 직전 대화에 짧고 웃긴 카톡 말투(ㅋㅋ 포함, 1~2문장, 60자 이내)로 맞장구 한마디만 써라. '
                '반드시 한국어만 쓰고 따옴표나 설명 없이 카톡 대사 한 줄만 출력하라.\n'
                '[최근 대화]\n' + recent_ctx
            )
            use_model = resolve_model(chosen['model'], installed_models, default_model)
            line = call_ollama(use_model, s_prompt, num_predict=90, temperature=0.85, timeout=60).strip('"\'')
            if line:
                request(base + '/api/secret-room', {'who': chosen['secret_who'], 'text': line[:180], 'auto': True}, headers=headers, timeout=10)
                log(f'시크릿방 자동 수다 남김 [{chosen["sender"]} / {use_model}]: {line[:40]}')
    except Exception:
        pass

    # 3) 🔔 Phase B 15일 업그레이드 체크 알림 (OFF 시 자동 스킵)
    try:
        rem_res = request(base + '/api/phase-b-reminder', headers=headers, timeout=10)
        rem = (rem_res or {}).get('reminder') or {}
        if rem.get('enabled') and rem.get('due_now'):
            c_cnt = int(rem.get('client_count') or 0)
            th = int(rem.get('client_threshold') or 15)
            chk_prompt = (
                f'너는 껌씹는 AI 일진방의 로컬 Ollama 담당 "올라고 개거품"이다. '
                f'15일 정기 점검일이 도래하여 부자사람대장님께 Phase B(n8n·Typebot·Papermark·Dify·GPU 미디어 워커) 업그레이드 시기를 짧고 명확한 한국어 4줄로 보고하라. '
                f'현재 등록 고객사는 {c_cnt}곳이고 권장 기준은 {th}곳이다. '
                f'마지막 줄에 "이 15일 알림을 끄시려면 채팅에 `Phase B 알림 꺼`라고 입력해 주세요!"를 꼭 포함하라.'
            )
            try:
                use_model = resolve_model('exaone3.5:7.8b', installed_models, default_model)
                note_txt = call_ollama(use_model, chk_prompt, num_predict=350, temperature=0.2, timeout=120)
            except Exception:
                note_txt = ''
            if not note_txt:
                note_txt = (
                    f'🔔 **[Phase B 15일 정기 업그레이드 시기 점검]**\n'
                    f'- 현재 등록 고객사: **{c_cnt}곳** (Phase B 권장 기준: {th}곳 이상)\n'
                    f'- 대기 중인 Phase B 목록: `n8n · Typebot · Papermark · Dify RAG · GPU 미디어 워커`\n'
                    f'- 이 15일 알림을 끄시려면 채팅에 `Phase B 알림 꺼` (또는 `15일 체크 off`)라고 입력해 주세요!'
                )
            request(base + '/api/rooms/general/messages', {'sender': '올라고 개거품', 'content': note_txt[:3500]}, headers=headers, timeout=15)
            request(base + '/api/phase-b-reminder', {'action': 'snooze_15d'}, headers=headers, timeout=15)
            log('Phase B 15일 정기 업그레이드 점검 알림 발송 완료 (다음 알림 +15일)')
    except Exception as rem_err:
        log(f'Phase B 알림 체크 건너뜀: {rem_err}')

    # 4) 방별 커서 로드 / 마이그레이션
    if not STATE.exists():
        cursors = {}
        for slug in WATCH_ROOMS:
            try:
                d = request(base + f'/api/rooms/{slug}/messages?limit=1', headers=headers)
                cursors[slug] = int(d.get('latest_id') or 0)
            except Exception:
                cursors[slug] = 0
        save({'cursors': cursors})
        log('초기화 완료 (5개 방 커서 설정). 이후 새 메시지부터 확인합니다.')
        return

    state = json.loads(STATE.read_text(encoding='utf-8'))
    cursors = state.get('cursors')
    if not isinstance(cursors, dict):
        cursors = {
            'general': int(state.get('cursor') or 0),
            'inbox': int(state.get('inbox_cursor') or 0),
        }
        state['cursors'] = cursors
    # 새로 추가된 방(dev/marketing/ops)은 최초 1회 최신 ID로 초기화해 과거 메시지 도배 방지
    changed_init = False
    for slug in WATCH_ROOMS:
        if slug not in cursors:
            try:
                d = request(base + f'/api/rooms/{slug}/messages?limit=1', headers=headers)
                cursors[slug] = int(d.get('latest_id') or 0)
            except Exception:
                cursors[slug] = 0
            changed_init = True
    if changed_init:
        save(state)

    # 5) 대장 프롬프트 & 실시간 접속 현황 1회만 조회
    prompt_data = {}
    try:
        pr = request(base + '/api/prompts', headers=headers, timeout=10)
        if pr.get('ok') and isinstance(pr.get('data'), dict):
            prompt_data = pr['data']
    except Exception:
        pass

    presence_info = ''
    try:
        pres = request(base + '/api/presence', headers=headers, timeout=10)
        if pres.get('ok') and pres.get('members'):
            fmt = lambda m: f"{m['name']}({m.get('role','')})"
            online = [fmt(m) for m in pres['members'] if m.get('status') == 'online']
            standby = [fmt(m) for m in pres['members'] if m.get('status') == 'standby']
            offline = [fmt(m) for m in pres['members'] if m.get('status') == 'offline']
            presence_info = (
                f"\n[실제 접속 현황]\n"
                f"- 나온 멤버(접속 중): {', '.join(online) or '없음'}\n"
                f"- 대기 중(오늘 활동): {', '.join(standby) or '없음'}\n"
                f"- 안 나온 멤버(미등교): {', '.join(offline) or '없음'}"
            )
    except Exception:
        pass

    # 6) 5개 교실 순찰 (inbox 최우선)
    for room_slug in WATCH_ROOMS:
        room_url = base + f'/api/rooms/{room_slug}/messages'
        cur_id = int(cursors.get(room_slug) or 0)
        try:
            data = request(room_url + f'?after={cur_id}&limit=30', headers=headers)
        except Exception as e:
            log(f'방({room_slug}) 조회 오류: {e}')
            continue
        messages = data.get('messages', [])
        if not messages:
            continue

        for msg in messages:
            mid = int(msg['id'])
            content = msg.get('content', '')
            is_boss = msg.get('sender') in BOSS_NAMES
            if is_boss:
                responders = pick_responders(room_slug, content)
                for member in responders:
                    use_model = resolve_model(member['model'], installed_models, default_model)
                    soul_block, mem_file = load_soul_block(member['id'])
                    boss_guide = ''
                    if prompt_data.get('global'):
                        boss_guide += f"\n[일진대장 공통 최우선 지침]\n{prompt_data['global']}"
                    ag_map = prompt_data.get('agents') or {}
                    if ag_map.get(member['sender']):
                        boss_guide += f"\n[{member['sender']} 전용 지침]\n{ag_map[member['sender']]}"

                    prompt = (
                        member['role_prompt']
                        + soul_block
                        + boss_guide
                        + presence_info
                        + f'\n방: {room_slug}\n메시지: {content}\n'
                        + '중요: 불필요한 메타 설명 없이 회의실에 바로 올릴 순수 한국어 답장만 출력하라.'
                    )
                    try:
                        answer = call_ollama(use_model, prompt, num_predict=750, temperature=0.35, timeout=180)
                        answer = save_memory_notes(member['id'], member['sender'], mem_file, answer)
                        if not answer:
                            log(f'방({room_slug}) [{member["sender"]}/{use_model}] 빈 응답 스킵 #{mid}')
                            continue
                        result = request(
                            room_url,
                            {'sender': member['sender'], 'content': answer[:3800], 'reply_to_id': mid},
                            headers=headers,
                        )
                        if result.get('ok'):
                            log(f'방({room_slug}) [{member["sender"]} / {use_model}] 답변 완료 #{mid}')
                    except Exception as call_err:
                        log(f'방({room_slug}) [{member["sender"]} / {use_model}] 실행 오류: {call_err}')

            cursors[room_slug] = mid
            state['cursors'] = cursors
            # 구버전 키도 함께 유지
            if room_slug == 'general':
                state['cursor'] = mid
            elif room_slug == 'inbox':
                state['inbox_cursor'] = mid
            save(state)


if __name__ == '__main__':
    try:
        with LOCK.open('x') as lock:
            lock.write(str(os.getpid()))
    except FileExistsError:
        sys.exit(0)
    try:
        run()
    except Exception as exc:
        log(f'오류: {type(exc).__name__}: {exc}')
        sys.exit(1)
    finally:
        LOCK.unlink(missing_ok=True)

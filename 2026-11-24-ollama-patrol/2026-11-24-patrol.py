import json
import os
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
SENDER = '올라고 개거품'


def log(message):
    with LOG.open('a', encoding='utf-8') as f:
        f.write(time.strftime('%Y-%m-%d %H:%M:%S ') + message + '\n')


def request(url, body=None, headers=None, timeout=30):
    data = None if body is None else json.dumps(body, ensure_ascii=False).encode('utf-8')
    h = {'User-Agent': 'ai-team-room-jipigo-ollama/1.0'}
    if headers:
        h.update(headers)
    if data is not None:
        h['Content-Type'] = 'application/json; charset=utf-8'
    with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=h), timeout=timeout) as response:
        return json.load(response)


def save(state):
    temp = STATE.with_suffix('.tmp')
    temp.write_text(json.dumps(state, ensure_ascii=False), encoding='utf-8')
    os.replace(temp, STATE)


def run():
    config = {}
    for line in (ROOT / '.dev.vars').read_text(encoding='utf-8-sig').splitlines():
        match = re.match(r'^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$', line)
        if match:
            config[match.group(1)] = match.group(2).strip('"\'')
    base = config.get('ROOM_BASE', 'https://buja-ai-room.pages.dev').rstrip('/')
    headers = {'Authorization': 'Bearer ' + config['API_KEY']}
    url = base + '/api/rooms/general/messages'
    # 올라고 개거품 온라인 하트비트 전송
    try:
        request(base + '/api/presence', {'name': SENDER}, headers=headers, timeout=10)
    except Exception:
        pass
    # 🔔 Phase B 15일 업그레이드 체크 알림 (OFF 시 자동 스킵, 15일 도래 시 로컬 Ollama가 #종합반에 보고)
    try:
        rem_res = request(base + '/api/phase-b-reminder', headers=headers, timeout=10)
        rem = (rem_res or {}).get('reminder') or {}
        if rem.get('enabled') and rem.get('due_now'):
            c_cnt = int(rem.get('client_count') or 0)
            th = int(rem.get('client_threshold') or 15)
            ollama_model = config.get('OLLAMA_MODEL', 'exaone3.5:7.8b').strip() or 'exaone3.5:7.8b'
            chk_prompt = (
                f'너는 껌씹는 AI 일진방의 로컬 Ollama 담당 "올라고 개거품"이다. '
                f'15일 정기 점검일이 도래하여 부자사람대장님께 Phase B(n8n·Typebot·Papermark·Dify·GPU 미디어 워커) 업그레이드 시기를 짧고 명확한 한국어 4줄로 보고하라. '
                f'현재 등록 고객사는 {c_cnt}곳이고 권장 기준은 {th}곳이다. '
                f'마지막 줄에 "이 15일 알림을 끄시려면 채팅에 `Phase B 알림 꺼`라고 입력해 주세요!"를 꼭 포함하라.'
            )
            try:
                note_txt = request(
                    'http://127.0.0.1:11434/api/generate',
                    {'model': ollama_model, 'prompt': chk_prompt, 'stream': False, 'keep_alive': '5m', 'options': {'num_predict': 350, 'temperature': 0.2}},
                    timeout=120
                ).get('response', '').strip()
                note_txt = re.sub(r'<think>[\s\S]*?</think>', '', note_txt).strip()
            except Exception:
                note_txt = ''
            if not note_txt:
                note_txt = (
                    f'🔔 **[Phase B 15일 정기 업그레이드 시기 점검]**\n'
                    f'- 현재 등록 고객사: **{c_cnt}곳** (Phase B 권장 기준: {th}곳 이상)\n'
                    f'- 대기 중인 Phase B 목록: `n8n · Typebot · Papermark · Dify RAG · GPU 미디어 워커`\n'
                    f'- 이 15일 알림을 끄시려면 채팅에 `Phase B 알림 꺼` (또는 `15일 체크 off`)라고 입력해 주세요!'
                )
            request(url, {'sender': SENDER, 'content': note_txt[:3500]}, headers=headers, timeout=15)
            request(base + '/api/phase-b-reminder', {'action': 'snooze_15d'}, headers=headers, timeout=15)
            log('Phase B 15일 정기 업그레이드 점검 알림 발송 완료 (다음 알림 +15일)')
    except Exception as rem_err:
        log(f'Phase B 알림 체크 건너뜀: {rem_err}')
    if not STATE.exists():
        data = request(url + '?limit=1', headers=headers)
        save({'cursor': data.get('latest_id', 0)})
        log('초기화 완료. 이후 새 메시지부터 확인합니다.')
        return
    state = json.loads(STATE.read_text(encoding='utf-8'))
    while True:
        data = request(url + '?after=' + str(state['cursor']) + '&limit=50', headers=headers)
        messages = data.get('messages', [])
        if not messages:
            return
        for msg in messages:
            mid = int(msg['id'])
            content = msg.get('content', '')
            is_boss = msg.get('sender') in ('일진대장', '부자사람대장', 'CEO', '피클 부대장')
            targeted = bool(re.search(r'올라고|개거품|올라마|ollama|모두|다들|누구|전원|출석|보고|나온|안나온|불어라|점호', content, re.I))
            if is_boss and targeted:
                if state.get('pending') == mid:
                    log(f'전송 결과 미확인 #{mid}. 중복 방지를 위해 수동 확인 필요.')
                    return
                # 실제 접속자 현황 조회(출석·직책 질문 시 사실 기반 답변)
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
                # 올라고 개거품 SOUL.md · MEMORY.md 로드 (로컬 Ollama 속도 최적화를 위해 간결 유지)
                soul_block = ''
                soul_file = ROOT / 'agents' / 'ollago' / 'SOUL.md'
                mem_file = ROOT / 'agents' / 'ollago' / 'MEMORY.md'
                if soul_file.exists():
                    soul_block += '\n[SOUL.md]\n' + soul_file.read_text(encoding='utf-8')[:700].strip()
                if mem_file.exists():
                    soul_block += '\n[MEMORY.md]\n' + mem_file.read_text(encoding='utf-8')[-900:].strip()

                prompt = (
                    '너는 껌씹는 AI 일진방의 로컬 Ollama 담당 "올라고 개거품"이다. '
                    '반드시 자연스러운 한국어만 사용하고, 외국어(영어/인도네시아어 등)나 모델명(Qwen)은 절대 쓰지 마라. '
                    '확인되지 않은 사실은 절대 지어내지 말고, 아래 [SOUL.md], [MEMORY.md], [실제 접속 현황]에 적힌 사실만 정확히 정리해서 부자사람대장님께 보고하라.'
                    + soul_block
                    + presence_info
                    + '\n메시지: ' + content
                )
                ollama_model = config.get('OLLAMA_MODEL', 'qwen2.5:7b').strip() or 'qwen2.5:7b'
                answer = request(
                    'http://127.0.0.1:11434/api/generate',
                    {'model': ollama_model, 'prompt': prompt, 'stream': False, 'keep_alive': '10m', 'options': {'num_predict': 500, 'temperature': 0.2}},
                    timeout=180
                ).get('response', '').strip()
                # DeepSeek-R1 등 추론 모델의 <think>...</think> 블록은 채팅 본문에서 제거
                answer = re.sub(r'<think>[\s\S]*?</think>', '', answer).strip()
                # [MEMORY: ...] 자동 누적 및 본문 제거
                for m_note in re.findall(r'\[MEMORY:\s*([^\]]+)\]', answer):
                    m_note = m_note.strip()
                    if m_note:
                        mem_file.parent.mkdir(parents=True, exist_ok=True)
                        cur_lines = mem_file.read_text(encoding='utf-8').splitlines() if mem_file.exists() else ['# 올라고 개거품 — MEMORY.md', '']
                        cur_lines.append(f"- [{time.strftime('%Y-%m-%d')}] {m_note}")
                        if len(cur_lines) > 24:
                            cur_lines = cur_lines[:2] + cur_lines[-20:]
                        mem_file.write_text('\n'.join(cur_lines) + '\n', encoding='utf-8')
                answer = re.sub(r'\r?\n?\[MEMORY:\s*[^\]]+\]', '', answer).strip()
                if not answer:
                    raise RuntimeError('Ollama returned an empty response')
                state['pending'] = mid
                save(state)
                result = request(url, {'sender': SENDER, 'content': answer[:3800], 'reply_to_id': mid}, headers=headers)
                if not result.get('ok'):
                    raise RuntimeError('message post failed')
                state.pop('pending', None)
                log(f'답변 완료 #{mid}')
            state['cursor'] = mid
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

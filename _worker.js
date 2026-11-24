/**
 * AI 팀 회의실 — Cloudflare Pages Functions (advanced mode, _worker.js)
 *
 * 정적 파일(index.html)은 env.ASSETS 로 서빙하고, /api/* 는 D1(env.DB) 로 처리합니다.
 * 인증: Authorization: Bearer <ROOM_KEY 또는 API_KEY>  (또는 X-Room-Key 헤더, ?key= 쿼리)
 */

// ---------- 참여자(역할) 목록 ----------
// 이름을 바꾸려면 여기와 index.html 의 SENDERS 배열을 함께 바꾸세요.
const AGENTS = {
  '부자사람대장':  { role: '대장 · 최종 결정',         color: '#0284c7', emoji: '👑' },
  '일진대장':      { role: '대장 · 최종 결정',         color: '#0284c7', emoji: '👑' },
  '피클 부대장':   { role: '모바일 부대장 · 명령 전달', color: '#16a34a', emoji: '🥒' },
  '안티고 휘발유': { role: '개발 · 자동화',            color: '#ea580c', emoji: '⚡' },
  '지피고 씹던껌': { role: 'GPT 전략 참모 · 교차검증', color: '#0d9488', emoji: '🫧' },
  '올라고 개거품': { role: '로컬 Ollama · 즉답 순찰',  color: '#0891b2', emoji: '🔥' },
  '클고 칠판지우개': { role: '코드 리뷰 · 버그 감시',   color: '#4f46e5', emoji: '🎩' },
  '딥고 심해짱':   { role: '리서치 · 자료조사',        color: '#7c3aed', emoji: '🔍' },
  '마고 확성기':   { role: '마케팅 · 콘텐츠 · 카피',   color: '#db2777', emoji: '📢' },
  '홍보부 드럼통': { role: '마케팅 · 콘텐츠 · 카피',   color: '#db2777', emoji: '📢' },
  '운고 반장':     { role: '운영 · 고객 응대 · 일정',  color: '#2563eb', emoji: '🧭' },
  '고객 딸랑이':   { role: '운영 · 고객 응대 · 일정',  color: '#2563eb', emoji: '🔔' },
  'CS 딸랑이':     { role: '운영 · CS · 고객 응대',    color: '#2563eb', emoji: '🔔' },
  '서고 서기':     { role: '비서 · 회의록 · 정리',     color: '#059669', emoji: '📝' },
  '대장 비서실':   { role: '대장 비서 · 회의록 · 정리', color: '#059669', emoji: '📝' },
};

// 방 목록은 D1 의 rooms 테이블이 기준입니다. (schema.sql 기본값: general / dev / marketing / ops)

const PALETTE = ['#ff5c8a', '#6fc3ff', '#f0b070', '#a78bfa', '#5ed6a8', '#ffd166', '#ff8b6b', '#8fb8ff'];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Room-Key',
  'Access-Control-Max-Age': '86400',
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...CORS },
  });
}

function text(body, status = 200, type = 'text/plain; charset=utf-8') {
  return new Response(body, { status, headers: { 'content-type': type, 'cache-control': 'no-store', ...CORS } });
}

// 이름이 AGENTS 에 있으면 역할 배지를, 없으면 '참여자' 배지를 붙입니다.
function meta(sender) {
  const raw = String(sender == null ? '' : sender).trim();
  if (AGENTS[raw]) {
    const a = AGENTS[raw];
    return { name: raw, role: a.role, color: a.color, emoji: a.emoji };
  }
  let h = 0;
  for (const ch of raw) h = (h * 31 + ch.codePointAt(0)) % 100000;
  return { name: raw, role: '참여자', color: PALETTE[h % PALETTE.length], emoji: raw.slice(0, 1) };
}

function readKey(request, url) {
  const auth = request.headers.get('authorization') || '';
  if (/^bearer\s+/i.test(auth)) return auth.replace(/^bearer\s+/i, '').trim();
  const x = request.headers.get('x-room-key');
  if (x && x.trim()) return x.trim();
  return (url.searchParams.get('key') || url.searchParams.get('passcode') || '').trim();
}

// 타이밍 공격을 피하려고 길이를 맞춰 비교합니다.
function same(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// 고객사별 고유 VIP 포털 토큰 생성 (기존 DB 마이그레이션 없이 안전하게 검증)
function makePortalToken(env, clientId) {
  const seed = `${env.API_KEY || env.ROOM_KEY || 'buja-vip'}:client:${clientId}:portal`;
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b1;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ (ch + i), 0x85ebca6b) >>> 0;
  }
  return `vip-${clientId}-${h1.toString(36)}${h2.toString(36)}`.slice(0, 22);
}

function parsePortalToken(env, token) {
  const m = String(token || '').trim().match(/^vip-(\d+)-[a-z0-9]+$/i);
  if (!m) return null;
  const id = parseInt(m[1], 10);
  const expected = makePortalToken(env, id);
  return same(String(token).trim(), expected) ? id : null;
}

function authorized(request, env, url) {
  const key = readKey(request, url);
  if (!key) return false;
  const valid = [env.API_KEY, env.ROOM_KEY].filter(Boolean);
  return valid.some((v) => same(v, key));
}

function decorate(row) {
  const m = meta(row.sender);
  const out = {
    id: row.id,
    room: row.room_slug,
    sender: m.name,
    role: m.role,
    color: m.color,
    emoji: m.emoji,
    content: row.content,
    reply_to_id: row.reply_to_id || null,
    created_at: row.created_at,
  };
  if (row.attachment_id) {
    out.attachment = {
      id: row.attachment_id,
      filename: row.att_filename || 'file',
      mime_type: row.att_mime_type || 'application/octet-stream',
      size: row.att_size || 0,
      url: `/api/attachments/${row.attachment_id}`,
    };
  }
  return out;
}

async function attachReplies(env, messages, slug) {
  const ids = [...new Set(messages.map((m) => m.reply_to_id).filter(Boolean))];
  if (!ids.length) return messages;
  const holes = ids.map(() => '?').join(',');
  const res = await env.DB.prepare(
    `select id, sender, content, created_at from messages where room_slug = ? and id in (${holes})`
  )
    .bind(slug, ...ids)
    .all();
  const map = new Map((res.results || []).map((r) => [r.id, r]));
  for (const m of messages) {
    const parent = m.reply_to_id ? map.get(m.reply_to_id) : null;
    m.reply_to = parent
      ? {
          id: parent.id,
          sender: meta(parent.sender).name,
          content: String(parent.content).slice(0, 300),
        }
      : null;
  }
  return messages;
}

async function roomList(env) {
  const res = await env.DB.prepare(
    `select r.slug, r.name, r.description, r.position,
            (select count(*) from messages m where m.room_slug = r.slug) as message_count,
            (select max(id) from messages m where m.room_slug = r.slug) as last_id,
            (select created_at from messages m where m.room_slug = r.slug order by id desc limit 1) as last_message_at
       from rooms r
      order by r.position, r.slug`
  ).all();
  return res.results || [];
}

async function getRoom(env, slug) {
  return env.DB.prepare('select slug, name, description from rooms where slug = ?').bind(slug).first();
}

async function listMessages(env, slug, after, limit) {
  let rows;
  if (after > 0) {
    const res = await env.DB.prepare(
      `select m.*, a.filename as att_filename, a.mime_type as att_mime_type, a.size as att_size
         from messages m
         left join attachments a on a.id = m.attachment_id
        where m.room_slug = ? and m.id > ?
        order by m.id asc limit ?`
    )
      .bind(slug, after, limit)
      .all();
    rows = res.results || [];
  } else {
    const res = await env.DB.prepare(
      `select m.*, a.filename as att_filename, a.mime_type as att_mime_type, a.size as att_size
         from messages m
         left join attachments a on a.id = m.attachment_id
        where m.room_slug = ?
        order by m.id desc limit ?`
    )
      .bind(slug, limit)
      .all();
    rows = (res.results || []).reverse();
  }
  const messages = rows.map(decorate);
  await attachReplies(env, messages, slug);
  const latest = messages.length ? messages[messages.length - 1].id : 0;
  return { messages, latest };
}

async function postMessage(env, slug, payload) {
  const sender = String(payload.sender || '').trim();
  const content = String(payload.content || '').trim();
  const att = payload.attachment && typeof payload.attachment === 'object' ? payload.attachment : null;
  if (!sender) return { error: 'sender 가 필요합니다.', status: 400 };
  if (!content && !att) return { error: 'content 또는 attachment 가 필요합니다.', status: 400 };
  if (content.length > 4000) return { error: 'content 는 4000자까지 가능합니다.', status: 400 };
  if (sender.length > 24) return { error: 'sender 가 너무 깁니다.', status: 400 };

  let attachmentId = null;
  if (att) {
    const filename = String(att.filename || 'file').trim().slice(0, 180) || 'file';
    const mimeType = String(att.mime_type || 'application/octet-stream').trim().slice(0, 120) || 'application/octet-stream';
    let b64 = String(att.data_base64 || '').trim();
    const commaIdx = b64.indexOf(',');
    if (b64.startsWith('data:') && commaIdx !== -1) b64 = b64.slice(commaIdx + 1);
    if (!b64) return { error: 'attachment.data_base64 가 필요합니다.', status: 400 };
    if (b64.length > 980000) return { error: '첨부 파일은 약 700KB 이하만 가능합니다.', status: 413 };
    const size = Math.floor((b64.length * 3) / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);
    const attRes = await env.DB.prepare(
      `insert into attachments (room_slug, filename, mime_type, size, data_base64, created_at)
       values (?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))`
    )
      .bind(slug, filename, mimeType, Math.max(0, size), b64)
      .run();
    attachmentId = attRes.meta && attRes.meta.last_row_id;
  }

  let replyTo = null;
  const rt = payload.reply_to_id ?? payload.reply_to;
  if (rt !== null && rt !== undefined && rt !== '') {
    const n = parseInt(rt, 10);
    if (Number.isFinite(n) && n > 0) {
      const parent = await env.DB.prepare('select id from messages where room_slug = ? and id = ?').bind(slug, n).first();
      if (parent) replyTo = n;
    }
  }

  const res = await env.DB.prepare(
    `insert into messages (room_slug, sender, content, reply_to_id, attachment_id, created_at)
     values (?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))`
  )
    .bind(slug, sender, content, replyTo, attachmentId)
    .run();

  const id = res.meta && res.meta.last_row_id;
  const row = await env.DB.prepare(
    `select m.*, a.filename as att_filename, a.mime_type as att_mime_type, a.size as att_size
       from messages m
       left join attachments a on a.id = m.attachment_id
      where m.id = ?`
  )
    .bind(id)
    .first();
  const messages = [decorate(row)];
  await attachReplies(env, messages, slug);
  return { message: messages[0] };
}

const DOCS_TEMPLATE = `# 🏫 껌씹는 AI 일진방 API 사용법

일진대장 1명과 여러 AI 일진(및 피클 부대장)이 학교 방(Room)별로 협업하는 경량 회의실입니다.
AI 는 아래 API 로 사람처럼 읽고 쓸 수 있습니다. (Antigravity, Claude Code, Codex, GPT, 피클 모두 동일)

## 참여자(역할)
| 이름 | 역할 | 이모지 |
| --- | --- | --- |
__AGENTS_TABLE__

이름은 자유롭게 쓰셔도 됩니다. 목록에 없는 이름은 '참여자' 배지로 표시됩니다.

## 접속 정보
- BASE URL: __BASE__
- API KEY: __KEY__
- 인증 헤더: Authorization: Bearer __KEY__  (또는 X-Room-Key: __KEY__)
- 방(slug): __ROOMS__

## 1) 방 목록
curl -s -H "Authorization: Bearer __KEY__" "__BASE__/api/rooms"

## 2) 메시지 읽기
# after 를 생략하면 최근 메시지(기본 50건, 오래된 순)를 돌려줍니다.
curl -s -H "Authorization: Bearer __KEY__" "__BASE__/api/rooms/__FIRST_ROOM__/messages?limit=50"

# 마지막으로 본 id 이후의 새 메시지만 (폴링용)
curl -s -H "Authorization: Bearer __KEY__" "__BASE__/api/rooms/__FIRST_ROOM__/messages?after=12&limit=50"

## 3) 메시지 보내기
curl -s -X POST "__BASE__/api/rooms/__FIRST_ROOM__/messages" \\
  -H "Authorization: Bearer __KEY__" \\
  -H "Content-Type: application/json" \\
  -d '{"sender":"Dev","content":"배포 스크립트 점검 끝났습니다.","reply_to_id":12}'

- sender: 참여자 이름(24자 이내). 목록에 없는 이름은 '참여자' 배지로 표시됩니다.
- content: 1~4000자. 줄바꿈, **굵게**, \`코드\`, 목록(- ), 링크, @멘션이 화면에서 렌더링됩니다.
- reply_to_id: 선택. 답글 대상 메시지 id.

## 응답 예시
{"ok":true,"room":{"slug":"general","name":"종합"},
 "messages":[{"id":13,"sender":"Dev","role":"개발 · 자동화","content":"...",
              "reply_to_id":12,"reply_to":{"id":12,"sender":"CEO","content":"..."},
              "created_at":"2026-01-01T02:50:11.412Z"}],
 "latest_id":13}

- created_at 은 UTC(ISO8601)이고 화면에는 한국 시간으로 표시됩니다.
- 다음 폴링은 마지막으로 받은 id 를 after 로 넘기면 됩니다.

## 그 밖의 엔드포인트
- POST /api/mailbox — 피클 부대장 우편함 명령 전달 (body: {"sender":"피클 부대장","command":"...","room":"inbox"})
- GET /api/mailbox — 일진우편함 최근 명령·결과 조회
- GET /api/agents — 참여자 목록
- GET /api/attachments/:id — 첨부 이미지/파일 조회 (인증 필요, ?key= 지원)
- GET /api/docs?format=json — 이 안내의 JSON 버전
- GET /api/health — 상태 확인(인증 불필요)

(참고: POST /api/rooms/:slug/messages 본문에 attachment: { filename, mime_type, data_base64 } 를 넣으면 약 700KB 이하 파일을 함께 첨부할 수 있습니다.)

## 주의
- 메시지는 회의실 DB 에 남고 참여자 모두가 읽습니다.
- API KEY 는 외부에 공개하지 마세요.
- HTTP 클라이언트가 기본 User-Agent(python-urllib 등)를 쓰면 Cloudflare 가 403으로 막는 경우가 있습니다.
  "User-Agent: ai-team-room-agent/1.0" 처럼 UA 를 지정하세요. (curl 기본 UA 는 정상 동작)
`;

async function docsText(env, url) {
  const list = await roomList(env);
  const rooms = list.map((r) => `${r.slug}(${r.name})`).join(', ') || '(방 없음)';
  const firstRoom = list[0];
  const table = Object.entries(AGENTS)
    .map(([name, m]) => `| ${name} | ${m.role} | ${m.emoji} |`)
    .join('\n');
  return DOCS_TEMPLATE
    .replaceAll('__AGENTS_TABLE__', table)
    .replaceAll('__BASE__', url.origin)
    .replaceAll('__KEY__', env.API_KEY || '(API_KEY 미설정)')
    .replaceAll('__ROOMS__', rooms)
    .replaceAll('__FIRST_ROOM__', firstRoom ? firstRoom.slug : 'general');
}

async function handleApi(request, env, url) {
  const parts = url.pathname.split('/').filter(Boolean); // ['api', ...]
  const method = request.method.toUpperCase();

  if (parts[1] === 'health') {
    let dbOk = false;
    try {
      const r = await env.DB.prepare('select 1 as ok').first();
      dbOk = !!(r && Number(r.ok) === 1);
    } catch (e) {
      dbOk = false;
    }
    return json({ ok: dbOk, service: 'ai-team-room', db: dbOk, time: new Date().toISOString() });
  }

  // ✍️ DocuSeal 전자서명 완료 웹훅 (/api/webhooks/docuseal — 외부 DocuSeal 서버에서 호출)
  if (parts[1] === 'webhooks' && parts[2] === 'docuseal' && method === 'POST') {
    if (env.DOCUSEAL_WEBHOOK_SECRET) {
      const sig = request.headers.get('x-docuseal-secret') || request.headers.get('authorization') || '';
      if (!same(sig.replace(/^bearer\s+/i, '').trim(), env.DOCUSEAL_WEBHOOK_SECRET)) {
        return json({ ok: false, error: 'unauthorized' }, 401);
      }
    }
    let body;
    try { body = await request.json(); } catch (e) { return json({ ok: false, error: 'invalid_json' }, 400); }
    const evType = String((body && body.event_type) || '');
    const d = (body && body.data) || {};
    const subId = String(d.submission_id || d.id || (d.submission && d.submission.id) || '');
    const extId = String(d.external_id || (d.submission && d.submission.external_id) || '');
    const docs = Array.isArray(d.documents) ? d.documents : [];
    const signedUrl = (docs[0] && docs[0].url) || d.audit_log_url || '';

    if (evType === 'form.completed' || evType === 'submission.completed') {
      try {
        await env.DB.prepare(
          `create table if not exists contracts (
             id integer primary key autoincrement, client_id integer, proposal_id integer,
             contract_no text not null default '', client_name text not null default '',
             title text not null default '', status text not null default '초안',
             total_amount integer not null default 0, data_json text not null default '{}',
             created_at text not null, updated_at text not null
           )`
        ).run();
        const rows = await env.DB.prepare('select * from contracts order by id desc limit 100').all();
        const target = (rows.results || []).find((r) => {
          if (extId && String(r.id) === extId.replace(/^contract-/, '')) return true;
          try {
            const parsed = JSON.parse(r.data_json || '{}');
            return subId && parsed.docuseal && String(parsed.docuseal.submission_id) === subId;
          } catch (e) { return false; }
        });
        if (target) {
          let dj = {};
          try { dj = JSON.parse(target.data_json || '{}'); } catch (e) { dj = {}; }
          dj.status = '서명완료';
          dj.docuseal = Object.assign({}, dj.docuseal || {}, {
            status: 'completed',
            completed_at: new Date().toISOString(),
            signed_url: signedUrl || (dj.docuseal && dj.docuseal.signed_url) || '',
          });
          await env.DB.prepare('update contracts set status = ?, data_json = ?, updated_at = ? where id = ?')
            .bind('서명완료', JSON.stringify(dj), new Date().toISOString(), target.id)
            .run();
        }
      } catch (e) {}
    }
    return json({ ok: true, received: evType || 'ok' });
  }

  // 🎯 공개 실시간 DB(리드) 수집 웹훅 (/api/leads/capture — Typebot/랜딩/네이버폼 연동)
  if (parts[1] === 'leads' && parts[2] === 'capture' && method === 'POST') {
    let p;
    try { p = await request.json(); } catch (e) { return json({ ok: false, error: 'invalid_json' }, 400); }
    const token = String((p && (p.token || p.portal_token)) || url.searchParams.get('token') || '').trim();
    let clientId = parsePortalToken(env, token);
    if (!clientId && authorized(request, env, url) && p && p.client_id) {
      clientId = parseInt(p.client_id, 10);
    }
    if (!clientId) {
      return json({ ok: false, error: 'unauthorized', message: '유효한 고객사 포털 토큰(token)이 필요합니다.' }, 401);
    }
    await env.DB.batch([
      env.DB.prepare(
        `create table if not exists leads (
           id integer primary key autoincrement, client_id integer not null, client_name text not null default '',
           source text not null default '랜딩/퍼널', lead_name text not null default '', lead_phone text not null default '',
           lead_note text not null default '', ad_spend integer not null default 0, est_value integer not null default 0,
           status text not null default '신규', created_at text not null
         )`
      ),
    ]);
    const client = await env.DB.prepare('select id, name, db_count from clients where id = ?').bind(clientId).first();
    if (!client) return json({ ok: false, error: 'client_not_found' }, 404);
    const now = new Date().toISOString();
    const leadName = String(p.lead_name || p.name || '신규 문의자').trim();
    const leadPhone = String(p.lead_phone || p.phone || p.contact || '').trim();
    const leadNote = String(p.lead_note || p.note || p.message || '').trim();
    const source = String(p.source || p.channel || '랜딩/퍼널').trim();
    const res = await env.DB.prepare(
      `insert into leads (client_id, client_name, source, lead_name, lead_phone, lead_note, ad_spend, est_value, status, created_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, '신규', ?)`
    ).bind(
      client.id, client.name, source, leadName, leadPhone, leadNote,
      Math.max(0, Number(p.ad_spend || 0)), Math.max(0, Number(p.est_value || 0)), now
    ).run();
    // 고객사 DB 카운트 자동 +1
    await env.DB.prepare('update clients set db_count = db_count + 1, updated_at = ? where id = ?')
      .bind(now, client.id).run();
    // #일진선도부(ops) 방에 실시간 DB 유입 알림 자동 발송
    try {
      await postMessage(env, 'ops', {
        sender: 'CS 딸랑이',
        content: `🎯 **[실시간 DB 유입]** **${client.name}**\n- 문의자: ${leadName}${leadPhone ? ' (' + leadPhone + ')' : ''}\n- 유입경로: ${source}${leadNote ? '\n- 문의내용: ' + leadNote : ''}\n- 누적 DB: ${Number(client.db_count || 0) + 1}건`,
      });
    } catch (e) {}
    return json({ ok: true, lead_id: res.meta.last_row_id, db_count: Number(client.db_count || 0) + 1 }, 201);
  }

  // 🌟 고객 전용 화이트라벨 VIP 포털 공개 API (/api/portal/:token)
  if (parts[1] === 'portal' && parts.length >= 3) {
    const token = decodeURIComponent(parts[2]);
    const clientId = parsePortalToken(env, token);
    if (!clientId) {
      return json({ ok: false, error: 'invalid_token', message: '유효하지 않은 고객 포털 링크입니다.' }, 401);
    }
    await env.DB.batch([
      env.DB.prepare(
        `create table if not exists leads (
           id integer primary key autoincrement, client_id integer not null, client_name text not null default '',
           source text not null default '랜딩/퍼널', lead_name text not null default '', lead_phone text not null default '',
           lead_note text not null default '', ad_spend integer not null default 0, est_value integer not null default 0,
           status text not null default '신규', created_at text not null
         )`
      ),
      env.DB.prepare(
        `create table if not exists deliverables (
           id integer primary key autoincrement, client_id integer not null, channel text not null default '네이버 블로그',
           title text not null default '', preview_text text not null default '', scheduled_date text not null default '',
           status text not null default '검수대기', client_feedback text not null default '',
           created_at text not null, updated_at text not null
         )`
      ),
    ]);

    if (parts.length === 3 && method === 'GET') {
      const client = await env.DB.prepare('select * from clients where id = ?').bind(clientId).first();
      if (!client) return json({ ok: false, error: 'not_found' }, 404);
      const profRow = await env.DB.prepare('select v from kv_store where k = ?').bind('agency_profile').first();
      const rawProf = profRow ? JSON.parse(profRow.v || '{}') : {};
      const agency = { company: rawProf.company || '미담공장', ceo: rawProf.ceo || '', phone: rawProf.phone || '', email: rawProf.email || '' };
      const leadsRes = await env.DB.prepare('select * from leads where client_id = ? order by id desc limit 50').bind(clientId).all();
      const delivRes = await env.DB.prepare('select * from deliverables where client_id = ? order by id desc limit 30').bind(clientId).all();
      const snsRes = await env.DB.prepare('select * from sns_reports where client_id = ? or client_name = ? order by id desc limit 6').bind(clientId, client.name).all();
      const contRes = await env.DB.prepare('select id, contract_no, title, status, total_amount, created_at from contracts where client_id = ? or client_name = ? order by id desc limit 5').bind(clientId, client.name).all();
      return json({
        ok: true,
        agency,
        client: {
          id: client.id,
          name: client.name,
          industry: client.industry,
          contact_name: client.contact_name,
          services: JSON.parse(client.services_json || '[]'),
          funnel_stage: client.funnel_stage,
          monthly_fee: Number(client.monthly_fee || 0),
          db_count: Number(client.db_count || 0),
          db_goal: Number(client.db_goal || 0),
          blog_url: client.blog_url,
          insta_handle: client.insta_handle,
        },
        leads: leadsRes.results || [],
        deliverables: delivRes.results || [],
        sns_reports: (snsRes.results || []).map((r) => ({ id: r.id, period: r.period, data: JSON.parse(r.data_json || '{}'), updated_at: r.updated_at })),
        contracts: contRes.results || [],
      });
    }

    // 고객 포털에서 콘텐츠 승인 / 수정 요청 제출
    if (parts.length === 5 && parts[3] === 'deliverables' && method === 'POST') {
      const did = parseInt(parts[4], 10);
      if (!Number.isFinite(did) || did <= 0) return json({ ok: false, error: 'invalid_id' }, 400);
      let p;
      try { p = await request.json(); } catch (e) { return json({ ok: false, error: 'invalid_json' }, 400); }
      const item = await env.DB.prepare('select * from deliverables where id = ? and client_id = ?').bind(did, clientId).first();
      if (!item) return json({ ok: false, error: 'not_found' }, 404);
      const nextStatus = p.status === '수정요청' ? '수정요청' : '승인완료';
      const fb = String(p.feedback || '').trim();
      const now = new Date().toISOString();
      await env.DB.prepare('update deliverables set status = ?, client_feedback = ?, updated_at = ? where id = ?')
        .bind(nextStatus, fb, now, did).run();
      const client = await env.DB.prepare('select name from clients where id = ?').bind(clientId).first();
      try {
        await postMessage(env, 'ops', {
          sender: 'CS 딸랑이',
          content: `🌟 **[VIP 포털 고객 컨펌]** **${client ? client.name : ''}**\n- 콘텐츠: [${item.channel}] ${item.title}\n- 결과: **${nextStatus}**${fb ? '\n- 고객 피드백: ' + fb : ''}`,
        });
      } catch (e) {}
      return json({ ok: true, status: nextStatus, feedback: fb });
    }
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  if (!authorized(request, env, url)) {
    return json(
      { ok: false, error: 'unauthorized', message: 'API 키가 필요합니다. Authorization: Bearer <API_KEY>' },
      401
    );
  }

  if (parts[1] === 'docs' || parts[1] === 'guide') {
    if ((url.searchParams.get('format') || '') === 'json') {
      const rooms = await roomList(env);
      return json({
        ok: true,
        name: '껌씹는 Ai 모여라 API',
        base_url: url.origin,
        auth: 'Authorization: Bearer <API_KEY> (또는 X-Room-Key: <API_KEY>)',
        rooms: rooms.map((r) => ({ slug: r.slug, name: r.name })),
        agents: Object.entries(AGENTS).map(([name, m]) => ({ name, role: m.role, color: m.color, emoji: m.emoji })),
        endpoints: [
          { method: 'GET', path: '/api/rooms', note: '방 목록' },
          { method: 'GET', path: '/api/rooms/:slug/messages?after=<id>&limit=50', note: '메시지 조회' },
          {
            method: 'POST',
            path: '/api/rooms/:slug/messages',
            body: { sender: 'Dev', content: '안녕하세요', reply_to_id: 12 },
            note: '메시지 전송',
          },
          { method: 'GET', path: '/api/agents', note: '참여자 목록' },
          { method: 'GET', path: '/api/health', note: '상태 확인(인증 불필요)' },
        ],
        note: 'python-urllib 등 기본 User-Agent 는 Cloudflare 가 403으로 막는 경우가 있습니다. UA 를 지정하세요.',
      });
    }
    return text(await docsText(env, url));
  }

  if (parts[1] === 'agents' && method === 'GET') {
    return json({
      ok: true,
      agents: Object.entries(AGENTS).map(([name, m]) => ({ name, role: m.role, color: m.color, emoji: m.emoji })),
    });
  }

  if (parts[1] === 'attachments' && parts.length === 3 && method === 'GET') {
    const id = parseInt(parts[2], 10);
    if (!Number.isFinite(id) || id <= 0) {
      return json({ ok: false, error: 'invalid_id' }, 400);
    }
    const row = await env.DB.prepare('select filename, mime_type, data_base64 from attachments where id = ?')
      .bind(id)
      .first();
    if (!row) return json({ ok: false, error: 'not_found' }, 404);
    const bin = atob(row.data_base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const mime = row.mime_type || 'application/octet-stream';
    const isInline = mime.startsWith('image/');
    const disp = (isInline ? 'inline' : 'attachment') + "; filename*=UTF-8''" + encodeURIComponent(row.filename || 'file');
    return new Response(bytes, {
      status: 200,
      headers: {
        'content-type': mime,
        'content-disposition': disp,
        'cache-control': 'private, max-age=86400',
        ...CORS,
      },
    });
  }

// 마케팅 에이전시 워크스페이스(CRM · SNS분석 · 제안서 · 계약서) 테이블 자동 보장
async function ensureAgencyTables(env) {
  await env.DB.batch([
    env.DB.prepare(
      `create table if not exists kv_store (
         k text primary key,
         v text not null,
         updated_at text not null
       )`
    ),
    env.DB.prepare(
      `create table if not exists clients (
         id integer primary key autoincrement,
         name text not null,
         industry text not null default '자영업/소상공인',
         contact_name text not null default '',
         contact_phone text not null default '',
         services_json text not null default '[]',
         funnel_stage text not null default '신규문의',
         monthly_fee integer not null default 0,
         db_count integer not null default 0,
         db_goal integer not null default 0,
         blog_url text not null default '',
         insta_handle text not null default '',
         memo text not null default '',
         ai_notes_json text not null default '[]',
         created_at text not null,
         updated_at text not null
       )`
    ),
    env.DB.prepare(
      `create table if not exists sns_reports (
         id integer primary key autoincrement,
         client_id integer,
         client_name text not null default '',
         period text not null default '',
         data_json text not null default '{}',
         created_at text not null,
         updated_at text not null
       )`
    ),
    env.DB.prepare(
      `create table if not exists proposals (
         id integer primary key autoincrement,
         client_id integer,
         client_name text not null default '',
         industry text not null default '',
         title text not null default '',
         status text not null default '작성중',
         total_amount integer not null default 0,
         data_json text not null default '{}',
         created_at text not null,
         updated_at text not null
       )`
    ),
    env.DB.prepare(
      `create table if not exists contracts (
         id integer primary key autoincrement,
         client_id integer,
         proposal_id integer,
         contract_no text not null default '',
         client_name text not null default '',
         title text not null default '',
         status text not null default '초안',
         total_amount integer not null default 0,
         data_json text not null default '{}',
         created_at text not null,
         updated_at text not null
       )`
    ),
    env.DB.prepare(
      `create table if not exists portfolios (
         id integer primary key autoincrement,
         title text not null default '',
         theme text not null default 'obsidian-gold',
         data_json text not null default '{}',
         created_at text not null,
         updated_at text not null
       )`
    ),
    env.DB.prepare(
      `create table if not exists leads (
         id integer primary key autoincrement,
         client_id integer not null,
         client_name text not null default '',
         source text not null default '랜딩/퍼널',
         lead_name text not null default '',
         lead_phone text not null default '',
         lead_note text not null default '',
         ad_spend integer not null default 0,
         est_value integer not null default 0,
         status text not null default '신규',
         created_at text not null
       )`
    ),
    env.DB.prepare(
      `create table if not exists deliverables (
         id integer primary key autoincrement,
         client_id integer not null,
         channel text not null default '네이버 블로그',
         title text not null default '',
         preview_text text not null default '',
         scheduled_date text not null default '',
         status text not null default '검수대기',
         client_feedback text not null default '',
         created_at text not null,
         updated_at text not null
       )`
    ),
  ]);
}

function safeParseJson(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function formatClientRow(r, env) {
  if (!r) return null;
  return {
    id: r.id,
    portal_token: env ? makePortalToken(env, r.id) : '',
    name: r.name,
    industry: r.industry || '자영업/소상공인',
    contact_name: r.contact_name || '',
    contact_phone: r.contact_phone || '',
    services: safeParseJson(r.services_json, []),
    funnel_stage: r.funnel_stage || '신규문의',
    monthly_fee: Number(r.monthly_fee || 0),
    db_count: Number(r.db_count || 0),
    db_goal: Number(r.db_goal || 0),
    blog_url: r.blog_url || '',
    insta_handle: r.insta_handle || '',
    memo: r.memo || '',
    ai_notes: safeParseJson(r.ai_notes_json, []),
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function formatDocRow(r) {
  if (!r) return null;
  const out = Object.assign({}, r, { data: safeParseJson(r.data_json, {}) });
  delete out.data_json;
  return out;
}

  // 🧠 브레인 전체 내보내기(export) 및 덮어쓰기/병합 복원(import)
  if (parts[1] === 'brain' && parts.length === 3) {
    await ensureAgencyTables(env);

    if (parts[2] === 'export' && method === 'GET') {
      const rooms = await roomList(env);
      const msgsRes = await env.DB.prepare(
        `select id, room_slug, sender, content, reply_to_id, created_at from messages order by id asc`
      ).all();
      const kvRes = await env.DB.prepare(
        `select k, v, updated_at from kv_store where k in ('prompts', 'integrations', 'agency_profile', 'agent_souls')`
      ).all();
      const clientsRes = await env.DB.prepare('select * from clients order by id asc').all();
      const snsRes = await env.DB.prepare('select * from sns_reports order by id asc').all();
      const propRes = await env.DB.prepare('select * from proposals order by id asc').all();
      const contRes = await env.DB.prepare('select * from contracts order by id asc').all();
      const portRes = await env.DB.prepare('select * from portfolios order by id asc').all();
      const kv = {};
      for (const r of kvRes.results || []) {
        try { kv[r.k] = JSON.parse(r.v); } catch (e) { kv[r.k] = null; }
      }
      // 브레인 백업 파일에는 외부 API 키(DocuSeal)를 제외해 보안 유지
      const safeProfile = kv.agency_profile ? Object.assign({}, kv.agency_profile) : null;
      if (safeProfile && safeProfile.docusealApiKey) delete safeProfile.docusealApiKey;
      return json({
        ok: true,
        brain: {
          version: '2.1',
          service: '껌씹는 AI 일진방',
          exported_at: new Date().toISOString(),
          rooms: rooms.map((r) => ({ slug: r.slug, name: r.name, description: r.description, position: r.position })),
          messages: msgsRes.results || [],
          prompts: kv.prompts || null,
          integrations: kv.integrations || null,
          agency_profile: safeProfile,
          agent_souls: kv.agent_souls || null,
          clients: (clientsRes.results || []).map((r) => formatClientRow(r, env)),
          sns_reports: (snsRes.results || []).map(formatDocRow),
          proposals: (propRes.results || []).map(formatDocRow),
          contracts: (contRes.results || []).map(formatDocRow),
          portfolios: (portRes.results || []).map(formatDocRow),
        },
      });
    }

    if (parts[2] === 'import' && method === 'POST') {
      let payload;
      try { payload = await request.json(); } catch (e) {
        return json({ ok: false, error: 'invalid_json', message: '유효한 브레인 JSON 파일이 필요합니다.' }, 400);
      }
      const brain = payload && (payload.brain || payload);
      const mode = payload && payload.mode === 'replace' ? 'replace' : 'merge';
      if (!brain || typeof brain !== 'object') {
        return json({ ok: false, error: 'invalid_brain', message: '브레인 데이터 형식이 올바르지 않습니다.' }, 400);
      }
      let restoredRooms = 0, restoredMsgs = 0;
      if (Array.isArray(brain.rooms)) {
        for (const r of brain.rooms) {
          if (!r || !r.slug) continue;
          await env.DB.prepare(
            `insert into rooms (slug, name, description, position) values (?, ?, ?, ?)
             on conflict(slug) do update set name = excluded.name, description = excluded.description, position = excluded.position`
          ).bind(String(r.slug), String(r.name || r.slug), String(r.description || ''), Number(r.position || 0)).run();
          restoredRooms++;
        }
      }
      for (const kvKey of ['prompts', 'integrations', 'agency_profile', 'agent_souls']) {
        if (brain[kvKey] !== undefined && brain[kvKey] !== null) {
          await env.DB.prepare(
            `insert into kv_store (k, v, updated_at) values (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
             on conflict(k) do update set v = excluded.v, updated_at = excluded.updated_at`
          ).bind(kvKey, JSON.stringify(brain[kvKey])).run();
        }
      }
      if (Array.isArray(brain.messages)) {
        if (mode === 'replace') {
          await env.DB.prepare('delete from messages').run();
        }
        for (const m of brain.messages) {
          if (!m || !m.room_slug || !m.sender) continue;
          const exists = mode === 'merge' && m.id
            ? await env.DB.prepare('select id from messages where id = ?').bind(Number(m.id)).first()
            : null;
          if (!exists) {
            await env.DB.prepare(
              `insert into messages (room_slug, sender, content, reply_to_id, created_at) values (?, ?, ?, ?, ?)`
            ).bind(
              String(m.room_slug),
              String(m.sender),
              String(m.content || ''),
              m.reply_to_id ? Number(m.reply_to_id) : null,
              String(m.created_at || new Date().toISOString())
            ).run();
            restoredMsgs++;
          }
        }
      }
      // 마케팅 에이전시 워크스페이스 데이터(고객사·SNS분석·제안서·계약서) 복원
      const nowIso = new Date().toISOString();
      if (Array.isArray(brain.clients)) {
        if (mode === 'replace') await env.DB.prepare('delete from clients').run();
        for (const c of brain.clients) {
          if (!c || !c.name) continue;
          const ex = mode === 'merge' && c.id
            ? await env.DB.prepare('select id from clients where id = ?').bind(Number(c.id)).first()
            : null;
          if (!ex) {
            await env.DB.prepare(
              `insert into clients (name, industry, contact_name, contact_phone, services_json, funnel_stage, monthly_fee, db_count, db_goal, blog_url, insta_handle, memo, ai_notes_json, created_at, updated_at)
               values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              String(c.name), String(c.industry || '자영업/소상공인'), String(c.contact_name || ''),
              String(c.contact_phone || ''), JSON.stringify(c.services || []), String(c.funnel_stage || '신규문의'),
              Number(c.monthly_fee || 0), Number(c.db_count || 0), Number(c.db_goal || 0),
              String(c.blog_url || ''), String(c.insta_handle || ''), String(c.memo || ''),
              JSON.stringify(c.ai_notes || []), String(c.created_at || nowIso), String(c.updated_at || nowIso)
            ).run();
          }
        }
      }
      if (Array.isArray(brain.sns_reports)) {
        if (mode === 'replace') await env.DB.prepare('delete from sns_reports').run();
        for (const s of brain.sns_reports) {
          if (!s) continue;
          const ex = mode === 'merge' && s.id
            ? await env.DB.prepare('select id from sns_reports where id = ?').bind(Number(s.id)).first()
            : null;
          if (!ex) {
            await env.DB.prepare(
              `insert into sns_reports (client_id, client_name, period, data_json, created_at, updated_at)
               values (?, ?, ?, ?, ?, ?)`
            ).bind(
              s.client_id ? Number(s.client_id) : null, String(s.client_name || ''), String(s.period || ''),
              JSON.stringify(s.data || {}), String(s.created_at || nowIso), String(s.updated_at || nowIso)
            ).run();
          }
        }
      }
      if (Array.isArray(brain.proposals)) {
        if (mode === 'replace') await env.DB.prepare('delete from proposals').run();
        for (const p of brain.proposals) {
          if (!p) continue;
          const ex = mode === 'merge' && p.id
            ? await env.DB.prepare('select id from proposals where id = ?').bind(Number(p.id)).first()
            : null;
          if (!ex) {
            await env.DB.prepare(
              `insert into proposals (client_id, client_name, industry, title, status, total_amount, data_json, created_at, updated_at)
               values (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              p.client_id ? Number(p.client_id) : null, String(p.client_name || ''), String(p.industry || ''),
              String(p.title || ''), String(p.status || '작성중'), Number(p.total_amount || 0),
              JSON.stringify(p.data || {}), String(p.created_at || nowIso), String(p.updated_at || nowIso)
            ).run();
          }
        }
      }
      if (Array.isArray(brain.contracts)) {
        if (mode === 'replace') await env.DB.prepare('delete from contracts').run();
        for (const ct of brain.contracts) {
          if (!ct) continue;
          const ex = mode === 'merge' && ct.id
            ? await env.DB.prepare('select id from contracts where id = ?').bind(Number(ct.id)).first()
            : null;
          if (!ex) {
            await env.DB.prepare(
              `insert into contracts (client_id, proposal_id, contract_no, client_name, title, status, total_amount, data_json, created_at, updated_at)
               values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              ct.client_id ? Number(ct.client_id) : null, ct.proposal_id ? Number(ct.proposal_id) : null,
              String(ct.contract_no || ''), String(ct.client_name || ''), String(ct.title || ''),
              String(ct.status || '초안'), Number(ct.total_amount || 0),
              JSON.stringify(ct.data || {}), String(ct.created_at || nowIso), String(ct.updated_at || nowIso)
            ).run();
          }
        }
      }
      if (Array.isArray(brain.portfolios)) {
        if (mode === 'replace') await env.DB.prepare('delete from portfolios').run();
        for (const pf of brain.portfolios) {
          if (!pf) continue;
          const ex = mode === 'merge' && pf.id
            ? await env.DB.prepare('select id from portfolios where id = ?').bind(Number(pf.id)).first()
            : null;
          if (!ex) {
            await env.DB.prepare(
              `insert into portfolios (title, theme, data_json, created_at, updated_at) values (?, ?, ?, ?, ?)`
            ).bind(
              String(pf.title || '회사 포트폴리오'), String(pf.theme || 'obsidian-gold'),
              JSON.stringify(pf.data || {}), String(pf.created_at || nowIso), String(pf.updated_at || nowIso)
            ).run();
          }
        }
      }
      return json({ ok: true, mode, restored_rooms: restoredRooms, restored_messages: restoredMsgs });
    }
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  // 🧬 AI 인격체별 SOUL.md · MEMORY.md 저장/조회 (/api/souls)
  if (parts[1] === 'souls' && parts.length === 2) {
    await ensureAgencyTables(env);
    if (method === 'GET') {
      const row = await env.DB.prepare('select v, updated_at from kv_store where k = ?').bind('agent_souls').first();
      return json({ ok: true, data: row ? safeParseJson(row.v, null) : null, updated_at: row ? row.updated_at : null });
    }
    if (method === 'POST' || method === 'PUT') {
      let payload;
      try { payload = await request.json(); } catch (e) {
        return json({ ok: false, error: 'invalid_json', message: 'JSON 본문이 필요합니다.' }, 400);
      }
      const serialized = JSON.stringify(payload || {});
      if (serialized.length > 900000) {
        return json({ ok: false, error: 'too_large', message: 'SOUL/MEMORY 용량은 900KB 이하만 가능합니다.' }, 413);
      }
      await env.DB.prepare(
        `insert into kv_store (k, v, updated_at) values ('agent_souls', ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
         on conflict(k) do update set v = excluded.v, updated_at = excluded.updated_at`
      ).bind(serialized).run();
      return json({ ok: true, data: payload });
    }
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  // 🎨 회사 포트폴리오 CRUD (/api/portfolios, /api/portfolios/:id)
  if (parts[1] === 'portfolios') {
    await ensureAgencyTables(env);
    if (parts.length === 2 && method === 'GET') {
      const res = await env.DB.prepare('select * from portfolios order by updated_at desc, id desc').all();
      return json({ ok: true, portfolios: (res.results || []).map(formatDocRow) });
    }
    if (parts.length === 2 && method === 'POST') {
      let p;
      try { p = await request.json(); } catch (e) { return json({ ok: false, error: 'invalid_json' }, 400); }
      const now = new Date().toISOString();
      const serialized = JSON.stringify(p.data || {});
      if (serialized.length > 1400000) {
        return json({ ok: false, error: 'too_large', message: '포트폴리오 이미지 포함 용량이 너무 큽니다. 이미지를 줄여주세요.' }, 413);
      }
      const res = await env.DB.prepare(
        `insert into portfolios (title, theme, data_json, created_at, updated_at) values (?, ?, ?, ?, ?)`
      ).bind(
        String(p.title || '미담공장 회사소개서 & 포트폴리오').trim(),
        String(p.theme || 'obsidian-gold').trim(),
        serialized,
        now,
        now
      ).run();
      const row = await env.DB.prepare('select * from portfolios where id = ?').bind(res.meta.last_row_id).first();
      return json({ ok: true, portfolio: formatDocRow(row) }, 201);
    }
    if (parts.length === 3) {
      const id = parseInt(parts[2], 10);
      if (!Number.isFinite(id) || id <= 0) return json({ ok: false, error: 'invalid_id' }, 400);
      const existing = await env.DB.prepare('select * from portfolios where id = ?').bind(id).first();
      if (!existing) return json({ ok: false, error: 'not_found' }, 404);
      if (method === 'PATCH' || method === 'PUT') {
        let p;
        try { p = await request.json(); } catch (e) { return json({ ok: false, error: 'invalid_json' }, 400); }
        const cur = formatDocRow(existing);
        const now = new Date().toISOString();
        const serialized = JSON.stringify(p.data !== undefined ? p.data : cur.data);
        if (serialized.length > 1400000) {
          return json({ ok: false, error: 'too_large', message: '포트폴리오 용량이 너무 큽니다.' }, 413);
        }
        await env.DB.prepare(
          `update portfolios set title=?, theme=?, data_json=?, updated_at=? where id=?`
        ).bind(
          String(p.title !== undefined ? p.title : cur.title).trim(),
          String(p.theme !== undefined ? p.theme : cur.theme).trim(),
          serialized,
          now,
          id
        ).run();
        const updated = await env.DB.prepare('select * from portfolios where id = ?').bind(id).first();
        return json({ ok: true, portfolio: formatDocRow(updated) });
      }
      if (method === 'DELETE') {
        await env.DB.prepare('delete from portfolios where id = ?').bind(id).run();
        return json({ ok: true, deleted_id: id });
      }
    }
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  // 🎯 리드(DB) 목록 관리 (/api/leads)
  if (parts[1] === 'leads') {
    await ensureAgencyTables(env);
    if (parts.length === 2 && method === 'GET') {
      const cid = parseInt(url.searchParams.get('client_id') || '0', 10);
      const res = cid > 0
        ? await env.DB.prepare('select * from leads where client_id = ? order by id desc limit 100').bind(cid).all()
        : await env.DB.prepare('select * from leads order by id desc limit 100').all();
      return json({ ok: true, leads: res.results || [] });
    }
    if (parts.length === 3 && method === 'DELETE') {
      const id = parseInt(parts[2], 10);
      await env.DB.prepare('delete from leads where id = ?').bind(id).run();
      return json({ ok: true, deleted_id: id });
    }
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  // ✅ VIP 포털 콘텐츠 검수 항목 CRUD (/api/deliverables)
  if (parts[1] === 'deliverables') {
    await ensureAgencyTables(env);
    if (parts.length === 2 && method === 'GET') {
      const cid = parseInt(url.searchParams.get('client_id') || '0', 10);
      const res = cid > 0
        ? await env.DB.prepare('select * from deliverables where client_id = ? order by id desc limit 50').bind(cid).all()
        : await env.DB.prepare('select * from deliverables order by id desc limit 100').all();
      return json({ ok: true, deliverables: res.results || [] });
    }
    if (parts.length === 2 && method === 'POST') {
      let p;
      try { p = await request.json(); } catch (e) { return json({ ok: false, error: 'invalid_json' }, 400); }
      const cid = parseInt(p && p.client_id, 10);
      const title = String((p && p.title) || '').trim();
      if (!cid || !title) return json({ ok: false, error: 'invalid_request', message: '고객사와 콘텐츠 제목이 필요합니다.' }, 400);
      const now = new Date().toISOString();
      const res = await env.DB.prepare(
        `insert into deliverables (client_id, channel, title, preview_text, scheduled_date, status, client_feedback, created_at, updated_at)
         values (?, ?, ?, ?, ?, '검수대기', '', ?, ?)`
      ).bind(
        cid, String(p.channel || '네이버 블로그').trim(), title,
        String(p.preview_text || '').trim(), String(p.scheduled_date || '').trim(), now, now
      ).run();
      const row = await env.DB.prepare('select * from deliverables where id = ?').bind(res.meta.last_row_id).first();
      return json({ ok: true, deliverable: row }, 201);
    }
    if (parts.length === 3 && method === 'DELETE') {
      const id = parseInt(parts[2], 10);
      await env.DB.prepare('delete from deliverables where id = ?').bind(id).run();
      return json({ ok: true, deleted_id: id });
    }
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  // 🏢 우리 회사(을) 기본 프로필 및 직인 · DocuSeal 키 저장/조회 (/api/agency-profile)
  if (parts[1] === 'agency-profile' && parts.length === 2) {
    await ensureAgencyTables(env);
    if (method === 'GET') {
      const row = await env.DB.prepare('select v, updated_at from kv_store where k = ?').bind('agency_profile').first();
      const raw = row ? safeParseJson(row.v, null) : null;
      const safe = raw ? Object.assign({}, raw) : {};
      const keyStr = String(safe.docusealApiKey || env.DOCUSEAL_API_KEY || '').trim();
      safe.hasDocusealKey = !!keyStr;
      safe.docusealKeyHint = keyStr ? ('••••' + keyStr.slice(-4)) : '';
      delete safe.docusealApiKey;
      return json({ ok: true, data: raw || env.DOCUSEAL_API_KEY ? safe : null, updated_at: row ? row.updated_at : null });
    }
    if (method === 'POST' || method === 'PUT') {
      let payload;
      try { payload = await request.json(); } catch (e) {
        return json({ ok: false, error: 'invalid_json', message: 'JSON 본문이 필요합니다.' }, 400);
      }
      const prevRow = await env.DB.prepare('select v from kv_store where k = ?').bind('agency_profile').first();
      const prev = prevRow ? safeParseJson(prevRow.v, {}) : {};
      const merged = Object.assign({}, prev, payload || {});
      // 빈 문자열로 넘어온 경우 기존 저장된 DocuSeal API 키 유지 (명시적 삭제 flag 제외)
      if (!merged.docusealApiKey && prev.docusealApiKey && !payload.clearDocusealKey) {
        merged.docusealApiKey = prev.docusealApiKey;
      }
      delete merged.clearDocusealKey;
      delete merged.hasDocusealKey;
      delete merged.docusealKeyHint;
      const serialized = JSON.stringify(merged);
      if (serialized.length > 900000) {
        return json({ ok: false, error: 'too_large', message: '직인 포함 프로필 용량은 900KB 이하만 가능합니다.' }, 413);
      }
      await env.DB.prepare(
        `insert into kv_store (k, v, updated_at) values ('agency_profile', ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
         on conflict(k) do update set v = excluded.v, updated_at = excluded.updated_at`
      ).bind(serialized).run();
      const outSafe = Object.assign({}, merged);
      const kStr = String(outSafe.docusealApiKey || env.DOCUSEAL_API_KEY || '').trim();
      outSafe.hasDocusealKey = !!kStr;
      outSafe.docusealKeyHint = kStr ? ('••••' + kStr.slice(-4)) : '';
      delete outSafe.docusealApiKey;
      return json({ ok: true, data: outSafe });
    }
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  // 📊 고객사 CRM CRUD (/api/clients, /api/clients/:id)
  if (parts[1] === 'clients') {
    await ensureAgencyTables(env);
    if (parts.length === 2 && method === 'GET') {
      const res = await env.DB.prepare('select * from clients order by updated_at desc, id desc').all();
      return json({ ok: true, clients: (res.results || []).map((r) => formatClientRow(r, env)) });
    }
    if (parts.length === 2 && method === 'POST') {
      let p;
      try { p = await request.json(); } catch (e) {
        return json({ ok: false, error: 'invalid_json', message: 'JSON 본문이 필요합니다.' }, 400);
      }
      const name = String((p && p.name) || '').trim();
      if (!name) return json({ ok: false, error: 'invalid_request', message: '업체명을 입력하세요.' }, 400);
      const now = new Date().toISOString();
      const res = await env.DB.prepare(
        `insert into clients (name, industry, contact_name, contact_phone, services_json, funnel_stage, monthly_fee, db_count, db_goal, blog_url, insta_handle, memo, ai_notes_json, created_at, updated_at)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        name,
        String(p.industry || '자영업/소상공인').trim(),
        String(p.contact_name || '').trim(),
        String(p.contact_phone || '').trim(),
        JSON.stringify(Array.isArray(p.services) ? p.services : []),
        String(p.funnel_stage || '신규문의').trim(),
        Math.max(0, Number(p.monthly_fee || 0)),
        Math.max(0, Number(p.db_count || 0)),
        Math.max(0, Number(p.db_goal || 0)),
        String(p.blog_url || '').trim(),
        String(p.insta_handle || '').trim(),
        String(p.memo || '').trim(),
        JSON.stringify(Array.isArray(p.ai_notes) ? p.ai_notes : []),
        now,
        now
      ).run();
      const row = await env.DB.prepare('select * from clients where id = ?').bind(res.meta.last_row_id).first();
      return json({ ok: true, client: formatClientRow(row, env) }, 201);
    }
    if (parts.length === 3) {
      const id = parseInt(parts[2], 10);
      if (!Number.isFinite(id) || id <= 0) return json({ ok: false, error: 'invalid_id' }, 400);
      const existing = await env.DB.prepare('select * from clients where id = ?').bind(id).first();
      if (!existing) return json({ ok: false, error: 'not_found', message: '고객사를 찾을 수 없습니다.' }, 404);
      if (method === 'PATCH' || method === 'PUT') {
        let p;
        try { p = await request.json(); } catch (e) {
          return json({ ok: false, error: 'invalid_json' }, 400);
        }
        const cur = formatClientRow(existing, env);
        const now = new Date().toISOString();
        await env.DB.prepare(
          `update clients set name=?, industry=?, contact_name=?, contact_phone=?, services_json=?, funnel_stage=?, monthly_fee=?, db_count=?, db_goal=?, blog_url=?, insta_handle=?, memo=?, ai_notes_json=?, updated_at=? where id=?`
        ).bind(
          String(p.name !== undefined ? p.name : cur.name).trim() || cur.name,
          String(p.industry !== undefined ? p.industry : cur.industry).trim(),
          String(p.contact_name !== undefined ? p.contact_name : cur.contact_name).trim(),
          String(p.contact_phone !== undefined ? p.contact_phone : cur.contact_phone).trim(),
          JSON.stringify(Array.isArray(p.services) ? p.services : cur.services),
          String(p.funnel_stage !== undefined ? p.funnel_stage : cur.funnel_stage).trim(),
          Math.max(0, Number(p.monthly_fee !== undefined ? p.monthly_fee : cur.monthly_fee)),
          Math.max(0, Number(p.db_count !== undefined ? p.db_count : cur.db_count)),
          Math.max(0, Number(p.db_goal !== undefined ? p.db_goal : cur.db_goal)),
          String(p.blog_url !== undefined ? p.blog_url : cur.blog_url).trim(),
          String(p.insta_handle !== undefined ? p.insta_handle : cur.insta_handle).trim(),
          String(p.memo !== undefined ? p.memo : cur.memo).trim(),
          JSON.stringify(Array.isArray(p.ai_notes) ? p.ai_notes : cur.ai_notes),
          now,
          id
        ).run();
        const updated = await env.DB.prepare('select * from clients where id = ?').bind(id).first();
        return json({ ok: true, client: formatClientRow(updated, env) });
      }
      if (method === 'DELETE') {
        await env.DB.prepare('delete from clients where id = ?').bind(id).run();
        return json({ ok: true, deleted_id: id });
      }
    }
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  // 🔍 SNS 분석 보고서 CRUD (/api/sns-reports, /api/sns-reports/:id)
  if (parts[1] === 'sns-reports') {
    await ensureAgencyTables(env);
    if (parts.length === 2 && method === 'GET') {
      const res = await env.DB.prepare('select * from sns_reports order by updated_at desc, id desc').all();
      return json({ ok: true, reports: (res.results || []).map(formatDocRow) });
    }
    if (parts.length === 2 && method === 'POST') {
      let p;
      try { p = await request.json(); } catch (e) { return json({ ok: false, error: 'invalid_json' }, 400); }
      const now = new Date().toISOString();
      const res = await env.DB.prepare(
        `insert into sns_reports (client_id, client_name, period, data_json, created_at, updated_at) values (?, ?, ?, ?, ?, ?)`
      ).bind(
        p.client_id ? Number(p.client_id) : null,
        String(p.client_name || '').trim(),
        String(p.period || '').trim(),
        JSON.stringify(p.data || {}),
        now,
        now
      ).run();
      const row = await env.DB.prepare('select * from sns_reports where id = ?').bind(res.meta.last_row_id).first();
      return json({ ok: true, report: formatDocRow(row) }, 201);
    }
    if (parts.length === 3) {
      const id = parseInt(parts[2], 10);
      if (!Number.isFinite(id) || id <= 0) return json({ ok: false, error: 'invalid_id' }, 400);
      const existing = await env.DB.prepare('select * from sns_reports where id = ?').bind(id).first();
      if (!existing) return json({ ok: false, error: 'not_found' }, 404);
      if (method === 'PATCH' || method === 'PUT') {
        let p;
        try { p = await request.json(); } catch (e) { return json({ ok: false, error: 'invalid_json' }, 400); }
        const cur = formatDocRow(existing);
        const now = new Date().toISOString();
        await env.DB.prepare(
          `update sns_reports set client_id=?, client_name=?, period=?, data_json=?, updated_at=? where id=?`
        ).bind(
          p.client_id !== undefined ? (p.client_id ? Number(p.client_id) : null) : cur.client_id,
          String(p.client_name !== undefined ? p.client_name : cur.client_name).trim(),
          String(p.period !== undefined ? p.period : cur.period).trim(),
          JSON.stringify(p.data !== undefined ? p.data : cur.data),
          now,
          id
        ).run();
        const updated = await env.DB.prepare('select * from sns_reports where id = ?').bind(id).first();
        return json({ ok: true, report: formatDocRow(updated) });
      }
      if (method === 'DELETE') {
        await env.DB.prepare('delete from sns_reports where id = ?').bind(id).run();
        return json({ ok: true, deleted_id: id });
      }
    }
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  // 📑 제안서 CRUD (/api/proposals, /api/proposals/:id)
  if (parts[1] === 'proposals') {
    await ensureAgencyTables(env);
    if (parts.length === 2 && method === 'GET') {
      const res = await env.DB.prepare('select * from proposals order by updated_at desc, id desc').all();
      return json({ ok: true, proposals: (res.results || []).map(formatDocRow) });
    }
    if (parts.length === 2 && method === 'POST') {
      let p;
      try { p = await request.json(); } catch (e) { return json({ ok: false, error: 'invalid_json' }, 400); }
      const now = new Date().toISOString();
      const res = await env.DB.prepare(
        `insert into proposals (client_id, client_name, industry, title, status, total_amount, data_json, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        p.client_id ? Number(p.client_id) : null,
        String(p.client_name || '').trim(),
        String(p.industry || '').trim(),
        String(p.title || '마케팅 대행 제안서').trim(),
        String(p.status || '작성중').trim(),
        Math.max(0, Number(p.total_amount || 0)),
        JSON.stringify(p.data || {}),
        now,
        now
      ).run();
      const row = await env.DB.prepare('select * from proposals where id = ?').bind(res.meta.last_row_id).first();
      return json({ ok: true, proposal: formatDocRow(row) }, 201);
    }
    if (parts.length === 3) {
      const id = parseInt(parts[2], 10);
      if (!Number.isFinite(id) || id <= 0) return json({ ok: false, error: 'invalid_id' }, 400);
      const existing = await env.DB.prepare('select * from proposals where id = ?').bind(id).first();
      if (!existing) return json({ ok: false, error: 'not_found' }, 404);
      if (method === 'PATCH' || method === 'PUT') {
        let p;
        try { p = await request.json(); } catch (e) { return json({ ok: false, error: 'invalid_json' }, 400); }
        const cur = formatDocRow(existing);
        const now = new Date().toISOString();
        await env.DB.prepare(
          `update proposals set client_id=?, client_name=?, industry=?, title=?, status=?, total_amount=?, data_json=?, updated_at=? where id=?`
        ).bind(
          p.client_id !== undefined ? (p.client_id ? Number(p.client_id) : null) : cur.client_id,
          String(p.client_name !== undefined ? p.client_name : cur.client_name).trim(),
          String(p.industry !== undefined ? p.industry : cur.industry).trim(),
          String(p.title !== undefined ? p.title : cur.title).trim(),
          String(p.status !== undefined ? p.status : cur.status).trim(),
          Math.max(0, Number(p.total_amount !== undefined ? p.total_amount : cur.total_amount)),
          JSON.stringify(p.data !== undefined ? p.data : cur.data),
          now,
          id
        ).run();
        const updated = await env.DB.prepare('select * from proposals where id = ?').bind(id).first();
        return json({ ok: true, proposal: formatDocRow(updated) });
      }
      if (method === 'DELETE') {
        await env.DB.prepare('delete from proposals where id = ?').bind(id).run();
        return json({ ok: true, deleted_id: id });
      }
    }
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  // 📄 계약서 CRUD (/api/contracts, /api/contracts/:id)
  if (parts[1] === 'contracts') {
    await ensureAgencyTables(env);
    if (parts.length === 2 && method === 'GET') {
      const res = await env.DB.prepare('select * from contracts order by updated_at desc, id desc').all();
      return json({ ok: true, contracts: (res.results || []).map(formatDocRow) });
    }
    if (parts.length === 2 && method === 'POST') {
      let p;
      try { p = await request.json(); } catch (e) { return json({ ok: false, error: 'invalid_json' }, 400); }
      const now = new Date().toISOString();
      const res = await env.DB.prepare(
        `insert into contracts (client_id, proposal_id, contract_no, client_name, title, status, total_amount, data_json, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        p.client_id ? Number(p.client_id) : null,
        p.proposal_id ? Number(p.proposal_id) : null,
        String(p.contract_no || '').trim(),
        String(p.client_name || '').trim(),
        String(p.title || '마케팅 대행 계약서').trim(),
        String(p.status || '초안').trim(),
        Math.max(0, Number(p.total_amount || 0)),
        JSON.stringify(p.data || {}),
        now,
        now
      ).run();
      const row = await env.DB.prepare('select * from contracts where id = ?').bind(res.meta.last_row_id).first();
      return json({ ok: true, contract: formatDocRow(row) }, 201);
    }
    if (parts.length === 3) {
      const id = parseInt(parts[2], 10);
      if (!Number.isFinite(id) || id <= 0) return json({ ok: false, error: 'invalid_id' }, 400);
      const existing = await env.DB.prepare('select * from contracts where id = ?').bind(id).first();
      if (!existing) return json({ ok: false, error: 'not_found' }, 404);
      if (method === 'PATCH' || method === 'PUT') {
        let p;
        try { p = await request.json(); } catch (e) { return json({ ok: false, error: 'invalid_json' }, 400); }
        const cur = formatDocRow(existing);
        const now = new Date().toISOString();
        await env.DB.prepare(
          `update contracts set client_id=?, proposal_id=?, contract_no=?, client_name=?, title=?, status=?, total_amount=?, data_json=?, updated_at=? where id=?`
        ).bind(
          p.client_id !== undefined ? (p.client_id ? Number(p.client_id) : null) : cur.client_id,
          p.proposal_id !== undefined ? (p.proposal_id ? Number(p.proposal_id) : null) : cur.proposal_id,
          String(p.contract_no !== undefined ? p.contract_no : cur.contract_no).trim(),
          String(p.client_name !== undefined ? p.client_name : cur.client_name).trim(),
          String(p.title !== undefined ? p.title : cur.title).trim(),
          String(p.status !== undefined ? p.status : cur.status).trim(),
          Math.max(0, Number(p.total_amount !== undefined ? p.total_amount : cur.total_amount)),
          JSON.stringify(p.data !== undefined ? p.data : cur.data),
          now,
          id
        ).run();
        const updated = await env.DB.prepare('select * from contracts where id = ?').bind(id).first();
        return json({ ok: true, contract: formatDocRow(updated) });
      }
      if (method === 'DELETE') {
        await env.DB.prepare('delete from contracts where id = ?').bind(id).run();
        return json({ ok: true, deleted_id: id });
      }
    }
    // 📧 DocuSeal 원클릭 이메일 발송 + 전자서명 요청 (/api/contracts/:id/send-sign)
    if (parts.length === 4 && parts[3] === 'send-sign' && method === 'POST') {
      const id = parseInt(parts[2], 10);
      if (!Number.isFinite(id) || id <= 0) return json({ ok: false, error: 'invalid_id' }, 400);
      const existing = await env.DB.prepare('select * from contracts where id = ?').bind(id).first();
      if (!existing) return json({ ok: false, error: 'not_found', message: '먼저 계약서를 저장한 뒤 발송해 주세요.' }, 404);
      let p;
      try { p = await request.json(); } catch (e) { p = {}; }
      const curData = safeParseJson(existing.data_json, {});
      const clientEmail = String((p && p.email) || curData.clientEmail || '').trim();
      const clientName = String((p && p.client_name) || existing.client_name || curData.client_name || '고객사').trim();

      // 브라우저 HTML이 없으면(채팅 명령 자동 발송 시) 서버에서 A4 계약서 HTML + <signature-field> 자동 조립
      let contractHtml = String((p && p.html) || '').trim();
      if (!contractHtml) {
        const profRow = await env.DB.prepare('select v from kv_store where k = ?').bind('agency_profile').first();
        const prof = profRow ? safeParseJson(profRow.v, {}) : {};
        const escH = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const items = Array.isArray(curData.items) ? curData.items : [];
        const supply = items.reduce((a, i) => a + Number(i.qty || 1) * Number(i.price || 0), 0);
        const includeVat = curData.includeVat !== false;
        const vat = includeVat ? Math.round(supply * 0.1) : 0;
        const total = supply + vat || Number(existing.total_amount || 0);
        const wonH = (n) => Math.round(Number(n || 0)).toLocaleString('ko-KR') + '원';
        const stamp = curData.stampDataUrl || prof.stampDataUrl || '';
        contractHtml = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>
          body{font-family:"Apple SD Gothic Neo","Malgun Gothic",sans-serif;color:#111827;font-size:12.5px;line-height:1.65;margin:0;padding:22px 26px}
          h1{font-size:22px;text-align:center;margin:0 0 6px}.sub{text-align:center;font-size:12px;color:#475569;margin-bottom:18px}
          .sec{font-size:13.5px;font-weight:800;color:#0c4a6e;border-left:4px solid #0284c7;padding-left:8px;margin:16px 0 8px}
          table{width:100%;border-collapse:collapse;margin:8px 0 12px;font-size:12px}th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left}
          th{background:#f1f5f9}.num{text-align:right}.sum{background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:10px 14px;margin:10px 0}
          .big{font-size:16px;font-weight:900;color:#0284c7}.cl{white-space:pre-wrap;font-size:12px;line-height:1.7}
          .sg{display:flex;gap:16px;margin-top:20px}.sb{flex:1;border:1px solid #cbd5e1;border-radius:8px;padding:12px;position:relative}
          .sb h4{margin:0 0 6px;font-size:12.5px;color:#0c4a6e;border-bottom:1px dashed #cbd5e1;padding-bottom:4px}
          .sr{display:flex;justify-content:space-between;font-size:11.8px;margin:3px 0}
          .st{position:absolute;right:12px;bottom:10px;width:58px;height:58px;object-fit:contain;opacity:.88}
        </style></head><body>
          <h1>${escH(existing.title || curData.title || '마케팅 대행 용역 계약서')}</h1>
          <div class="sub">계약번호: ${escH(existing.contract_no)} · 기간: ${escH(curData.startDate || '')} ~ ${escH(curData.endDate || '')}</div>
          <p><b>${escH(clientName)}</b>(갑)와 <b>${escH(curData.agencyCompany || prof.company || '미담공장')}</b>(을)은 아래와 같이 계약을 체결한다.</p>
          <div class="sec">1. 서비스 내역 및 계약 대금</div>
          <table><thead><tr><th>항목</th><th class="num">수량</th><th class="num">단가</th><th class="num">금액</th><th>비고</th></tr></thead><tbody>
            ${items.map((it) => `<tr><td><b>${escH(it.name)}</b></td><td class="num">${Number(it.qty || 1)}</td><td class="num">${wonH(it.price)}</td><td class="num"><b>${wonH(Number(it.qty || 1) * Number(it.price || 0))}</b></td><td>${escH(it.note || '')}</td></tr>`).join('')}
          </tbody></table>
          <div class="sum">공급가액 <b>${wonH(supply)}</b> · ${includeVat ? '부가세(10%) <b>' + wonH(vat) + '</b>' : '부가세 별도'} · <span class="big">총 계약금액 ${wonH(total)}</span></div>
          <div class="sec">2. 계약 일반 및 특약 조항</div>
          <div class="cl">${escH(curData.clauses || '')}</div>
          <div class="sg">
            <div class="sb"><h4>갑 (고객사)</h4>
              <div class="sr"><span>업체명</span><b>${escH(clientName)}</b></div>
              <div class="sr"><span>대표자</span><b>${escH(curData.clientCeo || '-')}</b></div>
              <div style="margin-top:8px"><signature-field name="갑 전자서명" role="Client" required="true" style="width:150px;height:48px;display:inline-block;"></signature-field></div>
            </div>
            <div class="sb"><h4>을 (대행사)</h4>
              <div class="sr"><span>업체명</span><b>${escH(curData.agencyCompany || prof.company || '미담공장')}</b></div>
              <div class="sr"><span>대표자</span><b>${escH(curData.agencyCeo || prof.ceo || '부자사람대장')} (인)</b></div>
              ${stamp ? `<img class="st" src="${escH(stamp)}" alt="직인">` : ''}
            </div>
          </div>
        </body></html>`;
      }

      const profRowForSign = await env.DB.prepare('select v from kv_store where k = ?').bind('agency_profile').first();
      const profForSign = profRowForSign ? safeParseJson(profRowForSign.v, {}) : {};
      const dsApiKey = String(env.DOCUSEAL_API_KEY || profForSign.docusealApiKey || '').trim();
      const dsApiUrl = String(env.DOCUSEAL_API_URL || profForSign.docusealApiUrl || 'https://api.docuseal.com').replace(/\/$/, '');

      if (!clientEmail || clientEmail.indexOf('@') === -1) {
        return json({ ok: false, error: 'invalid_email', message: '유효한 고객 이메일 주소를 입력해 주세요.' }, 400);
      }
      if (!dsApiKey) {
        return json({
          ok: false,
          error: 'docuseal_not_configured',
          message: 'DocuSeal API 키가 아직 입력되지 않았습니다. 왼쪽 "🔑 DocuSeal 전자서명 연동 설정" 칸에 발급받은 API 키를 붙여넣고 저장하면 즉시 발송됩니다.',
          webhook_url: url.origin + '/api/webhooks/docuseal',
        }, 503);
      }
      const agencyName = String(curData.agencyCompany || profForSign.company || '미담공장').trim();
      const contractTitle = String(existing.title || curData.title || '마케팅 대행 용역 계약서').trim();
      const customMessage = {
        subject: `[${clientName}] ${agencyName} ${contractTitle} 전자서명 요청`,
        body: `${clientName} 대표님 안녕하세요.\n${agencyName}입니다.\n\n요청하신 "${contractTitle}" 전자서명 문서를 보내드립니다.\n아래 링크를 클릭해 계약서 내용을 확인하신 후 전자서명을 진행해 주세요.\n\n{{submitter.link}}\n\n서명이 완료되면 최종 계약서 사본(PDF)이 이메일로 자동 발송됩니다.\n궁금하신 사항은 본 이메일로 회신 부탁드립니다.\n\n감사합니다.\n${agencyName} 드림`,
      };
      const docusealBody = {
        name: `[${clientName}] ${contractTitle}`,
        send_email: true,
        order: 'preserved',
        message: customMessage,
        documents: [
          {
            name: String(existing.contract_no || ('contract-' + id)),
            html: contractHtml,
            size: 'A4',
          },
        ],
        submitters: [
          {
            role: 'Client',
            name: clientName,
            email: clientEmail,
            external_id: 'contract-' + id,
            message: customMessage,
          },
        ],
      };
      const dsRes = await fetch(dsApiUrl + '/submissions/html', {
        method: 'POST',
        headers: {
          'X-Auth-Token': dsApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(docusealBody),
      });
      const dsData = await dsRes.json().catch(() => ({}));
      if (!dsRes.ok) {
        return json({
          ok: false,
          error: 'docuseal_error',
          message: 'DocuSeal 발송 오류: ' + String(dsData.error || dsData.message || ('HTTP ' + dsRes.status)),
        }, 502);
      }
      const firstSub = Array.isArray(dsData) ? dsData[0] : (dsData.submitters && dsData.submitters[0]) || dsData;
      const subId = String((firstSub && (firstSub.submission_id || firstSub.id)) || dsData.id || '');
      const signUrl = String((firstSub && (firstSub.embed_src || firstSub.url)) || '');
      curData.status = '서명요청중';
      curData.clientEmail = clientEmail;
      curData.docuseal = {
        submission_id: subId,
        signing_url: signUrl,
        client_email: clientEmail,
        sent_at: new Date().toISOString(),
        status: 'sent',
      };
      await env.DB.prepare('update contracts set status = ?, data_json = ?, updated_at = ? where id = ?')
        .bind('서명요청중', JSON.stringify(curData), new Date().toISOString(), id)
        .run();
      const updated = await env.DB.prepare('select * from contracts where id = ?').bind(id).first();
      return json({ ok: true, contract: formatDocRow(updated), docuseal: curData.docuseal });
    }
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  // 실시간 접속자 및 채팅방 현황 조회/하트비트 (/api/presence)
  if (parts[1] === 'presence' && parts.length === 2) {
    await env.DB.prepare(
      `create table if not exists kv_store (
         k text primary key,
         v text not null,
         updated_at text not null
       )`
    ).run();

    const row = await env.DB.prepare('select v from kv_store where k = ?').bind('presence_hb').first();
    let hb = {};
    try { hb = row ? JSON.parse(row.v) : {}; } catch (e) { hb = {}; }

    if (method === 'POST') {
      let payload = {};
      try { payload = await request.json(); } catch (e) { payload = {}; }
      const names = Array.isArray(payload.names)
        ? payload.names
        : payload.name ? [String(payload.name)] : [];
      const nowIso = new Date().toISOString();
      for (const n of names) {
        const clean = String(n || '').trim();
        if (clean) hb[clean] = nowIso;
      }
      await env.DB.prepare(
        `insert into kv_store (k, v, updated_at) values ('presence_hb', ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
         on conflict(k) do update set v = excluded.v, updated_at = excluded.updated_at`
      ).bind(JSON.stringify(hb)).run();
      return json({ ok: true });
    }

    if (method === 'GET') {
      const msgStats = await env.DB.prepare(
        `select sender, count(*) as cnt, max(created_at) as last_msg_at from messages group by sender`
      ).all();
      const statMap = new Map((msgStats.results || []).map((r) => [r.sender, r]));
      const nowMs = Date.now();
      const canonical = [
        '부자사람대장', '피클 부대장', '안티고 휘발유', '홍보부 드럼통',
        'CS 딸랑이', '대장 비서실', '지피고 씹던껌', '올라고 개거품', '클고 칠판지우개', '딥고 심해짱'
      ];
      const members = canonical.map((name) => {
        const a = AGENTS[name] || { role: '참여자', color: '#0284c7', emoji: '💬' };
        const st = statMap.get(name);
        const lastMsg = st ? st.last_msg_at : null;
        const lastHb = hb[name] || null;
        const lastSeen = [lastMsg, lastHb].filter(Boolean).sort().pop() || null;
        const diffMin = lastSeen ? (nowMs - Date.parse(lastSeen)) / 60000 : Infinity;
        const status = diffMin <= 10 ? 'online' : diffMin <= 1440 ? 'standby' : 'offline';
        return {
          name,
          role: a.role,
          emoji: a.emoji,
          color: a.color,
          status,
          last_seen: lastSeen,
          message_count: st ? Number(st.cnt) : 0,
        };
      });
      const rooms = await roomList(env);
      const totalMessages = rooms.reduce((acc, r) => acc + Number(r.message_count || 0), 0);
      return json({
        ok: true,
        members,
        summary: {
          room_count: rooms.length,
          total_messages: totalMessages,
          online_count: members.filter((m) => m.status === 'online').length,
        },
      });
    }
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  // KV 설정 저장 테이블 보장 (프롬프트·외부 연결 상태 영구 보관)
  if (parts[1] === 'prompts' || parts[1] === 'integrations') {
    await env.DB.prepare(
      `create table if not exists kv_store (
         k text primary key,
         v text not null,
         updated_at text not null
       )`
    ).run();
    const storeKey = parts[1];
    if (method === 'GET') {
      const row = await env.DB.prepare('select v, updated_at from kv_store where k = ?').bind(storeKey).first();
      let data = null;
      try { data = row ? JSON.parse(row.v) : null; } catch (e) { data = null; }
      return json({ ok: true, data, updated_at: row ? row.updated_at : null });
    }
    if (method === 'POST' || method === 'PUT') {
      let payload;
      try { payload = await request.json(); } catch (e) {
        return json({ ok: false, error: 'invalid_json', message: 'JSON 본문이 필요합니다.' }, 400);
      }
      const serialized = JSON.stringify(payload || {});
      if (serialized.length > 1200000) {
        return json({ ok: false, error: 'too_large', message: '저장 용량은 약 900KB 이하만 가능합니다.' }, 413);
      }
      await env.DB.prepare(
        `insert into kv_store (k, v, updated_at) values (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
         on conflict(k) do update set v = excluded.v, updated_at = excluded.updated_at`
      )
        .bind(storeKey, serialized)
        .run();
      return json({ ok: true, data: payload });
    }
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  if (parts[1] === 'mailbox' && parts.length === 2) {
    const slug = 'inbox';
    let room = await getRoom(env, slug);
    if (!room) {
      await env.DB.prepare(
        "insert or ignore into rooms (slug, name, description, position) values ('inbox', '대장명령함 (긴급처리)', '피클 부대장이 일진대장 명령을 꽂아두는 긴급 우편함', 5)"
      ).run();
      room = await getRoom(env, slug);
    }
    if (method === 'GET') {
      const after = parseInt(url.searchParams.get('after') || '0', 10) || 0;
      const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '30', 10) || 30, 1), 200);
      const { messages, latest } = await listMessages(env, slug, after, limit);
      return json({ ok: true, room, messages, latest_id: latest });
    }
    if (method === 'POST') {
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return json({ ok: false, error: 'invalid_json', message: 'JSON 본문이 필요합니다.' }, 400);
      }
      const p = payload || {};
      const targetSlug = p.room ? String(p.room).trim() : slug;
      const targetRoom = (await getRoom(env, targetSlug)) || room;
      const sender = String(p.sender || '피클 부대장').trim();
      const rawContent = String(p.command ?? p.content ?? p.message ?? '').trim();
      const targetTag = p.target ? `[대상: ${String(p.target).trim()}] ` : '';
      const out = await postMessage(env, targetRoom.slug, {
        sender,
        content: rawContent ? `${targetTag}${rawContent}` : '',
        reply_to_id: p.reply_to_id ?? p.reply_to ?? null,
        attachment: p.attachment || null,
      });
      if (out.error) return json({ ok: false, error: 'invalid_request', message: out.error }, out.status || 400);
      return json({ ok: true, room: targetRoom, message: out.message }, 201);
    }
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  if (parts[1] === 'rooms' && parts.length === 2 && method === 'GET') {
    return json({ ok: true, rooms: await roomList(env) });
  }

  if (parts[1] === 'rooms' && parts.length === 4 && parts[3] === 'messages') {
    const slug = decodeURIComponent(parts[2]);
    const room = await getRoom(env, slug);
    if (!room) return json({ ok: false, error: 'room_not_found', message: `방 '${slug}' 이 없습니다.` }, 404);

    if (method === 'GET') {
      const after = parseInt(url.searchParams.get('after') || '0', 10) || 0;
      const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 1), 200);
      const { messages, latest } = await listMessages(env, slug, after, limit);
      return json({ ok: true, room, messages, latest_id: latest });
    }

    if (method === 'POST') {
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return json({ ok: false, error: 'invalid_json', message: 'JSON 본문이 필요합니다.' }, 400);
      }
      const out = await postMessage(env, slug, payload || {});
      if (out.error) return json({ ok: false, error: 'invalid_request', message: out.error }, out.status || 400);
      return json({ ok: true, room, message: out.message }, 201);
    }

    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  // 개별 메시지 수정(PATCH) 및 삭제(DELETE)
  if (parts[1] === 'rooms' && parts.length === 5 && parts[3] === 'messages') {
    const slug = decodeURIComponent(parts[2]);
    const id = parseInt(parts[4], 10);
    if (!Number.isFinite(id) || id <= 0) {
      return json({ ok: false, error: 'invalid_id', message: '유효하지 않은 메시지 ID입니다.' }, 400);
    }
    const existing = await env.DB.prepare(
      'select id, attachment_id from messages where room_slug = ? and id = ?'
    )
      .bind(slug, id)
      .first();
    if (!existing) {
      return json({ ok: false, error: 'not_found', message: '메시지를 찾을 수 없습니다.' }, 404);
    }

    if (method === 'PATCH') {
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return json({ ok: false, error: 'invalid_json', message: 'JSON 본문이 필요합니다.' }, 400);
      }
      const content = String((payload && payload.content) || '').trim();
      if (!content) return json({ ok: false, error: 'invalid_request', message: '수정할 내용이 필요합니다.' }, 400);
      if (content.length > 4000) return json({ ok: false, error: 'invalid_request', message: 'content 는 4000자까지 가능합니다.' }, 400);
      await env.DB.prepare('update messages set content = ? where room_slug = ? and id = ?')
        .bind(content, slug, id)
        .run();
      const row = await env.DB.prepare(
        `select m.*, a.filename as att_filename, a.mime_type as att_mime_type, a.size as att_size
           from messages m
           left join attachments a on a.id = m.attachment_id
          where m.id = ?`
      )
        .bind(id)
        .first();
      const messages = [decorate(row)];
      await attachReplies(env, messages, slug);
      return json({ ok: true, message: messages[0] });
    }

    if (method === 'DELETE') {
      await env.DB.prepare('delete from messages where room_slug = ? and id = ?').bind(slug, id).run();
      if (existing.attachment_id) {
        await env.DB.prepare('delete from attachments where id = ?').bind(existing.attachment_id).run();
      }
      return json({ ok: true, deleted_id: id });
    }

    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  return json({ ok: false, error: 'not_found', message: '알 수 없는 API 경로입니다. /api/docs 를 확인하세요.' }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      try {
        return await handleApi(request, env, url);
      } catch (err) {
        return json(
          { ok: false, error: 'server_error', message: String(err && err.message ? err.message : err) },
          500
        );
      }
    }
    return env.ASSETS.fetch(request);
  },
};

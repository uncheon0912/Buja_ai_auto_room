-- AI 팀 회의실 — Cloudflare D1 스키마
-- 적용: npx wrangler d1 execute ai-team-room --remote --file=schema.sql
-- (로컬 테스트는 --remote 를 빼면 됩니다)

-- 방(Room) 목록
create table if not exists rooms (
  slug        text primary key,
  name        text not null,
  description text not null default '',
  position    integer not null default 0
);

-- 메시지 · 스레드 답글
create table if not exists messages (
  id            integer primary key autoincrement,
  room_slug     text not null,
  sender        text not null,
  content       text not null default '',
  reply_to_id   integer,
  attachment_id integer,
  created_at    text not null
);

create index if not exists idx_messages_room on messages(room_slug, id);

-- 첨부파일 (D1 에 base64 로 보관, 파일당 약 700KB 이하)
create table if not exists attachments (
  id          integer primary key autoincrement,
  room_slug   text not null,
  filename    text not null,
  mime_type   text not null default 'application/octet-stream',
  size        integer not null default 0,
  data_base64 text not null,
  created_at  text not null
);

-- 설정·프롬프트·외부연결·회사프로필 보관 테이블
create table if not exists kv_store (
  k          text primary key,
  v          text not null,
  updated_at text not null
);

-- 고객사 · 퍼널 CRM 테이블
create table if not exists clients (
  id            integer primary key autoincrement,
  name          text not null,
  industry      text not null default '자영업/소상공인',
  contact_name  text not null default '',
  contact_phone text not null default '',
  services_json text not null default '[]',
  funnel_stage  text not null default '신규문의',
  monthly_fee   integer not null default 0,
  db_count      integer not null default 0,
  db_goal       integer not null default 0,
  blog_url      text not null default '',
  insta_handle  text not null default '',
  memo          text not null default '',
  ai_notes_json text not null default '[]',
  created_at    text not null,
  updated_at    text not null
);

-- 고객사별 SNS(네이버 블로그 · 인스타 릴스 · 퍼널) 분석 보고서
create table if not exists sns_reports (
  id          integer primary key autoincrement,
  client_id   integer,
  client_name text not null default '',
  period      text not null default '',
  data_json   text not null default '{}',
  created_at  text not null,
  updated_at  text not null
);

-- 마케팅 제안서 · 견적서
create table if not exists proposals (
  id           integer primary key autoincrement,
  client_id    integer,
  client_name  text not null default '',
  industry     text not null default '',
  title        text not null default '',
  status       text not null default '작성중',
  total_amount integer not null default 0,
  data_json    text not null default '{}',
  created_at   text not null,
  updated_at   text not null
);

-- 마케팅 대행 계약서
create table if not exists contracts (
  id           integer primary key autoincrement,
  client_id    integer,
  proposal_id  integer,
  contract_no  text not null default '',
  client_name  text not null default '',
  title        text not null default '',
  status       text not null default '초안',
  total_amount integer not null default 0,
  data_json    text not null default '{}',
  created_at   text not null,
  updated_at   text not null
);

-- 회사 포트폴리오 (10장 고급 PDF 북릿)
create table if not exists portfolios (
  id         integer primary key autoincrement,
  title      text not null default '',
  theme      text not null default 'obsidian-gold',
  data_json  text not null default '{}',
  created_at text not null,
  updated_at text not null
);

-- 실시간 수집 DB 리드 (웹훅 /api/leads/capture 연동)
create table if not exists leads (
  id          integer primary key autoincrement,
  client_id   integer not null,
  client_name text not null default '',
  source      text not null default '랜딩/퍼널',
  lead_name   text not null default '',
  lead_phone  text not null default '',
  lead_note   text not null default '',
  ad_spend    integer not null default 0,
  est_value   integer not null default 0,
  status      text not null default '신규',
  created_at  text not null
);

-- 고객 VIP 포털 콘텐츠 검수 · 승인함
create table if not exists deliverables (
  id              integer primary key autoincrement,
  client_id       integer not null,
  channel         text not null default '네이버 블로그',
  title           text not null default '',
  preview_text    text not null default '',
  scheduled_date  text not null default '',
  status          text not null default '검수대기',
  client_feedback text not null default '',
  created_at      text not null,
  updated_at      text not null
);

-- 기본 방 5개 (학교 일진 콘셉트 + 피클 부대장 우편함)
insert or ignore into rooms (slug, name, description, position) values
  ('general',   '부자사람 일진 종합반',   '학교 옥상 집합 · 다 같이 떠드는 메인 아지트',          1),
  ('dev',       '일진개발실',             '컴퓨터실 점거 · 코드 · 배포 · 자동화',                 2),
  ('marketing', '일진홍보부',             '전교 방송실 · 콘텐츠 · 광고 · SNS',                   3),
  ('ops',       '일진선도부',             '교무실 감시 · 일정 · 정산 · 고객 관리',                4),
  ('inbox',     '대장명령함 (긴급처리)',   '피클 부대장이 일진대장 명령을 꽂아두는 긴급 우편함',    5);

/**
 * 탭 2: 📊 고객사 · 퍼널 대시보드 (CRM + 1초 업셀링 진단 + AI 일진팀 심층 제안 연동)
 */
(function () {
  'use strict';
  var A = window.AgencyApp;
  if (!A) return;

  var state = {
    filterIndustry: '전체',
    filterStage: '전체',
    search: '',
    selectedId: null,
    aiReplies: [],
    loadingReplies: false,
    deliverables: [],
  };

  function getSelectedClient() {
    if (!state.selectedId) return null;
    return A.store.clients.filter(function (c) { return c.id === state.selectedId; })[0] || null;
  }

  function getLatestSnsForClient(client) {
    if (!client) return null;
    return A.store.snsReports.filter(function (r) {
      return (r.client_id && r.client_id === client.id) || (r.client_name && r.client_name === client.name);
    })[0] || null;
  }

  function industryIcon(ind) {
    var f = A.INDUSTRIES.filter(function (x) { return x.id === ind; })[0];
    return f ? f.icon : '🏷️';
  }

  function formatPhone(raw) {
    var d = String(raw || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.indexOf('02') === 0) {
      if (d.length <= 2) return d;
      if (d.length <= 5) return d.slice(0, 2) + '-' + d.slice(2);
      if (d.length <= 9) return d.slice(0, 2) + '-' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
      return d.slice(0, 2) + '-' + d.slice(2, 6) + '-' + d.slice(6, 10);
    }
    if (d.length === 8 && /^(15|16|18)/.test(d)) return d.slice(0, 4) + '-' + d.slice(4);
    if (d.length <= 3) return d;
    if (d.length <= 7) return d.slice(0, 3) + '-' + d.slice(3);
    if (d.length <= 10) return d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
    return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7, 11);
  }

  function formatComma(v) {
    var d = String(v == null ? '' : v).replace(/\D/g, '');
    if (!d) return '';
    return Number(d).toLocaleString('ko-KR');
  }

  function parseComma(v) {
    var d = String(v == null ? '' : v).replace(/\D/g, '');
    return d ? Number(d) : 0;
  }

  function maskName(name) {
    var s = String(name || '').trim();
    if (!s) return '담당자 미입력';
    if (s.length === 1) return s + '*';
    return s.charAt(0) + '*'.repeat(Math.max(1, s.length - 1));
  }

  function maskPhone(phone) {
    var f = formatPhone(phone);
    if (!f) return '';
    var parts = f.split('-');
    if (parts.length === 3) return parts[0] + '-' + parts[1] + '-****';
    if (parts.length === 2) return parts[0] + '-****';
    return f.slice(0, Math.max(0, f.length - 4)) + '****';
  }

  function addDaysFromToday(offsetDays) {
    var base = new Date();
    base.setDate(base.getDate() + (Number(offsetDays) || 0));
    var y = base.getFullYear();
    var m = String(base.getMonth() + 1).padStart(2, '0');
    var d = String(base.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  // ✅ 체크된 대행 서비스(네이버 블로그 · 인스타 릴스 · 스레드 · 브랜딩/퍼널)에 맞춰 30일 이내 발행 스케줄 자동 생성
  function build30DayScheduleItems(client) {
    if (!client || !client.id) return [];
    var svcs = Array.isArray(client.services) ? client.services : [];
    var cname = client.name || '고객사';
    var ind = client.industry || '브랜드/기타';
    var items = [];
    // 고객사마다 시작일 오프셋을 살짝 어긋나게 두어 여러 업체 등록 시 한 날짜에 폭주 방지
    var seedShift = (Number(client.id) * 2) % 5;

    if (svcs.indexOf('네이버 블로그 대행') !== -1) {
      var blogTitles = [
        '[' + cname + '] ' + ind + ' 선택 전 꼭 확인해야 할 핵심 기준 3가지',
        '[' + cname + '] 실제 상담·진행 사례로 보는 실패 없는 준비 가이드',
        '[' + cname + '] 고객님들이 가장 자주 묻는 질문 FAQ TOP5 총정리',
        '[' + cname + '] 이번 달 무료 사전 진단 · 맞춤 상담 신청 안내',
      ];
      [2, 9, 16, 23].forEach(function (d, i) {
        var day = Math.min(29, d + seedShift);
        items.push({
          client_id: client.id,
          channel: '네이버 블로그',
          title: blogTitles[i],
          preview_text: '🎯 [도입]\n' + cname + ' (' + ind + ') 고객님들을 위한 핵심 정보 포스팅입니다.\n\n📝 [핵심 구성]\n1) 핵심 기준 비교\n2) 자주 하는 실수 체크\n3) 하단 무료 상담 CTA 연결',
          scheduled_date: addDaysFromToday(day),
          status: '검수대기',
        });
      });
    }

    if (svcs.indexOf('인스타 릴스 대행') !== -1) {
      var reelsTitles = [
        '3초 후킹 릴스 ① — ' + cname + ' ' + ind + ' 진행 전 절대 놓치면 안 되는 실수',
        '3초 후킹 릴스 ② — 비용 절반 줄이고 효과 2배 올리는 전문가 팁',
        '3초 후킹 릴스 ③ — ' + cname + ' 현장 비하인드 & 팩트체크 30초 요약',
        '3초 후킹 릴스 ④ — 이번 달 한정 무료 진단 혜택 지금 바로 신청하세요!',
      ];
      [4, 11, 18, 25].forEach(function (d, i) {
        var day = Math.min(29, d + seedShift);
        items.push({
          client_id: client.id,
          channel: '인스타 릴스',
          title: reelsTitles[i],
          preview_text: '[0~3초 후킹] "잠깐! ' + ind + ' 알아보고 계시다면 이 1가지 먼저 확인하세요!"\n[4~20초 본론] ' + cname + ' 핵심 차별점 3가지 빠른 컷 전개\n[21~30초 CTA] "프로필 링크에서 무료 체크리스트 받아가세요!"',
          scheduled_date: addDaysFromToday(day),
          status: '검수대기',
        });
      });
    }

    if (svcs.indexOf('스레드 대행') !== -1) {
      var threadTitles = [
        '[' + cname + '] 스레드 공감형 인사이트 — 현장에서 직접 겪은 진짜 이야기',
        '[' + cname + '] 스레드 질문형 소통 — 여러분은 어떤 기준으로 고르시나요?',
        '[' + cname + '] 스레드 꿀팁 정리 — 1분 만에 끝내는 체크리스트 공유',
      ];
      [6, 15, 24].forEach(function (d, i) {
        var day = Math.min(29, d + seedShift);
        items.push({
          client_id: client.id,
          channel: '스레드',
          title: threadTitles[i],
          preview_text: '💡 ' + cname + ' 데일리 스레드 원고 — 짧은 훅 2줄 + 댓글 참여 유도 질문 + 프로필 링크 연결',
          scheduled_date: addDaysFromToday(day),
          status: '검수대기',
        });
      });
    }

    if (svcs.indexOf('브랜딩 기획') !== -1 || svcs.indexOf('퍼널·DB 수집 마케팅') !== -1) {
      var consultTitles = [
        '[' + cname + '] 킥오프 브랜딩 · DB 수집 퍼널 동선 점검 컨설팅',
        '[' + cname + '] 월말 DB 전환율(ROAS·CPA) 성과 리포트 & 업셀링 미팅',
      ];
      [3, 27].forEach(function (d, i) {
        var day = Math.min(29, d + (i === 0 ? seedShift : 0));
        items.push({
          client_id: client.id,
          channel: '컨설팅',
          title: consultTitles[i],
          preview_text: '📌 ' + cname + ' 브랜딩 포지셔닝 및 퍼널·DB 전환 성과 점검 일정',
          scheduled_date: addDaysFromToday(day),
          status: '검수대기',
        });
      });
    }

    return items;
  }

  function render() {
    var root = document.getElementById('pane-crm');
    if (!root) return;

    var clients = A.store.clients || [];
    var totalMrr = clients.reduce(function (acc, c) { return acc + Number(c.monthly_fee || 0); }, 0);
    var totalDb = clients.reduce(function (acc, c) { return acc + Number(c.db_count || 0); }, 0);
    var upsellCount = clients.filter(function (c) {
      return A.buildUpsellRecommendations(c, getLatestSnsForClient(c)).length > 0;
    }).length;

    var filtered = clients.filter(function (c) {
      if (state.filterIndustry !== '전체' && c.industry !== state.filterIndustry) return false;
      if (state.filterStage !== '전체' && c.funnel_stage !== state.filterStage) return false;
      if (state.search) {
        var q = state.search.toLowerCase();
        var hay = (c.name + ' ' + c.industry + ' ' + c.contact_name + ' ' + c.memo + ' ' + (c.services || []).join(' ')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    var sel = getSelectedClient();
    var latestSns = getLatestSnsForClient(sel);
    var recs = sel ? A.buildUpsellRecommendations(sel, latestSns) : [];

    var html = '<div class="ws-scroll">' +
      '<div class="ws-head">' +
      '<div>' +
      '<h2>📊 고객사 · 퍼널 관리 대시보드</h2>' +
      '<p>업종별 고객사 분류, DB 퍼널 추적, 정보 입력 즉시 AI 신규 제안 · 업셀링 추천을 한곳에서 관리합니다.</p>' +
      '</div>' +
      '<div class="ws-actions">' +
      '<button type="button" class="ws-btn primary" id="crmNewBtn">➕ 새 고객사 등록</button>' +
      '<button type="button" class="ws-btn" id="crmRefreshBtn">🔄 새로고침</button>' +
      '</div>' +
      '</div>' +

      '<div class="kpi-grid">' +
      '<div class="kpi-card"><div class="k-lbl">전체 관리 업체</div><div class="k-val">' + clients.length + '곳</div><div class="k-sub">병원 · 보험 · 정책자금 · 자영업</div></div>' +
      '<div class="kpi-card"><div class="k-lbl">월 누적 대행 매출(MRR)</div><div class="k-val">' + A.won(totalMrr) + '</div><div class="k-sub">등록 업체 월 계약금 합계</div></div>' +
      '<div class="kpi-card"><div class="k-lbl">누적 DB 수집 실적</div><div class="k-val">' + totalDb.toLocaleString('ko-KR') + '건</div><div class="k-sub">퍼널 · 상담 리드 합산</div></div>' +
      '<div class="kpi-card"><div class="k-lbl">AI 업셀링 제안 가능</div><div class="k-val">' + upsellCount + '곳</div><div class="k-sub">추가 상품 · 퍼널 확장 기회</div></div>' +
      '</div>' +

      '<div class="filter-bar">' +
      '<button type="button" class="filter-pill' + (state.filterIndustry === '전체' ? ' active' : '') + '" data-find="전체">전체 업종</button>' +
      A.INDUSTRIES.map(function (ind) {
        return '<button type="button" class="filter-pill' + (state.filterIndustry === ind.id ? ' active' : '') + '" data-find="' + A.esc(ind.id) + '">' + ind.icon + ' ' + A.esc(ind.id) + '</button>';
      }).join('') +
      '<select id="crmStageFilter" style="margin-left:auto;padding:5px 9px;border-radius:9px;border:1px solid var(--line-strong);font-size:12px;font-weight:700">' +
      '<option value="전체">전체 퍼널 단계</option>' +
      A.FUNNEL_STAGES.map(function (st) {
        return '<option value="' + A.esc(st) + '"' + (state.filterStage === st ? ' selected' : '') + '>' + A.esc(st) + '</option>';
      }).join('') +
      '</select>' +
      '<input type="search" id="crmSearch" value="' + A.esc(state.search) + '" placeholder="업체명·담당자·메모 검색…" style="padding:5px 10px;border-radius:9px;border:1px solid var(--line-strong);font-size:12.2px;width:180px">' +
      '</div>' +

      '<div class="crm-layout">' +
      // 왼쪽: 고객사 목록
      '<div class="client-list">' +
      (filtered.length ? filtered.map(function (c) {
        var isAct = sel && sel.id === c.id;
        var pct = c.db_goal > 0 ? Math.min(100, Math.round((c.db_count / c.db_goal) * 100)) : null;
        var cRecs = A.buildUpsellRecommendations(c, getLatestSnsForClient(c));
        return '<div class="client-card' + (isAct ? ' active' : '') + '" data-cid="' + c.id + '">' +
          '<div class="client-top">' +
          '<div class="client-name">' + industryIcon(c.industry) + ' ' + A.esc(c.name) + '</div>' +
          '<div style="display:flex;gap:5px;flex-wrap:wrap">' +
          '<span class="tag-pill">' + A.esc(c.industry) + '</span>' +
          '<span class="tag-pill stage">' + A.esc(c.funnel_stage) + '</span>' +
          (cRecs.length ? '<span class="tag-pill upsell">✨ 업셀링 ' + cRecs.length + '건</span>' : '') +
          '</div>' +
          '</div>' +
          '<div class="client-meta">' +
          '<span>👤 ' + A.esc(maskName(c.contact_name)) + (c.contact_phone ? ' (' + A.esc(maskPhone(c.contact_phone)) + ')' : '') + '</span>' +
          '<span>💳 월 ' + A.won(c.monthly_fee) + '</span>' +
          '<span>🎯 DB ' + Number(c.db_count || 0) + '건' + (c.db_goal ? ' / 목표 ' + c.db_goal + '건 (' + pct + '%)' : '') + '</span>' +
          '</div>' +
          '<div class="client-services">' +
          ((c.services && c.services.length)
            ? c.services.map(function (s) { return '<span class="svc-chip">✓ ' + A.esc(s) + '</span>'; }).join('')
            : '<span class="svc-chip" style="opacity:.7">진행 서비스 미선택</span>') +
          '</div>' +
          '</div>';
      }).join('') : '<div class="ws-card" style="text-align:center;padding:34px 20px;color:var(--muted)">등록된 고객사가 없습니다.<br>오른쪽 입력창에서 첫 고객사를 등록하면 <b>AI 업셀링 제안</b>이 즉시 활성화됩니다!</div>') +
      '</div>' +

      // 오른쪽: 고객사 편집 + AI 업셀링 & 제안 파트
      '<div id="crmRightCol" style="display:flex;flex-direction:column;gap:14px">' +
      '<div class="ws-card">' +
      '<h3><span>' + (sel ? '✏️ 고객사 정보 수정 (#' + sel.id + ')' : '➕ 새 고객사 등록') + '</span>' +
      '<span style="display:flex;gap:6px;align-items:center">' +
      '<button type="button" class="ws-btn sm accent" id="crmSampleBtn" title="랜덤 예시 고객사 자동 채우기">🎲 Sample</button>' +
      (sel ? '<button type="button" class="ws-btn sm danger" id="crmDeleteBtn">삭제</button>' : '') +
      '</span>' +
      '</h3>' +
      '<div class="ws-grid-2">' +
      '<div class="ws-field"><label>업체명 *</label><input id="cName" value="' + A.esc(sel ? sel.name : '') + '" placeholder="예: 연세투석검진센터, 한화 홍길동 팀장"></div>' +
      '<div class="ws-field"><label>업종 분류</label><select id="cIndustry">' +
      A.INDUSTRIES.map(function (ind) {
        return '<option value="' + A.esc(ind.id) + '"' + ((sel ? sel.industry : '병원') === ind.id ? ' selected' : '') + '>' + ind.icon + ' ' + A.esc(ind.label) + '</option>';
      }).join('') +
      '</select></div>' +
      '<div class="ws-field"><label>담당자 / 대표자명</label><input id="cContact" value="' + A.esc(sel ? sel.contact_name : '') + '" placeholder="예: 김대표님"></div>' +
      '<div class="ws-field"><label>연락처 (자동 하이픈)</label><input id="cPhone" value="' + A.esc(sel ? formatPhone(sel.contact_phone) : '') + '" placeholder="010-0000-0000" maxlength="13"></div>' +
      '<div class="ws-field"><label>퍼널 단계</label><select id="cStage">' +
      A.FUNNEL_STAGES.map(function (st) {
        return '<option value="' + A.esc(st) + '"' + ((sel ? sel.funnel_stage : '신규문의') === st ? ' selected' : '') + '>' + A.esc(st) + '</option>';
      }).join('') +
      '</select></div>' +
      '<div class="ws-field"><label>월 대행 금액 (원 · 자동 콤마)</label><input type="text" inputmode="numeric" id="cFee" value="' + A.esc(sel && sel.monthly_fee ? formatComma(sel.monthly_fee) : '0') + '" placeholder="예: 5,000,000"></div>' +
      '<div class="ws-field"><label>현재 수집 DB 수 (건)</label><input type="number" id="cDbCnt" value="' + A.esc(sel ? sel.db_count : 0) + '" min="0"></div>' +
      '<div class="ws-field"><label>월 목표 DB 수 (건)</label><input type="number" id="cDbGoal" value="' + A.esc(sel ? sel.db_goal : 30) + '" min="0"></div>' +
      '<div class="ws-field"><label>네이버 블로그 URL</label><input id="cBlog" value="' + A.esc(sel ? sel.blog_url : '') + '" placeholder="https://blog.naver.com/..."></div>' +
      '<div class="ws-field"><label>인스타그램 계정</label><input id="cInsta" value="' + A.esc(sel ? sel.insta_handle : '') + '" placeholder="@account_id"></div>' +
      '</div>' +
      '<div class="ws-field" style="margin-top:10px"><label>현재 대행 / 관심 서비스</label>' +
      '<div class="chip-group">' +
      A.SERVICES.map(function (svc) {
        var checked = sel && Array.isArray(sel.services) && sel.services.indexOf(svc) !== -1;
        return '<label class="chip-check"><input type="checkbox" class="cSvcChk" value="' + A.esc(svc) + '"' + (checked ? ' checked' : '') + '> ' + A.esc(svc) + '</label>';
      }).join('') +
      '</div>' +
      '</div>' +
      '<div class="ws-field" style="margin-top:10px"><label>업체 특징 · 고민 · 마케팅 이슈 메모 (AI 제안 근거로 활용)</label>' +
      '<textarea id="cMemo" placeholder="예: 개원 2개월 차, 블로그만 운영 중이나 신환 예약 전환이 부족함. 원장님 릴스 촬영 의향 있음.">' + A.esc(sel ? sel.memo : '') + '</textarea>' +
      '</div>' +
      '<div class="ws-actions" style="margin-top:12px">' +
      '<button type="button" class="ws-btn primary" id="crmSaveBtn">💾 ' + (sel ? '수정 저장' : '고객사 등록') + '</button>' +
      (sel ? '<button type="button" class="ws-btn" id="crmGoSnsBtn">🔍 SNS 분석 작성</button>' : '') +
      (sel ? '<button type="button" class="ws-btn" id="crmGoPropBtn">📑 제안서 만들기</button>' : '') +
      (sel ? '<button type="button" class="ws-btn ok" id="crmGoContBtn">📄 계약서 만들기</button>' : '') +
      '</div>' +
      '</div>' +

      // AI 신규 제안 & 업셀링 파트
      '<div class="ws-card">' +
      '<h3><span>🤖 AI 마케팅 신규 제안 · 업셀링 파트</span>' +
      (sel ? '<span class="tag-pill upsell">' + A.esc(sel.industry) + ' 맞춤 분석</span>' : '') +
      '</h3>' +
      (sel ? (
        '<div class="ai-box">' +
        '<div style="font-size:12.2px;font-weight:700;color:#5b21b6">⚡ 고객사 정보 기반 즉시 업셀링 · 신규 제안 (' + recs.length + '건)</div>' +
        recs.map(function (r, idx) {
          return '<div class="ai-rec-item">' +
            '<b>[' + A.esc(r.tag) + '] ' + A.esc(r.title) + ' · 추천 추가가 ' + A.won(r.price) + '/월</b>' +
            '<p>' + A.esc(r.reason) + '</p>' +
            '<div style="margin-top:7px;display:flex;gap:6px;flex-wrap:wrap">' +
            '<button type="button" class="ws-btn sm primary" data-rec-prop="' + idx + '">📑 이 업셀링으로 제안서 바로 만들기</button>' +
            '</div>' +
            '</div>';
        }).join('') +
        '<div class="ws-actions" style="margin-top:4px">' +
        '<button type="button" class="ws-btn ai" id="crmAskAiBtn">🚀 AI 일진팀에 심층 제안 · 업셀링 요청</button>' +
        '<button type="button" class="ws-btn sm" id="crmLoadAiReplies">' + (state.loadingReplies ? '조회 중…' : '🔄 AI 팀 답장 불러오기') + '</button>' +
        '</div>' +
        (state.aiReplies.length ? (
          '<div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">' +
          state.aiReplies.map(function (m, ridx) {
            return '<div class="ai-reply-card">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;font-weight:800;color:#5b21b6">' +
              '<span>' + A.esc(m.emoji || '🤖') + ' ' + A.esc(m.sender) + ' (#' + m.id + ')</span>' +
              '<button type="button" class="ws-btn sm" data-ai-prop="' + ridx + '">📑 제안서에 반영</button>' +
              '</div>' +
              A.esc(m.content) +
              '</div>';
          }).join('') +
          '</div>'
        ) : '<div style="font-size:11.8px;color:var(--muted)">💡 <b>AI 일진팀에 심층 제안 요청</b>을 누르면 <code>#일진홍보부</code>의 홍보부 드럼통 · 지피고 씹던껌이 이 업체의 블로그/릴스/퍼널 업셀링 전략을 작성해 줍니다.</div>') +
        '</div>'
      ) : '<div style="font-size:12.6px;color:var(--muted);line-height:1.6">왼쪽 목록에서 고객사를 클릭하거나 새 고객사를 등록하면, 업종·이용 서비스·DB 수치를 분석해 <b>즉시 업셀링 패키지와 AI 팀 심층 제안</b>을 띄워 드립니다.</div>') +
      '</div>' +

      // 🌟 Phase A-1: VIP 고객 포털 + 실시간 DB 웹훅 + KPI(ROAS/CPA) 차트 + 콘텐츠 승인함
      (sel ? (function () {
        var pToken = sel.portal_token || '';
        var portalUrl = location.origin + '/portal?token=' + encodeURIComponent(pToken);
        var webhookUrl = location.origin + '/api/leads/capture?token=' + encodeURIComponent(pToken);
        var budget = Number((latestSns && latestSns.data && latestSns.data.marketingBudget) || sel.monthly_fee || 0);
        var cpa = sel.db_count > 0 && budget > 0 ? Math.round(budget / sel.db_count) : 0;
        var estSales = latestSns && latestSns.data ? Number(latestSns.data.closeCount || 0) * Number(latestSns.data.avgDealValue || 0) : (sel.db_count * 250000);
        var roasNum = budget > 0 && estSales > 0 ? (estSales / budget) : 0;
        var roas = roasNum > 0 ? roasNum.toFixed(1) + '배 (' + Math.round(roasNum * 100) + '%)' : '-';
        var pct = sel.db_goal > 0 ? Math.min(100, Math.round((sel.db_count / sel.db_goal) * 100)) : 0;
        var maxMoney = Math.max(budget, estSales, 1);
        var budgetBarW = Math.max(6, Math.round((budget / maxMoney) * 100));
        var salesBarW = Math.max(6, Math.round((estSales / maxMoney) * 100));
        var estVisits = (latestSns && latestSns.data && (Number(latestSns.data.blogVisitors || 0) + Number(latestSns.data.reelsViews || 0))) || (sel.db_count * 35);
        var convRate = estVisits > 0 ? ((sel.db_count / estVisits) * 100).toFixed(1) : '0.0';
        return '<div class="ws-card">' +
          '<h3><span>🌟 VIP 고객 포털 · 실시간 DB 웹훅 · KPI 차트</span><span class="tag-pill ok">● 화이트라벨 활성</span></h3>' +
          '<div class="ws-grid-3" style="margin-bottom:10px">' +
          '<div style="background:rgba(2,132,199,0.09);border-radius:10px;padding:8px 10px"><div style="font-size:10.5px;color:var(--muted);font-weight:700">DB 목표 달성률</div><b style="font-size:16px;color:#0284c7">' + pct + '%</b></div>' +
          '<div style="background:rgba(2,132,199,0.09);border-radius:10px;padding:8px 10px"><div style="font-size:10.5px;color:var(--muted);font-weight:700">문의 1건당 비용(CPA)</div><b style="font-size:16px;color:#0284c7">' + (cpa ? A.won(cpa) : '-') + '</b></div>' +
          '<div style="background:rgba(22,163,74,0.1);border-radius:10px;padding:8px 10px"><div style="font-size:10.5px;color:var(--muted);font-weight:700">투자 대비 매출(ROAS)</div><b style="font-size:15px;color:#15803d">' + roas + '</b></div>' +
          '</div>' +
          '<div style="background:rgba(15,23,42,0.04);border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-bottom:10px;font-size:11.6px">' +
          '<div style="display:flex;justify-content:space-between;font-weight:800;margin-bottom:7px;color:#0c4a6e"><span>📊 월간 마케팅 투입비 vs 예상 매출 · 퍼널 전환 차트</span><span>유입→DB 전환율 ' + convRate + '%</span></div>' +
          '<div style="display:grid;gap:6px">' +
          '<div><div style="display:flex;justify-content:space-between;margin-bottom:2px"><span>💸 월 광고·대행 투입비</span><b>' + A.won(budget) + '</b></div><div style="height:10px;border-radius:99px;background:rgba(148,163,184,0.2);overflow:hidden"><div style="height:100%;width:' + budgetBarW + '%;background:linear-gradient(90deg,#f59e0b,#fbbf24);border-radius:99px"></div></div></div>' +
          '<div><div style="display:flex;justify-content:space-between;margin-bottom:2px"><span>💰 예상 창출 매출 (ROAS)</span><b style="color:#15803d">' + A.won(estSales) + '</b></div><div style="height:10px;border-radius:99px;background:rgba(148,163,184,0.2);overflow:hidden"><div style="height:100%;width:' + salesBarW + '%;background:linear-gradient(90deg,#16a34a,#4ade80);border-radius:99px"></div></div></div>' +
          '<div><div style="display:flex;justify-content:space-between;margin-bottom:2px"><span>🎯 유입(' + estVisits.toLocaleString('ko-KR') + '명) → DB(' + sel.db_count + '건 / 목표 ' + sel.db_goal + '건)</span><b style="color:#0284c7">' + pct + '%</b></div><div style="height:10px;border-radius:99px;background:rgba(148,163,184,0.2);overflow:hidden"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#0284c7,#38bdf8);border-radius:99px"></div></div></div>' +
          '</div>' +
          (function () {
            // A-6: 최근 SNS 보고서 이력 기반 월별 DB · ROAS 시계열 추이 SVG 꺾은선 차트
            var hist = (A.store.snsReports || []).filter(function (r) {
              return String(r.client_id) === String(sel.id) || r.client_name === sel.name;
            }).slice(0, 6).reverse();
            var pts = hist.map(function (r, idx) {
              var d = r.data || {};
              var b = Number(d.marketingBudget || sel.monthly_fee || 0);
              var db = Number(d.dbCount || 0);
              var sales = Number(d.closeCount || 0) * Number(d.avgDealValue || 0);
              var rVal = b > 0 && sales > 0 ? +(sales / b).toFixed(1) : +(db * 0.15).toFixed(1);
              return { label: String(r.period || ((idx + 1) + '차')).slice(-7), db: db, roas: rVal };
            });
            if (pts.length < 2) {
              var baseDb = Math.max(4, sel.db_count || 12);
              var baseRoas = roasNum > 0 ? roasNum : 2.8;
              pts = [
                { label: '1개월 전', db: Math.round(baseDb * 0.55), roas: +(baseRoas * 0.65).toFixed(1) },
                { label: '2주 전', db: Math.round(baseDb * 0.72), roas: +(baseRoas * 0.8).toFixed(1) },
                { label: '지난 주', db: Math.round(baseDb * 0.88), roas: +(baseRoas * 0.92).toFixed(1) },
                { label: '현재', db: sel.db_count || baseDb, roas: +baseRoas.toFixed(1) },
              ];
            }
            var W = 420, H = 104, padL = 24, padR = 24, padT = 18, padB = 22;
            var maxDb = Math.max.apply(null, pts.map(function (p) { return p.db; }).concat([10]));
            var maxRoas = Math.max.apply(null, pts.map(function (p) { return p.roas; }).concat([3]));
            var stepX = (W - padL - padR) / Math.max(1, pts.length - 1);
            var dbCoords = pts.map(function (p, i) {
              return [padL + i * stepX, H - padB - ((p.db / maxDb) * (H - padT - padB))];
            });
            var roasCoords = pts.map(function (p, i) {
              return [padL + i * stepX, H - padB - ((p.roas / maxRoas) * (H - padT - padB))];
            });
            var dbLine = dbCoords.map(function (c) { return c[0].toFixed(1) + ',' + c[1].toFixed(1); }).join(' ');
            var roasLine = roasCoords.map(function (c) { return c[0].toFixed(1) + ',' + c[1].toFixed(1); }).join(' ');
            return '<div style="margin-top:10px;padding-top:8px;border-top:1px dashed var(--line)">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;font-size:11px">' +
              '<b style="color:#0369a1">📈 시계열 추이 차트 (DB 수집량 · ROAS 배수)</b>' +
              '<span><span style="color:#0284c7;font-weight:800">● DB수</span> &nbsp;<span style="color:#16a34a;font-weight:800">● ROAS(배)</span></span>' +
              '</div>' +
              '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:110px;display:block;overflow:visible">' +
              '<line x1="' + padL + '" y1="' + (H - padB) + '" x2="' + (W - padR) + '" y2="' + (H - padB) + '" stroke="rgba(148,163,184,0.35)" stroke-width="1"/>' +
              '<polyline fill="none" stroke="#0284c7" stroke-width="2.5" points="' + dbLine + '"/>' +
              '<polyline fill="none" stroke="#16a34a" stroke-width="2.2" stroke-dasharray="4 3" points="' + roasLine + '"/>' +
              pts.map(function (p, i) {
                var dc = dbCoords[i], rc = roasCoords[i];
                return '<circle cx="' + dc[0].toFixed(1) + '" cy="' + dc[1].toFixed(1) + '" r="3.6" fill="#0284c7"/>' +
                  '<text x="' + dc[0].toFixed(1) + '" y="' + (dc[1] - 6).toFixed(1) + '" text-anchor="middle" font-size="9.5" font-weight="800" fill="#0284c7">' + p.db + '건</text>' +
                  '<circle cx="' + rc[0].toFixed(1) + '" cy="' + rc[1].toFixed(1) + '" r="3.2" fill="#16a34a"/>' +
                  '<text x="' + dc[0].toFixed(1) + '" y="' + (H - 5) + '" text-anchor="middle" font-size="9.5" fill="#64748b">' + A.esc(p.label) + '</text>';
              }).join('') +
              '</svg>' +
              '</div>';
          })() +
          '</div>' +
          '<div class="ws-actions" style="margin-bottom:10px">' +
          '<a class="ws-btn sm primary" href="' + A.esc(portalUrl) + '" target="_blank" rel="noopener noreferrer" style="text-decoration:none">🌟 고객 VIP 포털 열기 (새 창)</a>' +
          '<button type="button" class="ws-btn sm" id="crmCopyPortalBtn" data-url="' + A.esc(portalUrl) + '">📋 포털 링크 복사</button>' +
          '<button type="button" class="ws-btn sm" id="crmCopyHookBtn" data-url="' + A.esc(webhookUrl) + '">📡 DB 웹훅 복사</button>' +
          '<button type="button" class="ws-btn sm ok" id="crmTestLeadBtn">⚡ 테스트 DB +1</button>' +
          '</div>' +
          '<div style="border-top:1px dashed var(--line);padding-top:10px">' +
          '<div style="font-size:12px;font-weight:800;color:#0369a1;margin-bottom:6px">✅ VIP 포털 콘텐츠 검수 요청 등록</div>' +
          '<div class="ws-grid-2">' +
          '<div class="ws-field"><label>채널</label><select id="dlvCh"><option>네이버 블로그</option><option>인스타 릴스</option><option>스레드</option><option>DB 퍼널 랜딩</option></select></div>' +
          '<div class="ws-field"><label>발행 예정일</label><input type="date" id="dlvDate" value="' + A.todayKst() + '"></div>' +
          '</div>' +
          '<div class="ws-field" style="margin-top:6px"><label>콘텐츠 제목</label><input id="dlvTitle" placeholder="예: 11월 4주차 인공신장실 개원 체크리스트 포스팅"></div>' +
          '<div class="ws-field" style="margin-top:6px"><label>초안 미리보기 / 핵심 내용</label><textarea id="dlvBody" style="min-height:56px" placeholder="고객 대표님이 포털에서 확인하고 원클릭 승인할 초안 요약을 입력하세요..."></textarea></div>' +
          '<div class="ws-actions" style="margin-top:8px"><button type="button" class="ws-btn sm primary" id="dlvAddBtn">📤 VIP 포털에 승인 요청 올리기</button></div>' +
          (state.deliverables.length ? '<div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">' +
            state.deliverables.slice(0, 8).map(function (d) {
              var isOk = d.status === '예약확정' || d.status === '승인완료' || d.status === '발행완료';
              var stCls = isOk ? 'ok' : (d.status === '수정요청' ? 'stage' : '');
              return '<div style="padding:7px 10px;border-radius:10px;border:1px solid var(--line);font-size:12px;display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap">' +
                '<span style="flex:1;min-width:180px"><b>[' + A.esc(d.channel) + ']</b> ' + A.esc(d.title) + (d.scheduled_date ? ' <small style="opacity:.7">(' + A.esc(d.scheduled_date) + ')</small>' : '') + (d.client_feedback ? ' <em style="color:#d97706">(' + A.esc(d.client_feedback) + ')</em>' : '') + '</span>' +
                '<div style="display:inline-flex;align-items:center;gap:5px">' +
                  '<span class="tag-pill ' + stCls + '">' + A.esc(d.status) + '</span>' +
                  (!isOk ? '<button type="button" class="ws-btn sm ok" data-dlv-approve="' + d.id + '" style="padding:2px 8px;font-size:11px">✅ 바로 승인</button>' : '') +
                '</div>' +
                '</div>';
            }).join('') + '</div>' : '') +
          '</div>' +
          '</div>';
      })() : '') +
      '</div>' +
      '</div>' +
      '</div>';

    root.innerHTML = html;
    bindEvents(root, sel, latestSns, recs);
  }

  function bindEvents(root, sel, latestSns, recs) {
    var q = function (s) { return root.querySelector(s); };
    var newBtn = q('#crmNewBtn');
    if (newBtn) newBtn.addEventListener('click', function () {
      state.selectedId = null;
      state.aiReplies = [];
      render();
      var inp = root.querySelector('#cName');
      if (inp) inp.focus();
    });
    var refBtn = q('#crmRefreshBtn');
    if (refBtn) refBtn.addEventListener('click', function () {
      A.refreshAll().then(function () { A.toast('🔄 고객사 목록을 최신화했습니다.'); });
    });

    Array.prototype.forEach.call(root.querySelectorAll('[data-find]'), function (b) {
      b.addEventListener('click', function () {
        state.filterIndustry = b.getAttribute('data-find');
        render();
      });
    });
    var stSel = q('#crmStageFilter');
    if (stSel) stSel.addEventListener('change', function () {
      state.filterStage = stSel.value;
      render();
    });
    var searchEl = q('#crmSearch');
    if (searchEl) searchEl.addEventListener('input', function () {
      state.search = searchEl.value;
      render();
      var nextInput = root.querySelector('#crmSearch');
      if (nextInput) { nextInput.focus(); nextInput.setSelectionRange(state.search.length, state.search.length); }
    });

    Array.prototype.forEach.call(root.querySelectorAll('.client-card'), function (card) {
      card.addEventListener('click', function () {
        state.selectedId = parseInt(card.getAttribute('data-cid'), 10);
        state.aiReplies = [];
        render();
        loadRepliesForSelected();
        if (window.innerWidth <= 1080) {
          requestAnimationFrame(function () {
            var rc = document.getElementById('crmRightCol');
            if (rc && rc.scrollIntoView) rc.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }
      });
    });

    var sampleCrmBtn = q('#crmSampleBtn');
    if (sampleCrmBtn) sampleCrmBtn.addEventListener('click', function () {
      var s = A.generateUniqueSample();
      if (q('#cName')) q('#cName').value = s.name;
      if (q('#cIndustry')) q('#cIndustry').value = s.industry;
      if (q('#cContact')) q('#cContact').value = s.contact;
      if (q('#cPhone')) q('#cPhone').value = formatPhone(s.phone);
      if (q('#cStage')) q('#cStage').value = s.stage;
      if (q('#cFee')) q('#cFee').value = formatComma(s.fee);
      if (q('#cDbCnt')) q('#cDbCnt').value = s.db;
      if (q('#cDbGoal')) q('#cDbGoal').value = s.goal;
      if (q('#cBlog')) q('#cBlog').value = s.blog;
      if (q('#cInsta')) q('#cInsta').value = s.insta;
      if (q('#cMemo')) q('#cMemo').value = s.memo;
      Array.prototype.forEach.call(root.querySelectorAll('.cSvcChk'), function (chk) {
        chk.checked = s.svcs.indexOf(chk.value) !== -1;
      });
      A.toast('🎲 중복 없는 랜덤 고객사(' + s.name + ' · ' + s.industry + ')가 입력되었습니다!');
    });

    var phoneEl = q('#cPhone');
    if (phoneEl) phoneEl.addEventListener('input', function () {
      phoneEl.value = formatPhone(phoneEl.value);
    });
    var feeEl = q('#cFee');
    if (feeEl) feeEl.addEventListener('input', function () {
      feeEl.value = formatComma(feeEl.value);
    });

    var saveBtn = q('#crmSaveBtn');
    if (saveBtn) saveBtn.addEventListener('click', function () {
      var name = q('#cName').value.trim();
      if (!name) { A.toast('⚠️ 업체명을 입력하세요.'); q('#cName').focus(); return; }
      var services = Array.prototype.filter.call(root.querySelectorAll('.cSvcChk'), function (c) { return c.checked; })
        .map(function (c) { return c.value; });
      var payload = {
        name: name,
        industry: q('#cIndustry').value,
        contact_name: q('#cContact').value.trim(),
        contact_phone: formatPhone(q('#cPhone').value.trim()),
        funnel_stage: q('#cStage').value,
        monthly_fee: parseComma(q('#cFee').value),
        db_count: Number(q('#cDbCnt').value || 0),
        db_goal: Number(q('#cDbGoal').value || 0),
        blog_url: q('#cBlog').value.trim(),
        insta_handle: q('#cInsta').value.trim(),
        services: services,
        memo: q('#cMemo').value.trim(),
      };
      saveBtn.disabled = true;
      var req = sel
        ? A.api('/api/clients/' + sel.id, { method: 'PATCH', body: JSON.stringify(payload) })
        : A.api('/api/clients', { method: 'POST', body: JSON.stringify(payload) });
      req.then(function (d) {
        var createdClient = d.client || null;
        if (createdClient) state.selectedId = createdClient.id;
        // 신규 고객사 등록 시 체크된 대행 서비스에 맞춰 30일 이내 발행 스케줄 자동 생성!
        var autoItems = (!sel && createdClient) ? build30DayScheduleItems(createdClient) : [];
        var scheduleJob = autoItems.length
          ? A.api('/api/deliverables/bulk', { method: 'POST', body: JSON.stringify({ items: autoItems }) })
              .then(function (r) { return (r && r.count) || autoItems.length; })
              .catch(function () { return 0; })
          : Promise.resolve(0);
        return scheduleJob.then(function (autoCnt) {
          return A.refreshAll().then(function () { return autoCnt; });
        });
      }).then(function (autoCnt) {
        if (autoCnt > 0) {
          A.emit('deliverables-updated');
          A.toast('✅ 새 고객사 등록 + 체크된 서비스 기준 30일 이내 콘텐츠 스케줄 ' + autoCnt + '건 자동 배치 완료! 📅');
          loadRepliesForSelected();
        } else {
          A.toast(sel ? '✅ 고객사 정보가 수정되었습니다.' : '✅ 새 고객사가 등록되었습니다! AI 업셀링 추천을 확인하세요.');
        }
        render();
      }).catch(function (err) {
        saveBtn.disabled = false;
        A.toast('❌ 저장 실패: ' + (err.message || ''));
      });
    });

    // VIP 포털 검수대기 항목 대장님 원클릭 바로 승인
    Array.prototype.forEach.call(root.querySelectorAll('[data-dlv-approve]'), function (b) {
      b.addEventListener('click', function () {
        var did = b.getAttribute('data-dlv-approve');
        b.disabled = true;
        A.api('/api/deliverables/' + did, { method: 'PATCH', body: JSON.stringify({ status: '예약확정' }) })
          .then(function () {
            A.toast('✅ 승인 완료! 캘린더에 [예약확정]으로 자동 반영되었습니다.');
            A.emit('deliverables-updated');
            loadRepliesForSelected();
          })
          .catch(function (err) { b.disabled = false; A.toast('승인 실패: ' + (err.message || ''), 'error'); });
      });
    });

    var delBtn = q('#crmDeleteBtn');
    if (delBtn && sel) delBtn.addEventListener('click', function () {
      if (!confirm('"' + sel.name + '" 고객사를 삭제할까요?')) return;
      A.api('/api/clients/' + sel.id, { method: 'DELETE' })
        .then(function () {
          state.selectedId = null;
          state.aiReplies = [];
          return A.refreshAll();
        })
        .then(function () { A.toast('🗑️ 고객사를 삭제했습니다.'); });
    });

    var goSns = q('#crmGoSnsBtn');
    if (goSns && sel) goSns.addEventListener('click', function () { A.transferToSns(sel); });

    var goProp = q('#crmGoPropBtn');
    if (goProp && sel) goProp.addEventListener('click', function () {
      A.transferToProposal({ client: sel, snsReport: latestSns });
    });

    var goCont = q('#crmGoContBtn');
    if (goCont && sel) goCont.addEventListener('click', function () {
      A.transferToContract({ client: sel });
    });

    Array.prototype.forEach.call(root.querySelectorAll('[data-rec-prop]'), function (b) {
      b.addEventListener('click', function () {
        var r = recs[parseInt(b.getAttribute('data-rec-prop'), 10)];
        if (r && sel) {
          A.transferToProposal({
            client: sel,
            snsReport: latestSns,
            upsellRec: r,
          });
        }
      });
    });

    Array.prototype.forEach.call(root.querySelectorAll('[data-ai-prop]'), function (b) {
      b.addEventListener('click', function () {
        var m = state.aiReplies[parseInt(b.getAttribute('data-ai-prop'), 10)];
        if (m && sel) {
          A.transferToProposal({
            client: sel,
            snsReport: latestSns,
            aiText: m.content,
          });
        }
      });
    });

    var askBtn = q('#crmAskAiBtn');
    if (askBtn && sel) askBtn.addEventListener('click', function () {
      var prompt = [
        '[AI 업셀링 · 신규 마케팅 제안 요청]',
        '- 고객사명: ' + sel.name,
        '- 업종: ' + sel.industry,
        '- 현재 이용 서비스: ' + ((sel.services && sel.services.length) ? sel.services.join(', ') : '없음(신규 영업)'),
        '- 퍼널 단계: ' + sel.funnel_stage + ' / 월 대행료: ' + A.won(sel.monthly_fee),
        '- DB 현황: 현재 ' + sel.db_count + '건 / 목표 ' + sel.db_goal + '건',
        sel.blog_url ? '- 네이버 블로그: ' + sel.blog_url : '',
        sel.insta_handle ? '- 인스타그램: ' + sel.insta_handle : '',
        sel.memo ? '- 대표님 메모/이슈: ' + sel.memo : '',
        '',
        '요청사항: 위 고객사(' + sel.name + ')의 업종과 현재 서비스 구성을 분석해서,',
        '1) 당장 실행할 신규 마케팅 기획(네이버 블로그/릴스/퍼널 DB)',
        '2) 객단가를 높일 핵심 업셀링 상품 2가지와 설득 영업 멘트',
        '3) 예상 월 패키지 금액을 핵심만 정리해줘!',
      ].filter(Boolean).join('\n');
      askBtn.disabled = true;
      A.requestAiAssist({ room: 'general', prompt: prompt })
        .catch(function (err) { A.toast('❌ AI 요청 실패: ' + (err.message || '')); })
        .then(function () { askBtn.disabled = false; });
    });

    var loadRepBtn = q('#crmLoadAiReplies');
    if (loadRepBtn && sel) loadRepBtn.addEventListener('click', loadRepliesForSelected);

    var cpPort = q('#crmCopyPortalBtn');
    if (cpPort) cpPort.addEventListener('click', function () {
      var u = cpPort.getAttribute('data-url');
      if (navigator.clipboard) navigator.clipboard.writeText(u).then(function () { A.toast('📋 고객 VIP 포털 링크를 복사했습니다!'); });
    });
    var cpHook = q('#crmCopyHookBtn');
    if (cpHook) cpHook.addEventListener('click', function () {
      var u = cpHook.getAttribute('data-url');
      if (navigator.clipboard) navigator.clipboard.writeText(u).then(function () { A.toast('📡 실시간 DB 웹훅 URL을 복사했습니다! (Typebot·랜딩에 붙여넣기)'); });
    });
    var testLead = q('#crmTestLeadBtn');
    if (testLead && sel) testLead.addEventListener('click', function () {
      testLead.disabled = true;
      fetch('/api/leads/capture?token=' + encodeURIComponent(sel.portal_token || ''), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: '테스트 퍼널(릴스)',
          lead_name: '김상담 테스트',
          lead_phone: '010-1234-5678',
          lead_note: '무료 상담 체크리스트 보고 문의드립니다.',
        }),
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (!d.ok) throw new Error(d.message || '실패');
        A.toast('🎯 테스트 DB 유입 완료! (누적 DB ' + d.db_count + '건 · #일진선도부 알림 전송됨)');
        return A.refreshAll();
      }).catch(function (err) {
        testLead.disabled = false;
        A.toast('❌ 테스트 실패: ' + (err.message || ''));
      });
    });
    var dlvAdd = q('#dlvAddBtn');
    if (dlvAdd && sel) dlvAdd.addEventListener('click', function () {
      var title = q('#dlvTitle').value.trim();
      if (!title) { A.toast('⚠️ 콘텐츠 제목을 입력하세요.'); return; }
      dlvAdd.disabled = true;
      A.api('/api/deliverables', {
        method: 'POST',
        body: JSON.stringify({
          client_id: sel.id,
          channel: q('#dlvCh').value,
          scheduled_date: q('#dlvDate').value,
          title: title,
          preview_text: q('#dlvBody').value.trim(),
        }),
      }).then(function () {
        A.toast('📤 VIP 고객 포털에 승인 요청을 등록했습니다!');
        loadRepliesForSelected();
      }).catch(function (err) {
        dlvAdd.disabled = false;
        A.toast('❌ 등록 실패: ' + (err.message || ''));
      });
    });
  }

  function loadRepliesForSelected() {
    var sel = getSelectedClient();
    if (!sel) return;
    state.loadingReplies = true;
    render();
    Promise.all([
      A.fetchAiRepliesForClient(sel.name).catch(function () { return []; }),
      A.api('/api/deliverables?client_id=' + sel.id).then(function (d) { return d.deliverables || []; }).catch(function () { return []; }),
    ]).then(function (arr) {
      state.aiReplies = arr[0] || [];
      state.deliverables = arr[1] || [];
      state.loadingReplies = false;
      render();
    });
  }

  A.on('data-updated', render);
  A.on('tab-changed', function (t) { if (t === 'crm') render(); });
})();

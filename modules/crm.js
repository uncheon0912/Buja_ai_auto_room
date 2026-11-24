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
                '<span>👤 ' + A.esc(c.contact_name || '담당자 미입력') + (c.contact_phone ? ' (' + A.esc(c.contact_phone) + ')' : '') + '</span>' +
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
        '<div style="display:flex;flex-direction:column;gap:14px">' +
          '<div class="ws-card">' +
            '<h3><span>' + (sel ? '✏️ 고객사 정보 수정 (#' + sel.id + ')' : '➕ 새 고객사 등록') + '</span>' +
              (sel ? '<button type="button" class="ws-btn sm danger" id="crmDeleteBtn">삭제</button>' : '') +
            '</h3>' +
            '<div class="ws-grid-2">' +
              '<div class="ws-field"><label>업체명 *</label><input id="cName" value="' + A.esc(sel ? sel.name : '') + '" placeholder="예: 연세투석검진센터, 한화 홍길동 팀장"></div>' +
              '<div class="ws-field"><label>업종 분류</label><select id="cIndustry">' +
                A.INDUSTRIES.map(function (ind) {
                  return '<option value="' + A.esc(ind.id) + '"' + ((sel ? sel.industry : '병원') === ind.id ? ' selected' : '') + '>' + ind.icon + ' ' + A.esc(ind.label) + '</option>';
                }).join('') +
              '</select></div>' +
              '<div class="ws-field"><label>담당자 / 대표자명</label><input id="cContact" value="' + A.esc(sel ? sel.contact_name : '') + '" placeholder="예: 김대표님"></div>' +
              '<div class="ws-field"><label>연락처</label><input id="cPhone" value="' + A.esc(sel ? sel.contact_phone : '') + '" placeholder="010-0000-0000"></div>' +
              '<div class="ws-field"><label>퍼널 단계</label><select id="cStage">' +
                A.FUNNEL_STAGES.map(function (st) {
                  return '<option value="' + A.esc(st) + '"' + ((sel ? sel.funnel_stage : '신규문의') === st ? ' selected' : '') + '>' + A.esc(st) + '</option>';
                }).join('') +
              '</select></div>' +
              '<div class="ws-field"><label>월 대행 금액 (원)</label><input type="number" id="cFee" value="' + A.esc(sel ? sel.monthly_fee : 0) + '" step="100000" min="0"></div>' +
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
            var estSales = latestSns && latestSns.data ? Number(latestSns.data.closeCount || 0) * Number(latestSns.data.avgDealValue || 0) : 0;
            var roas = budget > 0 && estSales > 0 ? (estSales / budget).toFixed(1) + '배' : '-';
            var pct = sel.db_goal > 0 ? Math.min(100, Math.round((sel.db_count / sel.db_goal) * 100)) : 0;
            return '<div class="ws-card">' +
              '<h3><span>🌟 VIP 고객 포털 · 실시간 DB 웹훅 · KPI</span><span class="tag-pill ok">● 화이트라벨 활성</span></h3>' +
              '<div class="ws-grid-3" style="margin-bottom:10px">' +
                '<div style="background:rgba(2,132,199,0.09);border-radius:10px;padding:8px 10px"><div style="font-size:10.5px;color:var(--muted);font-weight:700">DB 목표 달성률</div><b style="font-size:16px;color:#0284c7">' + pct + '%</b></div>' +
                '<div style="background:rgba(2,132,199,0.09);border-radius:10px;padding:8px 10px"><div style="font-size:10.5px;color:var(--muted);font-weight:700">문의 1건당 비용(CPA)</div><b style="font-size:16px;color:#0284c7">' + (cpa ? A.won(cpa) : '-') + '</b></div>' +
                '<div style="background:rgba(22,163,74,0.1);border-radius:10px;padding:8px 10px"><div style="font-size:10.5px;color:var(--muted);font-weight:700">투자 대비 매출(ROAS)</div><b style="font-size:16px;color:#15803d">' + roas + '</b></div>' +
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
                  state.deliverables.slice(0, 5).map(function (d) {
                    var stCls = d.status === '승인완료' ? 'ok' : (d.status === '수정요청' ? 'stage' : '');
                    return '<div style="padding:7px 10px;border-radius:10px;border:1px solid var(--line);font-size:12px;display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap">' +
                      '<span><b>[' + A.esc(d.channel) + ']</b> ' + A.esc(d.title) + (d.client_feedback ? ' <em style="color:#d97706">(' + A.esc(d.client_feedback) + ')</em>' : '') + '</span>' +
                      '<span class="tag-pill ' + stCls + '">' + A.esc(d.status) + '</span>' +
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
      });
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
        contact_phone: q('#cPhone').value.trim(),
        funnel_stage: q('#cStage').value,
        monthly_fee: Number(q('#cFee').value || 0),
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
        if (d.client) state.selectedId = d.client.id;
        return A.refreshAll();
      }).then(function () {
        A.toast(sel ? '✅ 고객사 정보가 수정되었습니다.' : '✅ 새 고객사가 등록되었습니다! AI 업셀링 추천을 확인하세요.');
        render();
      }).catch(function (err) {
        saveBtn.disabled = false;
        A.toast('❌ 저장 실패: ' + (err.message || ''));
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

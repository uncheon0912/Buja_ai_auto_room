/**
 * 탭 4: 📑 제안서 생성기 (왼쪽 텍스트·패키지 견적 입력 ↔ 오른쪽 실시간 A4 제안서 미리보기 + PDF 출력 + 계약서 원클릭 이관)
 */
(function () {
  'use strict';
  var A = window.AgencyApp;
  if (!A) return;

  function defaultItemsForIndustry(ind) {
    if (ind === '병원') {
      return [
        { name: '네이버 브랜드 블로그 대행 (주 3회 · 월 12편)', qty: 1, price: 1200000, note: '의료법 심의 기준 준수' },
        { name: '원장님 팩트체크 릴스 대행 (월 8편 기획·편집)', qty: 1, price: 1300000, note: '3초 후킹 대본 포함' },
        { name: '신환 상담 DB 퍼널 · 카톡 전환 셋팅', qty: 1, price: 700000, note: '무료 체크리스트 CTA' },
      ];
    }
    if (ind === '보험설계사') {
      return [
        { name: '보장분석 리드(DB) 자동 수집 퍼널 구축', qty: 1, price: 1000000, note: '3문항 간편점검 폼 + DM' },
        { name: '보험금 실수/사례 릴스 대행 (월 10편)', qty: 1, price: 1300000, note: '스레드 요약 연계' },
        { name: '네이버 블로그 신뢰 칼럼 대행 (월 12편)', qty: 1, price: 1000000, note: '핵심 보장 키워드' },
      ];
    }
    if (ind === '정책자금') {
      return [
        { name: '정책자금 무료 한도진단 B2B DB 퍼널 셋팅', qty: 1, price: 1100000, note: '대표자 사전 필터링' },
        { name: '정책자금 핵심 키워드 네이버 블로그 대행 (월 12편)', qty: 1, price: 1200000, note: '승인/부결 사례 칼럼' },
        { name: '정책자금 속보 숏폼 릴스 대행 (월 8편)', qty: 1, price: 1100000, note: '마감 임박 후킹 포맷' },
      ];
    }
    return [
      { name: '네이버 브랜드 블로그 대행 (월 12편)', qty: 1, price: 1000000, note: '지역·업종 키워드 공략' },
      { name: '인스타그램 릴스 대행 (월 8편)', qty: 1, price: 1100000, note: '기획·대본·자막 편집' },
      { name: '브랜딩 컨셉 & DB 전환 퍼널 셋팅', qty: 1, price: 600000, note: '프로필·랜딩 동선 최적화' },
    ];
  }

  function blankForm(industry) {
    var ind = industry || '병원';
    var pb = A.INDUSTRY_PLAYBOOK[ind] || A.INDUSTRY_PLAYBOOK['브랜드/기타'];
    return {
      id: null,
      client_id: '',
      client_name: '',
      contact_name: '',
      industry: ind,
      status: '작성중',
      title: ind + ' 맞춤 SNS 브랜딩 · DB 퍼널 마케팅 제안서',
      validUntil: A.todayKst(),
      diagnosis: '현재 채널 노출 대비 실제 상담·문의(DB)로 이어지는 전환 동선이 약합니다. 검색(블로그)과 확산(릴스)을 하나의 DB 수집 퍼널로 묶어 지속적인 가망고객 유입 구조를 구축해야 합니다.',
      concept: pb.coreHook,
      strategyBlog: pb.blogStrategy,
      strategyReels: pb.reelsStrategy,
      strategyFunnel: pb.funnelStrategy,
      roadmap: '1개월 차: 브랜드 포지셔닝 확정, 프로필·블로그 디자인 리뉴얼, DB 수집 퍼널 셋팅\n2개월 차: 핵심 키워드 블로그 주 3회 + 3초 후킹 릴스 월 8편 본격 발행\n3개월 차: 고전환 소재 집중 확대, DB 단가 최적화 및 월간 성과 보고',
      discountRate: 0,
      includeVat: true,
      items: defaultItemsForIndustry(ind),
    };
  }

  var form = blankForm('병원');

  function calcTotals() {
    var sub = (form.items || []).reduce(function (acc, it) {
      return acc + (Number(it.qty || 1) * Number(it.price || 0));
    }, 0);
    var disc = Math.round(sub * (Number(form.discountRate || 0) / 100));
    var supply = Math.max(0, sub - disc);
    var vat = form.includeVat ? Math.round(supply * 0.1) : 0;
    return { sub: sub, disc: disc, supply: supply, vat: vat, total: supply + vat };
  }

  function previewHtml() {
    var prof = A.store.agencyProfile || A.DEFAULT_AGENCY_PROFILE;
    var tot = calcTotals();
    return '<div class="a4-sheet">' +
      '<div class="doc-banner">' +
        '<div style="font-size:11.5px;font-weight:800;letter-spacing:.08em;color:#bae6fd;margin-bottom:4px">MARKETING PROPOSAL · ' + A.esc(prof.company || '미담공장') + '</div>' +
        '<h1>' + A.esc(form.title || '마케팅 대행 제안서') + '</h1>' +
        '<p>수신: ' + A.esc(form.client_name || '(고객사명)') + (form.contact_name ? ' ' + A.esc(form.contact_name) + ' 귀하' : ' 귀하') + ' · 업종: ' + A.esc(form.industry) + ' · 작성일: ' + A.todayKst() + '</p>' +
      '</div>' +

      '<div class="sec-title">1. 현황 진단 및 핵심 과제</div>' +
      '<div class="clause-body">' + A.esc(form.diagnosis) + '</div>' +

      '<div class="sec-title">2. 핵심 브랜딩 컨셉 &amp; 포지셔닝</div>' +
      '<div class="sum-box" style="display:block"><b style="color:#0c4a6e;font-size:14px">“' + A.esc(form.concept) + '”</b></div>' +

      '<div class="sec-title">3. 채널별 맞춤 실행 전략</div>' +
      '<table>' +
        '<tr><th style="width:130px">네이버 블로그</th><td>' + A.esc(form.strategyBlog) + '</td></tr>' +
        '<tr><th>인스타그램 릴스</th><td>' + A.esc(form.strategyReels) + '</td></tr>' +
        '<tr><th>퍼널 · DB 수집</th><td>' + A.esc(form.strategyFunnel) + '</td></tr>' +
      '</table>' +

      '<div class="sec-title">4. 추천 패키지 &amp; 견적 내역</div>' +
      '<table>' +
        '<thead><tr><th>서비스 항목</th><th class="num" style="width:62px">수량</th><th class="num" style="width:110px">단가</th><th class="num" style="width:115px">금액</th><th>비고</th></tr></thead>' +
        '<tbody>' +
          (form.items || []).map(function (it) {
            var amt = Number(it.qty || 1) * Number(it.price || 0);
            return '<tr><td><b>' + A.esc(it.name) + '</b></td><td class="num">' + Number(it.qty || 1) + '</td><td class="num">' + A.won(it.price) + '</td><td class="num"><b>' + A.won(amt) + '</b></td><td>' + A.esc(it.note || '') + '</td></tr>';
          }).join('') +
        '</tbody>' +
      '</table>' +

      '<div class="sum-box">' +
        '<div style="font-size:12.2px;color:#334155">' +
          '공급가액 <b>' + A.won(tot.supply) + '</b>' +
          (tot.disc > 0 ? ' (패키지 할인 -' + A.won(tot.disc) + ')' : '') +
          ' · ' + (form.includeVat ? '부가세(10%) <b>' + A.won(tot.vat) + '</b>' : '부가세 별도') +
        '</div>' +
        '<div class="big">최종 제안가 ' + A.won(tot.total) + '</div>' +
      '</div>' +

      '<div class="sec-title">5. 단계별 진행 로드맵 (타임스케줄)</div>' +
      A.renderTimelineGantt(form.roadmap) +

      '<div style="margin-top:26px;padding-top:12px;border-top:1px dashed #cbd5e1;font-size:11.8px;color:#475569;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">' +
        '<span><b>제안사:</b> ' + A.esc(prof.company || '미담공장') + ' · 대표 ' + A.esc(prof.ceo || '') + ' · ' + A.esc(prof.phone || '') + '</span>' +
        '<span>제안 유효일: ' + A.esc(form.validUntil || A.todayKst()) + '</span>' +
      '</div>' +
    '</div>';
  }

  function updatePreviewOnly() {
    var box = document.getElementById('propPreviewBox');
    if (box) box.innerHTML = previewHtml();
  }

  function render() {
    var root = document.getElementById('pane-proposal');
    if (!root) return;
    var proposals = A.store.proposals || [];
    var clients = A.store.clients || [];

    root.innerHTML = '<div class="ws-split">' +
      '<div class="split-editor">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">' +
          '<h3 style="margin:0;font-size:15px;color:#0c4a6e">📑 마케팅 제안서 · 견적서 편집</h3>' +
          '<div class="ws-actions">' +
            '<button type="button" class="ws-btn sm accent" id="propSampleBtn" title="랜덤 예시 제안서 자동 채우기">🎲 Sample</button>' +
            '<button type="button" class="ws-btn sm" id="propNewBtn">➕ 새 제안서</button>' +
            (form.id ? '<button type="button" class="ws-btn sm danger" id="propDelBtn">삭제</button>' : '') +
          '</div>' +
        '</div>' +

        (proposals.length ? '<div class="saved-bar"><span style="font-size:11px;font-weight:800;color:#0369a1">저장된 제안서:</span>' +
          proposals.slice(0, 10).map(function (p) {
            return '<button type="button" class="saved-chip' + (form.id === p.id ? ' active' : '') + '" data-pid="' + p.id + '">' + A.esc(p.client_name || p.title) + ' (' + A.won(p.total_amount) + ')</button>';
          }).join('') + '</div>' : '') +

        '<div class="ws-grid-2">' +
          '<div class="ws-field"><label>고객사 불러오기</label><select id="propClientSel">' +
            '<option value="">직접 입력</option>' +
            clients.map(function (c) {
              return '<option value="' + c.id + '"' + (String(form.client_id) === String(c.id) ? ' selected' : '') + '>' + A.esc(c.name) + ' (' + A.esc(c.industry) + ')</option>';
            }).join('') +
          '</select></div>' +
          '<div class="ws-field"><label>업종별 추천 템플릿 불러오기</label><div style="display:flex;gap:5px"><select id="propTplInd">' +
            A.INDUSTRIES.map(function (i) { return '<option value="' + A.esc(i.id) + '"' + (form.industry === i.id ? ' selected' : '') + '>' + i.icon + ' ' + A.esc(i.id) + '</option>'; }).join('') +
          '</select><button type="button" class="ws-btn sm" id="propApplyTpl">적용</button></div></div>' +
          '<div class="ws-field"><label>고객사명</label><input data-pf="client_name" value="' + A.esc(form.client_name) + '" placeholder="예: 미담투석검진센터"></div>' +
          '<div class="ws-field"><label>담당자 / 대표자명</label><input data-pf="contact_name" value="' + A.esc(form.contact_name) + '" placeholder="예: 김대표님"></div>' +
        '</div>' +

        '<div class="ws-grid-2">' +
          '<div class="ws-field"><label>제안서 제목</label><input data-pf="title" value="' + A.esc(form.title) + '"></div>' +
          '<div class="ws-field"><label>상태 / 유효일</label><div style="display:flex;gap:6px"><select data-pf="status" style="width:45%">' +
            ['작성중', '발송완료', '수락'].map(function (s) { return '<option value="' + s + '"' + (form.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') +
          '</select><input type="date" data-pf="validUntil" value="' + A.esc(form.validUntil) + '"></div></div>' +
        '</div>' +

        '<div class="ws-field"><label>1. 현황 진단 및 핵심 과제</label><textarea data-pf="diagnosis">' + A.esc(form.diagnosis) + '</textarea></div>' +
        '<div class="ws-field"><label>2. 핵심 브랜딩 컨셉 한 줄</label><input data-pf="concept" value="' + A.esc(form.concept) + '"></div>' +
        '<div class="ws-field"><label>3-1. 네이버 블로그 전략</label><textarea data-pf="strategyBlog" style="min-height:58px">' + A.esc(form.strategyBlog) + '</textarea></div>' +
        '<div class="ws-field"><label>3-2. 인스타그램 릴스 전략</label><textarea data-pf="strategyReels" style="min-height:58px">' + A.esc(form.strategyReels) + '</textarea></div>' +
        '<div class="ws-field"><label>3-3. 퍼널 · DB 수집 전략</label><textarea data-pf="strategyFunnel" style="min-height:58px">' + A.esc(form.strategyFunnel) + '</textarea></div>' +

        '<div class="ws-card" style="padding:12px">' +
          '<h3 style="margin-bottom:8px;font-size:13px"><span>💰 4. 패키지 서비스 · 견적 항목</span><span style="display:flex;gap:5px"><button type="button" class="ws-btn sm danger" id="propPopItem" title="마지막 항목 삭제">− 항목 빼기</button><button type="button" class="ws-btn sm primary" id="propAddItem">+ 항목 추가</button></span></h3>' +
          '<div class="line-items" id="propItemsBox">' +
            '<div class="line-head"><span>서비스 항목명</span><span>수량</span><span>단가(원)</span><span>비고</span><span>삭제</span></div>' +
            (form.items || []).map(function (it, idx) {
              return '<div class="line-row" data-pidx="' + idx + '">' +
                '<input placeholder="서비스명" data-pk="name" value="' + A.esc(it.name) + '">' +
                '<input type="number" min="1" placeholder="수량" data-pk="qty" value="' + A.esc(it.qty) + '">' +
                '<input type="number" step="50000" min="0" placeholder="단가" data-pk="price" value="' + A.esc(it.price) + '">' +
                '<input placeholder="비고" data-pk="note" value="' + A.esc(it.note || '') + '">' +
                '<button type="button" class="ws-btn sm danger line-del" data-pdel="' + idx + '" title="이 항목 삭제">−</button>' +
              '</div>';
            }).join('') +
          '</div>' +
          '<div class="ws-grid-2" style="margin-top:10px">' +
            '<div class="ws-field"><label>패키지 할인율 (%)</label><input type="number" min="0" max="50" data-pf="discountRate" value="' + A.esc(form.discountRate) + '"></div>' +
            '<div class="ws-field"><label>부가세 (10%)</label><label class="chip-check" style="margin-top:4px"><input type="checkbox" id="propVatChk"' + (form.includeVat ? ' checked' : '') + '> 부가세 10% 합계 포함</label></div>' +
          '</div>' +
        '</div>' +

        '<div class="ws-field"><label>5. 단계별 진행 로드맵 (예: "1개월 차: ...", "1~2개월 차: ..." → 오른쪽 가로 타임스케줄 그래프 자동 생성)</label><textarea data-pf="roadmap" style="min-height:92px">' + A.esc(form.roadmap) + '</textarea></div>' +
        '<div style="margin-top:10px;padding:12px;border-radius:12px;background:rgba(2,132,199,0.09);border:1.5px solid rgba(56,189,248,0.35);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">' +
          '<span style="font-size:12px;font-weight:700;color:#0c4a6e">🔗 이 제안서의 업체·견적·할인·로드맵을 <b>통일된 계약서 폼</b>으로 한 번에 넘기세요!</span>' +
          '<button type="button" class="ws-btn primary" id="propToContBtnLeft">📄 제안서 그대로 계약서 자동 작성 →</button>' +
        '</div>' +
      '</div>' +

      '<div class="split-preview">' +
        '<div class="preview-toolbar">' +
          '<span style="font-size:12.5px;font-weight:800;color:#0c4a6e">👁️ 실시간 A4 제안서 미리보기</span>' +
          '<div class="ws-actions">' +
            '<button type="button" class="ws-btn sm ai" id="propAskAiBtn">🤖 AI 초안 요청</button>' +
            '<button type="button" class="ws-btn sm primary" id="propSaveBtn">💾 제안서 저장</button>' +
            '<button type="button" class="ws-btn sm warn" id="propToContBtn">📄 제안서 그대로 계약서 전환</button>' +
            '<button type="button" class="ws-btn sm" id="propDownloadHtmlBtn">🌐 HTML 다운</button>' +
            '<button type="button" class="ws-btn sm ok" id="propPrintBtn">🖨️ PDF / 인쇄</button>' +
          '</div>' +
        '</div>' +
        '<div id="propPreviewBox" style="width:100%;display:flex;justify-content:center">' + previewHtml() + '</div>' +
      '</div>' +
    '</div>';

    bindEvents(root);
  }

  function bindEvents(root) {
    var q = function (s) { return root.querySelector(s); };
    Array.prototype.forEach.call(root.querySelectorAll('[data-pf]'), function (el) {
      var ev = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(ev, function () {
        var k = el.getAttribute('data-pf');
        form[k] = el.type === 'number' ? Number(el.value || 0) : el.value;
        updatePreviewOnly();
      });
    });

    var vatChk = q('#propVatChk');
    if (vatChk) vatChk.addEventListener('change', function () {
      form.includeVat = vatChk.checked;
      updatePreviewOnly();
    });

    Array.prototype.forEach.call(root.querySelectorAll('#propItemsBox .line-row'), function (row) {
      var idx = parseInt(row.getAttribute('data-pidx'), 10);
      Array.prototype.forEach.call(row.querySelectorAll('[data-pk]'), function (inp) {
        inp.addEventListener('input', function () {
          var k = inp.getAttribute('data-pk');
          form.items[idx][k] = inp.type === 'number' ? Number(inp.value || 0) : inp.value;
          updatePreviewOnly();
        });
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-pdel]'), function (b) {
      b.addEventListener('click', function () {
        form.items.splice(parseInt(b.getAttribute('data-pdel'), 10), 1);
        render();
      });
    });

    var addItem = q('#propAddItem');
    if (addItem) addItem.addEventListener('click', function () {
      form.items.push({ name: '추가 마케팅 서비스', qty: 1, price: 500000, note: '' });
      render();
    });
    var popItem = q('#propPopItem');
    if (popItem) popItem.addEventListener('click', function () {
      if (!form.items.length) { A.toast('삭제할 항목이 없습니다.'); return; }
      form.items.pop();
      render();
    });

    var csel = q('#propClientSel');
    if (csel) csel.addEventListener('change', function () {
      var cid = parseInt(csel.value, 10);
      var c = A.store.clients.filter(function (x) { return x.id === cid; })[0];
      if (c) {
        applyClientToForm(c);
        render();
      }
    });

    var applyTpl = q('#propApplyTpl');
    if (applyTpl) applyTpl.addEventListener('click', function () {
      var ind = q('#propTplInd').value;
      var keep = { id: form.id, client_id: form.client_id, client_name: form.client_name, contact_name: form.contact_name };
      form = Object.assign(blankForm(ind), keep);
      render();
      A.toast('✨ "' + ind + '" 업종 맞춤 제안서 템플릿을 적용했습니다.');
    });

    Array.prototype.forEach.call(root.querySelectorAll('[data-pid]'), function (b) {
      b.addEventListener('click', function () {
        var id = parseInt(b.getAttribute('data-pid'), 10);
        var p = A.store.proposals.filter(function (x) { return x.id === id; })[0];
        if (p) {
          form = Object.assign(blankForm(p.industry || '병원'), p.data || {}, {
            id: p.id,
            client_id: p.client_id || '',
            client_name: p.client_name || '',
            industry: p.industry || '병원',
            title: p.title || '',
            status: p.status || '작성중',
          });
          render();
        }
      });
    });

    var samplePropBtn = q('#propSampleBtn');
    if (samplePropBtn) samplePropBtn.addEventListener('click', function () {
      var s = A.generateUniqueSample();
      form = Object.assign(blankForm(s.industry), {
        client_name: s.name,
        contact_name: s.contact + '님',
        title: s.proposalTitle,
        discountRate: s.discountRate,
      });
      render();
      A.toast('🎲 중복 없는 랜덤 제안서(' + s.name + ' · ' + s.industry + ')가 자동 기입되었습니다!');
    });

    var newBtn = q('#propNewBtn');
    if (newBtn) newBtn.addEventListener('click', function () { form = blankForm('병원'); render(); });

    var delBtn = q('#propDelBtn');
    if (delBtn && form.id) delBtn.addEventListener('click', function () {
      if (!confirm('이 제안서를 삭제할까요?')) return;
      A.api('/api/proposals/' + form.id, { method: 'DELETE' })
        .then(function () { form = blankForm('병원'); return A.refreshAll(); })
        .then(function () { A.toast('🗑️ 제안서를 삭제했습니다.'); });
    });

    var saveBtn = q('#propSaveBtn');
    if (saveBtn) saveBtn.addEventListener('click', function () {
      if (!form.client_name.trim()) { A.toast('⚠️ 고객사명을 입력하세요.'); return; }
      var tot = calcTotals();
      var payload = {
        client_id: form.client_id || null,
        client_name: form.client_name.trim(),
        industry: form.industry,
        title: form.title.trim(),
        status: form.status,
        total_amount: tot.total,
        data: Object.assign({}, form),
      };
      var req = form.id
        ? A.api('/api/proposals/' + form.id, { method: 'PATCH', body: JSON.stringify(payload) })
        : A.api('/api/proposals', { method: 'POST', body: JSON.stringify(payload) });
      req.then(function (d) {
        if (d.proposal) form.id = d.proposal.id;
        return A.refreshAll();
      }).then(function () {
        A.toast('✅ 제안서가 저장되었습니다.');
        render();
      }).catch(function (err) { A.toast('❌ 저장 실패: ' + (err.message || '')); });
    });

    var askBtn = q('#propAskAiBtn');
    if (askBtn) askBtn.addEventListener('click', function () {
      var tot = calcTotals();
      var prompt = [
        '@홍보부 드럼통 @CS 딸랑이 @지피고 씹던껌 @대장 비서실',
        '[AI 맞춤 제안서 본문 초안 요청 · 종합반 합동 의논]',
        '- 고객사: ' + (form.client_name || '미지정') + ' (' + form.industry + ')',
        '- 제안 제목: ' + form.title,
        '- 현황 메모: ' + form.diagnosis,
        '- 제안 패키지: ' + (form.items || []).map(function (i) { return i.name + ': ' + Number(i.price || 0).toLocaleString() + '원'; }).join(' / ') + ' (총액 ' + A.won(tot.total) + ')',
        '',
        '요청: 일진 종합반에서 서로 아이디어를 교류하고 디벨롭해서 최종 승인용 제안서 초안을 아래 형식으로 정리해줘!',
        '[핵심 컨셉] / [현황 진단] / [네이버 블로그 전략] / [인스타 릴스 전략] / [퍼널·DB 전략] / [단계별 진행 로드맵(1개월 차/2개월 차/3개월 차)]',
      ].join('\n');
      A.requestAiAssist({ room: 'general', prompt: prompt }).then(function () {
        if (window.BujaChat && window.BujaChat.openRoom) window.BujaChat.openRoom('general');
      }).catch(function (err) {
        A.toast('❌ AI 요청 실패: ' + (err.message || ''));
      });
    });

    function sendProposalToContract() {
      var c = A.store.clients.filter(function (x) {
        return (form.client_id && String(x.id) === String(form.client_id)) ||
          (form.client_name && x.name === form.client_name.trim());
      })[0] || null;
      A.transferToContract({ client: c, proposal: Object.assign({}, form, { totals: calcTotals() }) });
    }
    var toCont = q('#propToContBtn');
    if (toCont) toCont.addEventListener('click', sendProposalToContract);
    var toContLeft = q('#propToContBtnLeft');
    if (toContLeft) toContLeft.addEventListener('click', sendProposalToContract);

    var printBtn = q('#propPrintBtn');
    if (printBtn) printBtn.addEventListener('click', function () {
      A.printPane('pane-proposal', (form.client_name || '고객사') + '_제안서_' + A.todayKst());
    });

    // 🌐 제안서 독립 실행형 고급 HTML 파일 다운로드 (고객에게 카톡/메일 전달 시 어떤 기기에서도 완벽 열람 + 내장 PDF 인쇄 버튼)
    var dlHtmlBtn = q('#propDownloadHtmlBtn');
    if (dlHtmlBtn) dlHtmlBtn.addEventListener('click', function () {
      var title = (form.client_name || '고객사') + '_제안서_' + A.todayKst();
      var fullHtml = '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>' + A.esc(title) + '</title>\n<style>' +
        '*{box-sizing:border-box}body{margin:0;background:linear-gradient(150deg,#0f172a,#1e293b);padding:26px 14px 48px;font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard","Malgun Gothic",sans-serif;color:#111827}' +
        '.top-act{max-width:820px;margin:0 auto 14px;display:flex;justify-content:space-between;align-items:center;color:#e2e8f0;font-size:13px;font-weight:700}' +
        '.top-act button{border:0;border-radius:999px;padding:8px 16px;background:linear-gradient(135deg,#0284c7,#38bdf8);color:#fff;font-weight:800;cursor:pointer;box-shadow:0 6px 18px rgba(2,132,199,0.35)}' +
        '.a4-sheet{max-width:820px;margin:0 auto;background:#fff;border-radius:12px;padding:44px 48px 50px;box-shadow:0 24px 60px rgba(0,0,0,0.4);font-size:13px;line-height:1.68}' +
        '.doc-banner{background:linear-gradient(135deg,#0c4a6e,#0284c7);color:#fff;border-radius:12px;padding:22px 26px;margin-bottom:20px}' +
        '.doc-banner h1{margin:0 0 6px;font-size:23px;color:#fff}.doc-banner p{margin:0;font-size:12.5px;color:#e0f2fe}' +
        '.sec-title{font-size:14.5px;font-weight:900;color:#0c4a6e;border-left:4px solid #0284c7;padding-left:9px;margin:20px 0 9px}' +
        'table{width:100%;border-collapse:collapse;margin:10px 0 14px;font-size:12.5px}th,td{border:1px solid #cbd5e1;padding:8px 10px;text-align:left;vertical-align:top}' +
        'th{background:#f1f5f9;font-weight:800;color:#1e293b}.num{text-align:right;font-variant-numeric:tabular-nums}' +
        '.sum-box{background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin:12px 0}' +
        '.sum-box .big{font-size:18px;font-weight:900;color:#0284c7}.clause-body{white-space:pre-wrap;word-break:keep-all;font-size:12.8px;line-height:1.75;color:#1f2937}' +
        '.gantt-wrap{border:1px solid #cbd5e1;border-radius:12px;overflow:hidden;background:#fff;margin:10px 0 14px}' +
        '.gantt-head{display:grid;grid-template-columns:150px 1fr;background:#f1f5f9;border-bottom:1px solid #cbd5e1;font-size:11px;font-weight:800;color:#0c4a6e}' +
        '.gantt-head-lbl{padding:7px 10px;border-right:1px solid #cbd5e1}.gantt-cols{display:grid;align-items:center}' +
        '.gantt-col{text-align:center;padding:7px 4px;border-right:1px dashed #cbd5e1}.gantt-col:last-child{border-right:0}' +
        '.gantt-row{display:grid;grid-template-columns:150px 1fr;border-bottom:1px solid #e2e8f0}.gantt-row:last-child{border-bottom:0}' +
        '.gantt-meta{padding:9px 10px;border-right:1px solid #e2e8f0;background:#f8fafc;display:flex;align-items:center}' +
        '.gantt-step-tag{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:900}.gantt-step-num{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:6px;color:#fff;font-size:10px;font-weight:900}' +
        '.gantt-track-cell{position:relative;padding:9px 10px 8px;display:flex;flex-direction:column;gap:5px}.gantt-gridlines{position:absolute;inset:0;display:grid;pointer-events:none}' +
        '.gantt-gridlines span{border-right:1px dashed #e2e8f0}.gantt-gridlines span:last-child{border-right:0}' +
        '.gantt-bar-lane{position:relative;height:22px;z-index:1}.gantt-bar{position:absolute;top:0;height:22px;border-radius:999px;display:flex;align-items:center;padding:0 10px;color:#fff;font-size:10.6px;font-weight:800;box-shadow:0 3px 8px rgba(15,23,42,0.15);-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
        '.gantt-desc{position:relative;z-index:1;font-size:11.5px;line-height:1.45;color:#334155}' +
        '@media print{@page{size:A4 portrait;margin:10mm}body{background:#fff;padding:0}.top-act{display:none}.a4-sheet{box-shadow:none;padding:4mm 6mm;border-radius:0;max-width:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}}' +
        '</style></head><body>' +
        '<div class="top-act"><span>📑 ' + A.esc(form.title || '마케팅 제안서') + '</span><button onclick="window.print()">🖨️ PDF 저장 / 인쇄</button></div>' +
        previewHtml() + '</body></html>';
      var blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = title.replace(/[\\/:*?"<>|]/g, '_') + '.html';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 300);
      A.toast('🌐 제안서 HTML 파일 다운로드 완료!');
    });
  }

  function applyClientToForm(c, snsReport, upsellRec, aiText) {
    var base = blankForm(c.industry || '병원');
    base.client_id = c.id || '';
    base.client_name = c.name || '';
    base.contact_name = c.contact_name || '';
    base.title = (c.name ? c.name + ' ' : '') + (c.industry || '') + ' 맞춤 SNS · DB 퍼널 마케팅 제안서';
    if (c.memo) base.diagnosis = c.memo + '\n\n' + base.diagnosis;
    if (snsReport && snsReport.data) {
      var sd = snsReport.data;
      base.diagnosis = '[SNS 정밀 진단 요약]\n' + (sd.summary || '') +
        '\n- 블로그 일방문자 ' + (sd.blogDailyVisits || 0) + '명 (SEO ' + (sd.blogScore || 0) + '점) / 릴스 평균 조회수 ' + (sd.reelsAvgViews || 0) + '회 / DB ' + (sd.funnelDb || 0) + '건';
      if (sd.actionPlan) base.roadmap = sd.actionPlan;
    }
    if (upsellRec) {
      base.title = (c.name || '') + ' 성과 극대화 업셀링 제안서 (' + upsellRec.service + ')';
      base.concept = upsellRec.title;
      base.diagnosis = upsellRec.reason + (c.memo ? '\n\n[고객사 현황 메모] ' + c.memo : '');
      base.items = [
        { name: upsellRec.title, qty: 1, price: upsellRec.price || 1000000, note: '업셀링 핵심 패키지' },
      ];
      if (c.monthly_fee > 0) {
        base.items.unshift({ name: '기존 대행 서비스 (' + ((c.services || []).join(', ') || '기본 운영') + ')', qty: 1, price: c.monthly_fee, note: '기존 유지 항목' });
      }
    }
    if (aiText) {
      base.strategyBlog = aiText.slice(0, 1200);
    }
    form = base;
  }

  A.on('transfer-proposal', function (payload) {
    if (payload && payload.client) {
      applyClientToForm(payload.client, payload.snsReport, payload.upsellRec, payload.aiText);
      render();
      A.toast('📑 "' + payload.client.name + '" 맞춤 제안서 초안을 채웠습니다!');
    }
  });

  // 채팅창에서 대장님이 "제안서 승인·적용" 클릭 시 AI 최종안 내용을 제안서 각 필드에 자동 반영
  A.on('apply-ai-proposal', function (payload) {
    var p = (payload && payload.parsed) || {};
    var msg = payload && payload.message;
    if (p.client_name) form.client_name = p.client_name;
    if (p.title) form.title = p.title;
    if (p.concept) form.concept = p.concept;
    if (p.diagnosis) form.diagnosis = p.diagnosis;
    if (p.strategyBlog) form.strategyBlog = p.strategyBlog;
    if (p.strategyReels) form.strategyReels = p.strategyReels;
    if (p.strategyFunnel) form.strategyFunnel = p.strategyFunnel;
    if (p.roadmap) form.roadmap = p.roadmap;
    if (p.items && p.items.length) form.items = p.items;
    // 구조화 헤딩이 없는 자유 형식 답변이면 핵심 전략 칸에 통째로 반영
    if (!p.diagnosis && !p.strategyBlog && !p.strategyReels && !p.roadmap && p.raw) {
      form.diagnosis = p.raw.slice(0, 1800);
    }
    render();
    A.toast('✅ ' + (msg ? msg.sender + '의 ' : '') + '승인 내용을 제안서 양식에 자동 반영했습니다!');
  });

  A.on('data-updated', function () { if (A.store.activeTab === 'proposal') render(); });
  A.on('tab-changed', function (t) { if (t === 'proposal') render(); });
})();

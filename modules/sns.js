/**
 * 탭 3: 🔍 SNS 분석 보고 (네이버 블로그 · 인스타 릴스 · 퍼널 DB 진단 ↔ 실시간 A4 보고서 미리보기 & PDF 출력)
 */
(function () {
  'use strict';
  var A = window.AgencyApp;
  if (!A) return;

  function blankForm() {
    var ym = A.todayKst().slice(0, 7);
    return {
      id: null,
      client_id: '',
      client_name: '',
      industry: '병원',
      period: ym + ' 월간 SNS 진단',
      blogUrl: '',
      blogNeighbors: 850,
      blogDailyVisits: 320,
      blogMonthlyPosts: 12,
      blogKeywords: '지역 핵심 키워드, 시술/상담 키워드',
      blogScore: 68,
      blogComment: '정보성 키워드 유입은 꾸준히 발생 중이나, 포스팅 하단 상담 전환 배너(CTA) 및 대표 키워드 상위 노출 보강이 필요합니다.',
      instaHandle: '',
      instaFollowers: 1450,
      reelsAvgViews: 2800,
      reelsSaveRate: '3.4%',
      reelsScore: 62,
      reelsComment: '초반 3초 후킹 자막과 실수 경고형 숏폼 포맷을 도입하면 도달률과 저장률을 2배 이상 끌어올릴 수 있습니다.',
      funnelVisits: 480,
      funnelDb: 22,
      funnelScore: 70,
      // 쉬운 KPI 계산용 (마케팅 투입비 · 계약 전환율 · 객단가)
      marketingBudget: 2000000,
      closeCount: 6,
      avgDealValue: 1500000,
      summary: '네이버 블로그의 신뢰 기반 검색 유입과 인스타그램 릴스의 지역 확산력을 결합하고, 3문항 간편 DB 상담 퍼널을 연결하는 전략을 권장합니다.',
      actionPlan: '1주차: 핵심 키워드 20개 클러스터링 및 프로필/배너 전환 동선 정비\n2주차: 블로그 정보성 3편 + 릴스 3초 후킹 2편 집중 발행\n3주차: 무료 진단 체크리스트 리드 마그넷 배포 및 DB 유입 테스트\n4주차: 성과 데이터 분석 및 고전환 소재 증액·업셀링 제안',
    };
  }

  var form = blankForm();
  var autoScore = true;

  // 🧮 객관적 실제 수치 기반 3대 점수(블로그 SEO · 릴스 확산 · 퍼널 전환) 자동 계산 엔진
  function computeAutoScores() {
    // 1) 네이버 블로그 SEO 점수 (100점 = 일방문자 45 + 월발행 30 + 이웃수 25)
    var visits = Math.max(0, Number(form.blogDailyVisits || 0));
    var posts = Math.max(0, Number(form.blogMonthlyPosts || 0));
    var neigh = Math.max(0, Number(form.blogNeighbors || 0));
    var bVisitPts = Math.min(45, Math.round((Math.log10(visits + 1) / Math.log10(3001)) * 45));
    var bPostPts  = Math.min(30, Math.round((Math.min(posts, 16) / 12) * 30));
    var bNeighPts = Math.min(25, Math.round((Math.log10(neigh + 1) / Math.log10(5001)) * 25));
    form.blogScore = Math.max(10, Math.min(100, bVisitPts + bPostPts + bNeighPts));

    // 2) 인스타 릴스 확산 점수 (100점 = 평균조회수 45 + 저장/공유율 35 + 팔로워 기반 20)
    var views = Math.max(0, Number(form.reelsAvgViews || 0));
    var foll  = Math.max(0, Number(form.instaFollowers || 0));
    var saveNum = parseFloat(String(form.reelsSaveRate || '0').replace(/[^0-9.]/g, '')) || 0;
    var rViewPts = Math.min(45, Math.round((Math.log10(views + 1) / Math.log10(15001)) * 45));
    var rSavePts = Math.min(35, Math.round((Math.min(saveNum, 6) / 5) * 35));
    var rFollPts = Math.min(20, Math.round((Math.log10(foll + 1) / Math.log10(10001)) * 20));
    form.reelsScore = Math.max(10, Math.min(100, rViewPts + rSavePts + rFollPts));

    // 3) 퍼널 · DB 전환 점수 (100점 = 전환율 55 + 월 DB 볼륨 45)
    var fVis = Math.max(0, Number(form.funnelVisits || 0));
    var fDb  = Math.max(0, Number(form.funnelDb || 0));
    var convPct = fVis > 0 ? (fDb / fVis) * 100 : 0;
    var fConvPts = Math.min(55, Math.round((Math.min(convPct, 7) / 5) * 55));
    var fDbPts   = Math.min(45, Math.round((Math.min(fDb, 40) / 30) * 45));
    form.funnelScore = Math.max(10, Math.min(100, fConvPts + fDbPts));
  }
  computeAutoScores();

  function calcConvRate() {
    var v = Number(form.funnelVisits || 0);
    var db = Number(form.funnelDb || 0);
    if (!v) return '0.0%';
    return ((db / v) * 100).toFixed(1) + '%';
  }

  function avgScore() {
    return Math.round((Number(form.blogScore || 0) + Number(form.reelsScore || 0) + Number(form.funnelScore || 0)) / 3);
  }

  function calcEasyKpi() {
    var reach = Number(form.blogDailyVisits || 0) * 30 + Number(form.reelsAvgViews || 0) * 4;
    var visits = Number(form.funnelVisits || 0);
    var db = Number(form.funnelDb || 0);
    var budget = Number(form.marketingBudget || 0);
    var closes = Number(form.closeCount || 0);
    var dealVal = Number(form.avgDealValue || 0);
    var cpa = db > 0 && budget > 0 ? Math.round(budget / db) : 0;
    var estSales = closes * dealVal;
    var roas = budget > 0 && estSales > 0 ? (estSales / budget) : 0;
    var grade = roas >= 5 ? { label: '🟢 매우 우수 (확장 추천)', color: '#15803d', bg: '#dcfce7' }
      : roas >= 2.5 ? { label: '🟡 양호 (전환율 보강 시 급성장)', color: '#b45309', bg: '#fef3c7' }
      : { label: '🔴 개선 필요 (퍼널·후킹 점검)', color: '#b91c1c', bg: '#fee2e2' };
    return { reach: reach, visits: visits, db: db, budget: budget, cpa: cpa, closes: closes, estSales: estSales, roas: roas, grade: grade };
  }

  function previewHtml() {
    var prof = A.store.agencyProfile || A.DEFAULT_AGENCY_PROFILE;
    var totalScore = avgScore();
    var kpi = calcEasyKpi();
    return '<div class="a4-sheet">' +
      '<div class="doc-banner">' +
        '<h1>SNS 채널 정밀 분석 &amp; 쉬운 KPI 성과 보고서</h1>' +
        '<p>' + A.esc(form.client_name || '(고객사명을 입력하세요)') + ' · ' + A.esc(form.industry) + ' · ' + A.esc(form.period) + ' · 작성: ' + A.esc(prof.company || '미담공장') + '</p>' +
      '</div>' +

      '<div class="sum-box">' +
        '<div><b>종합 마케팅 건강 점수</b><div style="font-size:11.8px;color:#475569">네이버 블로그 · 인스타 릴스 · 퍼널 전환 종합</div></div>' +
        '<div class="big">' + totalScore + ' / 100점</div>' +
      '</div>' +

      '<div class="sec-title">0. 대표님이 3초 만에 보는 쉬운 KPI 성적표</div>' +
      '<div style="background:' + kpi.grade.bg + ';color:' + kpi.grade.color + ';padding:9px 13px;border-radius:10px;font-size:12.5px;font-weight:800;margin-bottom:10px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px">' +
        '<span>🚦 이번 달 성적: ' + kpi.grade.label + '</span>' +
        '<span>투자 대비 매출: ' + (kpi.roas > 0 ? kpi.roas.toFixed(1) + '배 (예상 매출 ' + A.won(kpi.estSales) + ')' : '수치 입력 시 자동 계산') + '</span>' +
      '</div>' +
      '<table>' +
        '<tr><th>① 눈길 (월 노출)</th><th>② 관심 (상담 유입)</th><th>③ 문의 (수집 DB)</th><th>④ 문의 1건당 비용</th><th>⑤ 실제 계약 · 매출</th></tr>' +
        '<tr>' +
          '<td class="num"><b>약 ' + kpi.reach.toLocaleString() + '회</b><div style="font-size:10.5px;color:#64748b">우리를 본 사람</div></td>' +
          '<td class="num"><b>' + kpi.visits.toLocaleString() + '명</b><div style="font-size:10.5px;color:#64748b">클릭·방문한 사람</div></td>' +
          '<td class="num"><b style="color:#0284c7">' + kpi.db.toLocaleString() + '건</b><div style="font-size:10.5px;color:#64748b">전환율 ' + calcConvRate() + '</div></td>' +
          '<td class="num"><b>' + (kpi.cpa ? A.won(kpi.cpa) : '-') + '</b><div style="font-size:10.5px;color:#64748b">손님 1명 데려온 비용</div></td>' +
          '<td class="num"><b style="color:#15803d">' + kpi.closes + '건 / ' + A.won(kpi.estSales) + '</b><div style="font-size:10.5px;color:#64748b">마케팅비 ' + A.won(kpi.budget) + '</div></td>' +
        '</tr>' +
      '</table>' +

      '<div class="sec-title">1. 채널별 진단 점수 요약</div>' +
      '<div class="bar-row"><span class="bar-lbl">네이버 블로그 SEO</span><div class="bar-track"><div class="bar-fill" style="width:' + Math.min(100, Math.max(0, form.blogScore)) + '%"></div></div><span class="bar-val">' + form.blogScore + '점</span></div>' +
      '<div class="bar-row"><span class="bar-lbl">인스타 릴스 확산</span><div class="bar-track"><div class="bar-fill" style="width:' + Math.min(100, Math.max(0, form.reelsScore)) + '%;background:linear-gradient(90deg,#db2777,#f472b6)"></div></div><span class="bar-val">' + form.reelsScore + '점</span></div>' +
      '<div class="bar-row"><span class="bar-lbl">퍼널 · DB 전환</span><div class="bar-track"><div class="bar-fill" style="width:' + Math.min(100, Math.max(0, form.funnelScore)) + '%;background:linear-gradient(90deg,#16a34a,#4ade80)"></div></div><span class="bar-val">' + form.funnelScore + '점</span></div>' +

      '<div class="sec-title">2. 네이버 블로그 분석</div>' +
      '<table>' +
        '<tr><th>블로그 주소</th><td colspan="3">' + A.esc(form.blogUrl || '-') + '</td></tr>' +
        '<tr><th>이웃 수</th><td class="num">' + Number(form.blogNeighbors || 0).toLocaleString() + '명</td><th>일평균 방문자</th><td class="num">' + Number(form.blogDailyVisits || 0).toLocaleString() + '명</td></tr>' +
        '<tr><th>월 발행 건수</th><td class="num">' + Number(form.blogMonthlyPosts || 0) + '건</td><th>핵심 키워드</th><td>' + A.esc(form.blogKeywords || '-') + '</td></tr>' +
      '</table>' +
      '<div class="clause-body">' + A.esc(form.blogComment) + '</div>' +

      '<div class="sec-title">3. 인스타그램 · 릴스 분석</div>' +
      '<table>' +
        '<tr><th>인스타 계정</th><td>' + A.esc(form.instaHandle || '-') + '</td><th>팔로워</th><td class="num">' + Number(form.instaFollowers || 0).toLocaleString() + '명</td></tr>' +
        '<tr><th>릴스 평균 조회수</th><td class="num">' + Number(form.reelsAvgViews || 0).toLocaleString() + '회</td><th>저장 · 공유율</th><td class="num">' + A.esc(form.reelsSaveRate || '-') + '</td></tr>' +
      '</table>' +
      '<div class="clause-body">' + A.esc(form.reelsComment) + '</div>' +

      '<div class="sec-title">4. 퍼널 유입 · DB 전환 및 매출 성과</div>' +
      '<table>' +
        '<tr><th>랜딩 · 상담 유입</th><td class="num">' + Number(form.funnelVisits || 0).toLocaleString() + '명</td><th>수집 DB 건수</th><td class="num"><b>' + Number(form.funnelDb || 0).toLocaleString() + '건</b></td><th>DB 전환율</th><td class="num"><b>' + calcConvRate() + '</b></td></tr>' +
        '<tr><th>월 마케팅 투입비</th><td class="num"><b>' + A.won(kpi.budget) + '</b></td><th>실제 계약 성사 수</th><td class="num"><b style="color:#0284c7">' + kpi.closes.toLocaleString() + '건</b></td><th>고객 1명당 평균 매출</th><td class="num"><b>' + A.won(Number(form.avgDealValue || 0)) + '</b></td></tr>' +
        '<tr><th>문의 1건당 비용 (CPA)</th><td class="num"><b>' + (kpi.cpa ? A.won(kpi.cpa) : '-') + '</b></td><th>예상 총 매출</th><td class="num"><b style="color:#15803d">' + A.won(kpi.estSales) + '</b></td><th>투자 대비 매출 (ROAS)</th><td class="num"><b style="color:#15803d">' + (kpi.roas > 0 ? kpi.roas.toFixed(1) + '배 (' + Math.round(kpi.roas * 100) + '%)' : '-') + '</b></td></tr>' +
      '</table>' +

      '<div class="sec-title">5. 종합 진단 의견</div>' +
      '<div class="clause-body">' + A.esc(form.summary) + '</div>' +

      '<div class="sec-title">6. 다음 달 실행 액션플랜 (타임스케줄)</div>' +
      A.renderTimelineGantt(form.actionPlan) +

      '<div style="margin-top:26px;padding-top:12px;border-top:1px dashed #cbd5e1;font-size:11.5px;color:#64748b;display:flex;justify-content:space-between">' +
        '<span>작성: ' + A.esc(prof.company || '미담공장') + ' (' + A.esc(prof.phone || '') + ')</span>' +
        '<span>발행일: ' + A.todayKst() + '</span>' +
      '</div>' +
    '</div>';
  }

  function updatePreviewOnly() {
    var box = document.getElementById('snsPreviewBox');
    if (box) box.innerHTML = previewHtml();
  }

  function render() {
    var root = document.getElementById('pane-sns');
    if (!root) return;
    var reports = A.store.snsReports || [];
    var clients = A.store.clients || [];

    root.innerHTML = '<div class="ws-split">' +
      '<div class="split-editor">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">' +
          '<h3 class="neon-yellow-title" style="margin:0;font-size:15.5px">🔍 SNS 분석 보고서 입력</h3>' +
          '<div class="ws-actions">' +
            '<label class="chip-check" style="margin:0;padding:4px 9px;font-size:11.5px"><input type="checkbox" id="snsAutoScoreChk"' + (autoScore ? ' checked' : '') + '> 🧮 수치 기반 점수 자동계산</label>' +
            '<button type="button" class="ws-btn sm accent" id="snsSampleBtn">🎲 Sample</button>' +
            '<button type="button" class="ws-btn sm primary" id="snsRecalcBtn">⚡ 점수 재계산</button>' +
            '<button type="button" class="ws-btn sm" id="snsNewBtn">➕ 새 보고서</button>' +
            (form.id ? '<button type="button" class="ws-btn sm danger" id="snsDelBtn">삭제</button>' : '') +
          '</div>' +
        '</div>' +

        (reports.length ? '<div class="saved-bar"><span style="font-size:11px;font-weight:800;color:#0369a1">저장된 보고서:</span>' +
          reports.slice(0, 10).map(function (r) {
            return '<button type="button" class="saved-chip' + (form.id === r.id ? ' active' : '') + '" data-rid="' + r.id + '">' + A.esc(r.client_name || '무제') + ' · ' + A.esc(r.period || '') + '</button>';
          }).join('') + '</div>' : '') +

        '<div class="ws-grid-2">' +
          '<div class="ws-field"><label>등록 고객사 불러오기</label><select id="snsClientSel">' +
            '<option value="">직접 입력</option>' +
            clients.map(function (c) {
              return '<option value="' + c.id + '"' + (String(form.client_id) === String(c.id) ? ' selected' : '') + '>' + A.esc(c.name) + ' (' + A.esc(c.industry) + ')</option>';
            }).join('') +
          '</select></div>' +
          '<div class="ws-field"><label>보고 기간</label><input data-sf="period" value="' + A.esc(form.period) + '"></div>' +
          '<div class="ws-field"><label>고객사명</label><input data-sf="client_name" value="' + A.esc(form.client_name) + '" placeholder="예: 미담한의원"></div>' +
          '<div class="ws-field"><label>업종</label><select data-sf="industry">' +
            A.INDUSTRIES.map(function (i) { return '<option value="' + A.esc(i.id) + '"' + (form.industry === i.id ? ' selected' : '') + '>' + A.esc(i.id) + '</option>'; }).join('') +
          '</select></div>' +
        '</div>' +

        '<div class="ws-card" style="padding:12px">' +
          '<h3 style="margin-bottom:8px;font-size:13px">🟢 네이버 블로그 진단</h3>' +
          '<div class="ws-grid-2">' +
            '<div class="ws-field"><label>블로그 URL</label><input data-sf="blogUrl" value="' + A.esc(form.blogUrl) + '"></div>' +
            '<div class="ws-field"><label>SEO · 전환 점수 (0~100)</label><input type="number" min="0" max="100" data-sf="blogScore" value="' + A.esc(form.blogScore) + '"></div>' +
            '<div class="ws-field"><label>이웃 수</label><input type="number" data-sf="blogNeighbors" value="' + A.esc(form.blogNeighbors) + '"></div>' +
            '<div class="ws-field"><label>일평균 방문자</label><input type="number" data-sf="blogDailyVisits" value="' + A.esc(form.blogDailyVisits) + '"></div>' +
            '<div class="ws-field"><label>월 발행 건수</label><input type="number" data-sf="blogMonthlyPosts" value="' + A.esc(form.blogMonthlyPosts) + '"></div>' +
            '<div class="ws-field"><label>핵심 키워드</label><input data-sf="blogKeywords" value="' + A.esc(form.blogKeywords) + '"></div>' +
          '</div>' +
          '<div class="ws-field" style="margin-top:8px"><label>블로그 진단 코멘트</label><textarea data-sf="blogComment">' + A.esc(form.blogComment) + '</textarea></div>' +
        '</div>' +

        '<div class="ws-card" style="padding:12px">' +
          '<h3 style="margin-bottom:8px;font-size:13px">🩷 인스타그램 · 릴스 진단</h3>' +
          '<div class="ws-grid-2">' +
            '<div class="ws-field"><label>인스타 계정</label><input data-sf="instaHandle" value="' + A.esc(form.instaHandle) + '"></div>' +
            '<div class="ws-field"><label>릴스 확산 점수 (0~100)</label><input type="number" min="0" max="100" data-sf="reelsScore" value="' + A.esc(form.reelsScore) + '"></div>' +
            '<div class="ws-field"><label>팔로워 수</label><input type="number" data-sf="instaFollowers" value="' + A.esc(form.instaFollowers) + '"></div>' +
            '<div class="ws-field"><label>릴스 평균 조회수</label><input type="number" data-sf="reelsAvgViews" value="' + A.esc(form.reelsAvgViews) + '"></div>' +
            '<div class="ws-field"><label>저장 · 공유율</label><input data-sf="reelsSaveRate" value="' + A.esc(form.reelsSaveRate) + '"></div>' +
          '</div>' +
          '<div class="ws-field" style="margin-top:8px"><label>릴스 진단 코멘트</label><textarea data-sf="reelsComment">' + A.esc(form.reelsComment) + '</textarea></div>' +
        '</div>' +

        '<div class="ws-card" style="padding:12px">' +
          '<h3 style="margin-bottom:8px;font-size:13px">🎯 퍼널 · DB 성과 &amp; 종합 총평</h3>' +
          '<div class="ws-grid-3">' +
            '<div class="ws-field"><label>유입 수</label><input type="number" data-sf="funnelVisits" value="' + A.esc(form.funnelVisits) + '"></div>' +
            '<div class="ws-field"><label>수집 DB 수</label><input type="number" data-sf="funnelDb" value="' + A.esc(form.funnelDb) + '"></div>' +
            '<div class="ws-field"><label>퍼널 점수 (0~100)</label><input type="number" min="0" max="100" data-sf="funnelScore" value="' + A.esc(form.funnelScore) + '"></div>' +
            '<div class="ws-field"><label>월 마케팅 투입비 (원)</label><input type="number" step="100000" data-sf="marketingBudget" value="' + A.esc(form.marketingBudget) + '"></div>' +
            '<div class="ws-field"><label>실제 계약 성사 수 (건)</label><input type="number" data-sf="closeCount" value="' + A.esc(form.closeCount) + '"></div>' +
            '<div class="ws-field"><label>고객 1명당 평균 매출 (원)</label><input type="number" step="100000" data-sf="avgDealValue" value="' + A.esc(form.avgDealValue) + '"></div>' +
          '</div>' +
          '<div class="ws-field" style="margin-top:8px"><label>종합 진단 의견</label><textarea data-sf="summary">' + A.esc(form.summary) + '</textarea></div>' +
          '<div class="ws-field" style="margin-top:8px"><label>다음 달 액션플랜</label><textarea data-sf="actionPlan" style="min-height:92px">' + A.esc(form.actionPlan) + '</textarea></div>' +
        '</div>' +
      '</div>' +

      '<div class="split-preview">' +
        '<div class="preview-toolbar">' +
          '<span class="neon-yellow-title" style="font-size:12.8px">👁️ 실시간 A4 보고서 미리보기</span>' +
          '<div class="ws-actions">' +
            '<button type="button" class="ws-btn sm ai" id="snsAskAiBtn">🤖 AI 진단 총평 요청</button>' +
            '<button type="button" class="ws-btn sm primary" id="snsSaveBtn">💾 보고서 저장</button>' +
            '<button type="button" class="ws-btn sm warn" id="snsToPropBtn">📑 제안서로 보내기</button>' +
            '<button type="button" class="ws-btn sm ok" id="snsPrintBtn">🖨️ PDF / 인쇄</button>' +
          '</div>' +
        '</div>' +
        '<div id="snsPreviewBox" style="width:100%;display:flex;justify-content:center">' + previewHtml() + '</div>' +
      '</div>' +
    '</div>';

    bindEvents(root);
  }

  function bindEvents(root) {
    var q = function (s) { return root.querySelector(s); };
    var sampleSnsBtn = q('#snsSampleBtn');
    if (sampleSnsBtn) sampleSnsBtn.addEventListener('click', function () {
      var s = A.generateUniqueSample();
      form = Object.assign(blankForm(), {
        client_name: s.name,
        industry: s.industry,
        blogUrl: s.blog,
        blogNeighbors: s.blogNeighbors,
        blogDailyVisits: s.blogDailyVisits,
        blogMonthlyPosts: s.blogMonthlyPosts,
        blogKeywords: s.keywords,
        instaHandle: s.insta,
        instaFollowers: s.instaFollowers,
        reelsAvgViews: s.reelsAvgViews,
        reelsSaveRate: s.reelsSaveRate,
        funnelVisits: s.funnelVisits,
        funnelDb: s.funnelDb,
        marketingBudget: s.marketingBudget,
        closeCount: s.closeCount,
        avgDealValue: s.avgDealValue,
      });
      computeAutoScores();
      render();
      A.toast('🎲 중복 없는 랜덤 SNS 분석 예시(' + s.name + ' · ' + s.industry + ')가 자동 입력되었습니다!');
    });

    var autoChk = q('#snsAutoScoreChk');
    if (autoChk) autoChk.addEventListener('change', function () {
      autoScore = autoChk.checked;
      if (autoScore) { computeAutoScores(); render(); A.toast('🧮 수치 입력 시 SEO·릴스·퍼널 점수가 자동 계산됩니다!'); }
    });
    var recalcBtn = q('#snsRecalcBtn');
    if (recalcBtn) recalcBtn.addEventListener('click', function () {
      computeAutoScores();
      render();
      A.toast('⚡ 입력하신 실제 수치로 3대 점수를 자동 산출했습니다! (블로그 ' + form.blogScore + ' / 릴스 ' + form.reelsScore + ' / 퍼널 ' + form.funnelScore + ')');
    });

    var metricKeys = { blogNeighbors: 1, blogDailyVisits: 1, blogMonthlyPosts: 1, instaFollowers: 1, reelsAvgViews: 1, reelsSaveRate: 1, funnelVisits: 1, funnelDb: 1 };
    Array.prototype.forEach.call(root.querySelectorAll('[data-sf]'), function (el) {
      var ev = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(ev, function () {
        var key = el.getAttribute('data-sf');
        form[key] = el.type === 'number' ? Number(el.value || 0) : el.value;
        if (autoScore && metricKeys[key]) {
          computeAutoScores();
          ['blogScore', 'reelsScore', 'funnelScore'].forEach(function (sk) {
            var sInp = root.querySelector('[data-sf="' + sk + '"]');
            if (sInp) sInp.value = form[sk];
          });
        }
        updatePreviewOnly();
      });
    });

    var csel = q('#snsClientSel');
    if (csel) csel.addEventListener('change', function () {
      var cid = parseInt(csel.value, 10);
      var c = A.store.clients.filter(function (x) { return x.id === cid; })[0];
      if (c) {
        form.client_id = c.id;
        form.client_name = c.name;
        form.industry = c.industry;
        form.blogUrl = c.blog_url || form.blogUrl;
        form.instaHandle = c.insta_handle || form.instaHandle;
        form.funnelDb = Number(c.db_count || form.funnelDb);
        render();
      }
    });

    Array.prototype.forEach.call(root.querySelectorAll('[data-rid]'), function (b) {
      b.addEventListener('click', function () {
        var id = parseInt(b.getAttribute('data-rid'), 10);
        var r = A.store.snsReports.filter(function (x) { return x.id === id; })[0];
        if (r) {
          form = Object.assign(blankForm(), r.data || {}, {
            id: r.id,
            client_id: r.client_id || '',
            client_name: r.client_name || '',
            period: r.period || '',
          });
          render();
        }
      });
    });

    var newBtn = q('#snsNewBtn');
    if (newBtn) newBtn.addEventListener('click', function () { form = blankForm(); render(); });

    var delBtn = q('#snsDelBtn');
    if (delBtn && form.id) delBtn.addEventListener('click', function () {
      if (!confirm('이 SNS 분석 보고서를 삭제할까요?')) return;
      A.api('/api/sns-reports/' + form.id, { method: 'DELETE' })
        .then(function () { form = blankForm(); return A.refreshAll(); })
        .then(function () { A.toast('🗑️ 보고서를 삭제했습니다.'); });
    });

    var saveBtn = q('#snsSaveBtn');
    if (saveBtn) saveBtn.addEventListener('click', function () {
      if (!form.client_name.trim()) { A.toast('⚠️ 고객사명을 입력하세요.'); return; }
      var payload = {
        client_id: form.client_id || null,
        client_name: form.client_name.trim(),
        period: form.period.trim(),
        data: Object.assign({}, form),
      };
      var req = form.id
        ? A.api('/api/sns-reports/' + form.id, { method: 'PATCH', body: JSON.stringify(payload) })
        : A.api('/api/sns-reports', { method: 'POST', body: JSON.stringify(payload) });
      req.then(function (d) {
        if (d.report) form.id = d.report.id;
        return A.refreshAll();
      }).then(function () {
        A.toast('✅ SNS 분석 보고서가 저장되었습니다.');
        render();
      }).catch(function (err) { A.toast('❌ 저장 실패: ' + (err.message || '')); });
    });

    var askBtn = q('#snsAskAiBtn');
    if (askBtn) askBtn.addEventListener('click', function () {
      var prompt = [
        '[AI SNS 정밀 진단 총평 요청]',
        '- 고객사: ' + (form.client_name || '미지정') + ' (' + form.industry + ')',
        '- 블로그: 일방문자 ' + form.blogDailyVisits + '명 / 월 발행 ' + form.blogMonthlyPosts + '건 / SEO점수 ' + form.blogScore + '점 / 키워드: ' + form.blogKeywords,
        '- 인스타 릴스: 팔로워 ' + form.instaFollowers + '명 / 평균 조회수 ' + form.reelsAvgViews + '회 / 저장·공유율 ' + form.reelsSaveRate + ' / 점수 ' + form.reelsScore + '점',
        '- 퍼널 DB: 유입 ' + form.funnelVisits + '명 → DB ' + form.funnelDb + '건 (전환율 ' + calcConvRate() + ')',
        '',
        '요청: 고객사 대표님께 보고할 핵심 문제점 3가지와 다음 달 4주 실행 액션플랜을 설득력 있게 작성해줘!',
      ].join('\n');
      A.requestAiAssist({ room: 'general', prompt: prompt }).catch(function (err) {
        A.toast('❌ AI 요청 실패: ' + (err.message || ''));
      });
    });

    var toProp = q('#snsToPropBtn');
    if (toProp) toProp.addEventListener('click', function () {
      var client = A.store.clients.filter(function (c) { return String(c.id) === String(form.client_id); })[0] || {
        name: form.client_name,
        industry: form.industry,
      };
      A.transferToProposal({ client: client, snsReport: { data: Object.assign({}, form) } });
    });

    var printBtn = q('#snsPrintBtn');
    if (printBtn) printBtn.addEventListener('click', function () {
      A.printPane('pane-sns', (form.client_name || '고객사') + '_SNS분석보고서_' + A.todayKst());
    });
  }

  A.on('transfer-sns', function (payload) {
    var c = payload && payload.client;
    if (c) {
      form = blankForm();
      form.client_id = c.id;
      form.client_name = c.name;
      form.industry = c.industry || '병원';
      form.blogUrl = c.blog_url || '';
      form.instaHandle = c.insta_handle || '';
      form.funnelDb = Number(c.db_count || 0);
      render();
      A.toast('🔍 "' + c.name + '" 정보를 SNS 분석 보고서로 불러왔습니다.');
    }
  });

  A.on('data-updated', function () { if (A.store.activeTab === 'sns') render(); });
  A.on('tab-changed', function (t) { if (t === 'sns') render(); });
})();

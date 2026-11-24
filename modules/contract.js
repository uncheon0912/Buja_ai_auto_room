/**
 * 탭 5: 📄 계약서 생성기 (왼쪽 업체·가격·서비스·조항·직인 입력 ↔ 오른쪽 실시간 A4 표준 계약서 미리보기 + PDF 출력)
 */
(function () {
  'use strict';
  var A = window.AgencyApp;
  if (!A) return;

  var DEFAULT_CLAUSES = [
    '제1조 (목적)',
    '본 계약은 갑(위탁자)이 을(수탁자)에게 SNS·블로그·릴스·브랜딩 및 DB 퍼널 마케팅 대행 업무를 위탁함에 있어, 양 당사자 간의 권리·의무 및 제반 사항을 명확히 규정함을 목적으로 한다.',
    '',
    '제2조 (대행 업무 범위)',
    '을은 상단 [서비스 내역 및 대금] 표에 명시된 마케팅 대행 항목을 성실히 수행하며, 세부 기획·발행 일정은 월간 운영 계획에 따라 갑과 협의하여 진행한다.',
    '',
    '제3조 (대금 지급 조건)',
    '갑은 본 계약서에 명시된 대행료를 지정된 결제 조건에 따라 을의 지정 계좌로 입금하며, 세금계산서(또는 현금영수증)는 입금 확인 후 발행한다.',
    '',
    '제4조 (자료 협조 및 검수)',
    '1. 갑은 원활한 콘텐츠 제작을 위해 필요한 사진·영상·업종 전문 자료 및 계정 권한을 적시에 제공한다.',
    '2. 을이 제작한 콘텐츠 초안은 발행 전 갑의 검수를 거치며, 갑이 전달받은 날로부터 영업일 기준 2일 이내 별도 회신이 없을 경우 승인된 것으로 간주한다.',
    '',
    '제5조 (비밀유지 및 저작권)',
    '1. 양 당사자는 계약 수행 중 취득한 상대방의 영업 비밀 및 수집된 고객 DB 정보를 제3자에게 누설하거나 목적 외로 사용하지 않는다.',
    '2. 대금 완납 시 최종 제작된 콘텐츠의 사용권은 갑에게 귀속되며, 을은 포트폴리오 목적으로 활용할 수 있다(사전 비공개 요청 시 제외).',
    '',
    '제6조 (계약 기간 및 해지)',
    '1. 본 계약은 계약 기간 만료 15일 전까지 서면(문자·카톡 포함) 해지 통보가 없을 경우 동일 조건으로 1개월씩 자동 연장된다.',
    '2. 중도 해지 시 이미 착수·발행된 콘텐츠 및 퍼널 셋팅 실비를 정산한 잔액을 환불한다.',
    '',
    '제7조 (특약 사항)',
    '- 병원/보험/금융 등 관련 법령(의료법·금소법 등) 심의가 필요한 문구는 갑의 최종 확인을 거쳐 발행한다.',
    '- 수집된 리드(DB)는 실시간 시트 또는 지정 채널로 갑에게 즉시 공유한다.',
  ].join('\n');

  function makeContractNo() {
    var d = A.todayKst().replace(/-/g, '');
    var seq = String((A.store.contracts || []).length + 1).padStart(2, '0');
    return 'MD-' + d + '-' + seq;
  }

  function addMonths(ymd, m) {
    try {
      var dt = new Date(ymd + 'T00:00:00');
      dt.setMonth(dt.getMonth() + m);
      dt.setDate(dt.getDate() - 1);
      return dt.toISOString().slice(0, 10);
    } catch (e) { return ymd; }
  }

  function blankForm() {
    var today = A.todayKst();
    var prof = A.store.agencyProfile || A.DEFAULT_AGENCY_PROFILE;
    return {
      id: null,
      client_id: '',
      proposal_id: '',
      contract_no: makeContractNo(),
      status: '초안',
      title: '마케팅 대행 용역 계약서',
      contractDate: today,
      startDate: today,
      endDate: addMonths(today, 3),
      paymentTerms: '계약 체결일로부터 3일 이내 선입금 (매월 동일자 정기결제)',
      includeVat: true,
      // 갑 (고객사)
      client_name: '',
      clientCeo: '',
      clientBizNo: '',
      clientAddress: '',
      clientPhone: '',
      clientEmail: '',
      docuseal: null,
      // 을 (우리 회사 — 프로필 기본값)
      agencyCompany: prof.company || '미담공장',
      agencyCeo: prof.ceo || '부자사람대장',
      agencyBizNo: prof.bizNo || '',
      agencyAddress: prof.address || '',
      agencyPhone: prof.phone || '',
      agencyBank: prof.bank || '',
      stampDataUrl: prof.stampDataUrl || '',
      items: [
        { name: '네이버 브랜드 블로그 대행 (월 12편)', qty: 1, price: 1100000, note: '기획·원고·이미지' },
        { name: '인스타그램 릴스 대행 (월 8편)', qty: 1, price: 1200000, note: '대본·편집·업로드' },
      ],
      clauses: DEFAULT_CLAUSES,
      usePage2: false,
      extraSpecialTerms: '',
    };
  }

  function formatPhoneAuto(raw) {
    var d = String(raw || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.indexOf('02') === 0) {
      if (d.length <= 2) return d;
      if (d.length <= 5) return d.slice(0, 2) + '-' + d.slice(2);
      if (d.length <= 9) return d.slice(0, 2) + '-' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
      return d.slice(0, 2) + '-' + d.slice(2, 6) + '-' + d.slice(6, 10);
    }
    if (d.length <= 3) return d;
    if (d.length <= 7) return d.slice(0, 3) + '-' + d.slice(3);
    if (d.length <= 10) return d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
    return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7, 11);
  }

  var EXTRA_TERM_PRESETS = [
    { label: '📊 월간 성과 리포트 특약', text: '1. 을은 매월 말일 기준 네이버 블로그·인스타 릴스·DB 유입 성과 보고서 및 VIP 포털 실시간 리포트를 갑에게 제공한다.' },
    { label: '🎥 촬영·원본·저작권 특약', text: '2. 출장 촬영 또는 원장님/대표님 인터뷰 촬영 원본 파일은 요청 시 갑에게 제공하며, 제3자 무단 배포를 금지한다.' },
    { label: '💳 매체 광고비 실비 정산', text: '3. 네이버 파워링크·메타(인스타) 유료 광고 집행 실비는 본 대행료와 별도로 갑의 법인/개인 카드로 직접 결제한다.' },
    { label: '🔒 동종 업종 비밀유지 강화', text: '4. 을은 계약 기간 및 종료 후 1년간 갑의 내부 영업 전략·단가·수집된 가망고객 DB를 타사 마케팅에 일체 활용하지 않는다.' },
  ];

  var form = blankForm();

  function calcTotals() {
    var supply = (form.items || []).reduce(function (acc, it) {
      return acc + (Number(it.qty || 1) * Number(it.price || 0));
    }, 0);
    var vat = form.includeVat ? Math.round(supply * 0.1) : 0;
    return { supply: supply, vat: vat, total: supply + vat };
  }

  function previewHtml() {
    var tot = calcTotals();
    return '<div class="a4-sheet">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:#64748b;margin-bottom:8px">' +
      '<span>계약번호: <b>' + A.esc(form.contract_no) + '</b></span>' +
      '<span>상태: <b>' + A.esc(form.status) + '</b></span>' +
      '</div>' +
      '<h1>' + A.esc(form.title || '마케팅 대행 용역 계약서') + '</h1>' +
      '<div class="doc-sub">계약기간: ' + A.esc(form.startDate) + ' ~ ' + A.esc(form.endDate) + ' · 체결일: ' + A.esc(form.contractDate) + '</div>' +

      '<p style="font-size:12.6px;margin:0 0 14px">' +
      '<b>' + A.esc(form.client_name || '(고객사명)') + '</b>(이하 "갑"이라 한다)와 ' +
      '<b>' + A.esc(form.agencyCompany || '미담공장') + '</b>(이하 "을"이라 한다)은 아래와 같이 마케팅 대행 용역 계약을 체결한다.' +
      '</p>' +

      '<div class="sec-title">1. 서비스 내역 및 계약 대금</div>' +
      '<table>' +
      '<thead><tr><th>대행 서비스 항목</th><th class="num" style="width:60px">수량</th><th class="num" style="width:110px">단가</th><th class="num" style="width:115px">공급가액</th><th>비고</th></tr></thead>' +
      '<tbody>' +
      (form.items || []).map(function (it) {
        var amt = Number(it.qty || 1) * Number(it.price || 0);
        return '<tr><td><b>' + A.esc(it.name) + '</b></td><td class="num">' + Number(it.qty || 1) + '</td><td class="num">' + A.won(it.price) + '</td><td class="num"><b>' + A.won(amt) + '</b></td><td>' + A.esc(it.note || '') + '</td></tr>';
      }).join('') +
      '</tbody>' +
      '</table>' +

      '<div class="sum-box">' +
      '<div style="font-size:12.2px;color:#334155">' +
      '공급가액 <b>' + A.won(tot.supply) + '</b> · ' +
      (form.includeVat ? '부가세(10%) <b>' + A.won(tot.vat) + '</b>' : '부가세 별도') +
      '<div style="margin-top:3px;font-size:11.6px;color:#475569">결제조건: ' + A.esc(form.paymentTerms) + (form.agencyBank ? ' · 입금계좌: ' + A.esc(form.agencyBank) : '') + '</div>' +
      '</div>' +
      '<div class="big">총 계약금액 ' + A.won(tot.total) + '</div>' +
      '</div>' +

      '<div class="sec-title">2. 계약 일반 및 특약 조항</div>' +
      '<div class="clause-body">' + A.esc(form.clauses) + '</div>' +

      '<p style="text-align:center;font-weight:700;font-size:12.6px;margin:24px 0 6px">' +
      '본 계약의 성립을 증명하기 위하여 계약서 2부를 작성하고 갑과 을이 기명날인 후 각 1부씩 보관한다.' +
      '</p>' +
      '<div style="text-align:center;font-size:13px;font-weight:800;color:#0c4a6e;margin-bottom:14px">' + A.esc(form.contractDate) + '</div>' +

      '<div class="sign-grid">' +
      '<div class="sign-box">' +
      '<h4>갑 (위탁자 · 고객사)</h4>' +
      '<div class="sign-row"><span>상호/업체명</span><b>' + A.esc(form.client_name || '-') + '</b></div>' +
      '<div class="sign-row"><span>대표자</span><b>' + A.esc(form.clientCeo || '-') + ' (인)</b></div>' +
      '<div class="sign-row"><span>사업자번호</span><span>' + A.esc(form.clientBizNo || '-') + '</span></div>' +
      '<div class="sign-row"><span>연락처</span><span>' + A.esc(form.clientPhone || '-') + '</span></div>' +
      '<div class="sign-row"><span>주소</span><span>' + A.esc(form.clientAddress || '-') + '</span></div>' +
      '</div>' +
      '<div class="sign-box">' +
      '<h4>을 (수탁자 · 대행사)</h4>' +
      '<div class="sign-row"><span>상호/업체명</span><b>' + A.esc(form.agencyCompany || '미담공장') + '</b></div>' +
      '<div class="sign-row"><span>대표자</span><b>' + A.esc(form.agencyCeo || '-') + ' (인)</b></div>' +
      '<div class="sign-row"><span>사업자번호</span><span>' + A.esc(form.agencyBizNo || '-') + '</span></div>' +
      '<div class="sign-row"><span>연락처</span><span>' + A.esc(form.agencyPhone || '-') + '</span></div>' +
      '<div class="sign-row"><span>주소</span><span>' + A.esc(form.agencyAddress || '-') + '</span></div>' +
      (form.stampDataUrl ? '<img class="stamp-img" src="' + A.esc(form.stampDataUrl) + '" alt="직인">' : '') +
      '</div>' +
      '</div>' +
      '</div>' +
      // 📜 A4 2페이지: 추가 특약사항 합의서 (별지) — 체크박스(usePage2) ON일 때만 표시
      (form.usePage2 ? (
        '<div class="a4-sheet a4-page2" style="margin-top:22px;page-break-before:always;break-before:page">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:#64748b;margin-bottom:8px">' +
        '<span>계약번호: <b>' + A.esc(form.contract_no) + '</b> (별지 2 / 2페이지)</span>' +
        '<span>상호: <b>' + A.esc(form.client_name || '(고객사명)') + '</b></span>' +
        '</div>' +
        '<h1>[별지] 추가 특약사항 합의서</h1>' +
        '<div class="doc-sub">본 별지는 원 계약서(' + A.esc(form.contract_no) + ', 체결일 ' + A.esc(form.contractDate) + ')의 일부로서 원 계약서와 동일한 법적 효력을 가진다.</div>' +
        '<div class="sec-title">추가 특약 및 세부 합의 조항</div>' +
        '<div class="clause-body" style="min-height:420px;padding:14px 16px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc">' +
        A.esc((form.extraSpecialTerms || '').trim() || '여기에 클라이언트 요청 추가 특약사항을 입력하면 A4 2페이지에 자동 기재됩니다.') +
        '</div>' +
        '<p style="text-align:center;font-weight:700;font-size:12.4px;margin:24px 0 6px">' +
        '갑과 을은 위 추가 특약사항의 내용을 충분히 확인하고 합의하였음을 증명하기 위하여 아래와 같이 서명·날인한다.' +
        '</p>' +
        '<div style="text-align:center;font-size:13px;font-weight:800;color:#0c4a6e;margin-bottom:14px">' + A.esc(form.contractDate) + '</div>' +
        '<div class="sign-grid">' +
        '<div class="sign-box">' +
        '<h4>갑 (위탁자 · 고객사 확인)</h4>' +
        '<div class="sign-row"><span>상호/업체명</span><b>' + A.esc(form.client_name || '-') + '</b></div>' +
        '<div class="sign-row"><span>대표자</span><b>' + A.esc(form.clientCeo || '-') + ' (인)</b></div>' +
        '<div class="sign-row"><span>연락처</span><span>' + A.esc(form.clientPhone || '-') + '</span></div>' +
        '</div>' +
        '<div class="sign-box">' +
        '<h4>을 (수탁자 · 대행사 확인)</h4>' +
        '<div class="sign-row"><span>상호/업체명</span><b>' + A.esc(form.agencyCompany || '미담공장') + '</b></div>' +
        '<div class="sign-row"><span>대표자</span><b>' + A.esc(form.agencyCeo || '-') + ' (인)</b></div>' +
        '<div class="sign-row"><span>연락처</span><span>' + A.esc(form.agencyPhone || '-') + '</span></div>' +
        (form.stampDataUrl ? '<img class="stamp-img" src="' + A.esc(form.stampDataUrl) + '" alt="직인">' : '') +
        '</div>' +
        '</div>' +
        '</div>'
      ) : '');
  }

  function updatePreviewOnly() {
    var box = document.getElementById('contPreviewBox');
    if (box) box.innerHTML = previewHtml();
  }

  function render() {
    var root = document.getElementById('pane-contract');
    if (!root) return;
    var contracts = A.store.contracts || [];
    var clients = A.store.clients || [];
    var proposals = A.store.proposals || [];

    root.innerHTML = '<div class="ws-split">' +
      // 왼쪽: 계약서 입력 및 텍스트 편집
      '<div class="split-editor">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">' +
      '<h3 class="neon-yellow-title" style="margin:0;font-size:15.5px">📄 계약서 작성 · 텍스트 편집</h3>' +
      '<div class="ws-actions">' +
      '<button type="button" class="ws-btn sm accent" id="contSampleBtn">🎲 Sample</button>' +
      '<button type="button" class="ws-btn sm" id="contNewBtn">➕ 새 계약서</button>' +
      (form.id ? '<button type="button" class="ws-btn sm danger" id="contDelBtn">삭제</button>' : '') +
      '</div>' +
      '</div>' +

      (contracts.length ? '<div class="saved-bar"><span style="font-size:11px;font-weight:800;color:#0369a1">저장된 계약서:</span>' +
        contracts.slice(0, 10).map(function (ct) {
          return '<button type="button" class="saved-chip' + (form.id === ct.id ? ' active' : '') + '" data-ctid="' + ct.id + '">' + A.esc(ct.client_name || ct.contract_no) + ' (' + A.won(ct.total_amount) + ')</button>';
        }).join('') + '</div>' : '') +

      '<div class="ws-grid-2">' +
      '<div class="ws-field"><label>고객사 불러오기</label><select id="contClientSel">' +
      '<option value="">직접 입력</option>' +
      clients.map(function (c) {
        return '<option value="' + c.id + '"' + (String(form.client_id) === String(c.id) ? ' selected' : '') + '>' + A.esc(c.name) + ' (' + A.esc(c.industry) + ')</option>';
      }).join('') +
      '</select></div>' +
      '<div class="ws-field"><label>저장된 제안서에서 금액·서비스 불러오기</label><select id="contPropSel">' +
      '<option value="">제안서 선택…</option>' +
      proposals.map(function (p) {
        return '<option value="' + p.id + '"' + (String(form.proposal_id) === String(p.id) ? ' selected' : '') + '>' + A.esc(p.client_name || p.title) + ' · ' + A.won(p.total_amount) + '</option>';
      }).join('') +
      '</select></div>' +
      '</div>' +

      '<div class="ws-grid-3">' +
      '<div class="ws-field"><label>계약번호</label><input data-cf="contract_no" value="' + A.esc(form.contract_no) + '"></div>' +
      '<div class="ws-field"><label>계약서 제목</label><input data-cf="title" value="' + A.esc(form.title) + '"></div>' +
      '<div class="ws-field"><label>계약 상태</label><select data-cf="status">' +
      ['초안', '확정', '서명요청중', '서명완료'].map(function (s) { return '<option value="' + s + '"' + (form.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="ws-field"><label>계약 체결일</label><input type="date" data-cf="contractDate" value="' + A.esc(form.contractDate) + '"></div>' +
      '<div class="ws-field"><label>시작일</label><input type="date" data-cf="startDate" value="' + A.esc(form.startDate) + '"></div>' +
      '<div class="ws-field"><label>종료일</label><input type="date" data-cf="endDate" value="' + A.esc(form.endDate) + '"></div>' +
      '</div>' +

      '<div class="ws-card" style="padding:12px">' +
      '<h3 style="margin-bottom:8px;font-size:13px">👤 갑 (고객사) 정보</h3>' +
      '<div class="ws-grid-2">' +
      '<div class="ws-field"><label>업체명 *</label><input data-cf="client_name" value="' + A.esc(form.client_name) + '" placeholder="예: 미담투석검진센터"></div>' +
      '<div class="ws-field"><label>대표자명</label><input data-cf="clientCeo" value="' + A.esc(form.clientCeo) + '" placeholder="예: 홍길동"></div>' +
      '<div class="ws-field"><label>사업자번호</label><input data-cf="clientBizNo" value="' + A.esc(form.clientBizNo) + '" placeholder="000-00-00000"></div>' +
      '<div class="ws-field"><label>연락처</label><input data-cf="clientPhone" value="' + A.esc(form.clientPhone) + '" placeholder="010-0000-0000"></div>' +
      '<div class="ws-field"><label>고객 이메일 (전자서명 수신용) *</label><input type="email" data-cf="clientEmail" value="' + A.esc(form.clientEmail || '') + '" placeholder="client@company.co.kr"></div>' +
      '<div class="ws-field"><label>주소</label><input data-cf="clientAddress" value="' + A.esc(form.clientAddress) + '" placeholder="고객사 사업장 주소"></div>' +
      '</div>' +
      (form.docuseal ? (
        '<div style="margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(22,163,74,0.12);border:1px solid rgba(22,163,74,0.35);font-size:11.8px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">' +
        '<span>✍️ <b>DocuSeal 전자서명 상태:</b> ' + (form.docuseal.status === 'completed' ? '✅ 서명 완료' : '📨 이메일 발송됨 (' + A.esc(form.docuseal.client_email || '') + ')') + '</span>' +
        (form.docuseal.signed_url ? '<a href="' + A.esc(form.docuseal.signed_url) + '" target="_blank" rel="noopener" class="ws-btn sm ok" style="text-decoration:none">최종 서명본 열기</a>' :
          (form.docuseal.signing_url ? '<a href="' + A.esc(form.docuseal.signing_url) + '" target="_blank" rel="noopener" class="ws-btn sm" style="text-decoration:none">서명 링크 열기</a>' : '')) +
        '</div>'
      ) : '') +
      '</div>' +

      '<div class="ws-card" style="padding:12px">' +
      '<h3 style="margin-bottom:8px;font-size:13px"><span>💰 서비스 항목 및 계약 금액</span><span style="display:flex;gap:5px"><button type="button" class="ws-btn sm danger" id="contPopItem" title="마지막 항목 삭제">− 항목 빼기</button><button type="button" class="ws-btn sm primary" id="contAddItem">+ 항목 추가</button></span></h3>' +
      '<div class="line-items" id="contItemsBox">' +
      '<div class="line-head"><span>서비스 항목명</span><span>수량</span><span>단가(원)</span><span>비고</span><span>삭제</span></div>' +
      (form.items || []).map(function (it, idx) {
        return '<div class="line-row" data-cidx="' + idx + '">' +
          '<input placeholder="서비스명" data-ck="name" value="' + A.esc(it.name) + '">' +
          '<input type="number" min="1" placeholder="수량" data-ck="qty" value="' + A.esc(it.qty) + '">' +
          '<input type="number" step="50000" min="0" placeholder="단가" data-ck="price" value="' + A.esc(it.price) + '">' +
          '<input placeholder="비고" data-ck="note" value="' + A.esc(it.note || '') + '">' +
          '<button type="button" class="ws-btn sm danger line-del" data-cdel="' + idx + '" title="이 항목 삭제">−</button>' +
          '</div>';
      }).join('') +
      '</div>' +
      '<div class="ws-grid-2" style="margin-top:10px">' +
      '<div class="ws-field"><label>결제 조건</label><input data-cf="paymentTerms" value="' + A.esc(form.paymentTerms) + '"></div>' +
      '<div class="ws-field"><label>부가세 (10%)</label><label class="chip-check" style="margin-top:4px"><input type="checkbox" id="contVatChk"' + (form.includeVat ? ' checked' : '') + '> 부가세 10% 포함</label></div>' +
      '</div>' +
      '</div>' +

      '<div class="ws-card" style="padding:12px">' +
      '<h3 style="margin-bottom:8px;font-size:13px"><span>🏢 을 (우리 회사 · 직인)</span><button type="button" class="ws-btn sm primary" id="contSaveProfileBtn">기본정보로 영구 저장</button></h3>' +
      '<div class="ws-grid-2">' +
      '<div class="ws-field"><label>대행사 상호</label><input data-cf="agencyCompany" value="' + A.esc(form.agencyCompany) + '"></div>' +
      '<div class="ws-field"><label>대표자명</label><input data-cf="agencyCeo" value="' + A.esc(form.agencyCeo) + '"></div>' +
      '<div class="ws-field"><label>사업자번호</label><input data-cf="agencyBizNo" value="' + A.esc(form.agencyBizNo) + '"></div>' +
      '<div class="ws-field"><label>연락처</label><input data-cf="agencyPhone" value="' + A.esc(form.agencyPhone) + '"></div>' +
      '<div class="ws-field"><label>주소</label><input data-cf="agencyAddress" value="' + A.esc(form.agencyAddress) + '"></div>' +
      '<div class="ws-field"><label>입금 계좌</label><input data-cf="agencyBank" value="' + A.esc(form.agencyBank) + '"></div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap">' +
      '<input type="file" id="contStampInput" accept="image/*" hidden>' +
      '<button type="button" class="ws-btn sm" id="contStampBtn">🔴 회사 직인(도장) 이미지 업로드</button>' +
      (form.stampDataUrl ? '<button type="button" class="ws-btn sm danger" id="contStampClear">직인 제거</button><span style="font-size:11.5px;color:#16a34a;font-weight:700">✓ 직인 적용됨</span>' : '<span style="font-size:11.5px;color:var(--muted)">투명 PNG 도장 이미지를 올리면 서명란에 자동 날인됩니다</span>') +
      '</div>' +
      '</div>' +

      '<div class="ws-card" style="padding:12px">' +
      '<h3 style="margin-bottom:8px;font-size:13px"><span>🔑 DocuSeal 전자서명 API 키 설정</span>' +
      ((A.store.agencyProfile && A.store.agencyProfile.hasDocusealKey)
        ? '<span class="tag-pill ok" style="box-shadow:0 0 8px rgba(34,197,94,0.45)">● 연동됨 (' + A.esc(A.store.agencyProfile.docusealKeyHint || '') + ')</span>'
        : '<span class="tag-pill stage">미연동</span>') +
      '</h3>' +
      '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
      '<input type="password" id="dsApiKeyInput" placeholder="발급받은 DocuSeal API 키를 여기에 붙여넣으세요" style="flex:1;min-width:180px;font-size:12.4px;padding:7px 10px;border-radius:9px;border:1.5px solid var(--line-strong);background:var(--panel-strong);color:var(--text)">' +
      '<button type="button" class="ws-btn sm primary" id="dsKeySaveBtn">💾 API 키 저장</button>' +
      '</div>' +
      '<div style="margin-top:6px;font-size:11.2px;color:var(--muted);display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap">' +
      '<span>완료 웹훅 URL: <code>' + A.esc(location.origin) + '/api/webhooks/docuseal</code></span>' +
      '<button type="button" class="ws-btn sm" id="dsCopyWebhook">📋 웹훅 주소 복사</button>' +
      '</div>' +
      '</div>' +

      '<div class="ws-field">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<label>📝 계약서 조항 텍스트 편집 (1페이지 본문)</label>' +
      '<button type="button" class="ws-btn sm" id="contResetClauses">🔄 표준 조항 복원</button>' +
      '</div>' +
      '<textarea data-cf="clauses" style="min-height:220px;font-size:12.6px">' + A.esc(form.clauses) + '</textarea>' +
      '</div>' +

      '<div class="ws-card" style="padding:12px;border-color:rgba(56,189,248,0.45)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">' +
      '<h3 style="margin:0;font-size:13.2px">📜 별지 A4 2페이지 — 추가 특약사항 (선택)</h3>' +
      '<label class="chip-check" style="margin:0;padding:4px 9px;font-size:11.5px"><input type="checkbox" id="contPage2Chk"' + (form.usePage2 ? ' checked' : '') + '> A4 2장으로 출력/발송</label>' +
      '</div>' +
      '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px">' +
      EXTRA_TERM_PRESETS.map(function (p, i) {
        return '<button type="button" class="ws-btn sm" data-etp="' + i + '">+ ' + p.label + '</button>';
      }).join('') +
      '</div>' +
      '<div class="ws-field">' +
      '<textarea data-cf="extraSpecialTerms" style="min-height:130px;font-size:12.6px" placeholder="클라이언트가 추가 특약사항을 요청할 경우 여기에 입력하세요. 위 [A4 2장으로 출력/발송] 체크를 켜면 오른쪽 미리보기·PDF·전자서명에 별지 2페이지가 자동으로 붙고, 체크를 해제하면 1장으로 표시됩니다.">' + A.esc(form.extraSpecialTerms || '') + '</textarea>' +
      '</div>' +
      '</div>' +
      '</div>' +

      // 오른쪽: 실시간 A4 계약서 미리보기
      '<div class="split-preview">' +
      '<div class="preview-toolbar">' +
      '<span class="neon-yellow-title" style="font-size:12.8px">👁️ 실시간 A4 계약서 미리보기 (' + (form.usePage2 ? '2장' : '1장') + ')</span>' +
      '<div class="ws-actions">' +
      '<button type="button" class="ws-btn sm primary" id="contSaveBtn">💾 계약서 저장</button>' +
      '<button type="button" class="ws-btn sm ai" id="contSendSignBtn">📧 이메일 · 전자서명 발송</button>' +
      '<button type="button" class="ws-btn sm ok" id="contPrintBtn">🖨️ A4 PDF 저장 / 출력</button>' +
      '</div>' +
      '</div>' +
      '<div id="contSignNotice" style="width:100%;max-width:794px" hidden></div>' +
      '<div id="contPreviewBox" style="width:100%;display:flex;flex-direction:column;align-items:center">' + previewHtml() + '</div>' +
      '</div>' +
      '</div>';

    bindEvents(root);
  }

  function bindEvents(root) {
    var q = function (s) { return root.querySelector(s); };
    Array.prototype.forEach.call(root.querySelectorAll('[data-cf]'), function (el) {
      var ev = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(ev, function () {
        var k = el.getAttribute('data-cf');
        if (k === 'clientPhone' || k === 'agencyPhone') {
          el.value = formatPhoneAuto(el.value);
        }
        form[k] = el.value;
        updatePreviewOnly();
      });
    });

    var sampleContBtn = q('#contSampleBtn');
    if (sampleContBtn) sampleContBtn.addEventListener('click', function () {
      var s = A.generateUniqueSample();
      var p1 = EXTRA_TERM_PRESETS[Math.floor(Math.random() * EXTRA_TERM_PRESETS.length)];
      var p2 = EXTRA_TERM_PRESETS[(EXTRA_TERM_PRESETS.indexOf(p1) + 1) % EXTRA_TERM_PRESETS.length];
      form = Object.assign(blankForm(), {
        client_name: s.name,
        clientCeo: s.contactPure,
        clientBizNo: s.bizNo,
        clientPhone: s.phone,
        clientEmail: s.email,
        clientAddress: s.address,
        title: s.contractTitle,
        items: s.items,
        usePage2: true,
        extraSpecialTerms: p1.text + '\n\n' + p2.text,
      });
      render();
      A.toast('🎲 중복 없는 랜덤 계약서(' + s.name + ' · A4 2장)가 자동 입력되었습니다!');
    });

    var p2Chk = q('#contPage2Chk');
    if (p2Chk) p2Chk.addEventListener('change', function () {
      form.usePage2 = p2Chk.checked;
      render();
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-etp]'), function (b) {
      b.addEventListener('click', function () {
        var p = EXTRA_TERM_PRESETS[parseInt(b.getAttribute('data-etp'), 10)];
        if (!p) return;
        form.usePage2 = true;
        form.extraSpecialTerms = (form.extraSpecialTerms ? (form.extraSpecialTerms.trim() + '\n\n') : '') + p.text;
        render();
        A.toast('📜 A4 2페이지 별지 특약에 항목을 추가했습니다!');
      });
    });

    var vatChk = q('#contVatChk');
    if (vatChk) vatChk.addEventListener('change', function () {
      form.includeVat = vatChk.checked;
      updatePreviewOnly();
    });

    Array.prototype.forEach.call(root.querySelectorAll('#contItemsBox .line-row'), function (row) {
      var idx = parseInt(row.getAttribute('data-cidx'), 10);
      Array.prototype.forEach.call(row.querySelectorAll('[data-ck]'), function (inp) {
        inp.addEventListener('input', function () {
          var k = inp.getAttribute('data-ck');
          form.items[idx][k] = inp.type === 'number' ? Number(inp.value || 0) : inp.value;
          updatePreviewOnly();
        });
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-cdel]'), function (b) {
      b.addEventListener('click', function () {
        form.items.splice(parseInt(b.getAttribute('data-cdel'), 10), 1);
        render();
      });
    });

    var addItem = q('#contAddItem');
    if (addItem) addItem.addEventListener('click', function () {
      form.items.push({ name: '추가 대행 서비스', qty: 1, price: 500000, note: '' });
      render();
    });
    var popItem = q('#contPopItem');
    if (popItem) popItem.addEventListener('click', function () {
      if (!form.items.length) { A.toast('삭제할 항목이 없습니다.'); return; }
      form.items.pop();
      render();
    });

    var csel = q('#contClientSel');
    if (csel) csel.addEventListener('change', function () {
      var cid = parseInt(csel.value, 10);
      var c = A.store.clients.filter(function (x) { return x.id === cid; })[0];
      if (c) {
        applyClientToContract(c);
        render();
      }
    });

    var psel = q('#contPropSel');
    if (psel) psel.addEventListener('change', function () {
      var pid = parseInt(psel.value, 10);
      var p = A.store.proposals.filter(function (x) { return x.id === pid; })[0];
      if (p) {
        applyProposalToContract(p.data || p, p.id);
        render();
        A.toast('📑 제안서의 서비스 항목과 금액을 계약서로 불러왔습니다.');
      }
    });

    Array.prototype.forEach.call(root.querySelectorAll('[data-ctid]'), function (b) {
      b.addEventListener('click', function () {
        var id = parseInt(b.getAttribute('data-ctid'), 10);
        var ct = A.store.contracts.filter(function (x) { return x.id === id; })[0];
        if (ct) {
          form = Object.assign(blankForm(), ct.data || {}, {
            id: ct.id,
            client_id: ct.client_id || '',
            proposal_id: ct.proposal_id || '',
            contract_no: ct.contract_no || '',
            client_name: ct.client_name || '',
            title: ct.title || '',
            status: ct.status || '초안',
          });
          render();
        }
      });
    });

    var newBtn = q('#contNewBtn');
    if (newBtn) newBtn.addEventListener('click', function () { form = blankForm(); render(); });

    var delBtn = q('#contDelBtn');
    if (delBtn && form.id) delBtn.addEventListener('click', function () {
      if (!confirm('이 계약서를 삭제할까요?')) return;
      A.api('/api/contracts/' + form.id, { method: 'DELETE' })
        .then(function () { form = blankForm(); return A.refreshAll(); })
        .then(function () { A.toast('🗑️ 계약서를 삭제했습니다.'); });
    });

    var resetClauses = q('#contResetClauses');
    if (resetClauses) resetClauses.addEventListener('click', function () {
      form.clauses = DEFAULT_CLAUSES;
      render();
    });

    // 직인 업로드
    var stampBtn = q('#contStampBtn'), stampInp = q('#contStampInput');
    if (stampBtn && stampInp) {
      stampBtn.addEventListener('click', function () { stampInp.click(); });
      stampInp.addEventListener('change', function () {
        var f = stampInp.files && stampInp.files[0];
        if (!f) return;
        if (f.size > 350 * 1024) { A.toast('⚠️ 직인 이미지는 350KB 이하를 권장합니다.'); return; }
        var reader = new FileReader();
        reader.onload = function () {
          form.stampDataUrl = String(reader.result || '');
          render();
          A.toast('🔴 직인 이미지가 적용되었습니다. "기본정보로 영구 저장"을 누르면 계속 유지됩니다.');
        };
        reader.readAsDataURL(f);
      });
    }
    var stampClr = q('#contStampClear');
    if (stampClr) stampClr.addEventListener('click', function () { form.stampDataUrl = ''; render(); });

    // 우리 회사 기본정보 영구 저장
    var saveProf = q('#contSaveProfileBtn');
    if (saveProf) saveProf.addEventListener('click', function () {
      var prof = {
        company: form.agencyCompany.trim() || '미담공장',
        ceo: form.agencyCeo.trim(),
        bizNo: form.agencyBizNo.trim(),
        address: form.agencyAddress.trim(),
        phone: form.agencyPhone.trim(),
        bank: form.agencyBank.trim(),
        stampDataUrl: form.stampDataUrl || '',
      };
      A.api('/api/agency-profile', { method: 'POST', body: JSON.stringify(prof) })
        .then(function () {
          A.store.agencyProfile = Object.assign({}, A.DEFAULT_AGENCY_PROFILE, prof);
          A.toast('✅ 우리 회사 기본정보와 직인이 영구 저장되었습니다.');
        })
        .catch(function (err) { A.toast('❌ 저장 실패: ' + (err.message || '')); });
    });

    var saveBtn = q('#contSaveBtn');
    function saveContractInternal() {
      if (!form.client_name.trim()) {
        A.toast('⚠️ 갑(고객사) 업체명을 입력하세요.');
        return Promise.reject(new Error('업체명 필요'));
      }
      var tot = calcTotals();
      var payload = {
        client_id: form.client_id || null,
        proposal_id: form.proposal_id || null,
        contract_no: form.contract_no.trim() || makeContractNo(),
        client_name: form.client_name.trim(),
        title: form.title.trim(),
        status: form.status,
        total_amount: tot.total,
        data: Object.assign({}, form),
      };
      var req = form.id
        ? A.api('/api/contracts/' + form.id, { method: 'PATCH', body: JSON.stringify(payload) })
        : A.api('/api/contracts', { method: 'POST', body: JSON.stringify(payload) });
      return req.then(function (d) {
        if (d.contract) form.id = d.contract.id;
        return A.refreshAll().then(function () { return d.contract; });
      });
    }
    if (saveBtn) saveBtn.addEventListener('click', function () {
      saveContractInternal().then(function () {
        A.toast('✅ 계약서가 저장되었습니다.');
        render();
      }).catch(function (err) {
        if (err && err.message !== '업체명 필요') A.toast('❌ 저장 실패: ' + (err.message || ''));
      });
    });

    // 📧 DocuSeal 원클릭 이메일 발송 + 전자서명 요청
    function buildDocuSealHtml() {
      var inner = previewHtml().replace(
        '<b>' + A.esc(form.clientCeo || '-') + ' (인)</b>',
        '<b>' + A.esc(form.clientCeo || '-') + '</b><div style="margin-top:6px"><signature-field name="갑 전자서명" role="Client" required="true" style="width:150px;height:48px;display:inline-block;"></signature-field></div>'
      );
      return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>' +
        'body{font-family:"Apple SD Gothic Neo","Malgun Gothic",sans-serif;color:#111827;font-size:12.5px;line-height:1.65;margin:0;padding:18px 24px}' +
        'h1{font-size:22px;text-align:center;margin:0 0 6px}.doc-sub{text-align:center;font-size:12px;color:#475569;margin-bottom:18px}' +
        '.sec-title{font-size:13.5px;font-weight:800;color:#0c4a6e;border-left:4px solid #0284c7;padding-left:8px;margin:16px 0 8px}' +
        'table{width:100%;border-collapse:collapse;margin:8px 0 12px;font-size:12px}th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left}' +
        'th{background:#f1f5f9}.num{text-align:right}.sum-box{background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:10px 14px;margin:10px 0}' +
        '.sum-box .big{font-size:16px;font-weight:900;color:#0284c7}.clause-body{white-space:pre-wrap;font-size:12px;line-height:1.7}' +
        '.sign-grid{display:flex;gap:16px;margin-top:20px}.sign-box{flex:1;border:1px solid #cbd5e1;border-radius:8px;padding:12px;position:relative}' +
        '.sign-box h4{margin:0 0 6px;font-size:12.5px;color:#0c4a6e;border-bottom:1px dashed #cbd5e1;padding-bottom:4px}' +
        '.sign-row{display:flex;justify-content:space-between;font-size:11.8px;margin:3px 0}' +
        '.stamp-img{position:absolute;right:12px;bottom:10px;width:58px;height:58px;object-fit:contain;opacity:.88}' +
        '</style></head><body>' + inner + '</body></html>';
    }

    // 🔑 DocuSeal API 키 화면에서 바로 저장 + 웹훅 URL 복사
    var dsSaveBtn = q('#dsKeySaveBtn');
    if (dsSaveBtn) dsSaveBtn.addEventListener('click', function () {
      var kInp = q('#dsApiKeyInput');
      var kVal = kInp ? kInp.value.trim() : '';
      if (!kVal) { A.toast('⚠️ 발급받은 DocuSeal API 키를 붙여넣어 주세요.'); if (kInp) kInp.focus(); return; }
      dsSaveBtn.disabled = true;
      A.api('/api/agency-profile', {
        method: 'POST',
        body: JSON.stringify({ docusealApiKey: kVal }),
      }).then(function (d) {
        if (d && d.data) A.store.agencyProfile = Object.assign({}, A.store.agencyProfile, d.data);
        if (kInp) kInp.value = '';
        A.toast('✅ DocuSeal API 키가 안전하게 저장되었습니다! 이제 바로 이메일·전자서명을 발송할 수 있습니다.');
        render();
      }).catch(function (err) {
        dsSaveBtn.disabled = false;
        A.toast('❌ API 키 저장 실패: ' + (err.message || ''));
      });
    });
    var dsCopyBtn = q('#dsCopyWebhook');
    if (dsCopyBtn) dsCopyBtn.addEventListener('click', function () {
      var u = location.origin + '/api/webhooks/docuseal';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(u).then(function () { A.toast('📋 웹훅 주소를 복사했습니다: ' + u); });
      }
    });

    var sendSignBtn = q('#contSendSignBtn');
    if (sendSignBtn) sendSignBtn.addEventListener('click', function () {
      if (!form.client_name.trim()) {
        A.toast('⚠️ 먼저 갑(고객사) 업체명을 입력해 주세요.');
        var cnEl = root.querySelector('[data-cf="client_name"]');
        if (cnEl) cnEl.focus();
        return;
      }
      var email = String(form.clientEmail || '').trim();
      if (!email || email.indexOf('@') === -1) {
        A.toast('⚠️ 갑(고객사) 정보에 "고객 이메일"을 먼저 입력해 주세요.');
        var emEl = root.querySelector('[data-cf="clientEmail"]');
        if (emEl) emEl.focus();
        return;
      }
      sendSignBtn.disabled = true;
      var noticeEl = q('#contSignNotice');
      saveContractInternal()
        .then(function () {
          return A.api('/api/contracts/' + form.id + '/send-sign', {
            method: 'POST',
            body: JSON.stringify({
              email: email,
              client_name: form.client_name.trim(),
              html: buildDocuSealHtml(),
            }),
          });
        })
        .then(function (d) {
          form.status = '서명요청중';
          form.docuseal = d.docuseal || null;
          if (noticeEl) noticeEl.hidden = true;
          A.toast('✅ 고객 이메일(' + email + ')로 전자서명 계약서를 발송했습니다!');
          return A.refreshAll().then(render);
        })
        .catch(function (err) {
          sendSignBtn.disabled = false;
          if (noticeEl) {
            var mailSub = encodeURIComponent('[' + (form.agencyCompany || '미담공장') + '] ' + form.title + ' (' + form.contract_no + ')');
            var mailBody = encodeURIComponent(form.client_name + ' 대표님 안녕하세요.\n' + (form.agencyCompany || '미담공장') + '입니다.\n첨부된 마케팅 대행 계약서 확인 및 서명 부탁드립니다.\n감사합니다.');
            var gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(email) + '&su=' + mailSub + '&body=' + mailBody;
            noticeEl.hidden = false;
            noticeEl.innerHTML = '<div class="ws-card" style="border-color:#f59e0b;font-size:12.4px;line-height:1.6">' +
              '<b style="color:#d97706">⚙️ DocuSeal API 키 연동 안내</b><br>' +
              A.esc(err.message || '발송에 실패했습니다.') +
              '<div style="margin-top:8px;padding:8px 10px;border-radius:9px;background:rgba(2,132,199,0.08);font-size:11.8px">' +
              '1) 왼쪽 <b>🔑 DocuSeal 전자서명 API 키 설정</b> 칸에 발급받은 API 키를 붙여넣고 <b>API 키 저장</b> 클릭<br>' +
              '2) DocuSeal Settings → Webhooks에 <code>' + A.esc(location.origin) + '/api/webhooks/docuseal</code> 등록 (이벤트: <code>form.completed</code>)' +
              '</div>' +
              '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">' +
              '<a class="ws-btn sm primary" href="https://www.docuseal.com" target="_blank" rel="noopener noreferrer" style="text-decoration:none">🔗 DocuSeal 열기 (새 창)</a>' +
              '<a class="ws-btn sm ok" href="' + gmailUrl + '" target="_blank" rel="noopener noreferrer" style="text-decoration:none">📧 Gmail 새 창으로 보내기</a>' +
              '<a class="ws-btn sm" href="mailto:' + encodeURIComponent(email) + '?subject=' + mailSub + '&body=' + mailBody + '" target="_blank" rel="noopener noreferrer" style="text-decoration:none">✉️ PC 기본 메일 앱 (새 창)</a>' +
              '</div>' +
              '</div>';
          }
          A.toast('ℹ️ 왼쪽 "DocuSeal API 키 설정" 칸에 키를 입력 후 저장해 주세요.');
        });
    });

    var printBtn = q('#contPrintBtn');
    if (printBtn) printBtn.addEventListener('click', function () {
      A.printPane('pane-contract', (form.client_name || '고객사') + '_계약서_' + form.contract_no);
    });
  }

  function applyClientToContract(c) {
    form.client_id = c.id || '';
    form.client_name = c.name || '';
    form.clientCeo = c.contact_name || '';
    form.clientPhone = c.contact_phone || '';
    if (c.services && c.services.length) {
      var perPrice = c.monthly_fee > 0 ? Math.round(c.monthly_fee / c.services.length) : 1000000;
      form.items = c.services.map(function (s) {
        return { name: s, qty: 1, price: perPrice, note: '월간 대행' };
      });
    } else if (c.monthly_fee > 0) {
      form.items = [{ name: '통합 SNS 마케팅 대행', qty: 1, price: c.monthly_fee, note: '월간 대행' }];
    }
  }

  function applyProposalToContract(p, propId) {
    if (!p) return;
    form.proposal_id = propId || p.id || '';
    if (p.client_id) form.client_id = p.client_id;
    if (p.client_name) form.client_name = p.client_name;
    if (p.contact_name) form.clientCeo = p.contact_name;
    if (p.title) form.title = p.title.replace(/제안서/g, '대행 용역 계약서');
    if (Array.isArray(p.items) && p.items.length) {
      form.items = p.items.map(function (it) {
        return { name: it.name, qty: Number(it.qty || 1), price: Number(it.price || 0), note: it.note || '' };
      });
      var discRate = Number(p.discountRate || 0);
      if (discRate > 0) {
        var sub = form.items.reduce(function (a, b) { return a + (b.qty * b.price); }, 0);
        var discAmt = Math.round(sub * (discRate / 100));
        if (discAmt > 0) {
          form.items.push({ name: '패키지 특별 할인 (' + discRate + '%)', qty: 1, price: -discAmt, note: '제안서 할인 적용' });
        }
      }
    }
    if (p.includeVat !== undefined) form.includeVat = !!p.includeVat;
    // 제안서 핵심 전략 & 단계별 로드맵을 별지 참고 특약으로 통일 이관
    var summaryLines = [];
    if (p.concept) summaryLines.push('• 핵심 브랜딩 방향: ' + p.concept);
    if (p.roadmap) summaryLines.push('• 합의된 단계별 진행 로드맵:\n' + p.roadmap);
    if (summaryLines.length) {
      form.usePage2 = true;
      form.extraSpecialTerms = '[제안서 기반 합의 과업 범위]\n' + summaryLines.join('\n\n');
    }
  }

  A.on('transfer-contract', function (payload) {
    form = blankForm();
    if (payload && payload.client) applyClientToContract(payload.client);
    if (payload && payload.proposal) applyProposalToContract(payload.proposal, payload.proposal.id);
    render();
    A.toast('📄 업체·서비스·금액을 계약서로 불러왔습니다! 오른쪽 미리보기를 확인 후 출력하세요.');
  });

  // 채팅창에서 대장님이 "계약서 승인·적용" 클릭 시 AI 최종안 내용을 계약서 양식에 자동 반영
  A.on('apply-ai-contract', function (payload) {
    var p = (payload && payload.parsed) || {};
    var msg = payload && payload.message;
    if (p.client_name) form.client_name = p.client_name;
    if (p.clientCeo) form.clientCeo = p.clientCeo;
    if (p.clientEmail) form.clientEmail = p.clientEmail;
    if (p.clientPhone) form.clientPhone = p.clientPhone;
    if (p.title) form.title = p.title;
    if (p.paymentTerms) form.paymentTerms = p.paymentTerms;
    if (p.items && p.items.length) form.items = p.items;
    if (p.extraClauses) {
      form.clauses = DEFAULT_CLAUSES + '\n\n[AI 회의 최종 승인 추가 특약]\n' + p.extraClauses;
    } else if (!p.items && p.raw) {
      form.clauses = DEFAULT_CLAUSES + '\n\n[AI 회의 최종 승인 메모]\n' + p.raw.slice(0, 1500);
    }
    render();
    A.toast('✅ ' + (msg ? msg.sender + '의 ' : '') + '승인 내용을 계약서 양식에 자동 반영했습니다!');
    if (payload && payload.autoSendEmail) {
      setTimeout(function () {
        var btn = document.getElementById('contSendSignBtn');
        if (btn) btn.click();
      }, 250);
    }
  });

  A.on('data-updated', function () {
    // 최초 로드 시 회사 프로필 동기화
    var prof = A.store.agencyProfile;
    if (!form.id && prof) {
      form.agencyCompany = prof.company || form.agencyCompany;
      form.agencyCeo = prof.ceo || form.agencyCeo;
      form.agencyBizNo = prof.bizNo || form.agencyBizNo;
      form.agencyAddress = prof.address || form.agencyAddress;
      form.agencyPhone = prof.phone || form.agencyPhone;
      form.agencyBank = prof.bank || form.agencyBank;
      form.stampDataUrl = prof.stampDataUrl || form.stampDataUrl;
    }
    if (A.store.activeTab === 'contract') render();
  });
  A.on('tab-changed', function (t) { if (t === 'contract') render(); });
})();

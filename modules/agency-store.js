/**
 * Buja_Ai_room 마케팅 에이전시 워크스페이스 공통 스토어 & AI 업셀링 플레이북
 * - 고객사(CRM), SNS 분석 보고서, 제안서, 계약서, 회사 프로필(미담공장) 상태 공유
 * - 업종별 즉시 업셀링 추천 엔진 + 기존 멀티 AI 팀(#일진홍보부) 연동
 * - 탭 간 원클릭 데이터 이관(CRM → SNS → 제안서 → 계약서) 및 A4 PDF 인쇄
 */
(function () {
  'use strict';

  var INDUSTRIES = [
    { id: '병원', icon: '🏥', label: '병원 · 개원/검진' },
    { id: '보험설계사', icon: '🛡️', label: '보험설계사 · GA' },
    { id: '정책자금', icon: '💰', label: '정책자금 컨설팅' },
    { id: '자영업/소상공인', icon: '🏪', label: '자영업 · 소상공인' },
    { id: '브랜드/기타', icon: '✨', label: '브랜드 · 기타' },
  ];

  var SERVICES = [
    '네이버 블로그 대행',
    '인스타 릴스 대행',
    '브랜딩 기획',
    '퍼널·DB 수집 마케팅',
    '스레드 대행',
  ];

  var FUNNEL_STAGES = [
    '신규문의',
    'SNS진단',
    '제안발송',
    '계약진행',
    '운영중',
    '업셀링대기',
  ];

  var DEFAULT_AGENCY_PROFILE = {
    company: '미담공장',
    ceo: '부자사람대장',
    bizNo: '000-00-00000',
    address: '서울특별시 (회사 주소를 입력하세요)',
    phone: '010-0000-0000',
    email: 'contact@midamfactory.kr',
    bank: '계좌번호 (은행 / 계좌 / 예금주)',
    stampDataUrl: '',
  };

  // 업종별 맞춤 업셀링 · 신규 제안 플레이북
  var INDUSTRY_PLAYBOOK = {
    '병원': {
      coreHook: '진료 과목 신뢰 구축 + 원장님 전문성 브랜딩 + 신환 상담 DB 자동화',
      blogStrategy: '증상·시술·개원/검진 핵심 키워드(주 3회) + 의료법 심의 준수 사례형 원고 + 하단 네이버 예약/카톡 상담 전환 배너',
      reelsStrategy: '원장님 1분 팩트체크 숏폼 + 실수 경고형 3초 후킹 + 시술/검진 현장 비하인드 릴스(월 8편)',
      funnelStrategy: '블로그·릴스 유입 → 무료 자가진단/체크리스트 PDF → 카카오 채널 1:1 상담 예약 DB 수집',
      upsells: [
        { needMissing: '인스타 릴스 대행', title: '원장님 퍼스널 브랜딩 릴스 8편 패키지 추가', price: 1200000, reason: '블로그 검색 유입만으로는 지역 인지도 확산에 한계가 있어, 원장님 얼굴이 나오는 1분 팩트체크 릴스로 신환 신뢰도를 2배 높일 수 있습니다.' },
        { needMissing: '퍼널·DB 수집 마케팅', title: '신환 상담 자동 수집 퍼널(카톡/랜딩 DB) 구축', price: 900000, reason: '콘텐츠 조회를 실제 내원 예약 DB로 전환하는 랜딩폼 + 알림톡 리마인드 퍼널 결합 시 문의 전환율이 크게 올라갑니다.' },
        { needMissing: '네이버 블로그 대행', title: '진료권 상위노출 네이버 브랜드 블로그 대행', price: 1100000, reason: '병원 선택 직전 환자의 80%는 네이버 검색으로 검증하므로 핵심 질환·지역 키워드 선점이 필수입니다.' },
      ],
    },
    '보험설계사': {
      coreHook: '보장분석 리드(DB) 확보 + 설계사 신뢰 브랜딩 + 상담 자동 예약 퍼널',
      blogStrategy: '실손·암·운전자·어린이보험 비교 키워드 + 실제 보상 청구 성공 사례 칼럼(주 3~4회) + 보장분석 무료신청 CTA',
      reelsStrategy: '보험금 놓치는 실수 TOP3 · 내 보험료 새는 구멍 30초 팩트체크 릴스 + 댓글 키워드 자동 DM(매니챗) 연계',
      funnelStrategy: '릴스 댓글 DM/블로그 배너 → 3문항 간편 보장점검 폼 → 가망고객 DB 수집 → 1:1 카톡 리포트 발송',
      upsells: [
        { needMissing: '퍼널·DB 수집 마케팅', title: '가망고객 DB 자동 수집 퍼널 + 댓글 DM 자동화', price: 1000000, reason: '보험 영업은 결국 양질의 보장분석 DB 단가가 핵심입니다. 릴스·블로그 하단에 3문항 DB 폼을 연결하면 월 30~80건 자체 DB 확보가 가능합니다.' },
        { needMissing: '인스타 릴스 대행', title: '보장분석 문의 폭주형 릴스 10편 + 스레드 연계', price: 1300000, reason: '보험금 청구 실수/사례 숏폼은 저장·공유율이 높아 유료 DB 구매 비용을 크게 절감할 수 있습니다.' },
        { needMissing: '브랜딩 기획', title: '상위 1% 전문 설계사 퍼스널 브랜딩 리뉴얼', price: 800000, reason: '프로필·썸네일·상담 리포트 디자인을 통일해 영업사원이 아닌 재무 주치의 포지션을 각인시킵니다.' },
      ],
    },
    '정책자금': {
      coreHook: '대표님 B2B 가망 DB 수집 + 승인 사례 기반 전문성 브랜딩 + 진단 퍼널',
      blogStrategy: '소상공인·중소기업 정책자금, 운전자금, 기술보증기금 자격 조건/부결 사유 분석 원고 + 1분 자가진단 폼',
      reelsStrategy: '대표님들이 가장 많이 탈락하는 서류 실수 3가지 · 올해 정책자금 마감 임박 알림 릴스(월 8편)',
      funnelStrategy: '검색/릴스 유입 → 업력·매출·신용점수 4문항 무료 한도진단 폼 → 고관여 대표자 DB 확보',
      upsells: [
        { needMissing: '퍼널·DB 수집 마케팅', title: '정책자금 무료 한도진단 B2B DB 퍼널 셋팅', price: 1100000, reason: '매출·업력·필요자금 사전 필터링 폼을 붙이면 허수 문의를 걸러내고 계약 확률 높은 대표자 DB만 수집할 수 있습니다.' },
        { needMissing: '네이버 블로그 대행', title: '정책자금 핵심 키워드 브랜드 블로그 SEO 운영', price: 1200000, reason: '자금이 급한 대표님들은 네이버에서 직접 조건과 승인 사례를 검색하므로 정보성 상위노출이 즉각 문의로 이어집니다.' },
        { needMissing: '인스타 릴스 대행', title: '정책자금 속보 · 탈락 방지 숏폼 릴스 패키지', price: 1100000, reason: '자금 공고 시즌에 맞춰 빠른 숏폼 속보를 올리면 경쟁 컨설팅사 대비 압도적인 DB 선점이 가능합니다.' },
      ],
    },
    '자영업/소상공인': {
      coreHook: '지역 상권 검색 장악 + 릴스 바이럴 방문 유도 + 단골 재방문 퍼널',
      blogStrategy: '지역명+업종 핵심 키워드 + 매장 스토리·시그니처 메뉴/서비스 체험형 콘텐츠 + 플레이스 연동 최적화',
      reelsStrategy: '3초 시선강탈 매장 현장·비포애프터·사장님 철학 릴스(월 8편) + 위치태그/지역 해시태그 공략',
      funnelStrategy: '릴스/블로그 노출 → 네이버 플레이스 알림받기 쿠폰 → 방문 리뷰 선순환 & 카카오 단골 채널 확보',
      upsells: [
        { needMissing: '인스타 릴스 대행', title: '지역 상권 폭발형 릴스 숏폼 8편 + 플레이스 연계', price: 900000, reason: '자영업 매장은 릴스 1편만 지역 알고리즘을 타도 주말 예약과 방문객이 즉각 반응합니다.' },
        { needMissing: '브랜딩 기획', title: '매장 시그니처 컨셉 · SNS 프로필/피드 브랜딩', price: 700000, reason: '가격 경쟁에서 벗어나 "일부러 찾아가는 매장" 이미지를 만들어 객단가를 높입니다.' },
        { needMissing: '퍼널·DB 수집 마케팅', title: '쿠폰·예약 DB 확보 및 단골 재방문 자동화', price: 600000, reason: '신규 유입 고객을 1회성으로 흘리지 않고 쿠폰/알림 채널로 묶어 재방문 매출을 만듭니다.' },
      ],
    },
    '브랜드/기타': {
      coreHook: '차별화된 브랜드 포지셔닝 + 멀티채널(블로그·릴스·스레드) 통합 퍼널',
      blogStrategy: '브랜드 철학·고객 문제 해결 칼럼·검색 키워드 점유 콘텐츠(주 3회)',
      reelsStrategy: '브랜드 무드·비하인드·고객 후기 기반 숏폼 릴스(월 8편) + 스레드 데일리 소통',
      funnelStrategy: '콘텐츠 인지 → 리드 마그넷(가이드/샘플/무료상담) → DB 수집 및 전환',
      upsells: [
        { needMissing: '브랜딩 기획', title: '브랜드 핵심 메시지 · 비주얼 아이덴티티 재정립', price: 1200000, reason: '콘텐츠 효율이 떨어질 때는 발행량보다 포지셔닝과 후킹 메시지를 먼저 재설계해야 전환율이 살아납니다.' },
        { needMissing: '스레드 대행', title: '스레드(Threads) 데일리 팬덤 구축 대행 추가', price: 500000, reason: '릴스·블로그 소스를 짧은 인사이트로 재가공해 매일 발행하면 저비용으로 고관여 팔로워와 문의를 확보할 수 있습니다.' },
        { needMissing: '퍼널·DB 수집 마케팅', title: '고전환 상담/구매 리드 퍼널 구축', price: 900000, reason: '트래픽을 매출로 바꾸는 랜딩페이지·CTA·상담 동선을 정비해 ROAS를 끌어올립니다.' },
      ],
    },
  };

  var store = {
    activeTab: localStorage.getItem('buja_active_tab') || 'chat',
    clients: [],
    snsReports: [],
    proposals: [],
    contracts: [],
    portfolios: [],
    souls: null,
    agencyProfile: Object.assign({}, DEFAULT_AGENCY_PROFILE),
    loaded: false,
    listeners: {},
    bridge: null,
  };

  function emit(ev, detail) {
    (store.listeners[ev] || []).forEach(function (fn) {
      try { fn(detail); } catch (e) { console.error(e); }
    });
  }

  function on(ev, fn) {
    if (!store.listeners[ev]) store.listeners[ev] = [];
    store.listeners[ev].push(fn);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function won(n) {
    var v = Number(n || 0);
    if (!Number.isFinite(v)) v = 0;
    return Math.round(v).toLocaleString('ko-KR') + '원';
  }

  function todayKst() {
    try {
      var parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
      }).formatToParts(new Date());
      var y = '', m = '', d = '';
      parts.forEach(function (p) {
        if (p.type === 'year') y = p.value;
        if (p.type === 'month') m = p.value;
        if (p.type === 'day') d = p.value;
      });
      return y + '-' + m + '-' + d;
    } catch (e) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  function toast(msg) {
    var old = document.querySelector('.ws-toast');
    if (old) old.remove();
    var el = document.createElement('div');
    el.className = 'ws-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 2800);
  }

  function api(path, opts) {
    if (store.bridge && store.bridge.api) return store.bridge.api(path, opts);
    return Promise.reject(new Error('API 브릿지가 아직 준비되지 않았습니다.'));
  }

  function refreshAll() {
    return Promise.all([
      api('/api/clients').then(function (d) { store.clients = d.clients || []; }).catch(function () {}),
      api('/api/sns-reports').then(function (d) { store.snsReports = d.reports || []; }).catch(function () {}),
      api('/api/proposals').then(function (d) { store.proposals = d.proposals || []; }).catch(function () {}),
      api('/api/contracts').then(function (d) { store.contracts = d.contracts || []; }).catch(function () {}),
      api('/api/portfolios').then(function (d) { store.portfolios = d.portfolios || []; }).catch(function () {}),
      api('/api/souls').then(function (d) { if (d && d.data) store.souls = d.data; }).catch(function () {}),
      api('/api/agency-profile').then(function (d) {
        if (d && d.data) store.agencyProfile = Object.assign({}, DEFAULT_AGENCY_PROFILE, d.data);
      }).catch(function () {}),
    ]).then(function () {
      store.loaded = true;
      updateTabBadges();
      emit('data-updated');
    });
  }

  function updateTabBadges() {
    var bCrm = document.getElementById('tabBadgeCrm');
    var bSns = document.getElementById('tabBadgeSns');
    var bProp = document.getElementById('tabBadgeProp');
    var bCont = document.getElementById('tabBadgeCont');
    var bPort = document.getElementById('tabBadgePort');
    if (bCrm) bCrm.textContent = String(store.clients.length);
    if (bSns) bSns.textContent = String(store.snsReports.length);
    if (bProp) bProp.textContent = String(store.proposals.length);
    if (bCont) bCont.textContent = String(store.contracts.length);
    if (bPort) bPort.textContent = String(store.portfolios.length || 10);
  }

  function switchTab(tabId) {
    var valid = ['chat', 'crm', 'sns', 'proposal', 'contract', 'portfolio', 'video', 'content', 'secret'];
    if (valid.indexOf(tabId) === -1) tabId = 'chat';
    store.activeTab = tabId;
    localStorage.setItem('buja_active_tab', tabId);

    document.body.classList.toggle('ws-mode', tabId !== 'chat');
    Array.prototype.forEach.call(document.querySelectorAll('.cat-tab'), function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    var chatPane = document.getElementById('chatPane');
    if (chatPane) chatPane.hidden = tabId !== 'chat';
    ['crm', 'sns', 'proposal', 'contract', 'portfolio', 'video', 'content', 'secret'].forEach(function (id) {
      var el = document.getElementById('pane-' + id);
      if (el) el.hidden = tabId !== id;
    });

    // 상단 검색창은 AI 회의실 탭에서만 표시
    var sb = document.querySelector('.searchbox');
    if (sb) sb.style.display = tabId === 'chat' ? '' : 'none';

    emit('tab-changed', tabId);
  }

  // 업종·이용서비스·DB 현황 기반 즉시 1초 업셀링 제안 계산
  function buildUpsellRecommendations(client, latestSns) {
    if (!client) return [];
    var pb = INDUSTRY_PLAYBOOK[client.industry] || INDUSTRY_PLAYBOOK['브랜드/기타'];
    var curServices = Array.isArray(client.services) ? client.services : [];
    var recs = [];

    // 1) 미이용 핵심 서비스 기반 업셀링 추천
    pb.upsells.forEach(function (u) {
      if (curServices.indexOf(u.needMissing) === -1) {
        recs.push({
          tag: '업셀링 추천',
          service: u.needMissing,
          title: u.title,
          price: u.price,
          reason: u.reason,
        });
      }
    });

    // 2) DB 목표 대비 달성률 부족 시 전환 퍼널 보강 추천
    var goal = Number(client.db_goal || 0);
    var cnt = Number(client.db_count || 0);
    if (goal > 0 && cnt < goal * 0.7) {
      recs.push({
        tag: 'DB 전환 긴급 보강',
        service: '퍼널·DB 수집 마케팅',
        title: '목표 DB(' + goal + '건) 대비 현재 ' + cnt + '건 → 랜딩 CTA · 3초 후킹 리뉴얼 제안',
        price: 700000,
        reason: '현재 DB 달성률이 ' + Math.round((cnt / goal) * 100) + '%입니다. 리드 마그넷(무료 진단표/체크리스트)과 카카오 간편문의 동선을 추가해 전환율을 즉시 개선할 것을 제안합니다.',
      });
    }

    // 3) SNS 분석 보고서 기반 보완 제안
    if (latestSns && latestSns.data) {
      var d = latestSns.data;
      if (Number(d.blogScore || 100) < 70) {
        recs.push({
          tag: '블로그 SEO 개선',
          service: '네이버 블로그 대행',
          title: '네이버 블로그 SEO 집중 클리닉 (현재 진단 ' + d.blogScore + '점)',
          price: 800000,
          reason: '상위 노출 키워드 구조와 전환 배너 정비가 필요합니다. 업종 핵심 키워드 20개 클러스터링 패키지를 제안하세요.',
        });
      }
      if (Number(d.reelsAvgViews || 9999) < 3000 && curServices.indexOf('인스타 릴스 대행') !== -1) {
        recs.push({
          tag: '릴스 후킹 리뉴얼',
          service: '인스타 릴스 대행',
          title: '릴스 3초 후킹 대본 · 썸네일 고도화 업그레이드',
          price: 500000,
          reason: '평균 릴스 조회수가 ' + Number(d.reelsAvgViews || 0).toLocaleString() + '회로 정체 구간입니다. 실수 경고형·팩트체크형 대본 포맷 전환을 제안하세요.',
        });
      }
    }

    // 모든 서비스를 이미 사용 중이면 스레드/리텐션 확장 제안
    if (!recs.length) {
      recs.push({
        tag: '장기 리텐션 확장',
        service: '스레드 대행',
        title: '스레드(Threads) 데일리 브랜딩 + 분기별 성과 리포트 고도화',
        price: 600000,
        reason: '핵심 패키지를 모두 이용 중인 VIP 고객사입니다. 스레드 채널 확장과 연간 장기 계약(10% 할인) 전환으로 락인(Lock-in)을 제안하세요.',
      });
    }
    return recs;
  }

  // 기존 멀티 AI 일진팀(#부자사람 일진 종합반 기본)에 심층 분석/업셀링/제안서 초안 요청 발송
  function requestAiAssist(opts) {
    var roomSlug = opts.room || 'general';
    var content = String(opts.prompt || '').trim();
    if (!content) return Promise.reject(new Error('요청 내용이 없습니다.'));
    var sender = (store.bridge && store.bridge.getSender) ? store.bridge.getSender() : '부자사람대장';
    return api('/api/rooms/' + encodeURIComponent(roomSlug) + '/messages', {
      method: 'POST',
      body: JSON.stringify({ sender: sender, content: content.slice(0, 3900) }),
    }).then(function (res) {
      if (window.triggerSkyBurst) window.triggerSkyBurst();
      var rLabel = roomSlug === 'general' ? '부자사람 일진 종합반' : ('#' + roomSlug);
      toast('🤖 ' + rLabel + '으로 AI 의논 요청 완료! AI들이 의논 후 최종안을 올리면 "제안서/계약서 적용" 버튼으로 승인하세요.');
      return res;
    });
  }

  // AI 채팅 메시지 텍스트를 제안서 필드로 스마트 파싱
  function parseAiProposalText(rawText) {
    var txt = String(rawText || '').trim();
    var out = { raw: txt };
    function pick(patterns) {
      for (var i = 0; i < patterns.length; i++) {
        var m = txt.match(patterns[i]);
        if (m && m[1] && m[1].trim()) return m[1].trim();
      }
      return '';
    }
    function pickSection(headingRe) {
      var lines = txt.split(/\r?\n/);
      var capturing = false, buf = [];
      for (var i = 0; i < lines.length; i++) {
        var l = lines[i];
        if (!capturing && headingRe.test(l)) {
          capturing = true;
          var afterColon = l.replace(headingRe, '').replace(/^[\s:\-\]]+/, '').trim();
          if (afterColon) buf.push(afterColon);
          continue;
        }
        if (capturing) {
          if (/^\s*(#{1,4}\s|\d+[\.\)]\s|\[[가-힣A-Za-z0-9\s·\/]+\]|\*\*\d+[\.\)])/.test(l) && buf.length > 0) break;
          buf.push(l);
        }
      }
      return buf.join('\n').replace(/\*\*/g, '').trim();
    }

    out.client_name = pick([
      /\[?고객사(?:명)?\]?\s*[:：]\s*([^\n(]+)/i,
      /수신\s*[:：]\s*([^\n(]+)/i,
    ]);
    out.title = pick([
      /\[?제안(?:서)?\s*제목\]?\s*[:：]\s*([^\n]+)/i,
    ]);
    out.concept = pick([
      /\[?핵심\s*(?:브랜딩\s*)?컨셉\]?\s*[:：]?\s*["“]?([^\n"”]+)["”]?/i,
      /한\s*줄\s*컨셉\s*[:：]\s*["“]?([^\n"”]+)["”]?/i,
    ]);
    out.diagnosis = pickSection(/^\s*(?:#{1,4}\s*)?(?:\d+[\.\)]\s*)?\[?(?:현황\s*진단|문제점|핵심\s*과제)[^\n\]]*\]?/i);
    out.strategyBlog = pickSection(/^\s*(?:#{1,4}\s*)?(?:[-*]\s*)?(?:\d+[\.\)-]\s*)?\[?(?:네이버\s*블로그|블로그\s*전략)[^\n\]]*\]?/i);
    out.strategyReels = pickSection(/^\s*(?:#{1,4}\s*)?(?:[-*]\s*)?(?:\d+[\.\)-]\s*)?\[?(?:인스타(?:그램)?\s*릴스|릴스\s*전략|숏폼)[^\n\]]*\]?/i);
    out.strategyFunnel = pickSection(/^\s*(?:#{1,4}\s*)?(?:[-*]\s*)?(?:\d+[\.\)-]\s*)?\[?(?:퍼널|DB\s*수집|전환\s*동선|문의\s*전환)[^\n\]]*\]?/i);
    out.roadmap = pickSection(/^\s*(?:#{1,4}\s*)?(?:\d+[\.\)]\s*)?\[?(?:단계별\s*(?:진행\s*)?로드맵|3개월\s*로드맵|진행\s*일정|로드맵)[^\n\]]*\]?/i);

    // 견적 항목 라인 파싱 (예: "- 네이버 블로그 대행: 1,200,000원" 또는 "블로그 대행 (1,200,000원)")
    var items = [];
    var itemRe = /^[-*•\d\.\s]*([가-힣A-Za-z0-9·\s\(\)\/]+?)\s*[:：\-]\s*([\d,]+)\s*원(?:\s*\(([^)]+)\))?/gm;
    var im;
    while ((im = itemRe.exec(txt)) !== null) {
      var nm = im[1].replace(/\*\*/g, '').trim();
      var pr = parseInt(im[2].replace(/,/g, ''), 10);
      if (nm && nm.length <= 45 && pr >= 50000 && !/총액|합계|공급가액|부가세|예산/.test(nm)) {
        items.push({ name: nm, qty: 1, price: pr, note: (im[3] || '').trim() });
      }
    }
    if (items.length) out.items = items;
    return out;
  }

  // AI 채팅 메시지 텍스트를 계약서 필드로 스마트 파싱
  function parseAiContractText(rawText) {
    var txt = String(rawText || '').trim();
    var out = { raw: txt };
    function pick(patterns) {
      for (var i = 0; i < patterns.length; i++) {
        var m = txt.match(patterns[i]);
        if (m && m[1] && m[1].trim()) return m[1].replace(/\*\*/g, '').trim();
      }
      return '';
    }
    out.client_name = pick([
      /\[?(?:갑|고객사(?:명)?|업체명)\]?\s*[:：]\s*([^\n(]+)/i,
    ]);
    out.clientCeo = pick([
      /\[?(?:대표자(?:명)?|담당자(?:명)?)\]?\s*[:：]\s*([^\n(]+)/i,
    ]);
    out.clientEmail = pick([
      /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/,
    ]);
    out.clientPhone = pick([
      /(01[016789][-\s]?\d{3,4}[-\s]?\d{4})/,
    ]);
    out.title = pick([
      /\[?계약(?:서)?\s*제목\]?\s*[:：]\s*([^\n]+)/i,
    ]);
    out.paymentTerms = pick([
      /\[?결제\s*조건\]?\s*[:：]\s*([^\n]+)/i,
    ]);
    // 항목 및 금액 추출
    var items = [];
    var itemRe = /^[-*•\d\.\s]*([가-힣A-Za-z0-9·\s\(\)\/]+?)\s*[:：\-]\s*([\d,]+)\s*원(?:\s*\(([^)]+)\))?/gm;
    var im;
    while ((im = itemRe.exec(txt)) !== null) {
      var nm = im[1].replace(/\*\*/g, '').trim();
      var pr = parseInt(im[2].replace(/,/g, ''), 10);
      if (nm && nm.length <= 45 && pr >= 50000 && !/총액|합계|공급가액|부가세/.test(nm)) {
        items.push({ name: nm, qty: 1, price: pr, note: (im[3] || '').trim() });
      }
    }
    if (items.length) out.items = items;
    // 특약/조항 추출
    var spMatch = txt.match(/(?:특약\s*사항|제\d+조[\s\S]+)/);
    if (spMatch) out.extraClauses = spMatch[0].replace(/\*\*/g, '').trim();
    return out;
  }

  function applyChatMessageToProposal(msg) {
    if (!msg || !msg.content) return;
    var parsed = parseAiProposalText(msg.content);
    switchTab('proposal');
    emit('apply-ai-proposal', { message: msg, parsed: parsed });
  }

  function applyChatMessageToContract(msg, autoSendEmail) {
    if (!msg || !msg.content) return;
    var parsed = parseAiContractText(msg.content);
    switchTab('contract');
    emit('apply-ai-contract', { message: msg, parsed: parsed, autoSendEmail: !!autoSendEmail });
  }

  function applyChatMessageToFactory(msg) {
    if (!msg || !msg.content) return;
    switchTab('content');
    emit('apply-ai-factory', { message: msg, text: String(msg.content || '') });
  }

  // #일진홍보부 및 #종합반에서 특정 고객사 이름이 언급된 AI 팀 답장 회수
  function fetchAiRepliesForClient(clientName) {
    if (!clientName) return Promise.resolve([]);
    var needle = clientName.trim().toLowerCase();
    var bossSet = { '부자사람대장': 1, '일진대장': 1, 'CEO': 1 };
    return Promise.all([
      api('/api/rooms/marketing/messages?limit=50').catch(function () { return { messages: [] }; }),
      api('/api/rooms/general/messages?limit=50').catch(function () { return { messages: [] }; }),
    ]).then(function (arr) {
      var all = (arr[0].messages || []).concat(arr[1].messages || []);
      return all
        .filter(function (m) {
          if (bossSet[m.sender]) return false;
          var hay = (String(m.content || '') + ' ' + String(m.reply_to && m.reply_to.content || '')).toLowerCase();
          return hay.indexOf(needle) !== -1;
        })
        .sort(function (a, b) { return b.id - a.id; })
        .slice(0, 6);
    });
  }

  // 단계별 로드맵 텍스트를 간트차트(타임스케줄 가로 Bar) HTML로 변환
  // 예: "1개월 차: ..." / "1~2주차: ..." / "STEP 1: ..." 모두 자동 인식
  function renderTimelineGantt(rawText) {
    var lines = String(rawText || '')
      .split(/\r?\n/)
      .map(function (l) { return l.trim(); })
      .filter(Boolean);
    if (!lines.length) {
      return '<div class="clause-body" style="color:#64748b">로드맵 항목을 입력하면 타임스케줄 그래프가 자동 표시됩니다.</div>';
    }

    var palette = [
      'linear-gradient(90deg,#0284c7,#38bdf8)',
      'linear-gradient(90deg,#4f46e5,#818cf8)',
      'linear-gradient(90deg,#059669,#34d399)',
      'linear-gradient(90deg,#d97706,#fbbf24)',
      'linear-gradient(90deg,#db2777,#f472b6)',
      'linear-gradient(90deg,#0891b2,#22d3ee)',
    ];
    var solid = ['#0284c7', '#4f46e5', '#059669', '#d97706', '#db2777', '#0891b2'];

    var parsed = lines.map(function (line, idx) {
      var colon = line.indexOf(':');
      var label = colon > 0 && colon < 24 ? line.slice(0, colon).trim() : ((idx + 1) + '단계');
      var desc = colon > 0 && colon < 24 ? line.slice(colon + 1).trim() : line;
      var rangeMatch = label.match(/(\d+)\s*[~\-]\s*(\d+)/);
      var singleMatch = label.match(/(\d+)/);
      var start = idx + 1;
      var end = idx + 1;
      if (rangeMatch) {
        start = Math.max(1, parseInt(rangeMatch[1], 10));
        end = Math.max(start, parseInt(rangeMatch[2], 10));
      } else if (singleMatch) {
        start = Math.max(1, parseInt(singleMatch[1], 10));
        end = start;
      }
      var unit = /주/.test(label) ? '주차' : (/월|개월/.test(label) ? '개월 차' : '단계');
      var shortTitle = desc.split(/[,+·]/)[0].trim();
      if (shortTitle.length > 18) shortTitle = shortTitle.slice(0, 18) + '…';
      return { label: label, desc: desc, start: start, end: end, unit: unit, shortTitle: shortTitle };
    });

    var maxSlot = parsed.reduce(function (m, r) { return Math.max(m, r.end); }, parsed.length);
    if (maxSlot > 12) maxSlot = parsed.length;
    var primaryUnit = parsed[0].unit || '단계';

    var colHeaders = [];
    for (var i = 1; i <= maxSlot; i++) {
      colHeaders.push(i + (primaryUnit === '개월 차' ? '개월 차' : primaryUnit));
    }

    var gridTpl = 'repeat(' + maxSlot + ', 1fr)';
    var gridLinesHtml = '<div class="gantt-gridlines" style="grid-template-columns:' + gridTpl + '">' +
      colHeaders.map(function () { return '<span></span>'; }).join('') + '</div>';

    var rowsHtml = parsed.map(function (r, idx) {
      var sIdx = Math.min(maxSlot, Math.max(1, r.start)) - 1;
      var eIdx = Math.min(maxSlot, Math.max(r.start, r.end));
      var leftPct = (sIdx / maxSlot) * 100;
      var widthPct = ((eIdx - sIdx) / maxSlot) * 100;
      // 단일 칸일 때도 시각적으로 전문적으로 보이게 양쪽 미세 여백
      var barLeft = (leftPct + 1.2).toFixed(2) + '%';
      var barWidth = Math.max(14, widthPct - 2.4).toFixed(2) + '%';
      var bg = palette[idx % palette.length];
      var col = solid[idx % solid.length];
      var stepNo = String(idx + 1).padStart(2, '0');

      return '<div class="gantt-row">' +
        '<div class="gantt-meta">' +
          '<div class="gantt-step-tag"><span class="gantt-step-num" style="background:' + col + '">' + stepNo + '</span><span>' + esc(r.label) + '</span></div>' +
        '</div>' +
        '<div class="gantt-track-cell">' +
          gridLinesHtml +
          '<div class="gantt-bar-lane">' +
            '<div class="gantt-bar" style="left:' + barLeft + ';width:' + barWidth + ';background:' + bg + '">' +
              '<span>' + esc(r.shortTitle) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="gantt-desc">' + esc(r.desc) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="gantt-wrap">' +
      '<div class="gantt-head">' +
        '<div class="gantt-head-lbl">진행 단계</div>' +
        '<div class="gantt-cols" style="grid-template-columns:' + gridTpl + '">' +
          colHeaders.map(function (h) { return '<div class="gantt-col">' + esc(h) + '</div>'; }).join('') +
        '</div>' +
      '</div>' +
      rowsHtml +
    '</div>';
  }

  // A4 문서 고화질 PDF / 인쇄 실행
  function printPane(paneId, docTitle) {
    var pane = document.getElementById(paneId);
    if (!pane) return;
    var prevTitle = document.title;
    if (docTitle) document.title = docTitle;
    Array.prototype.forEach.call(document.querySelectorAll('.ws-pane'), function (p) {
      p.classList.remove('print-pane');
    });
    pane.classList.add('print-pane');
    window.print();
    setTimeout(function () {
      pane.classList.remove('print-pane');
      document.title = prevTitle;
    }, 400);
  }

  // 탭 간 원클릭 데이터 이관 함수
  function transferToSns(client) {
    switchTab('sns');
    emit('transfer-sns', { client: client });
  }
  function transferToProposal(payload) {
    switchTab('proposal');
    emit('transfer-proposal', payload || {});
  }
  function transferToContract(payload) {
    switchTab('contract');
    emit('transfer-contract', payload || {});
  }
  function transferToVideo(payload) {
    switchTab('video');
    emit('transfer-video', payload || {});
  }

  // 🔔 Phase B 15일 업그레이드 체크 알림 팝업 & ON/OFF 관리 (Phase B는 자동 실행하지 않고 시기만 점검!)
  var phaseBState = null;

  function renderPhaseBPill() {
    var pill = document.getElementById('phaseBReminderPill');
    if (!pill) {
      pill = document.createElement('button');
      pill.id = 'phaseBReminderPill';
      pill.type = 'button';
      pill.style.cssText = 'position:fixed;right:16px;bottom:14px;z-index:85;padding:7px 12px;border-radius:999px;border:1px solid rgba(56,189,248,0.45);background:rgba(15,23,42,0.88);color:#e0f2fe;font-size:11.5px;font-weight:800;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,0.28);backdrop-filter:blur(8px)';
      pill.addEventListener('click', function () { openPhaseBPopup(true); });
      document.body.appendChild(pill);
    }
    if (!phaseBState) return;
    if (phaseBState.enabled) {
      pill.style.borderColor = phaseBState.due_now ? '#f59e0b' : 'rgba(56,189,248,0.45)';
      pill.textContent = phaseBState.due_now
        ? '🚀 Phase B 업그레이드 점검 시점 도래!'
        : ('🔔 Phase B 15일 알림 ON (D-' + phaseBState.days_left + ')');
    } else {
      pill.style.borderColor = 'rgba(148,163,184,0.35)';
      pill.style.color = '#94a3b8';
      pill.textContent = '🔕 Phase B 15일 알림 OFF';
    }
  }

  function openPhaseBPopup(forceOpen) {
    if (!phaseBState) return;
    if (!forceOpen && (!phaseBState.enabled || !phaseBState.due_now)) return;
    var old = document.getElementById('phaseBModalBg');
    if (old) old.remove();

    var nextDate = phaseBState.next_due_at ? String(phaseBState.next_due_at).slice(0, 10) : '-';
    var cCnt = Number(phaseBState.client_count || 0);
    var th = Number(phaseBState.client_threshold || 15);
    var readyMsg = cCnt >= th
      ? '🎯 현재 등록 고객사가 <b>' + cCnt + '곳</b>으로 권장 기준(' + th + '곳)에 도달했습니다! 이제 Phase B 확장을 검토할 최적 시점입니다.'
      : '📊 현재 등록 고객사는 <b>' + cCnt + '곳</b>입니다. 권장 기준(<b>' + th + '곳 이상</b>)이 될 때까지는 지금 무료 Phase A 체제로 운영하셔도 충분합니다!';

    var bg = document.createElement('div');
    bg.id = 'phaseBModalBg';
    bg.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(2,6,23,0.68);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:16px';
    bg.innerHTML =
      '<div style="width:100%;max-width:520px;background:#0f172a;color:#f8fafc;border:1px solid rgba(56,189,248,0.42);border-radius:20px;padding:22px;box-shadow:0 24px 60px rgba(0,0,0,0.55);font-family:inherit">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px">' +
          '<h3 style="margin:0;font-size:16.5px;color:#38bdf8">🚀 Phase B 엔터프라이즈 업그레이드 시기 점검</h3>' +
          '<span style="font-size:11px;padding:4px 9px;border-radius:999px;font-weight:800;background:' + (phaseBState.enabled ? 'rgba(34,197,94,0.18);color:#86efac' : 'rgba(148,163,184,0.2);color:#cbd5e1') + '">' + (phaseBState.enabled ? '🔔 15일 알림 ON' : '🔕 알림 OFF') + '</span>' +
        '</div>' +
        '<p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#cbd5e1">' + readyMsg + '</p>' +
        '<div style="background:rgba(30,41,59,0.85);border:1px solid rgba(148,163,184,0.22);border-radius:12px;padding:12px;font-size:12px;line-height:1.65;color:#e2e8f0;margin-bottom:14px">' +
          '<div style="font-weight:800;color:#fde047;margin-bottom:4px">📋 Phase B 업그레이드 예정 목록 (아직 미실행 · 대기 중)</div>' +
          '• <b>n8n + Typebot</b>: 전 채널 실시간 자동화 &amp; 대화형 DB 퍼널 확장<br>' +
          '• <b>Papermark</b>: 제안서·10장 포트폴리오 페이지별 열람 실시간 추적<br>' +
          '• <b>Dify RAG</b>: 미담공장 성공사례 + 의료법/금소법 규정 벡터 DB<br>' +
          '• <b>GPU 미디어 워커</b>: Clips-Studio + ComfyUI(LTX-Video/Wan2.2) 대량 생산<br>' +
          '<div style="margin-top:6px;font-size:11.2px;color:#94a3b8">다음 정기 체크 예정일: <b>' + esc(nextDate) + '</b> (15일 주기 · 올라고 개거품 Ollama 연동)</div>' +
        '</div>' +
        '<div style="font-size:11.5px;color:#94a3b8;margin-bottom:14px">💡 채팅방에서 <code>Phase B 알림 꺼</code> 또는 <code>15일 체크 off</code>라고 입력하셔도 즉시 중지됩니다.</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">' +
          (phaseBState.enabled
            ? '<button type="button" id="pbSnoozeBtn" style="padding:8px 13px;border-radius:10px;border:none;background:#0284c7;color:#fff;font-weight:800;font-size:12.5px;cursor:pointer">⏰ 15일 뒤에 다시 알림</button>' +
              '<button type="button" id="pbOffBtn" style="padding:8px 13px;border-radius:10px;border:1px solid rgba(239,68,68,0.5);background:rgba(239,68,68,0.16);color:#fca5a5;font-weight:800;font-size:12.5px;cursor:pointer">🔕 15일 체크 영구 끄기 (OFF)</button>'
            : '<button type="button" id="pbOnBtn" style="padding:8px 13px;border-radius:10px;border:none;background:#16a34a;color:#fff;font-weight:800;font-size:12.5px;cursor:pointer">🔔 15일 체크 다시 켜기 (ON)</button>') +
          '<button type="button" id="pbCloseBtn" style="padding:8px 13px;border-radius:10px;border:1px solid rgba(148,163,184,0.35);background:transparent;color:#e2e8f0;font-weight:700;font-size:12.5px;cursor:pointer">닫기</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bg);

    var close = function () { bg.remove(); };
    bg.addEventListener('click', function (e) { if (e.target === bg) close(); });
    var cBtn = document.getElementById('pbCloseBtn');
    if (cBtn) cBtn.addEventListener('click', close);
    var sBtn = document.getElementById('pbSnoozeBtn');
    if (sBtn) sBtn.addEventListener('click', function () {
      api('/api/phase-b-reminder', { method: 'POST', body: JSON.stringify({ action: 'snooze_15d' }) })
        .then(function (r) { phaseBState = r.reminder; renderPhaseBPill(); toast('⏰ Phase B 업그레이드 점검을 15일 뒤로 예약했습니다!'); close(); });
    });
    var oBtn = document.getElementById('pbOffBtn');
    if (oBtn) oBtn.addEventListener('click', function () {
      api('/api/phase-b-reminder', { method: 'POST', body: JSON.stringify({ action: 'off' }) })
        .then(function (r) { phaseBState = r.reminder; renderPhaseBPill(); toast('🔕 Phase B 15일 체크 알림을 완전히 OFF(중지)했습니다.'); close(); });
    });
    var onBtn = document.getElementById('pbOnBtn');
    if (onBtn) onBtn.addEventListener('click', function () {
      api('/api/phase-b-reminder', { method: 'POST', body: JSON.stringify({ action: 'on' }) })
        .then(function (r) { phaseBState = r.reminder; renderPhaseBPill(); toast('🔔 Phase B 15일 체크 알림을 다시 켰습니다!'); close(); });
    });
  }

  function checkPhaseBReminder() {
    api('/api/phase-b-reminder').then(function (r) {
      if (r && r.reminder) {
        phaseBState = r.reminder;
        renderPhaseBPill();
        if (phaseBState.enabled && phaseBState.due_now) {
          openPhaseBPopup(false);
        }
      }
    }).catch(function () {});
  }

  // 🎲 300가지 이상(9,500+ 조합) 초고정밀 무중복 랜덤 샘플 생성기
  // - 현재 CRM에 등록된 고객사 이름과 절대 중복되지 않도록 엄격 필터링 (완전일치 + 부분포함 차단)
  var sampleUsedNames = {};
  var SAMPLE_REGIONS = [
    '강남', '서초', '청담', '압구정', '판교', '분당', '성수', '잠실', '여의도', '마포',
    '홍대', '용산', '한남', '송도', '해운대', '센텀', '둔산', '수성', '광교', '동탄',
    '위례', '목동', '일산', '평촌', '수원', '천안', '창원', '광주'
  ];
  var SAMPLE_SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍', '전', '고', '문', '양'];
  var SAMPLE_GIVEN = [
    '도현', '서연', '민수', '정훈', '지우', '현우', '유진', '성민', '수빈', '태윤',
    '하은', '재원', '지훈', '은서', '준호', '소연', '동혁', '예진', '승현', '다혜',
    '영호', '미라', '건우', '세진', '원준', '보람', '상우', '나연', '진우', '채원',
    '경수', '혜진', '민재', '아름', '시우', '윤서', '태현', '지민', '호진', '서현',
    '우진', '은지', '준영', '소미', '기훈'
  ];
  var SAMPLE_POOLS = {
    '병원': {
      cores: ['연세', '서울', '바른', '더맑은', '프리미어', '루미에', '하늘빛', '다온', '온유', '센트럴', '아름다운', '청담라인', '엘리트', '에이스', '리더스', '블룸', '웰니스', '스마일', '에이펙스', '더나은'],
      suffixes: ['내과', '치과', '피부과', '한의원', '정형외과', '안과', '성형외과', '건강검진센터', '통증의학과', '재활의학과'],
      titleSuffix: '원장',
      slugBase: 'clinic',
      keywords: ['건강검진, 내시경 잘하는 곳, 만성피로 수액', '임플란트 가격, 치아교정 후기, 야간진료', '기미 레이저, 리프팅 시술, 피부 탄력 관리', '도수치료, 허리디스크 비수술, 체형 교정', '다이어트 한약, 교통사고 후유증, 추나요법'],
      memos: [
        '개원 초기 지역 인지도 확보 및 신환 상담 DB 자동화 시급. 원장님 1분 팩트체크 릴스 촬영 적극 협조 가능.',
        '블로그 검색 유입은 있으나 예약 전환율 저조. 의료법 심의 준수 원고 + 카톡 상담 퍼널 결합 희망.',
        '경쟁 병원 증가로 신규 유입 정체. 시술·검진 비하인드 숏폼과 네이버 예약 전환 동선 개편 필요.',
        '야간/주말 진료 강점 홍보 및 고단가 시술 문의 집중 확보 목표. 월 30건 이상 신환 DB 기대.',
      ],
      feeRange: [2200000, 4800000],
      dealRange: [800000, 2200000],
      items: [
        { name: '네이버 브랜드 블로그 대행 (월 12편)', qty: 1, price: 1200000, note: '의료법 심의 기준 준수' },
        { name: '원장님 팩트체크 릴스 대행 (월 8편)', qty: 1, price: 1300000, note: '3초 후킹·촬영가이드·자막' },
        { name: '신환 상담 DB 퍼널·카톡 전환 세팅', qty: 1, price: 700000, note: '무료 자가진단 체크리스트 CTA' },
      ],
    },
    '보험설계사': {
      cores: ['리치파트너스', '프라임가드', '스마트보장', '트러스트', '밸류업', '위드라이프', '세이프플랜', '코어에셋', '올바른보장', '퍼스트케어', '하모니에셋', '넥스트웰스', '블루칩', '골든키', '에이원', '마스터플랜'],
      suffixes: ['보험설계팀', '보장분석센터', 'GA 본부', '재무설계 지점', '컨설팅 그룹', '금융파트너스'],
      titleSuffix: '본부장',
      slugBase: 'ins',
      keywords: ['40대 암보험 비교, 실손보험 리모델링, 가족 보장분석', '어린이보험 가입요령, 태아보험 추천, 보험료 절약', '운전자보험 필수특약, 뇌혈관 진단비, 보험금 청구', '법인 CEO 절세보험, 퇴직연금 설계, 종신보험 비교'],
      memos: [
        '유료 DB 구매 단가 부담이 커 자체 릴스·블로그 기반 무료 보장분석 DB 퍼널 구축 희망.',
        '댓글 키워드 자동 DM(매니챗) + 3문항 보장점검 폼으로 월 40건 이상 고관여 상담 DB 목표.',
        '금소법 심의 안전 가이드 준수하면서 실손·암보험 청구 실수 30초 릴스 집중 발행 요청.',
        '지점 소속 설계사 5명 공동 브랜딩 및 퍼스널 프로필 리뉴얼 + 스레드 데일리 소통 확장 추진.',
      ],
      feeRange: [1800000, 3800000],
      dealRange: [1000000, 2400000],
      items: [
        { name: '보장분석 DB 수집 퍼널 + 댓글 DM 자동화', qty: 1, price: 1100000, note: '월 목표 DB 40건 설계' },
        { name: '인스타 릴스 3초 후킹 대행 (월 10편)', qty: 1, price: 1300000, note: '금소법 심의 통과 기준' },
        { name: '네이버 보장분석 칼럼 블로그 (월 12편)', qty: 1, price: 1000000, note: '청구 사례·비교 키워드' },
      ],
    },
    '정책자금': {
      cores: ['한빛', '비즈브릿지', '성장파트너', '코어비즈', '넥스트펀드', '성공경영', '기업지원', '밸류인사이트', '드림캐피탈', '선도경영', '위너스비즈', '브라이트', '케이비즈', '올인원', '프로경영', '솔루션'],
      suffixes: ['정책자금연구소', '경영컨설팅', '기업자문센터', '경영지원단', '자금전략파트너스', 'B2B 컨설팅'],
      titleSuffix: '대표',
      slugBase: 'fund',
      keywords: ['소상공인 정책자금 조건, 운전자금 신청, 부결 사유', '중소기업 기술보증기금, 신보 한도 조회, 법인 자금', '창업자금 저금리 대출, 정부지원사업 서류 준비', '매출 10억 법인 운전자금, 시설자금 승인 사례'],
      memos: [
        '업력·매출·신용점수 4문항 사전 필터링 폼으로 허수 문의를 걸러내고 법인 대표자 DB만 수집 희망.',
        '자금 공고 마감 시즌에 맞춘 속보형 릴스와 네이버 정보성 상위노출 블로그 동시 가동 목표.',
        '승인 사례 스토리텔링 강화로 상담 미팅 성사율을 현재 18%에서 35% 이상으로 끌어올리는 것이 과제.',
        '전국 중소기업·소상공인 대표 타깃 B2B 퍼널 구축 및 월 30건 이상 유효 상담 확보 추진.',
      ],
      feeRange: [2400000, 4500000],
      dealRange: [2000000, 5000000],
      items: [
        { name: '정책자금 핵심 키워드 블로그 SEO (월 12편)', qty: 1, price: 1200000, note: '자격·승인사례 중심' },
        { name: '1분 무료 한도진단 B2B DB 퍼널 구축', qty: 1, price: 1100000, note: '매출·업력 필터링 4문항' },
        { name: '정책자금 속보·탈락방지 릴스 (월 8편)', qty: 1, price: 1100000, note: '대표자 타깃 3초 후킹' },
      ],
    },
    '자영업/소상공인': {
      cores: ['브루잉', '아뜰리에', '소담', '더테이블', '모던', '오브제', '그린우드', '라온', '미소', '달빛', '호호', '온기', '바다뷰', '포레스트', '선데이', '마레'],
      suffixes: ['카페', '다이닝', '베이커리', '피트니스', '필라테스', '헤어살롱', '인테리어', '스튜디오', '브런치하우스', '로스터리'],
      titleSuffix: '대표',
      slugBase: 'shop',
      keywords: ['데이트 맛집, 주차 편한 카페, 주말 웨이팅', '일대일 피티 후기, 체형교정 필라테스, 체험권', '복구펌 잘하는 곳, 퍼스널컬러 염색, 예약 할인', '소형 아파트 리모델링, 매장 인테리어 견적'],
      memos: [
        '주말 손님은 많으나 평일 낮 시간대 공석 해결 필요. 지역 릴스 + 네이버 알림받기 쿠폰 퍼널 도입 희망.',
        '신규 오픈 3개월 차. 지역 상권 네이버 플레이스 상위노출과 방문 리뷰 선순환 구조 세팅 요청.',
        '가격 경쟁 대신 시그니처 메뉴·공간 스토리 브랜딩으로 객단가 25% 상승 목표.',
        '단골 재방문 알림톡 채널 확보 및 매장 비하인드 3초 후킹 릴스 월 8편 제작 희망.',
      ],
      feeRange: [1200000, 2600000],
      dealRange: [150000, 650000],
      items: [
        { name: '지역 상권 폭발형 릴스 숏폼 (월 8편)', qty: 1, price: 900000, note: '위치태그·지역 알고리즘 공략' },
        { name: '네이버 브랜드 블로그 · 플레이스 연동 (월 10편)', qty: 1, price: 800000, note: '지역명+핵심키워드 장악' },
        { name: '알림받기 쿠폰 · 단골 재방문 퍼널 세팅', qty: 1, price: 500000, note: '방문 리뷰 선순환 구조' },
      ],
    },
    '브랜드/기타': {
      cores: ['노바', '루멘', '아르떼', '벨라', '오리진', '스파크', '넥서스', '에테르', '코지', '솔라', '모멘텀', '크래프트', '베르데', '클라우드', '아우라', '리브'],
      suffixes: ['F&B', '코스메틱', '리빙', '랩', '커머스', '스튜디오', '라이프', '프랜차이즈', '웰니스', '테크'],
      titleSuffix: '대표',
      slugBase: 'brand',
      keywords: ['프리미엄 브랜드 스토리, 고객 후기, 첫구매 혜택', '프랜차이즈 창업 비용, 소자본 가맹 상담, 수익 구조', '신제품 런칭 프로모션, 와디즈 펀딩 후기, 자사몰', 'B2B 납품 문의, OEM 제작 단가, 파트너 제휴'],
      memos: [
        '신규 브랜드 런칭 앞두고 인지도 확보 및 자사몰/가맹 상담 DB 동시 확장 목표.',
        '블로그·릴스·스레드 3채널 원소스 멀티유즈로 월 30편 콘텐츠 공장 가동 및 전환율 개선 희망.',
        '경쟁사 대비 차별화된 브랜드 포지셔닝 확립과 고전환 리드 마그넷(무료 샘플/가이드) 퍼널 세팅 필요.',
        '전국 대리점·가맹점주 모집 DB 확보를 위한 고단가 B2B 제안 퍼널 구축 추진 중.',
      ],
      feeRange: [2800000, 7500000],
      dealRange: [1500000, 6000000],
      items: [
        { name: '브랜드 통합 포지셔닝 · 콘텐츠 기획', qty: 1, price: 1400000, note: '멀티채널 톤앤매너 정립' },
        { name: '인스타 릴스 · 스레드 팬덤 대행 (월 10편+)', qty: 1, price: 1500000, note: '바이럴 후킹·데일리 소통' },
        { name: '고전환 상담/가맹 DB 수집 퍼널 구축', qty: 1, price: 1100000, note: '실시간 리드 자동 알림 연동' },
      ],
    },
  };

  function normBizName(s) {
    return String(s || '').toLowerCase().replace(/[\s\-_()\[\]·.,/]/g, '');
  }

  function isNameTakenByExisting(candidateName) {
    var candNorm = normBizName(candidateName);
    if (!candNorm) return true;
    var existing = store.clients || [];
    for (var i = 0; i < existing.length; i++) {
      var exNorm = normBizName(existing[i] && existing[i].name);
      if (!exNorm) continue;
      // 완전 일치 또는 기존 등록 고객사 이름을 포함하거나 포함되는 경우 모두 중복 차단!
      if (candNorm === exNorm || candNorm.indexOf(exNorm) !== -1 || exNorm.indexOf(candNorm) !== -1) {
        return true;
      }
    }
    return false;
  }

  function pickRand(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pad4(n) {
    return String(n).padStart(4, '0');
  }

  function generateUniqueSample(opts) {
    opts = opts || {};
    var indList = INDUSTRIES.map(function (x) { return x.id; });
    var ind = (opts.industry && SAMPLE_POOLS[opts.industry]) ? opts.industry : pickRand(indList);
    var pool = SAMPLE_POOLS[ind] || SAMPLE_POOLS['브랜드/기타'];

    // 기존 등록 고객사 이름 + 최근 샘플 이력과 100% 겹치지 않는 업체명 추첨 (300회 시도)
    var bizName = '';
    var region = '';
    var core = '';
    var suffix = '';
    for (var attempt = 0; attempt < 300; attempt++) {
      region = pickRand(SAMPLE_REGIONS);
      core = pickRand(pool.cores);
      suffix = pickRand(pool.suffixes);
      var style = attempt % 3;
      var candidate = style === 0
        ? (region + ' ' + core + ' ' + suffix)
        : (style === 1 ? (core + ' ' + suffix + ' ' + region + '점') : (region + core + suffix));
      candidate = candidate.replace(/\s+/g, ' ').trim();
      var key = normBizName(candidate);
      if (!isNameTakenByExisting(candidate) && !sampleUsedNames[key]) {
        bizName = candidate;
        sampleUsedNames[key] = true;
        break;
      }
    }
    if (!bizName) {
      // 모든 풀 소진 시 고유 번호 부여하여 절대 중복 방지
      sampleUsedNames = {};
      bizName = pickRand(SAMPLE_REGIONS) + ' ' + pickRand(pool.cores) + ' ' + pickRand(pool.suffixes) + ' ' + randInt(101, 999) + '호점';
    }

    var contactPure = pickRand(SAMPLE_SURNAMES) + pickRand(SAMPLE_GIVEN);
    var contactWithTitle = contactPure + ' ' + pool.titleSuffix;
    var phone = '010-' + pad4(randInt(2000, 9899)) + '-' + pad4(randInt(1000, 9999));
    var bizNo = String(randInt(101, 899)) + '-' + String(randInt(10, 89)) + '-' + String(randInt(10000, 99999));
    var handleNum = randInt(10, 999);
    var slug = pool.slugBase + '_' + handleNum;
    var feeStep = Math.round(randInt(pool.feeRange[0], pool.feeRange[1]) / 100000) * 100000;
    var dbGoal = randInt(20, 80);
    var dbCount = randInt(Math.max(5, Math.round(dbGoal * 0.4)), Math.round(dbGoal * 1.25));
    var stage = pickRand(FUNNEL_STAGES);
    var svcCount = randInt(2, 4);
    var shuffledSvcs = SERVICES.slice().sort(function () { return Math.random() - 0.5; });
    var svcs = shuffledSvcs.slice(0, svcCount);
    var roadNames = ['테헤란로', '강남대로', '판교역로', '여의대로', '성수로', '송파대로', '마포대로', '센텀중앙로', '둔산로', '광교중앙로'];
    var address = region + ' ' + pickRand(roadNames) + ' ' + randInt(12, 480) + ' ' + randInt(2, 14) + '층';
    var email = slug + '@' + pickRand(['naver.com', 'gmail.com', 'daum.net', 'company.kr']);
    var avgDeal = Math.round(randInt(pool.dealRange[0], pool.dealRange[1]) / 50000) * 50000;
    var closeCnt = randInt(3, 18);

    return {
      name: bizName,
      industry: ind,
      contact: contactWithTitle,
      contactPure: contactPure,
      phone: phone,
      bizNo: bizNo,
      email: email,
      address: address,
      stage: stage,
      fee: feeStep,
      db: dbCount,
      goal: dbGoal,
      blog: 'https://blog.naver.com/' + slug,
      insta: '@' + slug,
      svcs: svcs,
      memo: pickRand(pool.memos),
      keywords: region + ' ' + pickRand(pool.keywords),
      blogNeighbors: randInt(800, 9500),
      blogDailyVisits: randInt(350, 4200),
      blogMonthlyPosts: randInt(6, 20),
      instaFollowers: randInt(1200, 24000),
      reelsAvgViews: randInt(2500, 42000),
      reelsSaveRate: (randInt(18, 72) / 10).toFixed(1) + '%',
      funnelVisits: randInt(280, 1600),
      funnelDb: dbCount,
      marketingBudget: feeStep,
      closeCount: closeCnt,
      avgDealValue: avgDeal,
      discountRate: pickRand([0, 5, 10]),
      proposalTitle: bizName + ' ' + pickRand(['신규 문의 2배 SNS·DB 퍼널 마케팅 제안서', '고전환 브랜딩·릴스 통합 마케팅 제안서', '매출 직결 검색·숏폼·퍼널 실행 제안서']),
      contractTitle: bizName + ' ' + ind + ' SNS 브랜딩·DB 퍼널 마케팅 대행 계약서',
      items: pool.items.map(function (it) { return Object.assign({}, it); }),
    };
  }

  function init(bridge) {
    store.bridge = bridge;
    Array.prototype.forEach.call(document.querySelectorAll('.cat-tab'), function (btn) {
      btn.addEventListener('click', function () {
        switchTab(btn.getAttribute('data-tab'));
      });
    });
    switchTab(store.activeTab);
    refreshAll();
    setTimeout(checkPhaseBReminder, 1200);
  }

  window.AgencyApp = {
    INDUSTRIES: INDUSTRIES,
    SERVICES: SERVICES,
    FUNNEL_STAGES: FUNNEL_STAGES,
    INDUSTRY_PLAYBOOK: INDUSTRY_PLAYBOOK,
    DEFAULT_AGENCY_PROFILE: DEFAULT_AGENCY_PROFILE,
    store: store,
    init: init,
    on: on,
    emit: emit,
    esc: esc,
    won: won,
    todayKst: todayKst,
    toast: toast,
    api: api,
    refreshAll: refreshAll,
    updateTabBadges: updateTabBadges,
    switchTab: switchTab,
    buildUpsellRecommendations: buildUpsellRecommendations,
    requestAiAssist: requestAiAssist,
    fetchAiRepliesForClient: fetchAiRepliesForClient,
    parseAiProposalText: parseAiProposalText,
    parseAiContractText: parseAiContractText,
    applyChatMessageToProposal: applyChatMessageToProposal,
    applyChatMessageToContract: applyChatMessageToContract,
    applyChatMessageToFactory: applyChatMessageToFactory,
    renderTimelineGantt: renderTimelineGantt,
    printPane: printPane,
    transferToSns: transferToSns,
    transferToProposal: transferToProposal,
    transferToContract: transferToContract,
    transferToVideo: transferToVideo,
    generateUniqueSample: generateUniqueSample,
  };
})();

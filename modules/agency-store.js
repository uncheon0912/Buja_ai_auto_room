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
    var valid = ['chat', 'crm', 'sns', 'proposal', 'contract', 'portfolio', 'video'];
    if (valid.indexOf(tabId) === -1) tabId = 'chat';
    store.activeTab = tabId;
    localStorage.setItem('buja_active_tab', tabId);

    document.body.classList.toggle('ws-mode', tabId !== 'chat');
    Array.prototype.forEach.call(document.querySelectorAll('.cat-tab'), function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    var chatPane = document.getElementById('chatPane');
    if (chatPane) chatPane.hidden = tabId !== 'chat';
    ['crm', 'sns', 'proposal', 'contract', 'portfolio', 'video'].forEach(function (id) {
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

  function init(bridge) {
    store.bridge = bridge;
    Array.prototype.forEach.call(document.querySelectorAll('.cat-tab'), function (btn) {
      btn.addEventListener('click', function () {
        switchTab(btn.getAttribute('data-tab'));
      });
    });
    switchTab(store.activeTab);
    refreshAll();
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
    renderTimelineGantt: renderTimelineGantt,
    printPane: printPane,
    transferToSns: transferToSns,
    transferToProposal: transferToProposal,
    transferToContract: transferToContract,
  };
})();

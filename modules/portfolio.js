/**
 * 탭 6: 🎨 하이엔드 Three.js 3D 인터랙티브 회사 포트폴리오
 * - 10장 각기 다른 매거진/키노트 레이아웃 (Cover · Philosophy · Metrics SVG · Bento Services · Case Study · Process Timeline · Pricing Packages · Closing)
 * - 실시간 Three.js r187 3D 인터랙티브 배경 캔버스 (마우스 패럴랙스 + 페이지 전환 3D 모션)
 * - 🌐 독립 3D 인터랙티브 HTML 파일 다운로드 (.html) + 🖨️ 10장 풀컬러 PDF 저장/출력 동시 지원
 */
(function () {
  'use strict';
  var A = window.AgencyApp;
  if (!A) return;

  var THEMES = [
    { id: 'obsidian-gold', name: '🖤 옵시디언 골드 (하이엔드 3D)' },
    { id: 'midnight-navy', name: '🌌 미드나잇 네이비 (B2B 3D)' },
    { id: 'ivory-editorial', name: '🤍 아이보리 에디토리얼 (매거진)' },
  ];

  function defaultSlides(company, ceo, phone, email) {
    var co = company || '미담공장';
    return [
      {
        layout: 'cover',
        kicker: 'INTERACTIVE 3D AGENCY PORTFOLIO',
        title: co + '\nBRANDING & FUNNEL',
        subtitle: '단순 노출이 아닌, 실제 상담 DB와 매출로 증명하는\n네이버 블로그 · 릴스 · 퍼널 · KPI 마케팅 파트너',
        bullets: ['네이버 브랜드 블로그 SEO', '인스타 릴스 · 스레드 바이럴', '고전환 DB 수집 퍼널 설계'],
        metrics: [
          { label: 'SPECIALTY', value: '병원·보험·정책자금·자영업' },
          { label: 'EDITION', value: A.todayKst().slice(0, 7) + ' OFFICIAL' },
          { label: 'DIRECTOR', value: ceo || '부자사람대장' },
        ],
        image: '',
      },
      {
        layout: 'philosophy',
        kicker: '01 · PHILOSOPHY',
        title: '조회수가 아니라\n“문의가 터지는 구조”를 만듭니다',
        subtitle: co + '은 콘텐츠를 발행하고 끝내지 않습니다. 검색(신뢰) → 숏폼(확산) → DB 퍼널(전환)이 하나의 매출 기계처럼 맞물려 돌아가게 설계합니다.',
        bullets: [
          '검색 신뢰 선점 — 결제 직전 고객이 반드시 찾는 네이버 브랜드 블로그 장악',
          '3초 후킹 확산 — 지역·타겟 알고리즘을 뚫는 릴스 & 스레드 숏폼 파이프라인',
          'DB 자동 전환 — 3문항 간편진단·카카오 채널로 가망고객 문의 자동 수집',
        ],
        metrics: [
          { label: 'CORE GOAL', value: '매출 직결 DB 퍼널' },
          { label: 'COMPLIANCE', value: '의료법·금소법 심의 준수' },
          { label: 'TRANSPARENCY', value: '쉬운 월간 KPI 성적표' },
        ],
        image: '',
      },
      {
        layout: 'metrics',
        kicker: '02 · PROVEN IMPACT',
        title: '숫자와 데이터로 증명하는\n' + co + '의 성장 곡선',
        subtitle: '병원 · 보험설계사 · 정책자금 · 자영업 등 고관여 업종에서 검증된 전환 카피와 퍼널 공식을 그대로 이식합니다.',
        bullets: [
          '매월 "문의 1건당 비용(CPA)"과 "투자 대비 매출 배수"를 투명하게 보고',
          '멀티 AI 협업 + 전담 디렉터 교차검증으로 기획 속도 3배 · 퀄리티 극대화',
        ],
        metrics: [
          { label: '누적 협업 프로젝트', value: '120+' },
          { label: '평균 상담 DB 증가율', value: '+310%' },
          { label: '고객사 재계약률', value: '92.4%' },
        ],
        image: '',
      },
      {
        layout: 'services',
        kicker: '03 · 4 CORE SOLUTIONS',
        title: '기획부터 브랜딩 · DB 수집까지\n올인원 4대 솔루션',
        subtitle: '채널별 전문가가 하나의 브랜드 보이스로 통합 운영합니다.',
        bullets: [
          '네이버 브랜드 블로그 대행 | 업종 핵심 키워드 상위 노출 · 월 12편 · 하단 상담 전환 배너 고정',
          '인스타 릴스 · 스레드 대행 | 3초 후킹 대본 · 촬영 가이드 · 자막 편집 · 데일리 스레드 팬덤',
          '브랜딩 & 포지셔닝 기획 | 경쟁사와 차별화된 한 줄 컨셉 · 프로필/피드/썸네일 비주얼 통일',
          '퍼널 · DB 수집 마케팅 | 무료 자가진단 폼 · 댓글 자동 DM · 실시간 리드 추적 및 업셀링',
        ],
        metrics: [
          { label: 'SEARCH', value: 'Naver Blog' },
          { label: 'VIRAL', value: 'Reels & Threads' },
          { label: 'CONVERSION', value: 'DB Lead Funnel' },
        ],
        image: '',
      },
      {
        layout: 'case',
        kicker: '04 · CASE STUDY — HOSPITAL',
        title: '병원 · 투석검진실 개원\n브랜딩 & 신환 DB 셋팅',
        subtitle: '“장비만 채우면 망합니다 — 10년 굴러가는 동선·수익 구조까지 설계하는 개원 디렉터”로 포지셔닝을 재설계해 고관여 원장님 문의를 폭발시켰습니다.',
        bullets: [
          '인공신장실 개원 비용·동선 핵심 키워드 주 3회 블로그 발행으로 18개 키워드 상위 노출',
          '“배관 하나 잘못 놓으면 5천만 원 날립니다” 실수 경고형 릴스로 평균 4.2만 도달',
          '하단 ‘무료 개원 체크리스트 PDF + 1:1 도면 진단’ 3문항 폼으로 월 27건 문의 확보',
        ],
        metrics: [
          { label: '상위노출 키워드', value: '18개' },
          { label: '릴스 평균 도달', value: '4.2만 회' },
          { label: '월 개원 상담 DB', value: '27건/월' },
        ],
        image: '',
      },
      {
        layout: 'case',
        kicker: '05 · CASE STUDY — INSURANCE & FUND',
        title: '보험설계사 · 정책자금\n자체 DB 수집 자동화 퍼널',
        subtitle: '고비용 외부 DB 구매에서 벗어나, 콘텐츠 자체에서 매일 고관여 가망고객 DB가 유입되는 독립 파이프라인을 구축했습니다.',
        bullets: [
          '보험금 청구 실수 TOP3 릴스 + 댓글 자동 DM → 3문항 간편 보장점검 DB 수집',
          '정책자금 업력·매출·신용 사전 필터링 1분 한도진단 폼으로 허수 문의 80% 차단',
          '금소법·광고 심의 가이드 100% 준수 카피로 신뢰도와 계약 성사율 동시 상승',
        ],
        metrics: [
          { label: 'DB 획득 단가 절감', value: '-64%' },
          { label: '월 자체 수집 DB', value: '68건/월' },
          { label: '상담→계약 전환율', value: '34.5%' },
        ],
        image: '',
      },
      {
        layout: 'case',
        kicker: '06 · CASE STUDY — LOCAL BUSINESS',
        title: '자영업 · 소상공인 대표님\n지역 상권 릴스 바이럴 & 단골화',
        subtitle: '가격 할인 경쟁을 끊고 “일부러 찾아가는 동네 1등 매장” 브랜딩 + 플레이스 연동 + 재방문 쿠폰 퍼널로 매출 체질을 바꿨습니다.',
        bullets: [
          '매장 비포&애프터 · 사장님 철학 30초 릴스로 지역 타겟 조회수 38만 회 돌파',
          '지역+업종 체험형 블로그 + 네이버 플레이스 알림받기 쿠폰 전환 동선 연결',
          '방문객을 카카오 단골 채널로 흡수해 비수기에도 안정적인 주말 예약 100% 달성',
        ],
        metrics: [
          { label: '최고 릴스 조회수', value: '38만 회' },
          { label: '플레이스 길찾기', value: '+240%' },
          { label: '주말 예약률', value: '100%' },
        ],
        image: '',
      },
      {
        layout: 'process',
        kicker: '07 · EXECUTION PROCESS',
        title: '대표님 투입 시간 주 15분,\n체계적 4단계 실행 로드맵',
        subtitle: '자료 수급 스트레스는 줄이고 결과는 데이터로 증명하는 표준화된 프로세스입니다.',
        bullets: [
          '정밀 SNS 진단 | 경쟁사·키워드·전환 병목 분석 및 KPI 건강검진표 발행',
          '브랜딩 · 퍼널 셋팅 | 한 줄 컨셉 확정, 프로필 리뉴얼, 3문항 DB 폼 연결',
          '블로그 · 릴스 집중 발행 | 주 3회 SEO 블로그 + 월 8편 3초 후킹 릴스 배포',
          'KPI 분석 · 스케일업 | 문의 단가(CPA)·매출 배수 분석 및 고효율 소재 확장',
        ],
        metrics: [
          { label: '대표님 주간 소통', value: '15분' },
          { label: '초기 셋팅 완료', value: '10 영업일' },
          { label: '성과 보고', value: '매월 쉬운 KPI' },
        ],
        image: '',
      },
      {
        layout: 'packages',
        kicker: '08 · SERVICE PACKAGES',
        title: '비즈니스 성장 단계별\n맞춤형 대행 패키지',
        subtitle: '필요한 핵심 채널부터 시작해 성과 검증 후 풀 퍼널 VIP로 확장할 수 있습니다.',
        bullets: [
          'STANDARD | 월 110만~ | 검색 신뢰 구축형 | 네이버 브랜드 블로그 월 12편 · 키워드 SEO · 상담 전환 배너 셋팅',
          'GROWTH ★BEST | 월 220만~ | 확산+신뢰 급성장형 | 블로그 월 12편 · 인스타 릴스 월 8편 · 스레드 연계 · 월간 KPI 분석',
          'ALL-IN-ONE VIP | 월 320만~ | 풀 퍼널 DB 완성형 | 브랜딩 기획 · 블로그 · 릴스 · 자동 DB 퍼널 셋팅 · 전담 컨설팅',
        ],
        metrics: [
          { label: 'CONTRACT', value: '3개월 권장' },
          { label: 'CUSTOM', value: '업종별 맞춤 견적' },
          { label: 'REPORT', value: '쉬운 KPI 성적표 포함' },
        ],
        image: '',
      },
      {
        layout: 'closing',
        kicker: '09 · FREE SNS AUDIT & CONTACT',
        title: '대표님의 현재 SNS,\n무료로 정밀 진단해 드립니다',
        subtitle: '운영 중인 네이버 블로그 · 인스타그램 주소만 보내주시면, ' + co + '이 100점 만점 SNS 건강검진표와 DB 확장 전략을 무료로 보내드립니다.',
        bullets: [
          '대행사: ' + co + ' (대표 ' + (ceo || '부자사람대장') + ')',
          '연락처: ' + (phone || '010-0000-0000'),
          '이메일: ' + (email || 'contact@midamfactory.kr'),
        ],
        metrics: [
          { label: 'BENEFIT', value: '무료 SNS 건강검진' },
          { label: 'RESPONSE', value: '24시간 이내 회신' },
          { label: 'PARTNER', value: co },
        ],
        image: '',
      },
    ];
  }

  function blankDeck() {
    var prof = A.store.agencyProfile || A.DEFAULT_AGENCY_PROFILE;
    return {
      id: null,
      title: (prof.company || '미담공장') + ' 3D 인터랙티브 회사 포트폴리오',
      company: prof.company || '미담공장',
      companyEn: 'MIDAM FACTORY',
      tagline: 'SNS 브랜딩 · 블로그 · 릴스 · 퍼널 DB 마케팅 파트너',
      theme: 'obsidian-gold',
      slides: defaultSlides(prof.company, prof.ceo, prof.phone, prof.email),
    };
  }

  var deck = blankDeck();
  var ui = { pageIdx: 0, viewMode: 'single' };

  function clampPage() {
    if (!deck.slides || !deck.slides.length) deck.slides = defaultSlides(deck.company);
    if (ui.pageIdx < 0) ui.pageIdx = 0;
    if (ui.pageIdx >= deck.slides.length) ui.pageIdx = deck.slides.length - 1;
  }

  function renderSlideBody(s, idx) {
    var layout = s.layout || 'case';
    var bullets = s.bullets || [];
    var metrics = s.metrics || [];
    var hasImg = !!(s.image && s.image.trim());

    // 1) 시네마틱 3D 표지
    if (layout === 'cover') {
      return '<div class="dk-hero">' +
        '<div class="dk-pill-badge">✦ 3D INTERACTIVE PORTFOLIO · ' + A.esc(deck.companyEn) + '</div>' +
        '<h1 class="dk-hero-title">' + A.esc(s.title).replace(/\n/g, '<br>') + '</h1>' +
        '<p class="dk-hero-sub">' + A.esc(s.subtitle).replace(/\n/g, '<br>') + '</p>' +
        '<div class="dk-tag-row">' + bullets.map(function (b) { return '<span class="dk-glass-tag">◆ ' + A.esc(b) + '</span>'; }).join('') + '</div>' +
      '</div>' +
      '<div class="dk-metrics">' + metrics.map(function (m) {
        return '<div class="dk-metric"><span class="dk-mlbl">' + A.esc(m.label) + '</span><b class="dk-mval">' + A.esc(m.value) + '</b></div>';
      }).join('') + '</div>';
    }

    // 2) 철학: 좌측 거대 넘버 & 선언문 ↔ 우측 3단 글래스 카드
    if (layout === 'philosophy') {
      return '<div class="dk-split-2">' +
        '<div class="dk-left-col">' +
          '<div class="dk-giant-num">01</div>' +
          '<h1 class="dk-title">' + A.esc(s.title).replace(/\n/g, '<br>') + '</h1>' +
          '<p class="dk-sub">' + A.esc(s.subtitle).replace(/\n/g, '<br>') + '</p>' +
        '</div>' +
        '<div class="dk-right-col">' +
          bullets.map(function (b, i) {
            var sp = b.split('—');
            return '<div class="dk-feature-card"><span class="dk-bnum">0' + (i + 1) + '</span><div><b>' + A.esc((sp[0] || b).trim()) + '</b>' +
              (sp[1] ? '<p>' + A.esc(sp.slice(1).join('—').trim()) + '</p>' : '') + '</div></div>';
          }).join('') +
        '</div>' +
      '</div>';
    }

    // 3) 핵심 지표: 초대형 숫자 + SVG 성장 곡선 차트
    if (layout === 'metrics') {
      return '<div class="dk-metrics-hero">' +
        '<div><h1 class="dk-title">' + A.esc(s.title).replace(/\n/g, '<br>') + '</h1><p class="dk-sub">' + A.esc(s.subtitle) + '</p></div>' +
        '<div class="dk-kpi-big-grid">' +
          metrics.map(function (m) {
            return '<div class="dk-kpi-big"><div class="dk-kpi-num">' + A.esc(m.value) + '</div><div class="dk-kpi-lbl">' + A.esc(m.label) + '</div></div>';
          }).join('') +
        '</div>' +
        '<div class="dk-chart-card">' +
          '<div style="display:flex;justify-content:space-between;font-size:10.5px;opacity:.78;margin-bottom:4px"><span>FUNNEL GROWTH TRAJECTORY (1M → 6M)</span><b>DB 전환 누적 성장 곡선</b></div>' +
          '<svg viewBox="0 0 600 76" class="dk-svg-chart" preserveAspectRatio="none">' +
            '<defs><linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="currentColor" stop-opacity="0.38"/><stop offset="100%" stop-color="currentColor" stop-opacity="0.02"/></linearGradient></defs>' +
            '<path d="M0,68 C90,62 150,55 240,42 C340,28 450,16 600,6 L600,76 L0,76 Z" fill="url(#gArea)"/>' +
            '<path d="M0,68 C90,62 150,55 240,42 C340,28 450,16 600,6" fill="none" stroke="currentColor" stroke-width="3"/>' +
            '<circle cx="240" cy="42" r="4.5" fill="currentColor"/><circle cx="440" cy="18" r="4.5" fill="currentColor"/><circle cx="595" cy="7" r="5.5" fill="currentColor"/>' +
          '</svg>' +
        '</div>' +
      '</div>';
    }

    // 4) 서비스: 2x2 럭셔리 Bento Grid
    if (layout === 'services') {
      var icons = ['🟢', '🎬', '💎', '🎯'];
      return '<div><h1 class="dk-title" style="font-size:25px">' + A.esc(s.title).replace(/\n/g, '<br>') + '</h1>' +
        '<p class="dk-sub" style="margin-bottom:10px">' + A.esc(s.subtitle) + '</p>' +
        '<div class="dk-bento">' +
          bullets.map(function (b, i) {
            var sp = b.split('|');
            return '<div class="dk-bento-card"><div class="dk-bento-ico">' + icons[i % icons.length] + '</div><b>' + A.esc((sp[0] || b).trim()) + '</b>' +
              (sp[1] ? '<p>' + A.esc(sp.slice(1).join('|').trim()) + '</p>' : '') + '</div>';
          }).join('') +
        '</div></div>';
    }

    // 5) 실행 프로세스: 가로 4단계 타임라인 스텝 커넥터
    if (layout === 'process') {
      return '<div><h1 class="dk-title" style="font-size:25px">' + A.esc(s.title).replace(/\n/g, '<br>') + '</h1>' +
        '<p class="dk-sub">' + A.esc(s.subtitle) + '</p>' +
        '<div class="dk-timeline">' +
          bullets.map(function (b, i) {
            var sp = b.split('|');
            return '<div class="dk-step-card"><div class="dk-step-dot">STEP 0' + (i + 1) + '</div><b>' + A.esc((sp[0] || b).trim()) + '</b>' +
              (sp[1] ? '<p>' + A.esc(sp.slice(1).join('|').trim()) + '</p>' : '') + '</div>';
          }).join('') +
        '</div>' +
        '<div class="dk-metrics" style="margin-top:12px">' + metrics.map(function (m) {
          return '<div class="dk-metric"><span class="dk-mlbl">' + A.esc(m.label) + '</span><b class="dk-mval">' + A.esc(m.value) + '</b></div>';
        }).join('') + '</div></div>';
    }

    // 6) 패키지: 3단 VIP 가격 비교 카드 (가운데 강조)
    if (layout === 'packages') {
      return '<div><h1 class="dk-title" style="font-size:25px">' + A.esc(s.title).replace(/\n/g, '<br>') + '</h1>' +
        '<p class="dk-sub" style="margin-bottom:10px">' + A.esc(s.subtitle) + '</p>' +
        '<div class="dk-pricing">' +
          bullets.map(function (b, i) {
            var sp = b.split('|');
            var isBest = i === 1 || /BEST|추천/i.test(b);
            return '<div class="dk-price-card' + (isBest ? ' featured' : '') + '">' +
              (isBest ? '<span class="dk-best-badge">MOST POPULAR</span>' : '') +
              '<div class="dk-pname">' + A.esc((sp[0] || 'PACKAGE').trim()) + '</div>' +
              '<div class="dk-pamt">' + A.esc((sp[1] || '맞춤 견적').trim()) + '</div>' +
              '<div class="dk-ptag">' + A.esc((sp[2] || '').trim()) + '</div>' +
              '<p class="dk-pdesc">' + A.esc((sp[3] || sp[2] || '').trim()) + '</p>' +
            '</div>';
          }).join('') +
        '</div></div>';
    }

    // 7) 마무리 Contact 쇼케이스
    if (layout === 'closing') {
      return '<div class="dk-closing">' +
        '<div class="dk-pill-badge">✦ FREE 1:1 SNS HEALTH AUDIT</div>' +
        '<h1 class="dk-hero-title" style="font-size:32px;text-align:center !important">' + A.esc(s.title).replace(/\n/g, '<br>') + '</h1>' +
        '<p class="dk-hero-sub" style="text-align:center;margin:0 auto 16px">' + A.esc(s.subtitle).replace(/\n/g, '<br>') + '</p>' +
        '<div class="dk-contact-card">' +
          bullets.map(function (b) { return '<div class="dk-contact-item">' + A.esc(b) + '</div>'; }).join('') +
        '</div>' +
      '</div>';
    }

    // 8) Case Study (기본): 좌측 스토리 ↔ 우측 이미지 또는 자동 성과 대시보드 그래픽
    var rightVisual = hasImg
      ? '<div class="dk-imgbox"><img src="' + A.esc(s.image) + '" alt=""></div>'
      : '<div class="dk-mock-board">' +
          '<div class="dk-mock-head"><span>LIVE CASE PERFORMANCE</span><b>BEFORE → AFTER</b></div>' +
          metrics.map(function (m, mi) {
            var pct = [78, 88, 95][mi % 3];
            return '<div class="dk-mock-row">' +
              '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px"><span>' + A.esc(m.label) + '</span><b class="dk-mval" style="font-size:13px;margin:0">' + A.esc(m.value) + '</b></div>' +
              '<div class="dk-mock-track"><div class="dk-mock-fill" style="width:' + pct + '%"></div></div>' +
            '</div>';
          }).join('') +
        '</div>';

    return '<div class="dk-split-2 case">' +
      '<div class="dk-left-col">' +
        '<h1 class="dk-title" style="font-size:24px">' + A.esc(s.title).replace(/\n/g, '<br>') + '</h1>' +
        '<p class="dk-sub" style="font-size:12.2px">' + A.esc(s.subtitle).replace(/\n/g, '<br>') + '</p>' +
        '<div class="dk-bullets">' +
          bullets.map(function (b, i) {
            return '<div class="dk-bullet"><span class="dk-bnum">0' + (i + 1) + '</span><span>' + A.esc(b) + '</span></div>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div class="dk-right-col">' + rightVisual + '</div>' +
    '</div>';
  }

  function slideHtml(s, idx, total, withLive3D) {
    var pageNo = String(idx + 1).padStart(2, '0');
    var totalNo = String(total).padStart(2, '0');
    return '<article class="deck-slide theme-' + A.esc(deck.theme) + ' layout-' + A.esc(s.layout || 'case') + '">' +
      (withLive3D ? '<canvas class="dk-3d-canvas" id="port3dCanvas" aria-hidden="true"></canvas>' : '<div class="dk-glow"></div>') +
      '<div class="dk-topbar">' +
        '<span class="dk-brand">' + A.esc(deck.companyEn || deck.company) + '</span>' +
        '<span class="dk-kicker">' + A.esc(s.kicker || '') + '</span>' +
      '</div>' +
      '<div class="dk-stage-body">' + renderSlideBody(s, idx) + '</div>' +
      '<div class="dk-foot">' +
        '<span>' + A.esc(deck.company) + ' · ' + A.esc(deck.tagline || '') + '</span>' +
        '<span class="dk-pageno"><b>' + pageNo + '</b> / ' + totalNo + '</span>' +
      '</div>' +
    '</article>';
  }

  function mount3DIfVisible() {
    var cv = document.getElementById('port3dCanvas');
    if (cv && window.mountPortfolio3D) {
      window.mountPortfolio3D(cv, deck.theme);
      if (window.pulsePortfolio3D) window.pulsePortfolio3D(ui.pageIdx);
    }
  }

  function updatePreviewOnly() {
    clampPage();
    var stage = document.getElementById('portStage');
    var pager = document.getElementById('portPagerLabel');
    var printBox = document.getElementById('portPrintAll');
    if (pager) pager.textContent = (ui.pageIdx + 1) + ' / ' + deck.slides.length + ' 페이지';
    if (stage) {
      if (ui.viewMode === 'all') {
        stage.innerHTML = deck.slides.map(function (s, i) { return slideHtml(s, i, deck.slides.length, false); }).join('');
      } else {
        stage.innerHTML = slideHtml(deck.slides[ui.pageIdx], ui.pageIdx, deck.slides.length, true);
        mount3DIfVisible();
      }
    }
    if (printBox) {
      printBox.innerHTML = deck.slides.map(function (s, i) { return slideHtml(s, i, deck.slides.length, false); }).join('');
    }
  }

  // 🌐 Three.js r187 3D 인터랙티브 독립 HTML 파일 생성기 (클라이언트에게 보내면 브라우저에서 3D 실시간 구동 + 키보드/터치/PDF 인쇄 완비!)
  function buildStandalone3DHtml() {
    var slidesMarkup = deck.slides.map(function (s, i) {
      return '<section class="slide-wrap' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '">' +
        slideHtml(s, i, deck.slides.length, false) + '</section>';
    }).join('\n');

    var themeBg = deck.theme === 'ivory-editorial' ? '#e8e2d5' : (deck.theme === 'midnight-navy' ? '#040c1b' : '#050507');
    var palJs = deck.theme === 'ivory-editorial'
      ? '{p:0xb4822c,s:0x78716c,pt:0xd6a852}'
      : (deck.theme === 'midnight-navy' ? '{p:0x38bdf8,s:0x818cf8,pt:0xbae6fd}' : '{p:0xe6c46a,s:0xf59e0b,pt:0xfde68a}');

    // 핵심 덱 스타일을 인라인으로 포함해 오프라인/어디서나 100% 동일 렌더링
    var styles = '';
    try {
      Array.prototype.forEach.call(document.styleSheets, function (sheet) {
        if (sheet.href && sheet.href.indexOf('workspace.css') !== -1) {
          Array.prototype.forEach.call(sheet.cssRules || [], function (rule) {
            if (/\.deck-slide|\.dk-|\.theme-/.test(rule.cssText)) styles += rule.cssText + '\n';
          });
        }
      });
    } catch (e) {}

    return '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>' + A.esc(deck.title) + '</title>\n<style>\n' +
      '*{box-sizing:border-box}html,body{margin:0;height:100%;background:' + themeBg + ';font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard","Malgun Gothic",sans-serif;overflow:hidden}\n' +
      '#bg3d{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}\n' +
      '.viewer{position:relative;z-index:1;height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px 20px 68px}\n' +
      '.slide-wrap{display:none;width:100%;max-width:1040px;animation:fadeSlide .38s cubic-bezier(.22,1,.36,1)}\n' +
      '.slide-wrap.active{display:block}\n' +
      '@keyframes fadeSlide{from{opacity:0;transform:translateY(14px) scale(0.985)}to{opacity:1;transform:none}}\n' +
      '.deck-slide{background:rgba(12,12,16,0.78) !important;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}\n' +
      '.deck-slide.theme-midnight-navy{background:rgba(7,20,41,0.80) !important}\n' +
      '.deck-slide.theme-ivory-editorial{background:rgba(251,249,244,0.86) !important}\n' +
      '.hud{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:10;display:flex;align-items:center;gap:10px;padding:8px 14px;border-radius:999px;background:rgba(15,23,42,0.82);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.18);color:#f8fafc;font-size:12.5px;font-weight:800}\n' +
      '.hud button{border:1px solid rgba(255,255,255,0.22);background:rgba(255,255,255,0.1);color:#fff;border-radius:999px;padding:6px 12px;font:inherit;cursor:pointer}\n' +
      '.hud button:hover{background:rgba(255,255,255,0.24)}\n' +
      '.dots{display:flex;gap:5px;align-items:center}.dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.28);cursor:pointer;transition:transform .2s,background .2s}.dot.on{background:#e6c46a;transform:scale(1.35)}\n' +
      styles + '\n' +
      '@media print{@page{size:A4 landscape;margin:0}html,body{height:auto;overflow:visible;background:#fff}#bg3d,.hud{display:none !important}.viewer{display:block;height:auto;padding:0}.slide-wrap{display:block !important;max-width:none;page-break-after:always;break-after:page}.slide-wrap:last-child{page-break-after:auto}.deck-slide{border-radius:0 !important;height:210mm !important;aspect-ratio:auto !important;box-shadow:none !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}}\n' +
      '</style>\n</head>\n<body>\n<canvas id="bg3d"></canvas>\n<main class="viewer">' + slidesMarkup + '</main>\n' +
      '<div class="hud"><button id="prev">◀ 이전</button><span id="cnt">1 / ' + deck.slides.length + '</span><button id="next">다음 ▶</button><div class="dots" id="dots"></div><button id="fs">⛶ 전체화면</button><button onclick="window.print()">🖨️ PDF 저장</button></div>\n' +
      '<script type="module">\n' +
      'import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js";\n' +
      'const pal=' + palJs + ';const cv=document.getElementById("bg3d");const r=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true});r.setPixelRatio(Math.min(devicePixelRatio,2));r.setSize(innerWidth,innerHeight);\n' +
      'const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,0.1,100);cam.position.z=12;\n' +
      'const core=new THREE.Mesh(new THREE.IcosahedronGeometry(3.2,1),new THREE.MeshBasicMaterial({color:pal.p,wireframe:true,transparent:true,opacity:0.32}));core.position.set(4.2,0,-2);sc.add(core);\n' +
      'const ring=new THREE.Mesh(new THREE.TorusGeometry(4.6,0.05,16,100),new THREE.MeshBasicMaterial({color:pal.s,transparent:true,opacity:0.4}));ring.position.set(4.2,0,-2.5);ring.rotation.x=1.1;sc.add(ring);\n' +
      'const arr=new Float32Array(500*3);for(let i=0;i<500*3;i++)arr[i]=(Math.random()-0.5)*26;const pg=new THREE.BufferGeometry();pg.setAttribute("position",new THREE.BufferAttribute(arr,3));\n' +
      'const pts=new THREE.Points(pg,new THREE.PointsMaterial({color:pal.pt,size:0.09,transparent:true,opacity:0.75}));sc.add(pts);\n' +
      'let mx=0,my=0,rotTarget=0;addEventListener("pointermove",e=>{mx=(e.clientX/innerWidth-0.5)*2;my=(e.clientY/innerHeight-0.5)*2},{passive:true});\n' +
      'addEventListener("resize",()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();r.setSize(innerWidth,innerHeight)});\n' +
      'const slides=[...document.querySelectorAll(".slide-wrap")];let idx=0;const dots=document.getElementById("dots");\n' +
      'slides.forEach((_,i)=>{const d=document.createElement("span");d.className="dot"+(i===0?" on":"");d.onclick=()=>go(i);dots.appendChild(d)});\n' +
      'function go(n){idx=(n+slides.length)%slides.length;slides.forEach((s,i)=>s.classList.toggle("active",i===idx));[...dots.children].forEach((d,i)=>d.classList.toggle("on",i===idx));document.getElementById("cnt").textContent=(idx+1)+" / "+slides.length;rotTarget=idx*1.2;}\n' +
      'document.getElementById("prev").onclick=()=>go(idx-1);document.getElementById("next").onclick=()=>go(idx+1);\n' +
      'document.getElementById("fs").onclick=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen();else document.exitFullscreen();};\n' +
      'addEventListener("keydown",e=>{if(e.key==="ArrowRight"||e.key===" ")go(idx+1);if(e.key==="ArrowLeft")go(idx-1);});\n' +
      'let tx=0;addEventListener("touchstart",e=>{tx=e.touches[0].clientX},{passive:true});addEventListener("touchend",e=>{const dx=e.changedTouches[0].clientX-tx;if(dx<-45)go(idx+1);if(dx>45)go(idx-1);});\n' +
      '(function loop(now){requestAnimationFrame(loop);const t=now*0.0006;core.rotation.x=t*0.6+my*0.35;core.rotation.y+=0.004+(rotTarget-core.rotation.y)*0.05;ring.rotation.z=-t*0.35;ring.rotation.y=t*0.45+mx*0.4;pts.rotation.y=t*0.12+mx*0.1;cam.position.x+=(mx*0.8-cam.position.x)*0.04;cam.position.y+=(-my*0.5-cam.position.y)*0.04;cam.lookAt(0,0,0);r.render(sc,cam);})(0);\n' +
      '</script>\n</body>\n</html>';
  }

  function render() {
    var root = document.getElementById('pane-portfolio');
    if (!root) return;
    clampPage();
    var cur = deck.slides[ui.pageIdx];
    var savedList = A.store.portfolios || [];

    root.innerHTML = '<div class="ws-split port-split">' +
      '<div class="split-editor">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">' +
          '<h3 class="neon-yellow-title" style="margin:0;font-size:15.5px">🎨 3D 인터랙티브 회사 포트폴리오 편집</h3>' +
          '<div class="ws-actions">' +
            '<button type="button" class="ws-btn sm" id="portResetBtn">🔄 기본 10장</button>' +
            (deck.id ? '<button type="button" class="ws-btn sm danger" id="portDelDeckBtn">삭제</button>' : '') +
          '</div>' +
        '</div>' +

        (savedList.length ? '<div class="saved-bar"><span style="font-size:11px;font-weight:800;color:#0369a1">저장된 포트폴리오:</span>' +
          savedList.slice(0, 8).map(function (pf) {
            return '<button type="button" class="saved-chip' + (deck.id === pf.id ? ' active' : '') + '" data-pfid="' + pf.id + '">' + A.esc(pf.title || '포트폴리오') + '</button>';
          }).join('') + '</div>' : '') +

        '<div class="ws-card" style="padding:12px">' +
          '<h3 style="margin-bottom:8px;font-size:13px">🏢 브랜드 · 3D 테마 설정</h3>' +
          '<div class="ws-grid-2">' +
            '<div class="ws-field"><label>회사명 (한글)</label><input data-dk="company" value="' + A.esc(deck.company) + '"></div>' +
            '<div class="ws-field"><label>영문 브랜드명</label><input data-dk="companyEn" value="' + A.esc(deck.companyEn) + '"></div>' +
            '<div class="ws-field"><label>포트폴리오 문서명</label><input data-dk="title" value="' + A.esc(deck.title) + '"></div>' +
            '<div class="ws-field"><label>3D 럭셔리 테마</label><select data-dk="theme">' +
              THEMES.map(function (t) { return '<option value="' + t.id + '"' + (deck.theme === t.id ? ' selected' : '') + '>' + t.name + '</option>'; }).join('') +
            '</select></div>' +
          '</div>' +
          '<div class="ws-field" style="margin-top:8px"><label>하단 공통 슬로건</label><input data-dk="tagline" value="' + A.esc(deck.tagline) + '"></div>' +
        '</div>' +

        '<div class="ws-card" style="padding:12px">' +
          '<h3 style="margin-bottom:8px;font-size:13px">' +
            '<span>📄 ' + (ui.pageIdx + 1) + '번 페이지 편집 (총 ' + deck.slides.length + '장)</span>' +
            '<span style="display:flex;gap:4px;flex-wrap:wrap">' +
              '<button type="button" class="ws-btn sm" id="portMoveUp" title="앞으로 이동">◀</button>' +
              '<button type="button" class="ws-btn sm" id="portMoveDown" title="뒤로 이동">▶</button>' +
              '<button type="button" class="ws-btn sm primary" id="portAddSlide">+ 장 추가</button>' +
              '<button type="button" class="ws-btn sm danger" id="portDelSlide">− 장 삭제</button>' +
            '</span>' +
          '</h3>' +

          '<div class="ws-grid-2">' +
            '<div class="ws-field"><label>페이지 디자인 레이아웃</label><select data-sl="layout">' +
              [['cover', '3D 시네마틱 표지'], ['philosophy', '비전·철학 2단 분할'], ['metrics', '대형 KPI + 성장곡선 차트'], ['services', '2×2 럭셔리 벤토 그리드'], ['case', '성공사례 + 성과보드'], ['process', '4단계 가로 타임라인'], ['packages', '3단 VIP 가격 비교표'], ['closing', '마무리 · Contact 쇼케이스']].map(function (it) {
                return '<option value="' + it[0] + '"' + (cur.layout === it[0] ? ' selected' : '') + '>' + it[1] + '</option>';
              }).join('') +
            '</select></div>' +
            '<div class="ws-field"><label>상단 영문 라벨</label><input data-sl="kicker" value="' + A.esc(cur.kicker || '') + '"></div>' +
          '</div>' +

          '<div class="ws-field" style="margin-top:8px"><label>큰 제목 (줄바꿈 Enter 가능)</label><textarea data-sl="title" style="min-height:54px">' + A.esc(cur.title || '') + '</textarea></div>' +
          '<div class="ws-field" style="margin-top:8px"><label>서브 설명 문구</label><textarea data-sl="subtitle" style="min-height:56px">' + A.esc(cur.subtitle || '') + '</textarea></div>' +
          '<div class="ws-field" style="margin-top:8px"><label>핵심 포인트 / 카드 내용 (한 줄에 1개, 제목|설명 구분 지원)</label><textarea id="portBullets" style="min-height:92px">' + A.esc((cur.bullets || []).join('\n')) + '</textarea></div>' +

          '<div style="margin-top:8px">' +
            '<label style="font-size:11.6px;font-weight:800;color:#0369a1;display:block;margin-bottom:5px">핵심 지표 / 하단 스펙 (3칸)</label>' +
            '<div class="ws-grid-3">' +
              [0, 1, 2].map(function (mi) {
                var m = (cur.metrics && cur.metrics[mi]) || { label: '', value: '' };
                return '<div style="display:flex;flex-direction:column;gap:4px">' +
                  '<input data-ml="' + mi + '" placeholder="라벨" value="' + A.esc(m.label) + '" style="font-size:11.5px;padding:5px 7px;border-radius:7px;border:1px solid var(--line-strong)">' +
                  '<input data-mv="' + mi + '" placeholder="수치/강조값" value="' + A.esc(m.value) + '" style="font-size:12px;font-weight:700;padding:5px 7px;border-radius:7px;border:1px solid var(--line-strong)">' +
                '</div>';
              }).join('') +
            '</div>' +
          '</div>' +

          '<div style="display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap">' +
            '<input type="file" id="portImgInput" accept="image/*" hidden>' +
            '<button type="button" class="ws-btn sm" id="portImgBtn">🖼️ 이 페이지 이미지 추가</button>' +
            (cur.image ? '<button type="button" class="ws-btn sm danger" id="portImgClear">이미지 제거</button><span style="font-size:11.5px;color:#16a34a;font-weight:700">✓ 이미지 적용됨</span>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="split-preview port-preview">' +
        '<div class="preview-toolbar" style="max-width:940px">' +
          '<div style="display:flex;align-items:center;gap:6px">' +
            '<button type="button" class="ws-btn sm" id="portPrevBtn">◀ 이전 장</button>' +
            '<span id="portPagerLabel" class="neon-yellow-title" style="font-size:12.8px;min-width:90px;text-align:center">' + (ui.pageIdx + 1) + ' / ' + deck.slides.length + ' 페이지</span>' +
            '<button type="button" class="ws-btn sm" id="portNextBtn">다음 장 ▶</button>' +
          '</div>' +
          '<div class="ws-actions">' +
            '<button type="button" class="ws-btn sm" id="portViewModeBtn">' + (ui.viewMode === 'single' ? '📚 전체 펼치기' : '🎬 3D 한 장씩 보기') + '</button>' +
            '<button type="button" class="ws-btn sm primary" id="portSaveBtn">💾 저장</button>' +
            '<button type="button" class="ws-btn sm ai" id="portDownloadHtmlBtn">🌐 3D HTML 다운</button>' +
            '<button type="button" class="ws-btn sm ok" id="portPrintBtn">🖨️ ' + deck.slides.length + '장 PDF 출력</button>' +
          '</div>' +
        '</div>' +

        '<div class="deck-stage" id="portStage"></div>' +

        '<div class="deck-thumbs" id="portThumbs">' +
          deck.slides.map(function (s, i) {
            var shortT = (s.title || '').replace(/\n/g, ' ').slice(0, 14);
            return '<button type="button" class="deck-thumb' + (i === ui.pageIdx ? ' active' : '') + '" data-pjump="' + i + '">' +
              '<b>' + String(i + 1).padStart(2, '0') + '</b>' +
              '<span>' + A.esc(shortT || '페이지') + '</span>' +
            '</button>';
          }).join('') +
        '</div>' +

        '<div class="deck-print-all" id="portPrintAll"></div>' +
      '</div>' +
    '</div>';

    updatePreviewOnly();
    bindEvents(root);
  }

  function compressPortfolioImg(file, cb) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      URL.revokeObjectURL(url);
      var maxW = 900, w = img.width, h = img.height;
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      cb(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = function () { URL.revokeObjectURL(url); cb(''); };
    img.src = url;
  }

  function bindEvents(root) {
    var q = function (s) { return root.querySelector(s); };
    var cur = deck.slides[ui.pageIdx];

    Array.prototype.forEach.call(root.querySelectorAll('[data-dk]'), function (el) {
      var ev = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(ev, function () {
        deck[el.getAttribute('data-dk')] = el.value;
        updatePreviewOnly();
      });
    });

    Array.prototype.forEach.call(root.querySelectorAll('[data-sl]'), function (el) {
      var ev = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(ev, function () {
        cur[el.getAttribute('data-sl')] = el.value;
        updatePreviewOnly();
      });
    });

    var bEl = q('#portBullets');
    if (bEl) bEl.addEventListener('input', function () {
      cur.bullets = bEl.value.split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean);
      updatePreviewOnly();
    });

    Array.prototype.forEach.call(root.querySelectorAll('[data-ml]'), function (el) {
      el.addEventListener('input', function () {
        var mi = parseInt(el.getAttribute('data-ml'), 10);
        if (!cur.metrics) cur.metrics = [{ label: '', value: '' }, { label: '', value: '' }, { label: '', value: '' }];
        if (!cur.metrics[mi]) cur.metrics[mi] = { label: '', value: '' };
        cur.metrics[mi].label = el.value;
        updatePreviewOnly();
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-mv]'), function (el) {
      el.addEventListener('input', function () {
        var mi = parseInt(el.getAttribute('data-mv'), 10);
        if (!cur.metrics) cur.metrics = [{ label: '', value: '' }, { label: '', value: '' }, { label: '', value: '' }];
        if (!cur.metrics[mi]) cur.metrics[mi] = { label: '', value: '' };
        cur.metrics[mi].value = el.value;
        updatePreviewOnly();
      });
    });

    var imgBtn = q('#portImgBtn'), imgInp = q('#portImgInput');
    if (imgBtn && imgInp) {
      imgBtn.addEventListener('click', function () { imgInp.click(); });
      imgInp.addEventListener('change', function () {
        var f = imgInp.files && imgInp.files[0];
        if (!f) return;
        compressPortfolioImg(f, function (dataUrl) {
          if (dataUrl) { cur.image = dataUrl; render(); A.toast('🖼️ 이미지가 적용되었습니다.'); }
        });
      });
    }
    var imgClr = q('#portImgClear');
    if (imgClr) imgClr.addEventListener('click', function () { cur.image = ''; render(); });

    var prevBtn = q('#portPrevBtn'), nextBtn = q('#portNextBtn');
    if (prevBtn) prevBtn.addEventListener('click', function () { if (ui.pageIdx > 0) { ui.pageIdx--; render(); } });
    if (nextBtn) nextBtn.addEventListener('click', function () { if (ui.pageIdx < deck.slides.length - 1) { ui.pageIdx++; render(); } });

    Array.prototype.forEach.call(root.querySelectorAll('[data-pjump]'), function (b) {
      b.addEventListener('click', function () { ui.pageIdx = parseInt(b.getAttribute('data-pjump'), 10); render(); });
    });

    var vmBtn = q('#portViewModeBtn');
    if (vmBtn) vmBtn.addEventListener('click', function () { ui.viewMode = ui.viewMode === 'single' ? 'all' : 'single'; render(); });

    var addSlide = q('#portAddSlide');
    if (addSlide) addSlide.addEventListener('click', function () {
      var n = deck.slides.length + 1;
      deck.slides.splice(ui.pageIdx + 1, 0, {
        layout: 'case',
        kicker: String(n).padStart(2, '0') + ' · CUSTOM CASE',
        title: '새 포트폴리오 페이지\n핵심 성과를 입력하세요',
        subtitle: '고객에게 강조하고 싶은 스토리와 수치를 자유롭게 입력하세요.',
        bullets: ['핵심 실행 포인트 1', '핵심 실행 포인트 2', '핵심 실행 포인트 3'],
        metrics: [{ label: 'METRIC 01', value: '100%' }, { label: 'METRIC 02', value: '+250%' }, { label: 'METRIC 03', value: 'TOP 1' }],
        image: '',
      });
      ui.pageIdx++;
      render();
      A.toast('➕ 새 페이지 추가 완료 (총 ' + deck.slides.length + '장)');
    });
    var delSlide = q('#portDelSlide');
    if (delSlide) delSlide.addEventListener('click', function () {
      if (deck.slides.length <= 1) { A.toast('⚠️ 최소 1장은 남아 있어야 합니다.'); return; }
      deck.slides.splice(ui.pageIdx, 1);
      clampPage();
      render();
    });
    var upBtn = q('#portMoveUp'), downBtn = q('#portMoveDown');
    if (upBtn) upBtn.addEventListener('click', function () {
      if (ui.pageIdx <= 0) return;
      var tmp = deck.slides[ui.pageIdx - 1]; deck.slides[ui.pageIdx - 1] = deck.slides[ui.pageIdx]; deck.slides[ui.pageIdx] = tmp;
      ui.pageIdx--; render();
    });
    if (downBtn) downBtn.addEventListener('click', function () {
      if (ui.pageIdx >= deck.slides.length - 1) return;
      var tmp = deck.slides[ui.pageIdx + 1]; deck.slides[ui.pageIdx + 1] = deck.slides[ui.pageIdx]; deck.slides[ui.pageIdx] = tmp;
      ui.pageIdx++; render();
    });

    var resetBtn = q('#portResetBtn');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      if (!confirm('기본 10장 3D 포트폴리오로 초기화할까요?')) return;
      deck = blankDeck(); ui.pageIdx = 0; render();
    });

    Array.prototype.forEach.call(root.querySelectorAll('[data-pfid]'), function (b) {
      b.addEventListener('click', function () {
        var id = parseInt(b.getAttribute('data-pfid'), 10);
        var pf = A.store.portfolios.filter(function (x) { return x.id === id; })[0];
        if (pf) {
          deck = Object.assign(blankDeck(), pf.data || {}, { id: pf.id, title: pf.title, theme: pf.theme || 'obsidian-gold' });
          ui.pageIdx = 0; render();
        }
      });
    });

    var saveBtn = q('#portSaveBtn');
    if (saveBtn) saveBtn.addEventListener('click', function () {
      var payload = { title: deck.title.trim() || (deck.company + ' 포트폴리오'), theme: deck.theme, data: Object.assign({}, deck) };
      var req = deck.id
        ? A.api('/api/portfolios/' + deck.id, { method: 'PATCH', body: JSON.stringify(payload) })
        : A.api('/api/portfolios', { method: 'POST', body: JSON.stringify(payload) });
      req.then(function (d) { if (d.portfolio) deck.id = d.portfolio.id; return A.refreshAll(); })
        .then(function () { A.toast('✅ 포트폴리오가 저장되었습니다!'); render(); })
        .catch(function (err) { A.toast('❌ 저장 실패: ' + (err.message || '')); });
    });

    var delDeck = q('#portDelDeckBtn');
    if (delDeck && deck.id) delDeck.addEventListener('click', function () {
      if (!confirm('저장된 포트폴리오를 삭제할까요?')) return;
      A.api('/api/portfolios/' + deck.id, { method: 'DELETE' })
        .then(function () { deck = blankDeck(); ui.pageIdx = 0; return A.refreshAll(); });
    });

    // 🌐 Three.js 3D 인터랙티브 독립 HTML 파일 다운로드
    var dlHtmlBtn = q('#portDownloadHtmlBtn');
    if (dlHtmlBtn) dlHtmlBtn.addEventListener('click', function () {
      var html = buildStandalone3DHtml();
      var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = ((deck.company || '미담공장') + '_3D포트폴리오_' + deck.slides.length + 'p.html').replace(/[\\/:*?"<>|]/g, '_');
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 300);
      A.toast('🌐 Three.js 3D 인터랙티브 포트폴리오 HTML 파일 다운로드 완료!');
    });

    var printBtn = q('#portPrintBtn');
    if (printBtn) printBtn.addEventListener('click', function () {
      updatePreviewOnly();
      document.body.classList.add('printing-deck');
      A.printPane('pane-portfolio', (deck.company || '미담공장') + '_포트폴리오_' + deck.slides.length + 'p');
      setTimeout(function () { document.body.classList.remove('printing-deck'); }, 500);
    });
  }

  A.on('data-updated', function () {
    if (!deck.id && A.store.portfolios && A.store.portfolios.length) {
      var first = A.store.portfolios[0];
      deck = Object.assign(blankDeck(), first.data || {}, { id: first.id, title: first.title, theme: first.theme || 'obsidian-gold' });
    }
    if (A.store.activeTab === 'portfolio') render();
  });
  A.on('tab-changed', function (t) { if (t === 'portfolio') render(); });
})();

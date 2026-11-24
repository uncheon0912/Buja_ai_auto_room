/**
 * 탭 8: 📅 콘텐츠 캘린더 · 원클릭 예약 발행 (Phase A-2) & 🏭 AI 업종별 10편 공장 (Phase A-3)
 * - 월간 캘린더 보드 (고객사/채널 필터 · 일정 클릭 상세 검수 · 원클릭 예약확정/발행완료)
 * - 고객 VIP 포털(portal.html)에서 대표님 승인 시 자동 '예약확정' 반영 실시간 연동
 * - 🛡️ 의료법 · 금소법 · 표시광고법 AI 심의 금지어 자동 스캔 및 안전 대체어 제안
 * - 🏭 고객사 CRM 데이터 기반 병원/보험/정책자금/자영업 맞춤 블로그 6편 + 3초 후킹 릴스 4편 = 10편 일괄 생성
 */
(function () {
  'use strict';
  var A = window.AgencyApp;
  if (!A) return;

  // 🛡️ 업종별 법적 심의 금지어 · 위험 표현 스캐너 (의료법 · 금소법 · 표시광고법)
  var COMPLIANCE_RULES = [
    { group: '의료법(병원)', words: ['100% 완치', '완치 보장', '부작용 없음', '부작용 제로', '무통', '국내 최초', '국내 최고', '최고의 병원', '절대 안전', '단 1회로 해결', '평생 보장', '무조건 효과'], tip: '“개인차가 있을 수 있으며, 의료진 상담을 통해 맞춤 안내드립니다” 등 객관적 표현으로 순화하세요.' },
    { group: '금소법(보험)', words: ['무조건 보장', '100% 지급', '원금 100% 보장', '확정 수익', '손실 없음', '무조건 가입', '안 들면 손해', '절대 손해 없는'], tip: '“상품 약관 및 가입 조건에 따라 보장 범위가 달라질 수 있습니다” 문구를 반드시 포함하세요.' },
    { group: '정책자금·금융', words: ['100% 승인', '무조건 승인', '누구나 가능', '전액 지원 보장', '무심사', '확정 대출'], tip: '“기업별 매출·업력·신용 조건에 따라 심사 결과가 상이할 수 있습니다”로 표현하세요.' },
    { group: '표시광고법(공통)', words: ['업계 1위', '전국 최강', '단독 독점', '기적의', '무조건 대박'], tip: '객관적 근거 자료가 없는 최상급·단정적 표현은 삭제하거나 실제 수치 근거를 병기하세요.' },
  ];

  function checkCompliance(text) {
    var src = String(text || '');
    var hits = [];
    COMPLIANCE_RULES.forEach(function (rule) {
      rule.words.forEach(function (w) {
        if (src.indexOf(w) !== -1) {
          hits.push({ group: rule.group, word: w, tip: rule.tip });
        }
      });
    });
    var score = Math.max(40, 100 - hits.length * 18);
    return {
      score: score,
      safe: hits.length === 0,
      hits: hits,
      label: hits.length === 0 ? '✅ 심의 안전 (100점)' : ('⚠️ 심의 주의 (' + hits.length + '건 탐지 · ' + score + '점)'),
    };
  }

  // 업종별 고전환 10편(블로그 6편 + 3초 후킹 릴스 4편) 블루프린트
  var FACTORY_BLUEPRINTS = {
    '병원': [
      { ch: '네이버 블로그', title: '[{name}] 내원 전 꼭 확인해야 할 진료·검진 체크리스트 5가지', hook: '처음 방문하시는 환자분들이 가장 자주 묻는 핵심 질문 5가지를 원장님 기준으로 정리했습니다.', body: '1) 초진 예약 전 준비사항\n2) 증상별 맞춤 상담 절차\n3) 진료 장비·위생 관리 시스템\n4) 자주 묻는 질문(FAQ)\n5) 네이버 예약 / 카카오 상담 안내 (※ 개인별 상태에 따라 진료 계획은 달라질 수 있습니다.)', tags: '#{name} #지역병원추천 #건강검진 #원장님칼럼' },
      { ch: '인스타 릴스', title: '원장님 3초 팩트체크 ① — 병원 선택 시 놓치기 쉬운 핵심 기준', hook: '병원 예약하기 전에 이 1가지만 확인해도 시행착오를 크게 줄일 수 있습니다!', body: '[0~3초 후킹] "병원 예약 전, 이거 안 보고 가시면 후회합니다!"\n[4~20초 본론] 원장님이 직접 알려주는 장비·사후관리·상담 체크포인트 3가지\n[21~30초 CTA] "프로필 링크에서 무료 사전 체크리스트 받아가세요!"', tags: '#병원릴스 #원장님팩트체크 #건강정보 #{name}' },
      { ch: '네이버 블로그', title: '[{name}] 증상 방치하면 커지는 이유와 올바른 초기 대응 가이드', hook: '바쁘다는 이유로 미루기 쉬운 초기 신호, 정확한 진단 타이밍을 알기 쉽게 풀어드립니다.', body: '1) 일상에서 흔히 놓치는 초기 신호\n2) 자가 판단보다 정확한 검사가 중요한 이유\n3) 실제 내원 상담 흐름 안내\n4) 카카오 1:1 빠른 문의 배너', tags: '#증상가이드 #초기진단 #{name} #건강블로그' },
      { ch: '인스타 릴스', title: '원장님 3초 팩트체크 ② — 환자들이 가장 많이 오해하는 속설 TOP3', hook: '인터넷에서 보고 따라 하신 그 방법, 사실은 정반대일 수 있습니다!', body: '[0~3초 후킹] "아직도 이 속설 믿고 계세요? 원장님이 딱 정리해 드립니다!"\n[4~22초 본론] 오해 1~3번 팩트체크 + 올바른 관리법\n[23~30초 CTA] "저장해 두시고 가족에게도 공유해 주세요!"', tags: '#건강오해 #의료상식 #릴스추천 #{name}' },
      { ch: '네이버 블로그', title: '[{name}] 최신 의료 장비 및 체계적 사후관리 프로세스 소개', hook: '신뢰할 수 있는 진료를 위해 우리가 고집하는 정밀 검사·청결 기준을 투명하게 공개합니다.', body: '1) 정밀 진단을 돕는 핵심 장비 안내\n2) 1:1 전담 상담 및 사후 관리\n3) 오시는 길 · 주차 · 진료시간 안내', tags: '#정밀검사 #사후관리 #{name} #신뢰병원' },
      { ch: '인스타 릴스', title: '원장님 비하인드 릴스 ③ — 진료실 밖에서 지키는 우리 병원의 원칙', hook: '왜 우리 병원은 하루 상담 인원을 제한할까요? 진짜 이유를 공개합니다.', body: '[0~3초 후킹] "예약이 조금 밀려도 절대 타협하지 않는 딱 한 가지!"\n[4~20초 본론] 충분한 문진 시간과 꼼꼼한 설명 현장 스케치\n[21~30초 CTA] "진료 문의는 댓글에 ‘상담’ 남겨주세요!"', tags: '#병원브랜딩 #원장님철학 #릴스마케팅 #{name}' },
      { ch: '네이버 블로그', title: '[{name}] 바쁜 직장인·자영업자를 위한 야간/주말 효율적 예약 꿀팁', hook: '대기 시간을 줄이고 원하는 시간대에 편하게 진료받는 스마트 예약 방법 총정리.', body: '1) 대기 적은 추천 시간대 안내\n2) 네이버 예약 1분 신청 가이드\n3) 사전 문진표 작성 시 혜택(대기 단축)', tags: '#야간진료 #네이버예약 #{name} #진료꿀팁' },
      { ch: '인스타 릴스', title: '3초 경고형 릴스 ④ — 지금 바로 점검해야 할 자가 체크 3가지', hook: '이 3가지 중 2개 이상 해당된다면 미루지 말고 꼭 점검해 보세요!', body: '[0~3초 후킹] "손가락 접어보세요! 2개 이상이면 오늘 꼭 체크!"\n[4~22초 본론] 자가 체크리스트 3항목 + 주의사항\n[23~30초 CTA] "프로필 링크에서 무료 자가진단표 확인하세요!"', tags: '#자가진단 #건강체크 #숏폼 #{name}' },
      { ch: '네이버 블로그', title: '[{name}] 실제 상담 사례로 보는 맞춤형 진료 설계 이야기', hook: '비슷한 고민을 안고 내원하신 분들의 상담 과정과 관리 포인트를 객관적으로 정리했습니다.', body: '1) 주요 고민 유형별 상담 포인트\n2) 개인별 맞춤 계획 수립 절차\n3) 자주 묻는 비용·일정 Q&A (※ 개인차가 있을 수 있습니다.)', tags: '#진료상담 #맞춤케어 #{name} #병원정보' },
      { ch: '네이버 블로그', title: '[{name}] 이번 달 핵심 건강 관리 & 무료 사전 상담 안내', hook: '계절 변화에 맞춰 꼭 챙겨야 할 건강 습관과 간편 상담 신청 방법을 안내합니다.', body: '1) 이달의 건강 관리 체크포인트\n2) 원장님 추천 생활 습관 3가지\n3) 카카오 채널 · 전화 간편 상담 안내', tags: '#이달의건강 #무료상담 #{name} #브랜드블로그' },
    ],
    '보험설계사': [
      { ch: '네이버 블로그', title: '[{name}] 매달 나가는 보험료, 새는 구멍 찾는 3분 보장점검 가이드', hook: '중복 특약과 갱신형 폭탄만 점검해도 가족 보험료 구조를 훨씬 건강하게 바꿀 수 있습니다.', body: '1) 보험 증권에서 가장 먼저 볼 3가지\n2) 중복 가입이 흔한 특약 체크리스트\n3) 무료 보장분석 리포트 신청 안내 (※ 상품·약관에 따라 보장 범위는 상이할 수 있습니다.)', tags: '#보장분석 #보험리모델링 #{name} #보험꿀팁' },
      { ch: '인스타 릴스', title: '3초 후킹 릴스 ① — 매달 보험료 10만 원 넘게 새고 있는 분들의 공통점', hook: '내 보험 증권에 이 단어 하나 들어가 있으면 5년 뒤 보험료가 확 뛸 수 있습니다!', body: '[0~3초 후킹] "보험 증권 지금 꺼내보세요! 이 글자 있으면 주의!"\n[4~20초 본론] 갱신형 vs 비갱신형 핵심 차이 15초 요약\n[21~30초 CTA] "댓글에 ‘점검’ 남기시면 무료 체크표 DM 발송!"', tags: '#보험릴스 #보험료절약 #보장점검 #{name}' },
      { ch: '네이버 블로그', title: '[{name}] 실손보험 청구할 때 놓치기 쉬운 서류와 청구 절차 총정리', hook: '병원 다녀와서 서류 챙기기 막막하셨죠? 3분 만에 끝내는 실손 청구 체크리스트입니다.', body: '1) 통원·입원별 필수 발급 서류\n2) 3년 이내 미청구 보험금 확인법\n3) 1:1 청구 도우미 무료 상담 안내', tags: '#실손보험청구 #보험금청구 #{name} #재무주치의' },
      { ch: '인스타 릴스', title: '3초 팩트체크 릴스 ② — 암·뇌·심장 진단비, 이 범위 안 보면 반쪽짜리!', hook: '암보험 들었다고 안심하셨나요? 약관 속 ‘이 범위’를 꼭 확인해야 합니다!', body: '[0~3초 후킹] "진단비 5천만 원인데 왜 못 받았을까요?"\n[4~22초 본론] 유사암·허혈성·뇌혈관 범위 확인 포인트 3가지\n[23~30초 CTA] "프로필 링크 1분 무료 보장점검 신청하세요!"', tags: '#암보험 #진단비 #보험상식 #{name}' },
      { ch: '네이버 블로그', title: '[{name}] 연령대별(30대·40대·50대) 꼭 챙겨야 할 핵심 보장 우선순위', hook: '무작정 비싼 보험이 좋은 게 아닙니다. 내 나이와 가족 상황에 맞는 우선순위가 핵심입니다.', body: '1) 30대 사회초년생·신혼 필수 구성\n2) 40대 가장·자녀 가정 리밸런싱\n3) 50대 노후·간병 대비 체크포인트', tags: '#연령별보험 #가족보험 #{name} #보험설계' },
      { ch: '인스타 릴스', title: '3초 공감형 릴스 ③ — 지인 추천으로 가입한 보험, 점검받으면 벌어지는 일', hook: '거절 못 해서 가입한 보험, 눈치 보지 않고 객관적 비교표로만 딱 확인해 드립니다!', body: '[0~3초 후킹] "지인 보험 해지할까 말까 고민 중이라면?"\n[4~20초 본론] 유지해야 할 꿀특약 vs 정리할 중복특약 구분법\n[21~30초 CTA] "강요 없는 카톡 비교표는 프로필 링크로!"', tags: '#지인보험 #보험비교 #설계사브랜딩 #{name}' },
      { ch: '네이버 블로그', title: '[{name}] 운전자보험 핵심 3대 특약과 변경된 법규 체크포인트', hook: '스쿨존·중대과실 사고 시 자동차보험만으로는 부족한 형사적 책임 대비 가이드.', body: '1) 교통사고처리지원금·변호사선임비용·벌금 확인\n2) 기존 운전자보험 업그레이드 필요 여부\n3) 무료 증권 점검 신청 안내', tags: '#운전자보험 #자동차보험 #{name} #보험정보' },
      { ch: '인스타 릴스', title: '3초 체크 릴스 ④ — 우리 가족 숨은 보험금 찾는 30초 방법', hook: '몰라서 못 챙긴 보험금, 지금 스마트폰으로 30초 만에 조회할 수 있습니다!', body: '[0~3초 후킹] "아직도 모르고 지나친 보험금 있으실 수 있어요!"\n[4~22초 본론] 내보험찾아줌 + 실손 미청구 확인 스텝\n[23~30초 CTA] "저장해 두고 주말에 꼭 조회해 보세요!"', tags: '#숨은보험금 #보험꿀팁 #릴스 #{name}' },
      { ch: '네이버 블로그', title: '[{name}] 자영업자·개인사업자를 위한 절세와 리스크 대비 플랜', hook: '사업장 배상책임부터 대표님 개인 보장까지, 사장님이 꼭 알아야 할 안전장치 정리.', body: '1) 사업자 필수 리스크 점검\n2) 비용 처리 및 노후 준비 전략\n3) 대표님 맞춤 1:1 무료 컨설팅 예약', tags: '#사업자보험 #대표님보장 #{name} #재무설계' },
      { ch: '네이버 블로그', title: '[{name}] 실제 보장분석 상담 후기 & 강요 없는 객관적 리포트 원칙', hook: '영업이 아니라 ‘분석’을 드립니다. 고객님이 직접 비교하고 결정하는 상담 프로세스.', body: '1) 3문항 간편 신청 → 증권 분석 → 1페이지 요약 리포트\n2) 유지 권장이 더 많은 이유\n3) 카카오 채널 무료 점검 신청', tags: '#보장분석후기 #신뢰설계사 #{name} #보험상담' },
    ],
    '정책자금': [
      { ch: '네이버 블로그', title: '[{name}] 올해 소상공인·중소기업 정책자금 자격 조건 및 신청 일정 총정리', hook: '자금이 필요할 때 서류부터 막히셨나요? 대표님이 꼭 챙겨야 할 정책자금 핵심 조건을 정리했습니다.', body: '1) 운전자금 vs 시설자금 핵심 차이\n2) 업력·매출·신용점수 기본 기준\n3) 1분 무료 한도진단 폼 안내 (※ 기업별 심사 결과는 상이할 수 있습니다.)', tags: '#정책자금 #소상공인정책자금 #{name} #운전자금' },
      { ch: '인스타 릴스', title: '3초 경고형 릴스 ① — 정책자금 서류 탈락하는 대표님 90%의 공통 실수', hook: '조건은 다 되는데 딱 이 서류 한 줄 때문에 부결되는 대표님들이 정말 많습니다!', body: '[0~3초 후킹] "정책자금 탈락하는 대표님 90%가 놓치는 딱 1가지!"\n[4~20초 본론] 재무제표·국세완납·사업계획서 핵심 보완 포인트\n[21~30초 CTA] "프로필 링크에서 1분 무료 자가진단 받아보세요!"', tags: '#정책자금릴스 #사업자대출 #대표님필독 #{name}' },
      { ch: '네이버 블로그', title: '[{name}] 신용보증기금 · 기술보증기금 보증서 발급 전 필수 준비사항', hook: '한도를 높이고 심사 기간을 단축하는 사전 점검 포인트를 실무 기준으로 정리합니다.', body: '1) 신보·기보 대상 기업 구분\n2) 가점 요소(특허·인증·고용) 활용 전략\n3) 무료 사전 한도 진단 신청', tags: '#신용보증기금 #기술보증기금 #{name} #기업자금' },
      { ch: '인스타 릴스', title: '3초 속보형 릴스 ② — 예산 소진 전 대표님이 지금 확인해야 할 자금 3종', hook: '정책자금은 선착순 예산 소진입니다! 이번 분기 대표님 업종에 맞는 자금 3가지!', body: '[0~3초 후킹] "예산 끝나고 후회하지 마세요! 지금 열린 자금 3가지"\n[4~22초 본론] 창업·성장·소공인별 핵심 지원 체크\n[23~30초 CTA] "댓글에 ‘한도’ 남기시면 체크리스트 보내드립니다!"', tags: '#정부지원금 #소상공인자금 #릴스속보 #{name}' },
      { ch: '네이버 블로그', title: '[{name}] 창업 1년 미만 초기 사업자도 도전할 수 있는 정책자금 가이드', hook: '매출 실적이 아직 적어 고민이신 초기 대표님을 위한 단계별 자금 조달 로드맵.', body: '1) 초기 창업자 전용 자금 종류\n2) 사업계획서 설득력 높이는 구성법\n3) 1:1 무료 자격 점검 신청', tags: '#창업자금 #초기사업자 #{name} #정책자금컨설팅' },
      { ch: '인스타 릴스', title: '3초 팩트체크 릴스 ③ — 시중 은행 대출 vs 정책자금, 이자 차이 계산해 봤습니다', hook: '같은 1억 원이라도 어디서 조달하느냐에 따라 연간 이자가 수백만 원 달라집니다!', body: '[0~3초 후킹] "사업자금 이자, 아직도 고금리로 내고 계세요?"\n[4~20초 본론] 금리·거치기간·상환조건 비교 요약\n[21~30초 CTA] "프로필 링크에서 우리 회사 가능 한도 1분 조회!"', tags: '#저금리자금 #경영안정자금 #대표님꿀팁 #{name}' },
      { ch: '네이버 블로그', title: '[{name}] 정책자금 부결 후 3개월 만에 재도전 성공하는 보완 체크리스트', hook: '한 번 부결되었다고 끝이 아닙니다. 원인 분석과 재무·인증 보완으로 흐름을 바꾸는 법.', body: '1) 대표적 부결 사유 4가지 진단\n2) 단기 보완 가능한 체크항목\n3) 전문가 1:1 재도전 진단 신청', tags: '#정책자금재도전 #부결원인 #{name} #기업컨설팅' },
      { ch: '인스타 릴스', title: '3초 체크 릴스 ④ — 기업 인증(벤처·이노비즈) 있으면 한도가 달라지는 이유', hook: '대표님 회사에 인증 하나만 추가해도 심사 평가 점수가 확 올라갑니다!', body: '[0~3초 후킹] "남들보다 정책자금 한도 2배 잘 나오는 회사들의 비밀"\n[4~22초 본론] 기업부설연구소·벤처·메인비즈 실무 혜택\n[23~30초 CTA] "우리 회사 인증 가능 여부, 댓글에 ‘인증’ 남겨주세요!"', tags: '#기업인증 #벤처인증 #정책자금 #{name}' },
      { ch: '네이버 블로그', title: '[{name}] 법인사업자 vs 개인사업자, 자금 조달 시 유리한 전략 비교', hook: '매출 성장 구간에서 법인 전환과 정책자금 연계 타이밍을 어떻게 잡아야 할지 정리합니다.', body: '1) 개인·법인별 심사 포인트 차이\n2) 대표자 신용관리 핵심 팁\n3) 맞춤형 1:1 무료 자금 진단', tags: '#법인자금 #개인사업자자금 #{name} #경영전략' },
      { ch: '네이버 블로그', title: '[{name}] 업종별(제조·유통·서비스) 정책자금 준비 로드맵 & 무료 진단 안내', hook: '우리 업종에 딱 맞는 정책자금 루트, 4문항 간편 진단으로 방향부터 잡아보세요.', body: '1) 제조·유통·서비스업별 핵심 공략 자금\n2) 분기별 자금 캘린더\n3) 1분 무료 한도진단 폼 바로가기', tags: '#업종별정책자금 #무료한도진단 #{name}' },
    ],
    '자영업/소상공인': [
      { ch: '네이버 블로그', title: '[{name}] 동네 단골들이 일부러 찾아오는 시그니처 메뉴·서비스의 비밀', hook: '재료 손질부터 마무리까지, 우리가 매일 아침 고집하는 원칙을 솔직하게 담았습니다.', body: '1) 시그니처 메뉴/서비스 탄생 스토리\n2) 첫 방문 추천 베스트 조합\n3) 네이버 플레이스 예약·알림받기 쿠폰 안내', tags: '#{name} #동네맛집 #단골추천 #로컬브랜드' },
      { ch: '인스타 릴스', title: '3초 시선강탈 릴스 ① — 오픈 전 1시간, 사장님이 직접 준비하는 리얼 현장', hook: '왜 오픈하자마자 웨이팅이 생길까요? 30초 만에 비밀을 보여드립니다!', body: '[0~3초 후킹] "이 동네 사람들이 줄 서서 찾는 진짜 이유!"\n[4~20초 본론] 클로즈업 비주얼 + 사장님 정성 포인트 3컷\n[21~30초 CTA] "오늘 방문 시 ‘릴스 보고 왔어요’ 말씀하시면 서비스 증정!"', tags: '#릴스맛집 #매장브이로그 #로컬릴스 #{name}' },
      { ch: '네이버 블로그', title: '[{name}] 처음 방문하시는 분들을 위한 200% 즐기는 이용 꿀팁 & 주차 안내', hook: '방문 전 가장 많이 물어보시는 주차, 웨이팅 적은 시간, 추천 코스를 한 번에 정리했습니다.', body: '1) 여유롭게 이용하는 추천 시간대\n2) 주차·대중교통 오시는 길\n3) 네이버 알림받기 즉시 할인 쿠폰', tags: '#방문꿀팁 #주차가능 #{name} #네이버플레이스' },
      { ch: '인스타 릴스', title: '3초 비포애프터 릴스 ② — 단 10초 만에 달라지는 압도적 비주얼 컷', hook: '끝까지 보세요! 마지막 3초 완성 컷 보면 오늘 당장 오고 싶어지실 겁니다!', body: '[0~3초 후킹] "이거 실제로 보면 진짜 감탄 나옵니다!"\n[4~22초 본론] 과정 → 완성 하이라이트 컷 전환\n[23~30초 CTA] "같이 가고 싶은 친구 태그하고 저장하세요!"', tags: '#비포애프터 #시선강탈 #숏폼마케팅 #{name}' },
      { ch: '네이버 블로그', title: '[{name}] 고객님 실제 후기 BEST 5로 보는 우리가 사랑받는 이유', hook: '직접 다녀가신 손님들이 남겨주신 소중한 리뷰와 감사 인사를 모았습니다.', body: '1) 재방문 고객님들이 꼽은 장점 TOP3\n2) 리뷰 이벤트 및 단골 혜택 안내\n3) 카카오 채널 소식 받기', tags: '#실제후기 #재방문맛집 #{name} #고객리뷰' },
      { ch: '인스타 릴스', title: '3초 Q&A 릴스 ③ — 손님들이 가장 많이 물어보는 질문 TOP3 즉답!', hook: '디엠으로 하루에도 수십 번 물어보시는 그 질문, 사장님이 직접 답해드립니다!', body: '[0~3초 후킹] "제일 많이 물어보시는 3가지, 딱 20초 정리!"\n[4~20초 본론] 예약/포장/추천메뉴 빠른 답변\n[21~30초 CTA] "더 궁금한 점은 댓글로 남겨주세요!"', tags: '#사장님답변 #매장Q&A #동네핫플 #{name}' },
      { ch: '네이버 블로그', title: '[{name}] 이번 주말 가족·연인과 함께하기 좋은 추천 코스 & 예약 가이드', hook: '주말 나들이 동선에 딱 맞는 방문 코스와 사전 예약 혜택을 알려드립니다.', body: '1) 주말 방문 추천 타임\n2) 가족·모임 맞춤 추천 구성\n3) 네이버 예약 10초 완료 방법', tags: '#주말가볼만한곳 #가족모임 #{name}' },
      { ch: '인스타 릴스', title: '3초 혜택 릴스 ④ — 이번 달 한정 알림받기·방문 고객 특별 이벤트!', hook: '이번 달에 방문 예정이시라면 이 혜택 안 챙기면 진짜 손해입니다!', body: '[0~3초 후킹] "잠깐! 이번 달 오실 분들은 이거 꼭 챙기세요!"\n[4~22초 본론] 이벤트 혜택 & 참여 방법 3단계\n[23~30초 CTA] "프로필 링크에서 쿠폰 바로 다운받으세요!"', tags: '#매장이벤트 #방문혜택 #릴스쿠폰 #{name}' },
      { ch: '네이버 블로그', title: '[{name}] 사장님이 직접 전하는 매장 운영 철학과 앞으로의 약속', hook: '반짝 유행이 아니라 오래 기억되는 동네 1등 매장이 되기 위한 우리의 기준.', body: '1) 절대 타협하지 않는 품질 원칙\n2) 고객 피드백 반영 개선 스토리\n3) 단골 감사 인사 및 오시는 길', tags: '#사장님스토리 #브랜드철학 #{name}' },
      { ch: '네이버 블로그', title: '[{name}] 이달의 신메뉴/시즌 한정 프로모션 총정리', hook: '이번 시즌에만 만나볼 수 있는 특별한 구성과 사전 예약 혜택을 공개합니다.', body: '1) 시즌 한정 포인트 소개\n2) 함께 즐기면 좋은 베스트 조합\n3) 간편 예약 및 문의 안내', tags: '#시즌한정 #신메뉴 #{name} #동네추천' },
    ],
  };

  function getBlueprint(industry) {
    return FACTORY_BLUEPRINTS[industry] || FACTORY_BLUEPRINTS['자영업/소상공인'];
  }

  function addDays(ymd, days) {
    var parts = String(ymd || A.todayKst()).split('-');
    var dt = new Date(parseInt(parts[0], 10) || 2026, (parseInt(parts[1], 10) || 1) - 1, parseInt(parts[2], 10) || 1);
    dt.setDate(dt.getDate() + days);
    var y = dt.getFullYear();
    var m = String(dt.getMonth() + 1).padStart(2, '0');
    var d = String(dt.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  var nowParts = A.todayKst().split('-');
  var st = {
    subTab: 'calendar', // 'calendar' | 'factory'
    year: parseInt(nowParts[0], 10) || 2026,
    month: parseInt(nowParts[1], 10) || 11,
    filterClientId: '',
    filterChannel: '',
    items: [],
    selectedId: null,
    loading: false,
    // 공장(Phase A-3) 상태
    factoryClientId: '',
    factoryIndustry: '병원',
    factoryTopic: '',
    factoryStartDate: A.todayKst(),
    drafts: [],
    savingBulk: false,
  };

  function statusMeta(status) {
    if (status === '예약확정' || status === '승인완료') return { cls: 'ok', badge: '✅📅 VIP승인·예약확정', color: '#16a34a' };
    if (status === '발행완료') return { cls: 'ok', badge: '🚀 발행완료', color: '#0284c7' };
    if (status === '수정요청') return { cls: 'bad', badge: '✏️ 수정요청', color: '#dc2626' };
    return { cls: 'warn', badge: '⏳ VIP검수대기', color: '#d97706' };
  }

  function clientNameById(cid) {
    var c = (A.store.clients || []).find(function (x) { return String(x.id) === String(cid); });
    return c ? c.name : ('고객사 #' + cid);
  }

  function updateBadge() {
    var b = document.getElementById('tabBadgeContent');
    if (b) b.textContent = String(st.items.length);
  }

  function loadDeliverables() {
    st.loading = true;
    return A.api('/api/deliverables').then(function (r) {
      st.items = (r && r.deliverables) || [];
      updateBadge();
    }).catch(function () {
      st.items = [];
    }).finally(function () {
      st.loading = false;
      if (A.store.activeTab === 'content') render();
    });
  }

  function generate10Drafts() {
    var c = (A.store.clients || []).find(function (x) { return String(x.id) === String(st.factoryClientId); });
    var name = c ? c.name : '우리 고객사';
    var ind = c ? (c.industry || st.factoryIndustry) : st.factoryIndustry;
    var topic = st.factoryTopic.trim();
    var bp = getBlueprint(ind);
    var offsets = [0, 2, 4, 7, 9, 11, 14, 16, 18, 21]; // 월/수/금 리듬 자동 분산

    st.drafts = bp.map(function (tpl, idx) {
      var title = tpl.title.replace(/\{name\}/g, name) + (topic && idx < 4 ? ' (' + topic + ')' : '');
      var preview =
        '🎯 [3초 후킹 / 도입]\n' + tpl.hook +
        (topic ? '\n🔥 [이번 달 핵심 포인트] ' + topic : '') +
        '\n\n📝 [본문 · 대본 구성]\n' + tpl.body +
        '\n\n🏷️ [추천 해시태그]\n' + tpl.tags.replace(/\{name\}/g, name.replace(/\s+/g, ''));
      var comp = checkCompliance(title + '\n' + preview);
      return {
        idx: idx + 1,
        client_id: c ? c.id : 0,
        channel: tpl.ch,
        title: title,
        hook: tpl.hook,
        preview_text: preview,
        scheduled_date: addDays(st.factoryStartDate || A.todayKst(), offsets[idx] || idx * 2),
        compliance: comp,
      };
    });
    A.toast('🏭 ' + name + ' (' + ind + ') 맞춤 블로그 6편 + 릴스 4편 = 총 10편 생성 완료!');
    render();
  }

  function renderCalendar(root) {
    var clients = A.store.clients || [];
    var filtered = st.items.filter(function (it) {
      if (st.filterClientId && String(it.client_id) !== String(st.filterClientId)) return false;
      if (st.filterChannel && it.channel !== st.filterChannel) return false;
      return true;
    });

    var cntWait = filtered.filter(function (x) { return x.status === '검수대기'; }).length;
    var cntBooked = filtered.filter(function (x) { return x.status === '예약확정' || x.status === '승인완료'; }).length;
    var cntDone = filtered.filter(function (x) { return x.status === '발행완료'; }).length;
    var cntFix = filtered.filter(function (x) { return x.status === '수정요청'; }).length;

    // 달력 셀 생성
    var firstDay = new Date(st.year, st.month - 1, 1);
    var startDow = firstDay.getDay();
    var daysInMonth = new Date(st.year, st.month, 0).getDate();
    var ymPrefix = st.year + '-' + String(st.month).padStart(2, '0') + '-';
    var byDate = {};
    filtered.forEach(function (it) {
      var d = String(it.scheduled_date || '').slice(0, 10);
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(it);
    });

    var cells = [];
    for (var i = 0; i < startDow; i++) cells.push('<div style="min-height:94px;background:rgba(15,23,42,0.03);border-radius:10px;border:1px dashed var(--line)"></div>');
    var todayStr = A.todayKst();
    for (var day = 1; day <= daysInMonth; day++) {
      var ymd = ymPrefix + String(day).padStart(2, '0');
      var list = byDate[ymd] || [];
      var isToday = ymd === todayStr;
      cells.push(
        '<div style="min-height:94px;background:' + (isToday ? 'rgba(14,165,233,0.09)' : 'rgba(255,255,255,0.04)') + ';border:1px solid ' + (isToday ? '#0284c7' : 'var(--line)') + ';border-radius:10px;padding:6px;display:flex;flex-direction:column;gap:4px">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px;font-weight:800;color:' + (isToday ? '#0284c7' : 'var(--ink)') + '">' +
            '<span>' + day + '일</span>' +
            (list.length ? '<span style="font-size:10px;opacity:.7">' + list.length + '건</span>' : '') +
          '</div>' +
          list.slice(0, 3).map(function (it) {
            var sm = statusMeta(it.status);
            var chIcon = it.channel.indexOf('릴스') !== -1 ? '🎬' : (it.channel.indexOf('스레드') !== -1 ? '🧵' : '📝');
            var active = String(st.selectedId) === String(it.id);
            return '<button type="button" data-cal-pick="' + it.id + '" style="text-align:left;border:1px solid ' + (active ? '#0284c7' : 'rgba(148,163,184,0.28)') + ';background:' + (active ? 'rgba(14,165,233,0.18)' : 'rgba(15,23,42,0.04)') + ';border-left:3px solid ' + sm.color + ';border-radius:6px;padding:3px 5px;cursor:pointer;font-size:10.5px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ink)" title="' + A.esc('[' + clientNameById(it.client_id) + '] ' + it.title) + '">' +
              chIcon + ' ' + A.esc(it.title) +
            '</button>';
          }).join('') +
          (list.length > 3 ? '<div style="font-size:10px;color:var(--muted);text-align:right">+' + (list.length - 3) + '건 더보기</div>' : '') +
        '</div>'
      );
    }

    var sel = filtered.find(function (x) { return String(x.id) === String(st.selectedId); }) || filtered[0] || null;
    if (sel) st.selectedId = sel.id;
    var comp = sel ? checkCompliance(sel.title + '\n' + sel.preview_text) : null;

    return '' +
      '<div class="ws-grid-4" style="margin-bottom:12px">' +
        '<div class="kpi-card"><div class="k-lbl">전체 등록 콘텐츠</div><div class="k-val">' + filtered.length + '건</div><div class="k-sub">VIP 포털 실시간 연동</div></div>' +
        '<div class="kpi-card"><div class="k-lbl">✅ VIP승인 · 자동예약확정</div><div class="k-val" style="color:#16a34a">' + cntBooked + '건</div><div class="k-sub">고객 승인 시 자동 예약 전환</div></div>' +
        '<div class="kpi-card"><div class="k-lbl">⏳ 검수 대기 / ✏️ 수정요청</div><div class="k-val" style="color:#d97706">' + cntWait + ' / ' + cntFix + '</div><div class="k-sub">포털 피드백 실시간 반영</div></div>' +
        '<div class="kpi-card"><div class="k-lbl">🚀 발행 완료</div><div class="k-val" style="color:#0284c7">' + cntDone + '건</div><div class="k-sub">월간 납품 실적 누적</div></div>' +
      '</div>' +

      '<div class="ws-split" style="grid-template-columns:minmax(0,1.35fr) minmax(320px,0.9fr)">' +
        '<div class="ws-card" style="padding:14px">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px">' +
            '<div class="ws-actions">' +
              '<button type="button" class="ws-btn sm" id="calPrev">◀ 이전 달</button>' +
              '<strong style="font-size:15px;padding:0 6px">' + st.year + '년 ' + st.month + '월</strong>' +
              '<button type="button" class="ws-btn sm" id="calNext">다음 달 ▶</button>' +
              '<button type="button" class="ws-btn sm" id="calRefresh">🔄 새로고침</button>' +
            '</div>' +
            '<div class="ws-actions">' +
              '<select id="calFilterClient" style="padding:5px 8px;border-radius:8px;border:1px solid var(--line-strong);font-size:12px">' +
                '<option value="">전체 고객사</option>' +
                clients.map(function (c) { return '<option value="' + c.id + '"' + (String(st.filterClientId) === String(c.id) ? ' selected' : '') + '>' + A.esc(c.name) + '</option>'; }).join('') +
              '</select>' +
              '<select id="calFilterCh" style="padding:5px 8px;border-radius:8px;border:1px solid var(--line-strong);font-size:12px">' +
                '<option value="">전체 채널</option>' +
                ['네이버 블로그', '인스타 릴스', '스레드'].map(function (ch) { return '<option value="' + ch + '"' + (st.filterChannel === ch ? ' selected' : '') + '>' + ch + '</option>'; }).join('') +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;margin-bottom:6px;text-align:center;font-size:11.5px;font-weight:800;color:var(--muted)">' +
            '<span style="color:#ef4444">일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span style="color:#0284c7">토</span>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px">' + cells.join('') + '</div>' +
        '</div>' +

        // 오른쪽: 선택 콘텐츠 상세 검수 · 의료법/금소법 AI 심의 체크 · 원클릭 예약 발행
        '<div class="ws-card" style="padding:14px">' +
          '<h3 style="margin:0 0 10px;font-size:14px">🚀 원클릭 예약 발행 &amp; 🛡️ AI 심의 검수</h3>' +
          (sel ? (
            '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:8px">' +
              '<span class="tag-pill ' + statusMeta(sel.status).cls + '">' + statusMeta(sel.status).badge + '</span>' +
              '<span style="font-size:11.5px;color:var(--muted)">고객사: <b>' + A.esc(clientNameById(sel.client_id)) + '</b></span>' +
            '</div>' +
            '<div class="ws-grid-2">' +
              '<div class="ws-field"><label>발행 채널</label><select id="calEditCh">' +
                ['네이버 블로그', '인스타 릴스', '스레드'].map(function (ch) { return '<option value="' + ch + '"' + (sel.channel === ch ? ' selected' : '') + '>' + ch + '</option>'; }).join('') +
              '</select></div>' +
              '<div class="ws-field"><label>예약 발행일</label><input type="date" id="calEditDate" value="' + A.esc(sel.scheduled_date || '') + '"></div>' +
            '</div>' +
            '<div class="ws-field" style="margin-top:6px"><label>콘텐츠 제목</label><input id="calEditTitle" value="' + A.esc(sel.title) + '"></div>' +
            '<div class="ws-field" style="margin-top:6px"><label>원고 · 릴스 대본 · 해시태그</label><textarea id="calEditBody" style="min-height:140px">' + A.esc(sel.preview_text || '') + '</textarea></div>' +
            (sel.client_feedback ? '<div style="margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.35);font-size:12px">💬 <b>고객 대표님 피드백:</b> ' + A.esc(sel.client_feedback) + '</div>' : '') +

            // 🛡️ 의료법·금소법 심의 스캔 결과
            '<div style="margin-top:10px;padding:10px;border-radius:10px;border:1px solid ' + (comp.safe ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.4)') + ';background:' + (comp.safe ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)') + ';font-size:11.8px">' +
              '<div style="font-weight:800;margin-bottom:4px">🛡️ 의료법 · 금소법 · 표시광고법 자동 심의: ' + comp.label + '</div>' +
              (comp.safe
                ? '<div style="color:var(--muted)">금지어·과장광고 위험 표현이 발견되지 않았습니다. 바로 예약 발행하셔도 안전합니다!</div>'
                : comp.hits.map(function (h) {
                    return '<div style="margin-top:4px;color:#b91c1c">• <b>[' + h.group + ']</b> “' + A.esc(h.word) + '” 탐지 → <span style="color:var(--ink)">' + A.esc(h.tip) + '</span></div>';
                  }).join('')) +
            '</div>' +

            '<div class="ws-actions" style="margin-top:10px">' +
              '<button type="button" class="ws-btn sm primary" id="calSaveEdit">💾 수정 저장</button>' +
              '<button type="button" class="ws-btn sm ok" id="calSetBooked">📅 예약 확정</button>' +
              '<button type="button" class="ws-btn sm accent" id="calSetPublished">🚀 원클릭 발행 완료</button>' +
              '<button type="button" class="ws-btn sm" id="calCopyText">📋 본문 복사</button>' +
              (sel.channel.indexOf('릴스') !== -1 ? '<button type="button" class="ws-btn sm" id="calSendVideo">🎬 영상 편집기로 보내기</button>' : '') +
              '<button type="button" class="ws-btn sm bad" id="calDeleteItem">🗑️ 삭제</button>' +
            '</div>'
          ) : (
            '<div class="ws-empty">아직 캘린더에 등록된 콘텐츠가 없습니다.<br>상단 <b>🏭 AI 10편 일괄 생성 공장</b>에서 한 번에 10편을 만들어 등록해 보세요!</div>'
          )) +
        '</div>' +
      '</div>';
  }

  function renderFactory() {
    var clients = A.store.clients || [];
    if (!st.factoryClientId && clients.length) {
      st.factoryClientId = String(clients[0].id);
      st.factoryIndustry = clients[0].industry || '병원';
    }
    var selC = clients.find(function (c) { return String(c.id) === String(st.factoryClientId); });

    return '' +
      '<div class="ws-card" style="padding:14px;margin-bottom:12px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px">' +
          '<h3 style="margin:0;font-size:15px">🏭 AI 업종별 3초 후킹 릴스 · 블로그 초안 10편 일괄 생성 공장 (Phase A-3)</h3>' +
          '<span class="tag-pill ok">블로그 6편 + 릴스 4편 = 10편 원클릭</span>' +
        '</div>' +
        '<div class="ws-grid-4">' +
          '<div class="ws-field"><label>대상 고객사 (CRM 연동)</label><select id="facClient">' +
            (clients.length
              ? clients.map(function (c) { return '<option value="' + c.id + '"' + (String(st.factoryClientId) === String(c.id) ? ' selected' : '') + '>' + A.esc(c.name) + ' (' + A.esc(c.industry) + ')</option>'; }).join('')
              : '<option value="">고객사 미등록 (예시 생성)</option>') +
          '</select></div>' +
          '<div class="ws-field"><label>업종 템플릿</label><select id="facInd">' +
            ['병원', '보험설계사', '정책자금', '자영업/소상공인'].map(function (ind) { return '<option value="' + ind + '"' + (st.factoryIndustry === ind ? ' selected' : '') + '>' + ind + '</option>'; }).join('') +
          '</select></div>' +
          '<div class="ws-field"><label>이달의 핵심 키워드 · 프로모션</label><input id="facTopic" value="' + A.esc(st.factoryTopic) + '" placeholder="예: 12월 무료 건강검진, 연말 보험료 절감"></div>' +
          '<div class="ws-field"><label>발행 시작일 (월·수·금 자동 분산)</label><input type="date" id="facStart" value="' + A.esc(st.factoryStartDate) + '"></div>' +
        '</div>' +
        '<div class="ws-actions" style="margin-top:10px">' +
          '<button type="button" class="ws-btn primary" id="facGenBtn">⚡ 10편 일괄 생성 (블로그 6 + 릴스 4)</button>' +
          (st.drafts.length ? '<button type="button" class="ws-btn ok" id="facBulkSaveBtn"' + (st.savingBulk ? ' disabled' : '') + '>📅 10편 전체 캘린더 · VIP 포털 검수함에 일괄 등록</button>' : '') +
          (st.drafts.length ? '<button type="button" class="ws-btn accent" id="facAskAiBtn">🏫 일진 종합반 AI에 10편 카피 고도화 요청</button>' : '') +
        '</div>' +
        (selC ? '<div style="margin-top:8px;font-size:11.6px;color:var(--muted)">연동된 CRM 정보: <b>' + A.esc(selC.name) + '</b> · 업종: ' + A.esc(selC.industry) + ' · 이용 서비스: ' + A.esc((selC.services || []).join(', ') || '미지정') + '</div>' : '') +
      '</div>' +

      (st.drafts.length ? (
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:10px">' +
          st.drafts.map(function (d, i) {
            var isReel = d.channel.indexOf('릴스') !== -1;
            return '<div class="ws-card" style="padding:12px;border-left:4px solid ' + (isReel ? '#ec4899' : '#0284c7') + '">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:6px">' +
                '<span class="tag-pill ' + (isReel ? 'warn' : 'ok') + '">#' + d.idx + ' ' + (isReel ? '🎬 ' : '📝 ') + A.esc(d.channel) + '</span>' +
                '<span style="font-size:11px;font-weight:700;color:var(--muted)">📅 ' + A.esc(d.scheduled_date) + ' · ' + d.compliance.label + '</span>' +
              '</div>' +
              '<input data-fd-title="' + i + '" value="' + A.esc(d.title) + '" style="width:100%;font-weight:800;font-size:12.8px;margin-bottom:6px;padding:6px 8px;border-radius:8px;border:1px solid var(--line-strong);background:var(--bg);color:var(--ink)">' +
              '<textarea data-fd-body="' + i + '" style="width:100%;min-height:110px;font-size:11.6px;line-height:1.5;padding:7px 8px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--ink)">' + A.esc(d.preview_text) + '</textarea>' +
              '<div class="ws-actions" style="margin-top:6px">' +
                '<button type="button" class="ws-btn sm" data-fd-copy="' + i + '">📋 복사</button>' +
                (isReel ? '<button type="button" class="ws-btn sm primary" data-fd-video="' + i + '">🎬 영상·AI 스튜디오로 보내기</button>' : '') +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>'
      ) : (
        '<div class="ws-empty">위에서 고객사와 업종을 선택하고 <b>⚡ 10편 일괄 생성</b>을 눌러보세요!<br>생성 즉시 의료법·금소법 심의 검사까지 자동 완료되며, 클릭 한 번으로 월간 캘린더와 고객 VIP 포털 검수함에 10편을 모두 올릴 수 있습니다.</div>'
      ));
  }

  function render() {
    var root = document.getElementById('pane-content');
    if (!root) return;

    root.innerHTML =
      '<div style="padding:14px;overflow-y:auto;height:100%">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">' +
          '<div class="ws-actions">' +
            '<button type="button" class="ws-btn ' + (st.subTab === 'calendar' ? 'primary' : '') + '" data-ch-tab="calendar">📅 월간 콘텐츠 캘린더 · 원클릭 예약 (Phase A-2)</button>' +
            '<button type="button" class="ws-btn ' + (st.subTab === 'factory' ? 'primary' : '') + '" data-ch-tab="factory">🏭 AI 업종별 3초 후킹 10편 공장 (Phase A-3)</button>' +
          '</div>' +
          '<span style="font-size:11.8px;color:var(--muted)">💡 고객 VIP 포털에서 <b>✅ 발행 승인</b> 클릭 시 캘린더에 <b>자동 예약 확정</b>으로 즉시 반영됩니다.</span>' +
        '</div>' +
        (st.subTab === 'calendar' ? renderCalendar(root) : renderFactory()) +
      '</div>';

    bindEvents(root);
  }

  function bindEvents(root) {
    var q = function (s) { return root.querySelector(s); };
    Array.prototype.forEach.call(root.querySelectorAll('[data-ch-tab]'), function (b) {
      b.addEventListener('click', function () {
        st.subTab = b.getAttribute('data-ch-tab');
        render();
      });
    });

    // 캘린더 이벤트
    var prev = q('#calPrev'), next = q('#calNext'), ref = q('#calRefresh');
    if (prev) prev.addEventListener('click', function () { st.month--; if (st.month < 1) { st.month = 12; st.year--; } render(); });
    if (next) next.addEventListener('click', function () { st.month++; if (st.month > 12) { st.month = 1; st.year++; } render(); });
    if (ref) ref.addEventListener('click', function () { loadDeliverables().then(function () { A.toast('🔄 캘린더 최신 상태 동기화 완료'); }); });

    var fc = q('#calFilterClient'), fch = q('#calFilterCh');
    if (fc) fc.addEventListener('change', function () { st.filterClientId = fc.value; render(); });
    if (fch) fch.addEventListener('change', function () { st.filterChannel = fch.value; render(); });

    Array.prototype.forEach.call(root.querySelectorAll('[data-cal-pick]'), function (b) {
      b.addEventListener('click', function () {
        st.selectedId = parseInt(b.getAttribute('data-cal-pick'), 10);
        render();
      });
    });

    function patchSelected(extra) {
      if (!st.selectedId) return;
      var body = Object.assign({
        channel: (q('#calEditCh') && q('#calEditCh').value) || '네이버 블로그',
        scheduled_date: (q('#calEditDate') && q('#calEditDate').value) || '',
        title: (q('#calEditTitle') && q('#calEditTitle').value) || '',
        preview_text: (q('#calEditBody') && q('#calEditBody').value) || '',
      }, extra || {});
      A.api('/api/deliverables/' + st.selectedId, { method: 'PATCH', body: JSON.stringify(body) })
        .then(function () {
          A.toast('✅ 콘텐츠 상태·내용이 저장되었습니다!');
          return loadDeliverables();
        }).catch(function (e) { A.toast('저장 실패: ' + e.message, 'error'); });
    }

    var bSave = q('#calSaveEdit'), bBook = q('#calSetBooked'), bPub = q('#calSetPublished'), bCopy = q('#calCopyText'), bDel = q('#calDeleteItem'), bVid = q('#calSendVideo');
    if (bSave) bSave.addEventListener('click', function () { patchSelected({}); });
    if (bBook) bBook.addEventListener('click', function () { patchSelected({ status: '예약확정' }); });
    if (bPub) bPub.addEventListener('click', function () { patchSelected({ status: '발행완료' }); });
    if (bCopy) bCopy.addEventListener('click', function () {
      var t = (q('#calEditTitle') ? q('#calEditTitle').value : '') + '\n\n' + (q('#calEditBody') ? q('#calEditBody').value : '');
      navigator.clipboard.writeText(t).then(function () { A.toast('📋 제목+본문 복사 완료! 네이버/인스타에 바로 붙여넣으세요.'); });
    });
    if (bVid) bVid.addEventListener('click', function () {
      A.transferToVideo({
        title: q('#calEditTitle') ? q('#calEditTitle').value : '',
        script: q('#calEditBody') ? q('#calEditBody').value : '',
      });
    });
    if (bDel) bDel.addEventListener('click', function () {
      if (!confirm('이 콘텐츠 일정을 삭제할까요?')) return;
      A.api('/api/deliverables/' + st.selectedId, { method: 'DELETE' })
        .then(function () { st.selectedId = null; A.toast('🗑️ 삭제 완료'); return loadDeliverables(); });
    });

    // 10편 공장 이벤트
    var facC = q('#facClient'), facI = q('#facInd'), facT = q('#facTopic'), facS = q('#facStart');
    if (facC) facC.addEventListener('change', function () {
      st.factoryClientId = facC.value;
      var c = (A.store.clients || []).find(function (x) { return String(x.id) === String(facC.value); });
      if (c && c.industry) st.factoryIndustry = c.industry;
      render();
    });
    if (facI) facI.addEventListener('change', function () { st.factoryIndustry = facI.value; });
    if (facT) facT.addEventListener('input', function () { st.factoryTopic = facT.value; });
    if (facS) facS.addEventListener('change', function () { st.factoryStartDate = facS.value; });

    var genBtn = q('#facGenBtn');
    if (genBtn) genBtn.addEventListener('click', generate10Drafts);

    Array.prototype.forEach.call(root.querySelectorAll('[data-fd-title]'), function (inp) {
      inp.addEventListener('input', function () {
        var idx = parseInt(inp.getAttribute('data-fd-title'), 10);
        if (st.drafts[idx]) st.drafts[idx].title = inp.value;
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-fd-body]'), function (ta) {
      ta.addEventListener('input', function () {
        var idx = parseInt(ta.getAttribute('data-fd-body'), 10);
        if (st.drafts[idx]) st.drafts[idx].preview_text = ta.value;
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-fd-copy]'), function (b) {
      b.addEventListener('click', function () {
        var d = st.drafts[parseInt(b.getAttribute('data-fd-copy'), 10)];
        if (!d) return;
        navigator.clipboard.writeText(d.title + '\n\n' + d.preview_text).then(function () { A.toast('📋 #' + d.idx + ' 초안 복사 완료!'); });
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-fd-video]'), function (b) {
      b.addEventListener('click', function () {
        var d = st.drafts[parseInt(b.getAttribute('data-fd-video'), 10)];
        if (!d) return;
        A.transferToVideo({ title: d.title, topHook: d.hook, script: d.preview_text });
      });
    });

    var bulkBtn = q('#facBulkSaveBtn');
    if (bulkBtn) bulkBtn.addEventListener('click', function () {
      var cid = parseInt(st.factoryClientId, 10);
      if (!cid) { A.toast('먼저 📊 고객사·퍼널 대시보드에서 고객사를 1곳 이상 등록해 주세요!', 'error'); return; }
      st.savingBulk = true;
      render();
      var payload = st.drafts.map(function (d) {
        return {
          client_id: cid,
          channel: d.channel,
          title: d.title,
          preview_text: d.preview_text,
          scheduled_date: d.scheduled_date,
          status: '검수대기',
        };
      });
      A.api('/api/deliverables/bulk', { method: 'POST', body: JSON.stringify({ items: payload }) })
        .then(function (r) {
          A.toast('🎉 ' + (r.count || payload.length) + '편을 캘린더 & 고객 VIP 포털 검수함에 일괄 등록했습니다!');
          st.subTab = 'calendar';
          st.filterClientId = String(cid);
          return loadDeliverables();
        }).catch(function (e) {
          A.toast('일괄 등록 실패: ' + e.message, 'error');
        }).finally(function () {
          st.savingBulk = false;
          render();
        });
    });

    var aiBtn = q('#facAskAiBtn');
    if (aiBtn) aiBtn.addEventListener('click', function () {
      var cName = st.factoryClientId ? clientNameById(st.factoryClientId) : '신규 고객사';
      var summary = st.drafts.slice(0, 5).map(function (d) { return d.idx + '. [' + d.channel + '] ' + d.title; }).join('\n');
      A.requestAiAssist(
        '[AI 콘텐츠 10편 공장 카피 고도화 요청]\n' +
        '- 고객사: ' + cName + ' (' + st.factoryIndustry + ')\n' +
        '- 핵심 주제: ' + (st.factoryTopic || '월간 정규 운영') + '\n' +
        '- 초안 일부:\n' + summary + '\n\n' +
        '요청: 홍보부 드럼통·CS 딸랑이·대장 비서실이 합동으로 위 릴스 3초 후킹 카피와 블로그 제목을 훨씬 더 클릭률 높게 업그레이드하고, 의료법/금소법 리스크도 체크해 줘!',
        'general'
      );
    });
  }

  A.on('data-refreshed', function () { loadDeliverables(); });
  A.on('tab-changed', function (t) {
    if (t === 'content') {
      loadDeliverables();
      render();
    }
  });
})();

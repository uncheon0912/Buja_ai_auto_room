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
    '브랜드/기타': [
      { ch: '네이버 블로그', title: '[{name}] 브랜드가 탄생한 진짜 이유와 우리가 고집하는 핵심 기준', hook: '비슷한 제품·서비스가 넘치는 시장에서 {name}만의 확실한 차별점을 스토리로 풀어냅니다.', body: '1) 브랜드가 해결하려는 고객의 핵심 불편함\n2) 타사 대비 확실히 다른 3가지 기준\n3) 대표 상품·서비스 라인업 소개 및 공식 상담 안내', tags: '#{name} #브랜드스토리 #프리미엄브랜딩 #차별화' },
      { ch: '인스타 릴스', title: '3초 후킹 릴스 ① — 똑같은 돈 주고 후회하는 분들의 공통점 3가지', hook: '가격만 보고 고르셨다가 실패한 경험 있으시죠? 실패 없는 선택 기준 3초 정리!', body: '[0~3초 후킹] "아직도 가격표만 보고 고르세요? 딱 3가지만 보세요!"\n[4~20초 본론] 업계 전문가가 알려주는 품질·사후관리·가성비 비교 팩트\n[21~30초 CTA] "프로필 링크에서 무료 비교 가이드 받아가세요!"', tags: '#브랜드릴스 #선택가이드 #릴스마케팅 #{name}' },
      { ch: '네이버 블로그', title: '[{name}] 처음 이용하는 고객을 위한 베스트 추천 조합 & 200% 활용법', hook: '무엇부터 시작해야 할지 고민되신다면, 실제 고객 만족도가 가장 높은 베스트 구성을 확인해 보세요.', body: '1) 목적별·예산별 베스트 추천 옵션\n2) 첫 이용 시 꼭 챙겨야 할 혜택\n3) 1:1 맞춤 상담 및 견적 문의 안내', tags: '#추천가이드 #베스트구성 #{name} #고객맞춤' },
      { ch: '인스타 릴스', title: '3초 비하인드 릴스 ② — 완성품 뒤 숨겨진 {name}의 집요한 디테일', hook: '고객님은 모르셔도 됩니다. 하지만 우리가 끝까지 타협하지 않는 딱 한 가지 디테일!', body: '[0~3초 후킹] "남들은 대충 넘기는 이 공정, 우리는 왜 고집할까요?"\n[4~22초 본론] 제작·검수·세팅 리얼 현장 3컷 클로즈업\n[23~30초 CTA] "저장해 두고 필요할 때 바로 문의 주세요!"', tags: '#브랜드비하인드 #디테일장인 #숏폼 #{name}' },
      { ch: '네이버 블로그', title: '[{name}] 실제 고객 후기와 도입 사례로 보는 Before & After 변화', hook: '백 마디 광고보다 강력한 실제 고객님들의 솔직한 경험과 객관적 변화를 모았습니다.', body: '1) 도입 전 가장 컸던 고민 TOP3\n2) {name}과 함께한 뒤 달라진 핵심 변화\n3) 무료 사전 상담 및 맞춤 제안 신청', tags: '#고객후기 #성공사례 #{name} #신뢰브랜드' },
      { ch: '인스타 릴스', title: '3초 Q&A 릴스 ③ — DM·전화로 제일 많이 물어보시는 질문 TOP3 즉답!', hook: '문의 주시기 전에 가장 궁금해하시는 3가지, 20초 만에 속 시원하게 답해드립니다!', body: '[0~3초 후킹] "하루에도 수십 번 받는 질문 3가지, 딱 정리!"\n[4~20초 본론] 비용·기간·진행 절차 핵심 답변\n[21~30초 CTA] "댓글에 ‘문의’ 남기시면 상세 안내표 DM 발송!"', tags: '#자주묻는질문 #브랜드Q&A #DB퍼널 #{name}' },
      { ch: '네이버 블로그', title: '[{name}] 업계 트렌드 분석 — 올해 고객들이 열광하는 핵심 포인트', hook: '빠르게 변하는 시장 속에서 현명한 소비자와 대표님들이 주목하는 최신 트렌드 리포트.', body: '1) 올해 달라진 핵심 소비 기준\n2) 실패를 줄이는 체크리스트 5가지\n3) {name} 전문가 1:1 무료 진단 안내', tags: '#트렌드리포트 #인사이트 #{name} #전문가칼럼' },
      { ch: '인스타 릴스', title: '3초 혜택 릴스 ④ — 이번 달 한정 신규 고객 특별 프로모션 안내!', hook: '이번 달 진행 예정이시라면 지금 바로 챙기셔야 할 한정 혜택을 공개합니다!', body: '[0~3초 후킹] "잠깐! 이번 달 문의하시는 분들만 받는 특별 혜택!"\n[4~22초 본론] 한정 혜택 구성 & 1분 신청 절차\n[23~30초 CTA] "프로필 링크에서 지금 바로 신청하세요!"', tags: '#이달의혜택 #프로모션 #릴스광고 #{name}' },
      { ch: '네이버 블로그', title: '[{name}] 자주 묻는 질문(FAQ) 총정리 — 계약·진행·사후관리 완벽 가이드', hook: '진행 전 망설여지는 모든 궁금증을 투명하고 알기 쉽게 한 번에 정리해 드립니다.', body: '1) 상담부터 완료까지 전체 프로세스\n2) 비용·일정·수정 정책 안내\n3) 카카오 채널·전화 빠른 문의 연결', tags: '#FAQ #진행절차 #{name} #친절안내' },
      { ch: '네이버 블로그', title: '[{name}] 다음 달 시즌 전략 & VIP 고객 전용 우선 예약 안내', hook: '성수기·마감 전 미리 준비하시는 분들을 위한 우선 예약 및 맞춤 컨설팅 안내입니다.', body: '1) 미리 준비하면 유리한 이유\n2) 맞춤형 패키지 구성 안내\n3) 간편 무료 상담 신청 링크', tags: '#우선예약 #맞춤컨설팅 #{name} #브랜드블로그' },
    ],
  };

  function getBlueprint(industry) {
    return FACTORY_BLUEPRINTS[industry] || FACTORY_BLUEPRINTS['브랜드/기타'];
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
    modalDate: null,
    modalAdding: false,
    addMode: false,
    newDate: A.todayKst(),
    newClientId: '',
    newChannel: '네이버 블로그',
    newTitle: '',
    newBody: '',
    loading: false,
    // 공장(Phase A-3) 상태
    factoryClientId: '',
    factoryIndustry: '병원',
    factoryTopic: '',
    factoryStartDate: A.todayKst(),
    drafts: [],
    savingBulk: false,
  };

  var CHANNELS = [
    { id: '네이버 블로그', icon: '🟢', color: '#4ade80', bg: 'rgba(74,222,128,0.16)', border: '#22c55e', text: '#bbf7d0' },
    { id: '인스타 릴스', icon: '🟣', color: '#c084fc', bg: 'rgba(192,132,252,0.18)', border: '#a855f7', text: '#e9d5ff' },
    { id: '유튜브', icon: '🔴', color: '#f87171', bg: 'rgba(248,113,113,0.18)', border: '#ef4444', text: '#fecaca' },
    { id: '컨설팅', icon: '🟡', color: '#facc15', bg: 'rgba(250,204,21,0.18)', border: '#eab308', text: '#fef08a' },
    { id: '스레드', icon: '🧵', color: '#38bdf8', bg: 'rgba(15,23,42,0.22)', border: 'rgba(148,163,184,0.38)', text: '#e2e8f0' },
    { id: '기타', icon: '⚪', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', border: '#64748b', text: '#cbd5e1' },
  ];

  function channelStyle(ch) {
    var name = String(ch || '');
    for (var i = 0; i < CHANNELS.length; i++) {
      if (CHANNELS[i].id === name) return CHANNELS[i];
    }
    if (name.indexOf('블로그') !== -1) return CHANNELS[0];
    if (name.indexOf('릴스') !== -1) return CHANNELS[1];
    if (name.indexOf('유튜브') !== -1) return CHANNELS[2];
    if (name.indexOf('컨설팅') !== -1) return CHANNELS[3];
    if (name.indexOf('스레드') !== -1) return CHANNELS[4];
    return CHANNELS[5];
  }

  function statusMeta(status) {
    if (status === '예약확정' || status === '승인완료') return { cls: 'ok', badge: '✅ 검수완료·예약확정', short: '✅', color: '#10b981', cardBg: 'rgba(16,185,129,0.22)', cardBorder: '#10b981', textColor: '#a7f3d0', done: false };
    if (status === '발행완료') return { cls: 'ok', badge: '🏁 발행 완료', short: '🏁', color: '#06b6d4', cardBg: 'rgba(6,182,212,0.16)', cardBorder: '#06b6d4', textColor: '#a5f3fc', done: true };
    if (status === '수정요청') return { cls: 'bad', badge: '✏️ 수정요청', short: '✏️', color: '#f97316', cardBg: 'rgba(249,115,22,0.22)', cardBorder: '#f97316', textColor: '#fed7aa', done: false };
    return { cls: 'warn', badge: '⏳ VIP검수대기', short: '', color: '#d97706', cardBg: '', cardBorder: '', textColor: '', done: false };
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
        '<div data-cal-daybox="' + ymd + '" style="min-height:94px;background:' + (isToday ? 'rgba(14,165,233,0.1)' : 'rgba(255,255,255,0.03)') + ';border:1px solid ' + (isToday ? '#38bdf8' : 'var(--line)') + ';border-radius:10px;padding:6px;display:flex;flex-direction:column;gap:4px;cursor:pointer" title="클릭하면 ' + ymd + ' 상세 스케줄 팝업이 크게 열립니다">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px;font-weight:800;color:' + (isToday ? '#38bdf8' : 'var(--ink)') + '">' +
        '<button type="button" data-cal-open-day="' + ymd + '" style="border:0;background:transparent;padding:0;color:inherit;font:inherit;cursor:pointer;display:flex;align-items:center;gap:3px" title="날짜 크게 보기 팝업">' + day + '일' + (list.length ? ' <small style="opacity:.75;color:#7dd3fc">(' + list.length + '건 🔎)</small>' : '') + '</button>' +
        '<button type="button" data-cal-add-date="' + ymd + '" title="' + ymd + '에 새 콘텐츠 바로 등록" style="border:1px solid rgba(56,189,248,0.4);background:rgba(14,165,233,0.14);color:#7dd3fc;border-radius:6px;width:20px;height:20px;line-height:1;font-size:13px;font-weight:900;cursor:pointer;padding:0">＋</button>' +
        '</div>' +
        list.slice(0, 4).map(function (it) {
          var sm = statusMeta(it.status);
          var cs = channelStyle(it.channel);
          var active = !st.addMode && String(st.selectedId) === String(it.id);
          // 검수완료/발행완료/수정요청은 직관적 상태 색상, 일반 대기 일정은 채널 고유 색상으로 표시!
          var bgCol = sm.cardBg || cs.bg;
          var bdCol = active ? '#ffffff' : (sm.cardBorder || cs.border);
          var txtCol = sm.textColor || cs.text;
          var leftStripe = cs.color;
          var strike = sm.done ? 'text-decoration:line-through;opacity:.85;' : '';
          return '<div style="display:flex;align-items:center;gap:2px;border:1px solid ' + bdCol + ';background:' + bgCol + ';border-left:4px solid ' + leftStripe + ';border-radius:6px;padding:2px 3px 2px 5px;' + (active ? 'box-shadow:0 0 0 1px #38bdf8;' : '') + '">' +
            '<button type="button" data-cal-pick="' + it.id + '" style="flex:1;min-width:0;text-align:left;border:0;background:transparent;padding:1px 2px;cursor:pointer;font-size:10.5px;font-weight:700;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:' + txtCol + ';' + strike + '" title="' + A.esc('[' + clientNameById(it.client_id) + ' · ' + it.channel + ' · ' + it.status + '] ' + it.title) + '">' +
            (sm.short ? sm.short + ' ' : cs.icon + ' ') + A.esc(it.title) +
            '</button>' +
            '<button type="button" data-cal-quickdel="' + it.id + '" title="이 일정 바로 삭제" style="border:0;background:transparent;color:rgba(255,255,255,0.55);cursor:pointer;font-size:11px;font-weight:900;padding:0 3px;line-height:1;flex-shrink:0">×</button>' +
            '</div>';
        }).join('') +
        (list.length > 4 ? '<div style="font-size:10px;color:var(--muted);text-align:right">+' + (list.length - 4) + '건 더보기</div>' : '') +
        '</div>'
      );
    }

    var sel = !st.addMode ? (filtered.find(function (x) { return String(x.id) === String(st.selectedId); }) || filtered[0] || null) : null;
    if (sel) st.selectedId = sel.id;
    if (!sel && !filtered.length) st.addMode = true;
    if (!st.newClientId && clients.length) st.newClientId = String(clients[0].id);
    var comp = sel ? checkCompliance(sel.title + '\n' + sel.preview_text) : null;
    var selectedFilterClient = st.filterClientId ? clients.find(function (c) { return String(c.id) === String(st.filterClientId); }) : null;

    return '' +
      // 직관적인 1줄 4카드 요약 KPI
      '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:10px">' +
      '<div class="kpi-card"><div class="k-lbl">전체 등록 콘텐츠</div><div class="k-val">' + filtered.length + '건</div><div class="k-sub">VIP 포털 실시간 연동</div></div>' +
      '<div class="kpi-card"><div class="k-lbl">✅ 검수완료 · 예약확정</div><div class="k-val" style="color:#10b981">' + cntBooked + '건</div><div class="k-sub">민트색 완료 강조 표시</div></div>' +
      '<div class="kpi-card"><div class="k-lbl">⏳ 검수 대기 / ✏️ 수정요청</div><div class="k-val" style="color:#fbbf24">' + cntWait + ' / ' + cntFix + '</div><div class="k-sub">포털 피드백 실시간 반영</div></div>' +
      '<div class="kpi-card"><div class="k-lbl">🏁 발행 완료</div><div class="k-val" style="color:#06b6d4">' + cntDone + '건</div><div class="k-sub">청록 완료 표시 누적</div></div>' +
      '</div>' +

      // 직관적 채널·상태 색상 범례 & 쉬운 사용법 주석
      '<div style="background:rgba(14,165,233,0.1);border:1px solid rgba(56,189,248,0.32);border-radius:12px;padding:9px 14px;margin-bottom:12px;font-size:11.8px;line-height:1.6;color:var(--ink)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<span>💡 <b>등록법:</b> 달력 날짜의 <b style="color:#38bdf8">[＋]</b>로 1건씩 바로 추가하거나 <b>[🏭 AI 10편 공장]</b>에서 일괄 등록 · 일정 우측 <b>[×]</b>로 즉시 삭제!</span>' +
      '<button type="button" class="ws-btn sm primary" id="calOpenAddBtn">➕ 새 일정 바로 등록</button>' +
      '</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;padding-top:6px;border-top:1px dashed rgba(148,163,184,0.28);font-size:11.2px">' +
      '<span><b>채널색:</b></span>' +
      '<span style="color:#4ade80;font-weight:800">● 네이버(연두)</span>' +
      '<span style="color:#c084fc;font-weight:800">● 릴스(보라)</span>' +
      '<span style="color:#f87171;font-weight:800">● 유튜브(빨강)</span>' +
      '<span style="color:#facc15;font-weight:800">● 컨설팅(노랑)</span>' +
      '<span style="color:#38bdf8;font-weight:800">● 스레드</span>' +
      '<span style="color:#94a3b8;font-weight:800">● 기타</span>' +
      '<span style="margin-left:6px"><b>| 상태색:</b></span>' +
      '<span style="background:rgba(16,185,129,0.22);border:1px solid #10b981;color:#a7f3d0;padding:0 6px;border-radius:6px;font-weight:800">✅ 검수·예약완료</span>' +
      '<span style="background:rgba(6,182,212,0.18);border:1px solid #06b6d4;color:#a5f3fc;padding:0 6px;border-radius:6px;font-weight:800">🏁 발행완료</span>' +
      '<span style="background:rgba(249,115,22,0.22);border:1px solid #f97316;color:#fed7aa;padding:0 6px;border-radius:6px;font-weight:800">✏️ 수정요청</span>' +
      '</div>' +
      '</div>' +

      '<div class="ws-split" style="grid-template-columns:minmax(0,1.3fr) minmax(350px,0.95fr);align-items:start">' +
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
      (selectedFilterClient ? '<button type="button" class="ws-btn sm danger" id="calBulkDelClientBtn" title="선택한 고객사의 모든 일정을 일괄 삭제">🗑️ [' + A.esc(selectedFilterClient.name) + '] 전체 삭제 (' + filtered.length + '건)</button>' : '') +
      '<select id="calFilterCh" style="padding:5px 8px;border-radius:8px;border:1px solid var(--line-strong);font-size:12px">' +
      '<option value="">전체 채널</option>' +
      CHANNELS.map(function (ch) { return '<option value="' + ch.id + '"' + (st.filterChannel === ch.id ? ' selected' : '') + '>' + ch.icon + ' ' + ch.id + '</option>'; }).join('') +
      '</select>' +
      '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;margin-bottom:6px;text-align:center;font-size:11.5px;font-weight:800;color:var(--muted)">' +
      '<span style="color:#ef4444">일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span style="color:#38bdf8">토</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px">' + cells.join('') + '</div>' +
      '</div>' +

      // 오른쪽: sticky 고정으로 달력 아래 날짜를 클릭해도 스크롤 이동 없이 제자리에서 바로 확인!
      '<div class="ws-card" style="padding:14px;position:sticky;top:10px">' +
      (st.addMode ? (
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px">' +
        '<h3 style="margin:0;font-size:14.5px;color:#38bdf8">➕ 새 콘텐츠 일정 바로 등록</h3>' +
        '<div class="ws-actions">' +
        '<button type="button" class="ws-btn sm accent" id="calSampleAddBtn">🎲 Sample</button>' +
        (filtered.length ? '<button type="button" class="ws-btn sm" id="calCancelAddBtn">목록 보기</button>' : '') +
        '</div>' +
        '</div>' +
        '<div style="font-size:11.5px;color:var(--muted);margin-bottom:10px;line-height:1.5">' +
        '① 아래 4칸만 채우고 <b>[달력·VIP 포털에 등록]</b>을 누르세요.<br>' +
        '② 채널에 따라 달력에 <b>연두(네이버)·보라(릴스)·빨강(유튜브)·노랑(컨설팅)</b> 색상으로 자동 분류됩니다.' +
        '</div>' +
        '<div class="ws-grid-2">' +
        '<div class="ws-field"><label>1. 고객사 선택 *</label><select id="calNewClient">' +
        (clients.length
          ? clients.map(function (c) { return '<option value="' + c.id + '"' + (String(st.newClientId) === String(c.id) ? ' selected' : '') + '>' + A.esc(c.name) + ' (' + A.esc(c.industry) + ')</option>'; }).join('')
          : '<option value="">먼저 고객사 탭에서 1곳 등록하세요</option>') +
        '</select></div>' +
        '<div class="ws-field"><label>2. 발행 예정일 *</label><input type="date" id="calNewDate" value="' + A.esc(st.newDate || A.todayKst()) + '"></div>' +
        '</div>' +
        '<div class="ws-grid-2" style="margin-top:8px">' +
        '<div class="ws-field"><label>3. 발행 채널 (색상 자동지정)</label><select id="calNewCh">' +
        CHANNELS.map(function (ch) { return '<option value="' + ch.id + '"' + (st.newChannel === ch.id ? ' selected' : '') + '>' + ch.icon + ' ' + ch.id + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="ws-field"><label>등록 상태</label><select id="calNewStatus"><option value="검수대기">⏳ VIP 포털 고객 검수 요청</option><option value="예약확정">✅ 바로 예약 확정</option><option value="발행완료">🏁 발행 완료</option></select></div>' +
        '</div>' +
        '<div class="ws-field" style="margin-top:8px"><label>4. 콘텐츠 제목 *</label><input id="calNewTitle" value="' + A.esc(st.newTitle) + '" placeholder="예: 12월 유튜브 쇼츠 / 원장님 컨설팅 미팅 / 블로그 포스팅"></div>' +
        '<div class="ws-field" style="margin-top:8px"><label>초안 내용 · 대본 · 메모</label><textarea id="calNewBody" style="min-height:130px" placeholder="블로그 핵심 요약, 릴스/유튜브 대본, 또는 컨설팅 안건을 입력하세요">' + A.esc(st.newBody) + '</textarea></div>' +
        '<div class="ws-actions" style="margin-top:10px">' +
        '<button type="button" class="ws-btn primary" id="calSubmitNewBtn">💾 달력 · VIP 포털에 일정 등록</button>' +
        '<button type="button" class="ws-btn ok" data-ch-tab="factory">🏭 10편 한꺼번에 자동 생성하기</button>' +
        '</div>'
      ) : (
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px">' +
        '<h3 style="margin:0;font-size:14px">🚀 원클릭 예약 발행 &amp; 🛡️ AI 심의 검수</h3>' +
        '<button type="button" class="ws-btn sm primary" id="calSwitchAddBtn">＋ 새 일정 추가</button>' +
        '</div>' +
        (sel ? (
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:8px">' +
          '<span class="tag-pill ' + statusMeta(sel.status).cls + '">' + statusMeta(sel.status).badge + '</span>' +
          '<span style="font-size:11.5px;color:var(--muted)">고객사: <b>' + A.esc(clientNameById(sel.client_id)) + '</b></span>' +
          '</div>' +
          '<div class="ws-grid-2">' +
          '<div class="ws-field"><label>발행 채널</label><select id="calEditCh">' +
          CHANNELS.map(function (ch) { return '<option value="' + ch.id + '"' + (sel.channel === ch.id ? ' selected' : '') + '>' + ch.icon + ' ' + ch.id + '</option>'; }).join('') +
          '</select></div>' +
          '<div class="ws-field"><label>예약 발행일</label><input type="date" id="calEditDate" value="' + A.esc(sel.scheduled_date || '') + '"></div>' +
          '</div>' +
          '<div class="ws-field" style="margin-top:6px"><label>콘텐츠 제목</label><input id="calEditTitle" value="' + A.esc(sel.title) + '"></div>' +
          '<div class="ws-field" style="margin-top:6px"><label>원고 · 릴스 대본 · 해시태그</label><textarea id="calEditBody" style="min-height:140px">' + A.esc(sel.preview_text || '') + '</textarea></div>' +
          (sel.client_feedback ? '<div style="margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.35);font-size:12px">💬 <b>고객 대표님 피드백:</b> ' + A.esc(sel.client_feedback) + '</div>' : '') +

          '<div style="margin-top:10px;padding:10px;border-radius:10px;border:1px solid ' + (comp.safe ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.4)') + ';background:' + (comp.safe ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)') + ';font-size:11.8px">' +
          '<div style="font-weight:800;margin-bottom:4px">🛡️ 의료법 · 금소법 · 표시광고법 자동 심의: ' + comp.label + '</div>' +
          (comp.safe
            ? '<div style="color:var(--muted)">금지어·과장광고 위험 표현이 발견되지 않았습니다. 바로 예약 발행하셔도 안전합니다!</div>'
            : comp.hits.map(function (h) {
              return '<div style="margin-top:4px;color:#fca5a5">• <b>[' + h.group + ']</b> “' + A.esc(h.word) + '” 탐지 → <span style="color:var(--ink)">' + A.esc(h.tip) + '</span></div>';
            }).join('')) +
          '</div>' +

          '<div class="ws-actions" style="margin-top:10px">' +
          '<button type="button" class="ws-btn sm primary" id="calSaveEdit">💾 수정 저장</button>' +
          '<button type="button" class="ws-btn sm ok" id="calSetBooked">✅ 검수·예약 확정</button>' +
          '<button type="button" class="ws-btn sm accent" id="calSetPublished">🏁 발행 완료</button>' +
          '<button type="button" class="ws-btn sm" id="calCopyText">📋 본문 복사</button>' +
          (sel.channel.indexOf('릴스') !== -1 || sel.channel.indexOf('유튜브') !== -1 ? '<button type="button" class="ws-btn sm" id="calSendVideo">🎬 영상 편집기로 보내기</button>' : '') +
          '<button type="button" class="ws-btn sm danger" id="calDeleteItem">🗑️ 이 일정 삭제</button>' +
          '</div>'
        ) : '')
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
      ['병원', '보험설계사', '정책자금', '자영업/소상공인', '브랜드/기타'].map(function (ind) { return '<option value="' + ind + '"' + (st.factoryIndustry === ind ? ' selected' : '') + '>' + ind + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="ws-field"><label>이달의 핵심 키워드 · 프로모션</label><input id="facTopic" value="' + A.esc(st.factoryTopic) + '" placeholder="예: 12월 무료 건강검진, 연말 보험료 절감"></div>' +
      '<div class="ws-field"><label>발행 시작일 (월·수·금 자동 분산)</label><input type="date" id="facStart" value="' + A.esc(st.factoryStartDate) + '"></div>' +
      '</div>' +
      '<div class="ws-actions" style="margin-top:10px">' +
      '<button type="button" class="ws-btn primary" id="facGenBtn">⚡ 10편 일괄 생성 (블로그 6 + 릴스 4)</button>' +
      (st.drafts.length ? '<button type="button" class="ws-btn ok" id="facBulkSaveBtn"' + (st.savingBulk ? ' disabled' : '') + '>📅 10편 전체 캘린더 · VIP 포털 검수함에 일괄 등록</button>' : '') +
      (st.drafts.length ? '<button type="button" class="ws-btn" id="facDlHtmlBtn">🌐 클라이언트용 HTML 기획안 다운</button>' : '') +
      (st.drafts.length ? '<button type="button" class="ws-btn ok" id="facPrintPdfBtn">🖨️ 클라이언트용 PDF 출력 / 저장</button>' : '') +
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

  // 📅 날짜 클릭 시 크게 펼쳐지는 상세 스케줄 팝업 모달 (조회 · 수정 · 상태전환 · 삭제 · 바로추가)
  function renderDayPopupHtml() {
    if (!st.modalDate) return '';
    var ymd = st.modalDate;
    var clients = A.store.clients || [];
    var dayItems = st.items.filter(function (it) {
      if (String(it.scheduled_date || '').slice(0, 10) !== ymd) return false;
      if (st.filterClientId && String(it.client_id) !== String(st.filterClientId)) return false;
      if (st.filterChannel && it.channel !== st.filterChannel) return false;
      return true;
    });
    if (!st.newClientId && clients.length) st.newClientId = String(clients[0].id);

    return '<div id="calDayModalBg" style="position:fixed;inset:0;z-index:9990;background:rgba(2,6,23,0.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:18px">' +
      '<div style="width:100%;max-width:860px;max-height:88dvh;display:flex;flex-direction:column;background:#0f172a;color:#f8fafc;border:1.5px solid rgba(56,189,248,0.48);border-radius:20px;box-shadow:0 28px 70px rgba(0,0,0,0.65);overflow:hidden">' +
      // 팝업 상단바
      '<div style="padding:14px 18px;background:rgba(14,165,233,0.14);border-bottom:1px solid rgba(56,189,248,0.28);display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<div style="display:flex;align-items:center;gap:10px">' +
      '<h3 style="margin:0;font-size:16.5px;color:#7dd3fc">📅 ' + A.esc(ymd) + ' 상세 스케줄</h3>' +
      '<span class="tag-pill ok">총 ' + dayItems.length + '건</span>' +
      '</div>' +
      '<div class="ws-actions">' +
      '<button type="button" class="ws-btn sm primary" id="dmToggleAddBtn">' + (st.modalAdding ? '✖ 입력 닫기' : '＋ 이 날짜에 새 일정 추가') + '</button>' +
      '<button type="button" class="ws-btn sm" id="dmCloseBtn">닫기 (ESC)</button>' +
      '</div>' +
      '</div>' +

      // 팝업 스크롤 본문
      '<div style="padding:16px 18px;overflow-y:auto;display:flex;flex-direction:column;gap:12px">' +
      // 팝업 내 새 일정 바로 추가 폼
      (st.modalAdding ? (
        '<div style="padding:14px;border-radius:14px;background:rgba(14,165,233,0.09);border:1.5px dashed rgba(56,189,248,0.48)">' +
        '<div style="font-weight:800;font-size:13.5px;color:#38bdf8;margin-bottom:8px">➕ ' + A.esc(ymd) + ' 새 스케줄 바로 추가</div>' +
        '<div class="ws-grid-3">' +
        '<div class="ws-field"><label>고객사 *</label><select id="dmNewClient">' +
        (clients.length
          ? clients.map(function (c) { return '<option value="' + c.id + '"' + (String(st.newClientId) === String(c.id) ? ' selected' : '') + '>' + A.esc(c.name) + '</option>'; }).join('')
          : '<option value="">고객사 없음</option>') +
        '</select></div>' +
        '<div class="ws-field"><label>채널</label><select id="dmNewCh">' +
        CHANNELS.map(function (ch) { return '<option value="' + ch.id + '">' + ch.icon + ' ' + ch.id + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="ws-field"><label>상태</label><select id="dmNewStatus"><option value="검수대기">⏳ VIP검수대기</option><option value="예약확정">✅ 검수·예약확정</option><option value="발행완료">🏁 발행완료</option></select></div>' +
        '</div>' +
        '<div class="ws-field" style="margin-top:8px"><label>제목 *</label><input id="dmNewTitle" placeholder="예: 12월 유튜브 쇼츠 / 블로그 포스팅 / 원장님 컨설팅"></div>' +
        '<div class="ws-field" style="margin-top:8px"><label>내용 · 대본 · 메모</label><textarea id="dmNewBody" style="min-height:86px" placeholder="세부 원고·대본 또는 컨설팅 안건을 입력하세요"></textarea></div>' +
        '<div class="ws-actions" style="margin-top:8px"><button type="button" class="ws-btn sm primary" id="dmCreateBtn">💾 이 날짜에 바로 저장</button></div>' +
        '</div>'
      ) : '') +

      // 해당 날짜 스케줄 카드 목록 (바로 인라인 편집 가능!)
      (dayItems.length ? dayItems.map(function (it) {
        var sm = statusMeta(it.status);
        var cs = channelStyle(it.channel);
        var cp = checkCompliance(it.title + '\n' + it.preview_text);
        return '<div data-dm-card="' + it.id + '" style="padding:14px;border-radius:14px;background:rgba(30,41,59,0.88);border:1px solid ' + (sm.cardBorder || cs.border) + ';border-left:5px solid ' + cs.color + '">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px">' +
          '<div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">' +
          '<span style="padding:3px 9px;border-radius:999px;font-size:11px;font-weight:800;background:' + cs.bg + ';color:' + cs.text + ';border:1px solid ' + cs.border + '">' + cs.icon + ' ' + A.esc(it.channel) + '</span>' +
          '<span class="tag-pill ' + sm.cls + '">' + sm.badge + '</span>' +
          '<span style="font-size:12px;color:#cbd5e1">업체: <b>' + A.esc(clientNameById(it.client_id)) + '</b></span>' +
          '</div>' +
          '<span style="font-size:11px;font-weight:800;color:' + (cp.safe ? '#4ade80' : '#fca5a5') + '">' + cp.label + '</span>' +
          '</div>' +
          '<div class="ws-grid-3">' +
          '<div class="ws-field"><label>채널 변경</label><select data-dm-f="channel">' +
          CHANNELS.map(function (ch) { return '<option value="' + ch.id + '"' + (it.channel === ch.id ? ' selected' : '') + '>' + ch.icon + ' ' + ch.id + '</option>'; }).join('') +
          '</select></div>' +
          '<div class="ws-field"><label>날짜 이동</label><input type="date" data-dm-f="scheduled_date" value="' + A.esc(it.scheduled_date || ymd) + '"></div>' +
          '<div class="ws-field"><label>상태 변경</label><select data-dm-f="status">' +
          [['검수대기', '⏳ VIP검수대기'], ['예약확정', '✅ 검수완료·예약확정'], ['발행완료', '🏁 발행 완료'], ['수정요청', '✏️ 수정요청']].map(function (o) {
            return '<option value="' + o[0] + '"' + ((it.status === o[0] || (it.status === '승인완료' && o[0] === '예약확정')) ? ' selected' : '') + '>' + o[1] + '</option>';
          }).join('') +
          '</select></div>' +
          '</div>' +
          '<div class="ws-field" style="margin-top:8px"><label>콘텐츠 제목</label><input data-dm-f="title" value="' + A.esc(it.title) + '"></div>' +
          '<div class="ws-field" style="margin-top:8px"><label>원고 · 대본 · 메모</label><textarea data-dm-f="preview_text" style="min-height:110px">' + A.esc(it.preview_text || '') + '</textarea></div>' +
          (it.client_feedback ? '<div style="margin-top:8px;padding:7px 10px;border-radius:8px;background:rgba(245,158,11,0.14);font-size:12px;color:#fde68a">💬 고객 피드백: ' + A.esc(it.client_feedback) + '</div>' : '') +
          '<div class="ws-actions" style="margin-top:10px">' +
          '<button type="button" class="ws-btn sm primary" data-dm-save="' + it.id + '">💾 수정 저장</button>' +
          '<button type="button" class="ws-btn sm ok" data-dm-quick="' + it.id + ':예약확정">✅ 검수·예약 확정</button>' +
          '<button type="button" class="ws-btn sm accent" data-dm-quick="' + it.id + ':발행완료">🏁 발행 완료</button>' +
          '<button type="button" class="ws-btn sm" data-dm-copy="' + it.id + '">📋 복사</button>' +
          '<button type="button" class="ws-btn sm danger" data-dm-del="' + it.id + '">🗑️ 삭제</button>' +
          '</div>' +
          '</div>';
      }).join('') : (
        '<div style="text-align:center;padding:34px 16px;color:#94a3b8;font-size:13px">' +
        '이 날짜(' + A.esc(ymd) + ')에 등록된 스케줄이 아직 없습니다.<br>' +
        '위 <b>[＋ 이 날짜에 새 일정 추가]</b> 버튼을 눌러 바로 일정을 추가해 보세요!' +
        '</div>'
      )) +
      '</div>' +
      '</div>' +
      '</div>';
  }

  function render() {
    var root = document.getElementById('pane-content');
    if (!root) return;
    // 클릭 시 스크롤이 맨 위로 튀지 않도록 기존 스크롤 위치 보존!
    var prevScrollEl = document.getElementById('contentHubScroll');
    var savedScrollTop = prevScrollEl ? prevScrollEl.scrollTop : 0;

    root.innerHTML =
      '<div id="contentHubScroll" style="padding:14px;overflow-y:auto;height:100%">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">' +
      '<div class="ws-actions">' +
      '<button type="button" class="ws-btn neon-yellow-tab ' + (st.subTab === 'calendar' ? 'active' : '') + '" data-ch-tab="calendar">📅 월간 콘텐츠 캘린더 · 원클릭 예약 (Phase A-2)</button>' +
      '<button type="button" class="ws-btn neon-yellow-tab ' + (st.subTab === 'factory' ? 'active' : '') + '" data-ch-tab="factory">🏭 AI 업종별 3초 후킹 10편 공장 (Phase A-3)</button>' +
      '</div>' +
      '<span style="font-size:11.8px;color:var(--muted)">💡 날짜를 클릭하면 <b>크게 보는 상세 팝업</b>이 열리고, 팝업 안에서 바로 수정·완료 처리할 수 있습니다.</span>' +
      '</div>' +
      (st.subTab === 'calendar' ? renderCalendar(root) : renderFactory()) +
      '</div>' +
      renderDayPopupHtml();

    bindEvents(root);
    var newScrollEl = document.getElementById('contentHubScroll');
    if (newScrollEl && savedScrollTop > 0) newScrollEl.scrollTop = savedScrollTop;
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

    // 날짜 숫자 또는 날짜 칸 빈 곳 클릭 시 상세 확대 팝업 열기
    function openDayModal(ymd, withAdd) {
      st.modalDate = ymd;
      st.modalAdding = !!withAdd;
      render();
    }
    Array.prototype.forEach.call(root.querySelectorAll('[data-cal-open-day]'), function (b) {
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        openDayModal(b.getAttribute('data-cal-open-day'), false);
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-cal-daybox]'), function (box) {
      box.addEventListener('click', function (ev) {
        if (ev.target.closest('button')) return;
        openDayModal(box.getAttribute('data-cal-daybox'), false);
      });
    });

    // 날짜 상세 팝업 모달 내부 이벤트 바인딩
    var dmBg = q('#calDayModalBg');
    if (dmBg) {
      var closeDm = function () { st.modalDate = null; st.modalAdding = false; render(); };
      dmBg.addEventListener('click', function (ev) { if (ev.target === dmBg) closeDm(); });
      var dmClose = q('#dmCloseBtn');
      if (dmClose) dmClose.addEventListener('click', closeDm);
      var dmTogAdd = q('#dmToggleAddBtn');
      if (dmTogAdd) dmTogAdd.addEventListener('click', function () { st.modalAdding = !st.modalAdding; render(); });

      var dmCreate = q('#dmCreateBtn');
      if (dmCreate) dmCreate.addEventListener('click', function () {
        var cid = parseInt((q('#dmNewClient') && q('#dmNewClient').value) || '0', 10);
        var title = (q('#dmNewTitle') && q('#dmNewTitle').value || '').trim();
        var ch = (q('#dmNewCh') && q('#dmNewCh').value) || '네이버 블로그';
        var body = (q('#dmNewBody') && q('#dmNewBody').value || '').trim();
        var initSt = (q('#dmNewStatus') && q('#dmNewStatus').value) || '검수대기';
        if (!cid) { A.toast('⚠️ 고객사를 선택해 주세요.', 'error'); return; }
        if (!title) { A.toast('⚠️ 제목을 입력해 주세요.', 'error'); return; }
        dmCreate.disabled = true;
        A.api('/api/deliverables', {
          method: 'POST',
          body: JSON.stringify({ client_id: cid, channel: ch, title: title, preview_text: body, scheduled_date: st.modalDate, status: initSt }),
        }).then(function () {
          st.modalAdding = false;
          A.toast('✅ ' + st.modalDate + ' 일정이 추가되었습니다!');
          return loadDeliverables();
        }).catch(function (e) { dmCreate.disabled = false; A.toast('저장 실패: ' + e.message, 'error'); });
      });

      function readModalCard(id) {
        var card = dmBg.querySelector('[data-dm-card="' + id + '"]');
        if (!card) return null;
        return {
          channel: card.querySelector('[data-dm-f="channel"]').value,
          scheduled_date: card.querySelector('[data-dm-f="scheduled_date"]').value,
          status: card.querySelector('[data-dm-f="status"]').value,
          title: card.querySelector('[data-dm-f="title"]').value.trim(),
          preview_text: card.querySelector('[data-dm-f="preview_text"]').value,
        };
      }
      Array.prototype.forEach.call(dmBg.querySelectorAll('[data-dm-save]'), function (b) {
        b.addEventListener('click', function () {
          var id = parseInt(b.getAttribute('data-dm-save'), 10);
          var payload = readModalCard(id);
          if (!payload || !payload.title) { A.toast('⚠️ 제목을 입력하세요.', 'error'); return; }
          A.api('/api/deliverables/' + id, { method: 'PATCH', body: JSON.stringify(payload) })
            .then(function () { A.toast('✅ 수정 저장 완료!'); return loadDeliverables(); })
            .catch(function (e) { A.toast('저장 실패: ' + e.message, 'error'); });
        });
      });
      Array.prototype.forEach.call(dmBg.querySelectorAll('[data-dm-quick]'), function (b) {
        b.addEventListener('click', function () {
          var sp = b.getAttribute('data-dm-quick').split(':');
          var id = parseInt(sp[0], 10);
          var nextSt = sp[1];
          var payload = readModalCard(id) || {};
          payload.status = nextSt;
          A.api('/api/deliverables/' + id, { method: 'PATCH', body: JSON.stringify(payload) })
            .then(function () { A.toast('✅ 상태가 [' + nextSt + '](으)로 변경되었습니다!'); return loadDeliverables(); })
            .catch(function (e) { A.toast('변경 실패: ' + e.message, 'error'); });
        });
      });
      Array.prototype.forEach.call(dmBg.querySelectorAll('[data-dm-copy]'), function (b) {
        b.addEventListener('click', function () {
          var payload = readModalCard(parseInt(b.getAttribute('data-dm-copy'), 10));
          if (!payload) return;
          navigator.clipboard.writeText(payload.title + '\n\n' + payload.preview_text).then(function () { A.toast('📋 제목+내용 복사 완료!'); });
        });
      });
      Array.prototype.forEach.call(dmBg.querySelectorAll('[data-dm-del]'), function (b) {
        b.addEventListener('click', function () {
          var id = parseInt(b.getAttribute('data-dm-del'), 10);
          if (!confirm('이 일정을 삭제할까요?')) return;
          A.api('/api/deliverables/' + id, { method: 'DELETE' })
            .then(function () { A.toast('🗑️ 삭제 완료'); return loadDeliverables(); });
        });
      });
    }

    Array.prototype.forEach.call(root.querySelectorAll('[data-cal-pick]'), function (b) {
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        st.addMode = false;
        st.selectedId = parseInt(b.getAttribute('data-cal-pick'), 10);
        render();
      });
    });

    // 달력 카드 우측 '×' 개별 일정 즉시 삭제
    Array.prototype.forEach.call(root.querySelectorAll('[data-cal-quickdel]'), function (b) {
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var id = parseInt(b.getAttribute('data-cal-quickdel'), 10);
        if (!confirm('이 일정을 달력에서 바로 삭제할까요?')) return;
        A.api('/api/deliverables/' + id, { method: 'DELETE' })
          .then(function () {
            if (String(st.selectedId) === String(id)) st.selectedId = null;
            A.toast('🗑️ 일정을 삭제했습니다.');
            return loadDeliverables();
          }).catch(function (e) { A.toast('삭제 실패: ' + e.message, 'error'); });
      });
    });

    // 선택한 고객사 일정 전체 삭제 버튼
    var bulkDelClientBtn = q('#calBulkDelClientBtn');
    if (bulkDelClientBtn) bulkDelClientBtn.addEventListener('click', function () {
      var cid = parseInt(st.filterClientId, 10);
      if (!cid) return;
      var cname = clientNameById(cid);
      if (!confirm('[' + cname + '] 고객사의 캘린더 일정을 전부 삭제할까요? (복구 불가)')) return;
      bulkDelClientBtn.disabled = true;
      A.api('/api/deliverables?client_id=' + cid, { method: 'DELETE' })
        .then(function (r) {
          st.selectedId = null;
          A.toast('🗑️ [' + cname + '] 일정 ' + ((r && r.deleted_count) || '') + '건을 모두 삭제했습니다.');
          return loadDeliverables();
        }).catch(function (e) {
          bulkDelClientBtn.disabled = false;
          A.toast('일괄 삭제 실패: ' + e.message, 'error');
        });
    });

    // 날짜 칸 '+' 클릭 또는 '새 일정 바로 등록' 클릭 시 직관적 등록 폼 열기
    Array.prototype.forEach.call(root.querySelectorAll('[data-cal-add-date]'), function (b) {
      b.addEventListener('click', function () {
        st.addMode = true;
        st.newDate = b.getAttribute('data-cal-add-date');
        render();
        var ti = root.querySelector('#calNewTitle');
        if (ti) ti.focus();
      });
    });
    var openAdd = q('#calOpenAddBtn'), swAdd = q('#calSwitchAddBtn'), cancelAdd = q('#calCancelAddBtn');
    if (openAdd) openAdd.addEventListener('click', function () { st.addMode = true; render(); });
    if (swAdd) swAdd.addEventListener('click', function () { st.addMode = true; render(); });
    if (cancelAdd) cancelAdd.addEventListener('click', function () { st.addMode = false; render(); });

    var sampleAddBtn = q('#calSampleAddBtn');
    if (sampleAddBtn) sampleAddBtn.addEventListener('click', function () {
      var channels = ['네이버 블로그', '인스타 릴스', '유튜브', '스레드', '컨설팅', '기타'];
      var angles = [
        '초보가 가장 많이 하는 치명적 실수 TOP3',
        '비용 절반으로 줄이고 전환율 2배 올리는 체크리스트',
        '실제 고객 상담 Q&A 베스트 5 총정리',
        '이번 달 놓치면 손해 보는 핵심 혜택·일정 안내',
        '전문가가 직접 공개하는 현장 비하인드 스토리',
        '비교표 한 장으로 끝내는 실패 없는 선택 기준',
        '문의 전 반드시 확인해야 할 필수 준비물 4가지',
        '성과가 3배 차이 나는 상위 1%의 디테일 공개',
      ];
      var topics = ['무료 사전 진단', '신규 고객 프로모션', '브랜드 신뢰 구축', '보장·조건 리모델링', '예약·상담 퍼널', '지역 상권 공략', '고객 후기 사례', '시즌 트렌드 분석'];
      var ctas = ['프로필 링크에서 1분 무료 체크리스트 받아가세요!', '댓글에 "가이드" 남기시면 바로 DM 보내드립니다!', '하단 카카오 채널로 편하게 1:1 무료 상담 신청하세요!', '지금 저장해 두시고 상담 전에 꼭 다시 확인하세요!'];
      var ch = channels[Math.floor(Math.random() * channels.length)];
      var ang = angles[Math.floor(Math.random() * angles.length)];
      var top = topics[Math.floor(Math.random() * topics.length)];
      var cta = ctas[Math.floor(Math.random() * ctas.length)];
      var tag = (ch === '인스타 릴스' || ch === '유튜브') ? '3초 후킹 ' : '[' + top + '] ';
      st.newChannel = ch;
      st.newTitle = tag + ang;
      st.newBody = (ch === '인스타 릴스' || ch === '유튜브')
        ? ('[0~3초 후킹] "잠깐! ' + top + ' 준비 중이시라면 이거 먼저 확인하세요!"\n[4~20초 본론] ' + ang + ' 핵심 포인트 3가지 정리\n[21~30초 CTA] "' + cta + '"')
        : ('🎯 [도입]\n' + top + ' 관련해서 가장 많이 물어보시는 "' + ang + '" 내용을 알기 쉽게 정리했습니다.\n\n📝 [핵심 구성]\n1) 핵심 기준 3가지 비교\n2) 실제 사례로 보는 주의사항\n3) ' + cta + '\n\n🏷️ #' + top.replace(/\s+/g, '') + ' #브랜드마케팅 #무료상담');
      render();
      A.toast('🎲 랜덤 샘플 일정(' + ch + ' · ' + top + ')이 채워졌습니다!');
    });

    var submitNew = q('#calSubmitNewBtn');
    if (submitNew) submitNew.addEventListener('click', function () {
      var cid = parseInt((q('#calNewClient') && q('#calNewClient').value) || '0', 10);
      var title = (q('#calNewTitle') && q('#calNewTitle').value || '').trim();
      var date = (q('#calNewDate') && q('#calNewDate').value || '').trim();
      var ch = (q('#calNewCh') && q('#calNewCh').value) || '네이버 블로그';
      var body = (q('#calNewBody') && q('#calNewBody').value || '').trim();
      var initSt = (q('#calNewStatus') && q('#calNewStatus').value) || '검수대기';
      if (!cid) { A.toast('⚠️ 먼저 고객사를 1곳 이상 등록해 주세요!', 'error'); return; }
      if (!title) { A.toast('⚠️ 콘텐츠 제목을 입력해 주세요!', 'error'); return; }
      submitNew.disabled = true;
      A.api('/api/deliverables', {
        method: 'POST',
        body: JSON.stringify({ client_id: cid, channel: ch, title: title, preview_text: body, scheduled_date: date, status: initSt }),
      }).then(function (r) {
        st.addMode = false;
        st.newTitle = '';
        st.newBody = '';
        if (r && r.deliverable) st.selectedId = r.deliverable.id;
        A.toast('✅ 캘린더 & VIP 포털에 일정이 등록되었습니다!');
        return loadDeliverables();
      }).catch(function (e) {
        submitNew.disabled = false;
        A.toast('❌ 등록 실패: ' + e.message, 'error');
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

    function buildClientPlanHtml() {
      var prof = A.store.agencyProfile || A.DEFAULT_AGENCY_PROFILE;
      var cName = st.factoryClientId ? clientNameById(st.factoryClientId) : '고객사';
      var blogCnt = st.drafts.filter(function (d) { return d.channel.indexOf('블로그') !== -1; }).length;
      var reelCnt = st.drafts.filter(function (d) { return d.channel.indexOf('릴스') !== -1; }).length;
      var safeCnt = st.drafts.filter(function (d) { return checkCompliance(d.title + '\n' + d.preview_text).safe; }).length;
      var tableRows = st.drafts.map(function (d) {
        var isReel = d.channel.indexOf('릴스') !== -1;
        return '<tr><td style="text-align:center;font-weight:800">' + d.idx + '</td>' +
          '<td><span class="pill ' + (isReel ? 'reel' : 'blog') + '">' + A.esc(d.channel) + '</span></td>' +
          '<td><b>' + A.esc(d.title) + '</b></td>' +
          '<td style="text-align:center">' + A.esc(d.scheduled_date) + '</td>' +
          '<td style="text-align:center">' + (checkCompliance(d.title + '\n' + d.preview_text).safe ? '✅ 안전' : '⚠️ 검토') + '</td></tr>';
      }).join('');
      var detailCards = st.drafts.map(function (d) {
        var isReel = d.channel.indexOf('릴스') !== -1;
        var cp = checkCompliance(d.title + '\n' + d.preview_text);
        return '<div class="card ' + (isReel ? 'is-reel' : 'is-blog') + '">' +
          '<div class="card-top">' +
          '<span class="pill ' + (isReel ? 'reel' : 'blog') + '">#' + d.idx + ' ' + A.esc(d.channel) + '</span>' +
          '<span class="meta">발행 예정일: <b>' + A.esc(d.scheduled_date) + '</b> · ' + A.esc(cp.label) + '</span>' +
          '</div>' +
          '<h3>' + A.esc(d.title) + '</h3>' +
          '<pre>' + A.esc(d.preview_text) + '</pre>' +
          '</div>';
      }).join('');

      return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<title>' + A.esc(cName) + ' 월간 SNS 콘텐츠 기획안 (10편)</title>' +
        '<style>' +
        '*{box-sizing:border-box}body{margin:0;background:#0f172a;padding:28px 14px 56px;font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard","Malgun Gothic",sans-serif;color:#0f172a}' +
        '.bar{max-width:860px;margin:0 auto 14px;display:flex;justify-content:space-between;align-items:center;color:#e2e8f0;font-size:13px;font-weight:700}' +
        '.bar button{border:0;border-radius:999px;padding:9px 18px;background:linear-gradient(135deg,#0284c7,#38bdf8);color:#fff;font-weight:800;cursor:pointer;box-shadow:0 6px 18px rgba(2,132,199,.35)}' +
        '.sheet{max-width:860px;margin:0 auto;background:#fff;border-radius:16px;padding:42px 46px 50px;box-shadow:0 24px 64px rgba(0,0,0,.45)}' +
        '.hero{background:linear-gradient(135deg,#0c4a6e,#0284c7 60%,#38bdf8);color:#fff;border-radius:14px;padding:26px 28px;margin-bottom:22px}' +
        '.hero .eyebrow{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.85;margin-bottom:6px}' +
        '.hero h1{margin:0 0 8px;font-size:24px;line-height:1.3}.hero p{margin:0;font-size:13px;color:#e0f2fe}' +
        '.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:22px}' +
        '.kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px}.kpi .l{font-size:11px;color:#64748b;font-weight:700}.kpi .v{font-size:20px;font-weight:900;color:#0c4a6e;margin-top:4px}' +
        'h2{font-size:15.5px;font-weight:900;color:#0c4a6e;border-left:4px solid #0284c7;padding-left:10px;margin:24px 0 12px}' +
        'table{width:100%;border-collapse:collapse;font-size:12.2px;margin-bottom:24px}th,td{border:1px solid #cbd5e1;padding:8px 10px}th{background:#f1f5f9;color:#1e293b;font-weight:800}' +
        '.pill{display:inline-block;padding:3px 9px;border-radius:999px;font-size:10.8px;font-weight:800}.pill.blog{background:#e0f2fe;color:#0369a1}.pill.reel{background:#fce7f3;color:#be185d}' +
        '.card{border:1px solid #cbd5e1;border-left:4px solid #0284c7;border-radius:12px;padding:14px 16px;margin-bottom:12px;background:#fff;page-break-inside:avoid;break-inside:avoid}' +
        '.card.is-reel{border-left-color:#db2777}.card-top{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}.meta{font-size:11.2px;color:#64748b}' +
        '.card h3{margin:0 0 8px;font-size:14.2px;color:#0f172a}.card pre{margin:0;white-space:pre-wrap;word-break:keep-all;font-family:inherit;font-size:12.3px;line-height:1.68;color:#334155;background:#f8fafc;padding:10px 12px;border-radius:8px}' +
        '.foot{margin-top:28px;padding-top:14px;border-top:1px dashed #cbd5e1;display:flex;justify-content:space-between;font-size:11.5px;color:#64748b}' +
        '@media print{@page{size:A4 portrait;margin:10mm}body{background:#fff;padding:0}.bar{display:none}.sheet{box-shadow:none;padding:2mm 4mm;border-radius:0;max-width:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}}' +
        '</style></head><body>' +
        '<div class="bar"><span>📅 ' + A.esc(cName) + ' 월간 SNS 콘텐츠 기획안 (' + st.drafts.length + '편)</span><button onclick="window.print()">🖨️ PDF 저장 / 인쇄</button></div>' +
        '<div class="sheet">' +
        '<div class="hero">' +
        '<div class="eyebrow">MONTHLY CONTENT MASTER PLAN · ' + A.esc(prof.company || '미담공장') + '</div>' +
        '<h1>' + A.esc(cName) + ' 맞춤 콘텐츠 10편 발행 기획안</h1>' +
        '<p>업종: ' + A.esc(st.factoryIndustry) + ' · 핵심 테마: ' + A.esc(st.factoryTopic || '브랜딩 · 검색 유입 · DB 전환 극대화') + ' · 작성일: ' + A.todayKst() + '</p>' +
        '</div>' +
        '<div class="kpis">' +
        '<div class="kpi"><div class="l">총 기획 편수</div><div class="v">' + st.drafts.length + '편</div></div>' +
        '<div class="kpi"><div class="l">네이버 블로그</div><div class="v" style="color:#0284c7">' + blogCnt + '편</div></div>' +
        '<div class="kpi"><div class="l">인스타 릴스</div><div class="v" style="color:#db2777">' + reelCnt + '편</div></div>' +
        '<div class="kpi"><div class="l">법적 심의 통과</div><div class="v" style="color:#16a34a">' + safeCnt + '/' + st.drafts.length + '편</div></div>' +
        '</div>' +
        '<h2>1. 월간 발행 캘린더 요약표</h2>' +
        '<table><thead><tr><th style="width:46px">No</th><th style="width:110px">채널</th><th>콘텐츠 제목</th><th style="width:105px">발행 예정일</th><th style="width:80px">심의</th></tr></thead><tbody>' + tableRows + '</tbody></table>' +
        '<h2>2. 편별 상세 기획안 · 3초 후킹 대본 · 추천 해시태그</h2>' +
        detailCards +
        '<div class="foot"><span>작성 및 총괄: <b>' + A.esc(prof.company || '미담공장') + '</b> (' + A.esc(prof.phone || '') + ')</span><span>본 기획안은 고객사 검수 승인 후 확정 발행됩니다.</span></div>' +
        '</div></body></html>';
    }

    var dlHtmlBtn = q('#facDlHtmlBtn');
    if (dlHtmlBtn) dlHtmlBtn.addEventListener('click', function () {
      var cName = st.factoryClientId ? clientNameById(st.factoryClientId) : '고객사';
      var blob = new Blob([buildClientPlanHtml()], { type: 'text/html;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (cName + '_콘텐츠10편_기획안_' + A.todayKst()).replace(/[\\/:*?"<>|]/g, '_') + '.html';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 300);
      A.toast('🌐 클라이언트용 고급 HTML 기획안 다운로드 완료!');
    });

    var printPdfBtn = q('#facPrintPdfBtn');
    if (printPdfBtn) printPdfBtn.addEventListener('click', function () {
      var w = window.open('', '_blank', 'width=960,height=900');
      if (!w) { A.toast('⚠️ 팝업 차단을 해제해 주세요.', 'error'); return; }
      w.document.open();
      w.document.write(buildClientPlanHtml());
      w.document.close();
      setTimeout(function () { w.focus(); w.print(); }, 450);
    });

    var aiBtn = q('#facAskAiBtn');
    if (aiBtn) aiBtn.addEventListener('click', function () {
      var cName = st.factoryClientId ? clientNameById(st.factoryClientId) : '신규 고객사';
      var summary = st.drafts.map(function (d) { return d.idx + '. [' + d.channel + '] ' + d.title; }).join('\n');
      var promptText = [
        '@홍보부 드럼통 @CS 딸랑이 @지피고 씹던껌 @대장 비서실',
        '[AI 콘텐츠 10편 공장 카피 고도화 요청 · 종합반 합동 의논]',
        '- 고객사: ' + cName + ' (' + st.factoryIndustry + ')',
        '- 핵심 주제: ' + (st.factoryTopic || '월간 정규 운영'),
        '- 현재 10편 초안 목록:',
        summary,
        '',
        '요청: 위 10편(블로그 6편 + 릴스 4편)을 의료법·금소법 심의에 안전하면서도 클릭률과 DB 문의 전환율이 폭발하도록 업그레이드해 줘!',
        '※ 대장님이 [🎬 승인 · 10편 공장 재입력] 버튼 한 번으로 자동 반영할 수 있도록 반드시 아래 형식으로 1번~10번을 정리해 줘:',
        '1. [네이버 블로그] 업그레이드 제목',
        '후킹/구성: 핵심 도입 + 본문 3줄 + CTA',
        '2. [인스타 릴스] 업그레이드 제목',
        '후킹/구성: [0~3초 후킹] ... [4~20초 본론] ... [21~30초 CTA] ...',
      ].join('\n');
      A.requestAiAssist({ room: 'general', prompt: promptText }).then(function () {
        if (window.BujaChat && window.BujaChat.openRoom) window.BujaChat.openRoom('general');
        A.switchTab('chat');
        A.toast('🏫 #부자사람 일진 종합반으로 10편 고도화 요청을 보냈습니다! AI 답장 후 [🎬 승인 · 10편 공장 재입력]을 누르세요.');
      }).catch(function (err) {
        A.toast('❌ AI 요청 실패: ' + (err && err.message ? err.message : ''), 'error');
      });
    });
  }

  // 🎬 채팅방에서 AI가 다듬어준 10편 수정안을 대장님이 컨펌하면 10편 공장에 자동 재입력!
  A.on('apply-ai-factory', function (payload) {
    var raw = String((payload && payload.text) || '').replace(/\*\*/g, '').trim();
    if (!raw) return;
    if (!st.drafts.length) generate10Drafts();

    // "1. [채널] 제목" 또는 "1) 제목" 블록 단위로 1~10번 파싱
    var blocks = raw.split(/\r?\n(?=\s*(?:#?\d{1,2})[\.\)]\s+)/);
    var parsedItems = [];
    blocks.forEach(function (blk) {
      var m = blk.match(/^\s*#?(\d{1,2})[\.\)]\s*(?:\[([^\]]+)\]\s*)?([^\r\n]+)([\s\S]*)$/);
      if (m) {
        var num = parseInt(m[1], 10);
        if (num >= 1 && num <= 10) {
          var chRaw = (m[2] || '').trim();
          var title = (m[3] || '').trim();
          var body = (m[4] || '').trim();
          parsedItems.push({ num: num, chRaw: chRaw, title: title, body: body });
        }
      }
    });

    var updatedCnt = 0;
    if (parsedItems.length >= 2) {
      parsedItems.forEach(function (pi) {
        var target = st.drafts[pi.num - 1];
        if (!target) return;
        if (pi.chRaw) {
          target.channel = pi.chRaw.indexOf('릴스') !== -1 ? '인스타 릴스' : (pi.chRaw.indexOf('스레드') !== -1 ? '스레드' : '네이버 블로그');
        }
        if (pi.title) target.title = pi.title;
        if (pi.body) target.preview_text = pi.body;
        target.compliance = checkCompliance(target.title + '\n' + target.preview_text);
        updatedCnt++;
      });
    } else {
      // 번호 형식이 아닌 자유 서술이면 1번 카드와 릴스 카드에 AI 고도화 본문 자동 반영
      st.drafts[0].preview_text = '✨ [AI 종합반 컨펌 반영안]\n' + raw + '\n\n' + st.drafts[0].preview_text;
      st.drafts[0].compliance = checkCompliance(st.drafts[0].title + '\n' + st.drafts[0].preview_text);
      updatedCnt = 1;
    }

    st.subTab = 'factory';
    render();
    A.toast('🎬 AI 종합반 최종안 컨펌 완료! 10편 공장에 ' + updatedCnt + '편이 자동 재입력되었습니다.');
  });

  window.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && st.modalDate) {
      st.modalDate = null;
      st.modalAdding = false;
      render();
    }
  });

  A.on('data-refreshed', function () { loadDeliverables(); });
  A.on('tab-changed', function (t) {
    if (t === 'content') {
      loadDeliverables();
      render();
    }
  });
})();

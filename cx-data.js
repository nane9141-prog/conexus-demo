/* ============================================================
 * CONEXUS 데모 — 공통 데이터 (SSOT)
 * 모든 페이지가 이 파일 하나를 참조한다. (각 페이지 인라인 데이터 금지)
 * 사용: <script src="cx-data.js"></script> 를 conexus.js 보다 먼저 로드.
 *       전역 window.CX 로 접근.  예) CX.meeting.name, CX.agenda, CX.center['제1호']
 * 값 갱신 시 이 파일만 수정하면 전 페이지에 반영되도록 설계.
 * ============================================================ */
(function (global) {
  'use strict';

  /* ---------- 1) 주주총회 기본 정보 ---------- */
  var meeting = {
    org: '카카오뱅크',
    orgEmail: 'irkudos.co.kr',
    name: '제10기 정기주주총회',
    term: 10,
    kind: '정기',
    date: '2026-09-29',
    dateText: '2026년 9월 29일 (화)',
    time: '오전 10시',
    place: '서울 영등포구 카카오뱅크 본사 대강당',
    operator: { name: '강하나', email: 'doji@irkudos.co.kr' },

    /* 주식/의결권 (SSOT 기준값 — 표시·계산 모두 여기서 파생) */
    sharesIssued: 476211964,      // 발행주식총수
    sharesVoting: 471661174,      // 의결권 있는 주식수
    holdersTotal: 650000,         // 전체 주주 수
    // 출석/참석 현황
    attendShares: 300000000,      // 출석의결권 (= 채널 합계)
    attendHolders: 300000,        // 출석 주주 수
    onsiteHolders: 93000,         // 현장 참석 주주
    onsiteShares: 3120000,        // 현장 참석 행사 가능 주식
    onlineHolders: 207000,        // 온라인 참석 주주
    onlineShares: 296880000,      // 온라인 참석 의결권
    preExercised: 312504900,      // 사전 의결권 행사 (전자+서면+위임)
    // 파생 비율 (참고): attendShares / sharesVoting ≈ 63.6%
    // 의결정족수 기준 라벨
    quorum: { normalIssued: '1/4', normalAttend: '1/2', specialIssued: '1/3', specialAttend: '2/3' }
  };

  /* ---------- 2) 투표 채널 (출석의결권 분해) ---------- */
  var channels = [
    { key: 'pre',    nm: '사전투표',   w: 240000000 },
    { key: 'onsite', nm: '현장투표',   w: 40000000  },
    { key: 'online', nm: '온라인투표', w: 20000000  }
  ]; // 합계 300,000,000 = meeting.attendShares

  /* ---------- 3) 의안 리스트 (표결 단위 = 카드) ----------
   * type: 보통결의 | 특별결의 | 양립불가 | 집중투표
   * header:true → 비선택 상위 의안(제2호·제4호)
   * children → 하위행(양립불가 옵션 / 집중투표 후보)  ※비선택
   */
  var agenda = [
    { no: '제1호', nm: '재무제표 승인의 건', types: ['보통결의'] },

    { no: '제2호', nm: '정관 일부 변경의 건', header: true },
    { no: '제2-1호', nm: '집중투표제 배제 조항 삭제의 건(정관 제37조 제3항)', types: ['특별결의'] },
    { no: '제2-2호', nm: '전자주주총회 도입 관련 변경(정관 제26조 제2항)', types: ['특별결의'] },

    { no: '제3호', nm: '선임 이사 수 결정의 건', types: ['보통결의', '양립불가'], children: [
      { no: '제3-1호', nm: '집중투표 4인 중 2인 선임의 건(회사제안)' },
      { no: '제3-2호', nm: '집중투표 5인 중 2인 선임의 건(주주제안)' }
    ] },

    { no: '제4호', nm: '집중투표에 의한 이사 선임의 건', header: true },
    { no: '제4-1호', nm: '집중투표 4인 중 2인 선임의 건(회사제안)', types: ['보통결의', '집중투표'], children: [
      { no: '제4-1-1호', nm: '사외이사 후보 김도현' },
      { no: '제4-1-2호', nm: '사외이사 후보 이수진' },
      { no: '제4-1-3호', nm: '사외이사 후보 박준영' },
      { no: '제4-1-4호', nm: '사외이사 후보 최민서' }
    ] },
    { no: '제4-2호', nm: '집중투표 5인 중 2인 선임의 건(주주제안)', types: ['보통결의', '집중투표'], children: [
      { no: '제4-2-1호', nm: '사외이사 후보 정우성' },
      { no: '제4-2-2호', nm: '사외이사 후보 한지민' },
      { no: '제4-2-3호', nm: '사외이사 후보 오세훈' },
      { no: '제4-2-4호', nm: '사외이사 후보 강가람' },
      { no: '제4-2-5호', nm: '사외이사 후보 윤서연' }
    ] }
  ];

  /* ---------- 3-1) 의안 유형 (주총 설정·대본 템플릿 공용) ----------
   * 시스템이 제공하는 전체 목록. 의안을 등록할 때와 대본 템플릿을 만들 때
   * 같은 목록을 골라야 하므로 여기 한 곳에 둔다. */
  var agTypes = [
    ['결산 및 배당(재무관련)', ['재무제표 승인', '이익배당']],
    ['정관 변경', ['정관변경', '정관변경(집중투표 배제 및 해지)']],
    ['임원 선임 및 해임(지배구조)', ['이사선임', '이사해임', '감사선임', '감사해임',
      '감사위원회 감사위원 선임(사외이사)', '감사위원회 감사위원 선임(독립이사)', '감사위원회 감사위원 선임(일반)',
      '감사위원회 감사위원 해임(사외이사)', '감사위원회 감사위원 해임(독립이사)', '감사위원회 감사위원 해임(일반)']],
    ['임원 보수', ['이사 보수한도 승인', '감사 보수한도 승인']],
    ['기업 재편', ['합병계약서의 승인', '분할계획서의 승인', '분할합병계약서의 승인',
      '영업의 양도/양수 및 포괄적 계약 체결 승인']],
    ['기타', ['기타']]
  ];

  /* ---------- 4) 의안별 표결 상세 (현장 제어·집계·행사현황 공용) ---------- */
  var center = {
    '제1호':   { cat: '제1호', type: '보통결의', name: '재무제표 승인의 건',
                 thrLabel: '출석의결권 1/2', for: 241800000, against: 58200000, abs: 0, expect: '가결 예상' },
    '제2-1호': { cat: '제2-1호', type: '특별결의', name: '집중투표제 배제 조항 삭제의 건',
                 thrLabel: '출석의결권 2/3', for: 214000000, against: 84000000, abs: 2000000, expect: '가결 예상' },
    '제2-2호': { cat: '제2-2호', type: '특별결의', name: '전자주주총회 도입 관련 변경',
                 thrLabel: '출석의결권 2/3', for: 206000000, against: 92000000, abs: 2000000, expect: '가결 예상' },
    '제3호':   { cat: '제3호', type: '양립불가', name: '선임 이사 수 결정의 건', expect: '가결 예상', options: [
                   { no: '제3-1호', name: '집중투표 4인 중 2인 선임의 건(회사제안)', for: 241800000, against: 58200000, abs: 0, result: '가결' },
                   { no: '제3-2호', name: '집중투표 5인 중 2인 선임의 건(주주제안)', for: 118000000, against: 182000000, abs: 0, result: '부결' }
                 ] },
    '제4-1호': { cat: '제4-1호', type: '집중투표', name: '집중투표 4인 중 2인 선임의 건(회사제안)', expect: '가결 예상 : 1, 2', cands: [
                   { rank: 1, no: '제4-1-1호', name: '사외이사 후보 김도현', votes: 10240000, elected: true },
                   { rank: 2, no: '제4-1-3호', name: '사외이사 후보 박준영', votes: 7180000, elected: true },
                   { rank: 3, no: '제4-1-2호', name: '사외이사 후보 이수진', votes: 4320000, elected: false },
                   { rank: 4, no: '제4-1-4호', name: '사외이사 후보 최민서', votes: 1260000, elected: false }
                 ] },
    '제4-2호': { cat: '제4-2호', type: '집중투표', name: '집중투표 5인 중 2인 선임의 건(주주제안)', expect: '가결 예상 : 1, 2', cands: [
                   { rank: 1, no: '제4-2-1호', name: '사외이사 후보 정우성', votes: 9850000, elected: true },
                   { rank: 2, no: '제4-2-2호', name: '사외이사 후보 한지민', votes: 6420000, elected: true },
                   { rank: 3, no: '제4-2-3호', name: '사외이사 후보 오세훈', votes: 3980000, elected: false },
                   { rank: 4, no: '제4-2-4호', name: '사외이사 후보 강가람', votes: 2110000, elected: false },
                   { rank: 5, no: '제4-2-5호', name: '사외이사 후보 윤서연', votes: 980000, elected: false }
                 ] }
  };

  /* 선택 가능(표결 단위) 의안 번호 */
  var votingUnits = ['제1호', '제2-1호', '제2-2호', '제3호', '제4-1호', '제4-2호'];

  /* ---------- 4-1) 양립불가 후속 — 채택/폐기 라인 ----------
   * 제3호(양립불가)에서 가결된 제안이 회사제안이면 주주제안 집중투표(제4-2호)가,
   * 주주제안이면 제4-1호가 폐기된다. 값을 박지 않고 center 결과에서 파생한다.
   */
  var decided = (function () {
    var won = ((center['제3호'] || {}).options || []).filter(function (o) { return o.result === '가결'; })[0];
    return won ? (won.name.indexOf('주주제안') >= 0 ? '주주' : '회사') : null;
  })();
  var DISCARD = { '회사': '제4-2호', '주주': '제4-1호' };

  /* ---------- 4-2) 현장 운영 문구 ----------
   * 실시간 운영 탭과 질의·발언 관리 탭이 같은 문구를 쓴다.
   * l = 칩에 보이는 이름, t = 눌렀을 때 입력칸에 채워지는 본문.
   */
  var answerTpl = [
    { l: '배당 정책',   t: '당사는 안정적 배당과 성장 투자의 균형을 배당 정책의 원칙으로 하며, 별도재무제표 당기순이익 기준 배당성향 약 27% 수준을 유지하고 있습니다.' },
    { l: '재무 건전성', t: '건전성 지표는 안정적으로 관리되고 있으며, 선제적 리스크관리와 보수적 충당금 적립 기조를 유지하고 있습니다.' },
    { l: '주주환원',    t: '자기주식 취득·소각 등 주주환원 방안을 이사회에서 지속 검토 중이며, 확정 시 신속히 공시하겠습니다.' },
    { l: '추후 공시',   t: '해당 사안은 현재 검토 중으로, 확정되는 대로 공시를 통해 상세히 안내드리겠습니다.' },
    { l: '규정 준수',   t: '관련 법령과 정관 및 내부 규정에 따라 적법한 절차로 처리하고 있습니다.' },
    { l: '자료 안내',   t: '질의하신 내용은 소집공고 및 사업보고서에 관련 사항이 기재되어 있으니 참고하여 주시기 바랍니다.' }
  ];
  var rejectTpl = [
    { l: '주주 기준 안내',   t: '주주명부 기준일 현재 의결권 있는 주주께만 발언권을 드리고 있어 안내드립니다.' },
    { l: '의안과 무관',      t: '상정된 의안과 직접 관련이 없는 내용으로 확인되어 이번 순서에서는 다루지 않습니다.' },
    { l: '추후 서면 답변',   t: '현장에서 답변드리기 어려운 사항으로, 총회 이후 서면으로 답변드리겠습니다.' },
    { l: '공시 자료 참조',   t: '소집공고 및 사업보고서에 관련 내용이 기재되어 있어 해당 자료를 참고해 주시기 바랍니다.' },
    { l: '담당 임원 답변',   t: '담당 임원이 직접 답변드릴 사항으로, 해당 순서에 함께 안내드리겠습니다.' },
    { l: '시간 관계상 종료', t: '예정된 발언 시간이 지나 이번 순서는 여기서 마무리하겠습니다.' }
  ];
  /* 의장 전달 메시지 — 진행 안내가 아니라, 의장이 답변할 때 참고할 근거·수치를 넣는 자리다. */
  var chairTags = [
    { l: '실적 근거', t: '당기 실적: 매출·영업이익 추이와 전년 대비 증감 요인. ' },
    { l: '배당 정책', t: '배당 정책: 당기 배당성향 27%, 중기 25~30% 유지 방침. ' },
    { l: '주가 관련', t: '주가 관련: 업종 평균 대비 밸류에이션과 주주환원 계획. ' },
    { l: '정관 조항', t: '관련 정관: 제○조 제○항 개정 취지와 적용 시점. ' },
    { l: '후보 이력', t: '후보 이력: 주요 경력·겸직 현황·추천 사유. ' },
    { l: '법령 근거', t: '법령 근거: 상법 제○조에 따른 요건과 절차. ' },
    { l: '기존 답변', t: '기존 답변: 직전 총회·공시에서 안내한 내용과 동일. ' }
  ];

  /* ---------- 5) 공용 포맷/헬퍼 ---------- */
  var util = {
    comma: function (n) { return Math.round(Number(n)).toLocaleString('en-US'); },
    chip:  function (no) { return String(no).replace('제', '제 '); }, // 칩 표기 '제 1호'
    pct:   function (part, whole) { return whole ? (part / whole * 100) : 0; },
    /* 양립불가 후속으로 폐기된 의안인가 */
    discarded: function (no) { return DISCARD[decided] === no; }
  };

  global.CX = { meeting: meeting, channels: channels, agenda: agenda, agTypes: agTypes, center: center, votingUnits: votingUnits, decided: decided,
                answerTpl: answerTpl, rejectTpl: rejectTpl, chairTags: chairTags, util: util };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.CX;

  /* ---------- 6) 정적 페이지 값 주입 ----------
   * 마크업에 data-cx="meeting.sharesIssued" 를 달면 로드 시 CX 값으로 교체된다.
   * (숫자는 comma 포맷. 값이 없으면 마크업의 기존 텍스트를 그대로 둔다.)
   */
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      Array.prototype.forEach.call(document.querySelectorAll('[data-cx]'), function (el) {
        var v = el.getAttribute('data-cx').split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, global.CX);
        if (v == null) return;
        var t = typeof v === 'number' ? util.comma(v) : String(v);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.value = t + (el.getAttribute('data-cx-suffix') || '');
        else el.textContent = t + (el.getAttribute('data-cx-suffix') || '');
      });
    });
  }
})(typeof window !== 'undefined' ? window : this);

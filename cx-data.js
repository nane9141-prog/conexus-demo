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
    date: '2026-03-27',
    dateText: '2026년 3월 27일 (금)',
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

  /* ---------- 5) 공용 포맷/헬퍼 ---------- */
  var util = {
    comma: function (n) { return Math.round(Number(n)).toLocaleString('en-US'); },
    chip:  function (no) { return String(no).replace('제', '제 '); }, // 칩 표기 '제 1호'
    pct:   function (part, whole) { return whole ? (part / whole * 100) : 0; },
    /* 양립불가 후속으로 폐기된 의안인가 */
    discarded: function (no) { return DISCARD[decided] === no; }
  };

  global.CX = { meeting: meeting, channels: channels, agenda: agenda, center: center, votingUnits: votingUnits, decided: decided, util: util };
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

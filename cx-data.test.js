/* node cx-data.test.js — cx-data.js 불변식 자체점검 */
const assert = require('assert');
const CX = require('./cx-data.js');

const sum = CX.channels.reduce((a, c) => a + c.w, 0);
assert.strictEqual(sum, CX.meeting.attendShares, '채널 합계 ≠ 출석의결권');
assert.strictEqual(CX.meeting.onsiteShares + CX.meeting.onlineShares, 300000000, '현장+온라인 의결권 ≠ 출석의결권');
assert.strictEqual(CX.meeting.onsiteHolders + CX.meeting.onlineHolders, CX.meeting.attendHolders, '현장+온라인 주주수 ≠ 출석 주주수');
assert.ok(CX.meeting.sharesVoting <= CX.meeting.sharesIssued, '의결권주식 > 발행주식');

const votable = CX.agenda.filter(a => !a.header && a.types).map(a => a.no);
assert.deepStrictEqual(votable, CX.votingUnits, 'agenda 표결단위 ≠ votingUnits');
assert.deepStrictEqual(Object.keys(CX.center), CX.votingUnits, 'center 키 ≠ votingUnits');

for (const [no, c] of Object.entries(CX.center)) {
  if (c.for != null) assert.strictEqual(c.for + c.against + c.abs, CX.meeting.attendShares, `${no} 찬반기권 합 ≠ 출석의결권`);
  if (c.cands) c.cands.forEach((x, i) => assert.strictEqual(x.rank, i + 1, `${no} 후보 rank 순서 오류`));
}

assert.strictEqual(CX.util.comma(476211964), '476,211,964');
assert.strictEqual(CX.util.chip('제1호'), '제 1호');
// 양립불가 후속 — 채택 라인은 남고 반대 라인만 폐기된다
assert.strictEqual(CX.decided, '회사', '제3-1호(회사제안) 가결 → decided 는 회사');
assert.strictEqual(CX.util.discarded('제4-2호'), true, '주주제안 집중투표(제4-2호)는 폐기여야 함');
assert.strictEqual(CX.util.discarded('제4-1호'), false, '채택 라인(제4-1호)은 폐기 대상 아님');
assert.strictEqual(CX.votingUnits.filter(n => CX.util.discarded(n)).length, 1, '폐기 의안은 정확히 1건');

console.log('cx-data.js OK');

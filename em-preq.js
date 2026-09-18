/* 전자주주총회 관리 · 사전 질의 관리 — 주주가 총회 전 등록한 질의 확인 · 답변 등록/수정/삭제 */
(function () {
  var root = document.getElementById('pqRoot');
  if (!root || !window.CX || !CX.roster || !window.EM) return;
  var cm = EM.cm, esc = EM.esc, ME = '박지용';

  /* ---------- 데이터 ---------- */
  var Q = [
    ['제1호', '배당 정책', '배당 정책 관련 향후 계획을 알고 싶습니다. 올해 배당성향을 상향할 계획이 있는지, 분기배당 도입도 검토 중인지 궁금합니다.', '중장기 배당성향 30% 수준 유지를 목표로 하고 있으며, 분기배당 도입은 내년 이사회에서 검토할 예정입니다.'],
    ['일반', '신규 사업 투자', '신규 사업 부문의 투자 규모는 어느 정도인가요?', ''],
    ['제2호', '사내이사 후보 이력', '이사 선임 안건의 후보자 이력을 확인하고 싶습니다.', '후보자 이력은 소집공고 첨부자료에 기재되어 있으며, 총회 당일 후보자 소개 시간에 추가로 안내드리겠습니다.'],
    ['일반', '자사주 매입', '자사주 매입·소각 계획이 있는지 궁금합니다.', ''],
    ['일반', '해외 실적 전망', '해외 법인의 올해 실적 전망을 알려주세요.', '해외 법인은 전년 대비 성장세를 유지하고 있으며 상세 수치는 IR 자료를 참고해 주세요.'],
    ['일반', 'ESG 계획', 'ESG 경영 관련 중장기 계획이 있나요?', ''],
    ['제3호', '이사 보수한도', '이사 보수한도 증액 사유가 궁금합니다. 전년 대비 인상 폭이 큰 것 같습니다.', ''],
    ['제1호', '재무제표 승인', '영업외비용 증가 원인에 대해 설명 부탁드립니다.', '금리 상승에 따른 이자비용 증가가 주된 원인입니다.'],
    ['일반', '전자주총 운영', '전자주주총회 당일 질의는 어떻게 하나요?', ''],
    ['제2호', '사외이사 독립성', '사외이사 후보의 독립성은 어떻게 검증하셨나요?', '사외이사후보추천위원회에서 이해관계 여부를 사전 확인하였습니다.']
  ];
  var people = CX.roster.filter(function (r, i) { return i % 11 === 2; });
  var L = [];
  for (var i = 0; i < 36; i++) {
    var q = Q[i % Q.length], r = people[i], ans = !!q[3] && i % 4 !== 3;
    L.push({
      k: i, r: r, lbl: q[0], title: q[1], body: q[2], at: '2026-07-' + EM.p2(10 + i % 12) + ' ' + EM.p2(9 + i % 9) + ':' + EM.p2((i * 7) % 60),
      ans: ans ? q[3] : '', by: ans ? ['김지만', '박지용', '이도현'][i % 3] : '', ansAt: ans ? '2026-07-' + EM.p2(12 + i % 12) + ' ' + EM.p2(10 + i % 7) + ':' + EM.p2((i * 11) % 60) : '',
      email: 'sh' + r.i + '@naver.com', phone: '010-' + (2000 + i * 131) + '-' + (4000 + i * 97)
    });
  }
  function st(x) { return x.ans ? '답변완료' : '대기'; }
  function voter(r) { var g = (CX.rosterGroups || []).filter(function (g) { return g.members.indexOf(r) >= 0; })[0]; return g ? g.voter : r.nm; }

  /* ---------- 표 ---------- */
  var COLS = [['상태', 104, 'c'], ['접수일', 120, 'c'], ['작성자', 120], ['의안번호', 80, 'c', 'c'], ['질의 내용', 0], ['담당자', 100, 'c'], ['답변일', 120, 'c']];
  function val(x, c) {
    switch (c) {
      case '상태': return st(x); case '접수일': return x.at.slice(0, 10); case '작성자': return x.r.nm; case '의안번호': return x.lbl;
      case '질의 내용': return x.title + ' ' + x.body; case '담당자': return x.by || '-'; case '답변일': return x.ansAt ? x.ansAt.slice(0, 10) : '-';
    }
    return '';
  }
  function cell(x, c) {
    if (c === '상태') return '<span class="lc-b ' + (x.ans ? 'blue' : 'gray') + '"><i></i>' + st(x) + '</span>';   /* dot 뱃지(로그인코드 관리와 같은 모양) */
    if (c === '질의 내용') return '<div class="pq-q"><span class="tt">' + esc(x.title) + '</span><span class="bd">' + esc(x.body) + '</span></div>';
    var t = val(x, c);
    return (c === '접수일' || c === '답변일' || t === '-') ? '<span class="mu">' + esc(t) + '</span>' : esc(t);
  }

  root.innerHTML = '<div class="lc">' +
    '<div class="lc-hd"><h2>사전 질의 관리</h2><p>주주총회 참석 주주의 사전 질의 현황 및 답변 관리 화면입니다.</p></div>' +
    '<div class="lc-bar"><div class="lc-chips" id="pqChips"></div><span data-cx-tools></span></div>' +
    '<div class="lc-wrap"><div class="lc-scroll"><table class="lctbl" id="pqTbl"><colgroup>' + COLS.map(function (c) { return c[1] ? '<col style="width:' + c[1] + 'px">' : '<col>'; }).join('') + '</colgroup>' +
      '<thead><tr>' + COLS.map(function (c) { return '<th' + (c[2] ? ' class="' + c[2] + '"' : '') + (c[3] ? ' data-al="' + c[3] + '"' : '') + '>' + c[0] + '</th>'; }).join('') + '</tr></thead><tbody id="pqBody"></tbody></table></div>' +
      '<div class="lc-foot"><span class="cnt" id="pqCount"></span><span class="lc-pg">페이지당 <select id="pqSize"><option>20</option><option>50</option><option>100</option></select><span class="lc-pages" id="pqPager"></span></span></div>' +
    '</div></div>' +
    '<div class="sheet-ov lc-sheet" id="pqSheet"><div class="sheet"><button class="sheet-x" data-sx aria-label="닫기"><i class="ph ph-x" style="font-size:16px"></i></button>' +
      '<div class="sheet-hd"><div class="sheet-t">상세 정보</div></div><div class="sheet-body" id="pqShBody"></div>' +
      '<div class="lc-shft"><div class="sheet-ft" id="pqShFt"></div><div class="lc-mod" id="pqShMod"></div></div></div></div>';

  var tbl = document.getElementById('pqTbl'), body = document.getElementById('pqBody');
  var chip = 'all', page = 1, pageSize = 20, lastTotal = 0, sortSt = null, filtPred = null;
  function rows() {
    var r = L.filter(function (x) { return chip === 'all' || st(x) === chip; });
    if (filtPred) r = r.filter(function (x) { return filtPred(function (i) { return String(val(x, COLS[i][0])); }); });
    if (sortSt && sortSt.dir) {
      var c = COLS[sortSt.idx][0], d = (sortSt.dir === 'desc' || sortSt.dir < 0) ? -1 : 1;
      r = r.slice().sort(function (a, b) { return String(val(a, c)).localeCompare(String(val(b, c)), 'ko') * d; });
    }
    return r;
  }
  function render() {
    var n = L.filter(function (x) { return x.ans; }).length;
    document.getElementById('pqChips').innerHTML = [['all', '전체', L.length], ['대기', '답변대기', L.length - n], ['답변완료', '답변완료', n]].map(function (c) {
      return '<button type="button" class="lc-chip' + (c[0] === chip ? ' on' : '') + '" data-chip="' + c[0] + '">' + c[1] + '<span class="c">' + c[2] + '</span></button>';
    }).join('');
    var r = rows(); lastTotal = r.length;
    var pages = Math.max(1, Math.ceil(r.length / pageSize)); if (page > pages) page = pages;
    body.innerHTML = r.slice((page - 1) * pageSize, page * pageSize).map(function (x) {
      return '<tr data-k="' + x.k + '">' + COLS.map(function (c) { return '<td' + (c[2] ? ' class="' + c[2] + '"' : '') + '>' + cell(x, c[0]) + '</td>'; }).join('') + '</tr>';
    }).join('') || '<tr><td colspan="' + COLS.length + '" class="lc-empty">등록된 질의가 없습니다.</td></tr>';
    document.getElementById('pqCount').textContent = '총 ' + r.length + '건';
    document.getElementById('pqPager').innerHTML = EM.pagerHtml(page, pages);
  }
  document.getElementById('pqChips').addEventListener('click', function (e) { var b = e.target.closest('[data-chip]'); if (!b) return; chip = b.dataset.chip; page = 1; render(); });
  document.getElementById('pqSize').addEventListener('change', function () { pageSize = parseInt(this.value, 10) || 20; page = 1; render(); });
  document.getElementById('pqPager').addEventListener('click', function (e) { var b = e.target.closest('.pp'); if (!b || b.classList.contains('dis')) return; page = EM.pagerGo(b.dataset.pg, page, Math.max(1, Math.ceil(lastTotal / pageSize))); render(); });
  tbl.addEventListener('cxsort', function (e) { e.preventDefault(); sortSt = { idx: e.detail.idx, dir: e.detail.dir }; page = 1; render(); });
  tbl.cxFilter = function (pred) { filtPred = pred; page = 1; render(); };
  tbl.cxValues = function (i) { return L.map(function (x) { return String(val(x, COLS[i][0])); }); };

  /* ---------- 상세 패널 ---------- */
  var sheet = document.getElementById('pqSheet'), cx = null, editing = false, mod = {};
  function kv(k, v) { return '<div class="lc-kv"><span class="k">' + k + '</span><span class="v">' + v + '</span></div>'; }
  function paint() {
    var x = cx, r = x.r, h = '';
    h += '<div class="pq-info">' + kv('주주명', esc(r.nm)) + kv('투표권자명', esc(voter(r))) + kv('구분', (r.fr === '외국인' ? '해외 ' : '') + (r.gb === '개인' ? '개인' : '법인') + ' 주주') + kv('보유 주식수', cm(r.sh) + '주') + kv('이메일', esc(x.email)) + kv('휴대폰번호', x.phone) + '</div>';
    h += '<div class="lc-sec"><div class="lc-sh"><span>질의 내용</span><span class="lc-b gray">' + esc(x.lbl) + '</span></div><div class="pq-qbox"><div class="tt">' + esc(x.title) + '</div><div class="bd">' + esc(x.body) + '</div><div class="pq-ans" style="background:none;border:none;padding:0"><div class="meta"><span>' + x.at + ' 작성</span></div></div></div></div>';
    if (x.ans && !editing) {
      h += '<div class="lc-sec"><div class="lc-sh"><span>답변</span></div><div class="pq-ans"><div class="bd">' + esc(x.ans) + '</div><div class="meta"><span>' + x.ansAt + ' · ' + esc(x.by) + '</span><span class="lk"><button type="button" data-a="edit">수정</button><span class="sep"></span><button type="button" data-a="del">삭제</button></span></div></div></div>';
    } else {
      h += '<div class="lc-sec"><div class="lc-sh"><label for="pqTa">답변</label></div><textarea class="pq-ta" id="pqTa" placeholder="주주에게 전달할 답변을 입력해 주세요">' + esc(editing ? x.ans : '') + '</textarea></div>';
    }
    document.getElementById('pqShBody').innerHTML = h;
    var form = !x.ans || editing;
    document.getElementById('pqShFt').innerHTML = form ? '<button type="button" class="btn" data-a="cancel">취소</button><button type="button" class="btn dark" data-a="save" disabled>저장</button>' : '<button type="button" class="btn" data-sx>닫기</button>';
    var m = mod[x.k] || (x.ans ? [x.ansAt, x.by] : [x.at, '시스템']);
    document.getElementById('pqShMod').textContent = '마지막 수정 ' + m[0] + ' · ' + m[1];
  }
  function close() { sheet.classList.remove('show'); cx = null; editing = false; }
  body.addEventListener('click', function (e) { var tr = e.target.closest('tr[data-k]'); if (!tr) return; cx = L[+tr.dataset.k]; editing = false; paint(); sheet.classList.add('show'); });
  sheet.addEventListener('input', function (e) { if (e.target.id === 'pqTa') { var s = sheet.querySelector('[data-a=save]'); if (s) s.disabled = !e.target.value.trim(); } });
  sheet.addEventListener('click', function (e) {
    if (e.target.closest('[data-sx]')) return close();
    var a = e.target.closest('[data-a]'); if (!a || a.disabled || !cx) return;
    var x = cx, act = a.dataset.a;
    if (act === 'cancel') { if (editing) { editing = false; paint(); } else close(); }
    else if (act === 'edit') { editing = true; paint(); document.getElementById('pqTa').focus(); }
    else if (act === 'save') {
      x.ans = document.getElementById('pqTa').value.trim(); x.by = ME; x.ansAt = EM.now(); mod[x.k] = [x.ansAt, ME];
      var was = editing; editing = false; render(); paint(); EM.toast(was ? '답변을 수정했습니다.' : '답변을 등록했습니다.');
    } else if (act === 'del') {
      EM.alertDlg({ ic: 'trash', t: '답변을 삭제하시겠습니까?', d: '삭제하면 주주 사이트에서도 답변이 사라지고 답변대기 상태로 돌아갑니다.', cancel: 1, ok: '삭제', danger: 1 }, function () {
        x.ans = ''; x.by = ''; x.ansAt = ''; mod[x.k] = [EM.now(), ME]; render(); paint(); EM.toast('답변을 삭제했습니다.');
      });
    }
  });

  render();
})();

/* 의안별 행사 현황 표 — 대시보드 현장 탭 · 사전 탭 · 사전 의결권 현황이 같은 표를 쓴다.
   AGX.table(bodyId)      : 표 마크업(카드 · colgroup · 헤더)
   AGX.render(body, state): 행을 그리고 개수를 돌려준다. state 는 의안번호 → 'wait'|'count'|'done'
                            현장 탭만 현장 제어 진행상태(localStorage.cxDayState)를 넘기고, 사전 화면은 {} → 전부 '예상' */
(function () {
  if (!window.CX) return;
  function cm(n) { return Math.round(n).toLocaleString('en-US'); }
  var AV = CX.meeting.sharesVoting;          /* 총 행사가능의결권 */
  var HOLDERS = CX.meeting.attendHolders;    /* 행사(출석) 주주수 */

  /* 의안 목록은 현장 제어와 같은 출처(CX.agenda · CX.center)에서 만든다.
     제2호 · 제4호처럼 표결하지 않는 상위 의안은 값 칸을 비워 둔다. */
  function catLabel(a) {                          /* 칩엔 양립불가·집중투표만 (보통/특별결의 숨김) */
    return (a.types || []).filter(function (t) { return t === '양립불가' || t === '집중투표'; }).join(' · ');
  }
  function agendaRows() {
    var out = [];
    CX.agenda.forEach(function (a) {
      var d = CX.center[a.no];
      if (!!a.header || !d) { out.push({ no: a.no, nm: a.nm, cat: catLabel(a), grp: true }); return; }
      if (d.cands) {                           /* 집중투표 — 부모행 + 후보 하위행 */
        var total = d.cands.reduce(function (t, c) { return t + c.votes; }, 0);
        out.push({ no: a.no, nm: a.nm, cat: catLabel(a), cumParent: true });
        d.cands.forEach(function (c) {
          out.push({ no: c.no, nm: c.name, cand: true, votes: c.votes, elected: c.elected, total: total, parentNo: a.no });
        });
        return;
      }
      if (d.options) {                         /* 양립불가 — 부모행 + 선택지 하위행 (현장제어 의안 트리와 동일) */
        out.push({ no: a.no, nm: a.nm, cat: catLabel(a), exclParent: true, parentNo: a.no });
        d.options.forEach(function (o) {
          out.push({ no: o.no, nm: o.name, opt: true, yes: o['for'], w: o['for'] + o.against + (o.abs || 0), result: o.result, parentNo: a.no });
        });
        return;
      }
      var r = { no: a.no, nm: a.nm, cat: catLabel(a) };
      r.sp = (d.thrLabel || '').indexOf('2/3') >= 0;
      r.dis = CX.util.discarded(a.no);
      r.yes = d['for']; r.w = d['for'] + d.against + (d.abs || 0);
      out.push(r);
    });
    return out;
  }
  function yesPct(y, dn) { return (y == null || dn == null || !dn) ? '' : cm(y) + ' (' + (y / dn * 100).toFixed(1) + '%)'; }
  function rowHead(a) {
    return '<td class="db-no">' + String(a.no).replace(/제|호/g, '') + '</td><td>' + a.nm
      + (a.cat ? '<span class="db-cat">' + a.cat + '</span>' : '') + '</td>';
  }
  function badge(st, ok) {
    if (st === 'drop') return '<span class="db-rb wait">폐기</span>';
    if (st === 'count') return '<span class="db-rb count">집계중</span>';
    return '<span class="db-rb ' + (ok ? 'pass' : 'fail') + '">' + (ok ? '가결' : '부결') + (st === 'done' ? '' : ' 예상') + '</span>';
  }
  function cumParentRow(a) {                    /* 집중투표 · 양립불가 부모행: 총 행사가능의결권 + 행사주주만 */
    return '<tr>' + rowHead(a)
      + '<td class="n">' + cm(AV) + '</td><td class="n">' + cm(HOLDERS) + '</td>'
      + '<td class="n"></td><td class="n"></td><td class="n"></td><td class="c"></td></tr>';
  }
  function subRow(a, w, y, ok, st) {            /* 집중투표 후보 · 양립불가 선택지 하위행 */
    return '<tr>' + rowHead(a)
      + '<td class="n"></td><td class="n"></td>'
      + '<td class="n">' + cm(w) + '</td>'
      + '<td class="n">' + yesPct(y, AV) + '</td>'
      + '<td class="n">' + yesPct(y, w) + '</td>'
      + '<td class="c">' + badge(st, ok) + '</td></tr>';
  }
  var EMPTY = '<td class="n"></td><td class="n"></td><td class="n"></td><td class="n"></td><td class="n"></td><td class="c"></td>';

  function render(body, STATE) {
    STATE = STATE || {};
    var c = { wait: 0, count: 0, pass: 0, fail: 0, drop: 0 };
    body.innerHTML = agendaRows().map(function (a) {
      if (a.grp) return '<tr class="grp">' + rowHead(a) + EMPTY + '</tr>';
      if (a.cumParent) return cumParentRow(a);
      if (a.exclParent) { var es = STATE[a.parentNo] || 'wait'; if (es === 'count') c.count++; else if (es === 'done') c.pass++; else c.wait++; return cumParentRow(a); }
      if (a.cand) return subRow(a, a.total, a.votes, a.elected, STATE[a.parentNo] || 'wait');
      if (a.opt) return subRow(a, a.w, a.yes, a.result === '가결', STATE[a.parentNo] || 'wait');
      var st = a.dis ? 'drop' : (STATE[a.no] || 'wait');
      if (st === 'drop') {
        c.drop++;
        return '<tr>' + rowHead(a) + '<td class="n">' + cm(AV) + '</td><td class="n"></td><td class="n"></td><td class="n"></td><td class="n"></td><td class="c">' + badge('drop') + '</td></tr>';
      }
      var ok = a.yes / AV * 100 >= (a.sp ? 33.33 : 25);
      if (st === 'count') c.count++;
      else if (st === 'done') { if (ok) c.pass++; else c.fail++; }
      else c.wait++;
      return '<tr>' + rowHead(a)
        + '<td class="n">' + cm(AV) + '</td><td class="n">' + cm(HOLDERS) + '</td>'
        + '<td class="n">' + cm(a.w) + '</td>'
        + '<td class="n">' + yesPct(a.yes, AV) + '</td>'
        + '<td class="n">' + yesPct(a.yes, a.w) + '</td>'
        + '<td class="c">' + badge(st, ok) + '</td></tr>';
    }).join('');
    return c;
  }
  function table(bodyId) {
    return '<div class="db-tblc"><table class="db-ft">'
      + '<colgroup><col style="width:6%"><col style="width:18%"><col style="width:14%"><col style="width:9%"><col style="width:12%"><col style="width:16%"><col style="width:16%"><col style="width:9%"></colgroup>'
      + '<thead><tr><th>번호</th><th>의안명</th><th class="n">총 행사가능의결권 ①</th><th class="n">행사주주</th><th class="n">총 행사의결권 ②</th><th class="n">① 찬성(률)</th><th class="n">② 찬성(률)</th><th class="c">결과</th></tr></thead>'
      + '<tbody id="' + bodyId + '"></tbody></table></div>';
  }
  window.AGX = { table: table, render: render };

  /* 번호 컬럼 계층형 정렬(오름/내림 토글) — 부모·자식 순서 유지 */
  function key(r) {
    var t = (r.cells[0] ? r.cells[0].textContent : '').trim();
    if (!t) return [Infinity];
    return t.split('-').map(function (n) { var v = parseInt(n, 10); return isNaN(v) ? 0 : v; });
  }
  function bindSort() {
    document.querySelectorAll('table.db-ft').forEach(function (tbl) {
      var th = tbl.tHead && tbl.tHead.rows[0] ? tbl.tHead.rows[0].cells[0] : null;
      if (!th || th.__sortBound) return;
      th.__sortBound = 1; th.__dir = 0; th.classList.add('db-sortable');
      var ind = document.createElement('span'); ind.className = 'db-sort-ind'; th.appendChild(ind);
      th.addEventListener('click', function () {
        var tb = tbl.tBodies[0]; if (!tb) return;
        th.__dir = th.__dir === 1 ? -1 : 1;
        var rows = Array.prototype.slice.call(tb.rows);
        rows.sort(function (a, b) {
          var ka = key(a), kb = key(b), n = Math.max(ka.length, kb.length);
          for (var i = 0; i < n; i++) {
            var x = ka[i], y = kb[i];
            if (x == null) return -1 * th.__dir;   /* 짧은 쪽(상위 의안) 먼저(오름) */
            if (y == null) return 1 * th.__dir;
            if (x !== y) return (x - y) * th.__dir;
          }
          return 0;
        });
        rows.forEach(function (r) { tb.appendChild(r); });
        ind.textContent = th.__dir === 1 ? '▲' : (th.__dir === -1 ? '▼' : '');
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindSort); else bindSort();
})();

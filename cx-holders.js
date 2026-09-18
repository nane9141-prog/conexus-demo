/* ============================================================================
 * cx-holders.js — 전자투표/위임 · 서면투표/위임 내역의 '주주 기준' 표 (주주명부 SSOT)
 *   · 행사 주주 = 주주명부(cx-roster) 사전의결권 행사 채널(r.pre)이 탭 채널과 맞는 주주
 *   · 통합기관은 참석자 관리와 같은 방식: 투표권자 칸 ▾버튼+이름, 주주명 칸 '통합 N건' 뱃지, 계좌 줄은 접힘
 *   · 페이지네이션(페이지당 20/50/100 · 번호 3개) · 컬럼 정렬은 전체 데이터 기준
 *   · 탭(data-cnt/data-shr)도 같은 데이터로 채워 KPI·합계가 표와 일치한다
 * cxHolders({ tabChannels: function(탭 이름) → 채널 배열, method: function(채널) → 행사방식 표기 })
 * ==========================================================================*/
(function () {
  var OP = {
    'for': '<span class="op for"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>찬성</span>',
    against: '<span class="op against"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>반대</span>',
    abs: '<span class="op abs"><svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>기권</span>'
  };
  var VOTES = ['for', 'for', 'for', 'against', 'for', 'abs', 'for', 'against'];
  var CHEV = '<svg viewBox="0 0 24 24"><path d="m18 15-6-6-6 6"/></svg>';
  var DR = 0.021;   /* 중복 수치 포함 시 가산 비율(페이지 KPI 와 같은 값) */

  function cm(n) { return Math.round(n || 0).toLocaleString('en-US'); }
  function num(t) { return parseInt(String(t || '').replace(/[^0-9]/g, ''), 10) || 0; }

  window.cxHolders = function (opt) {
    var wrap = document.getElementById('viewHolder'); if (!wrap || !window.CX || !CX.roster) return;
    var table = wrap.querySelector('table'), tbody = table.tBodies[0];

    /* 주주 단위 — 통합기관은 한 단위(대표 = 첫 계좌), 나머지는 주주 1명 */
    var gOf = {};
    (CX.rosterGroups || []).forEach(function (g) { g.members.forEach(function (m) { gOf[m.i] = g; }); });
    var seen = {}, UNITS = [];
    CX.roster.slice().sort(function (a, b) { return b.sh - a.sh; }).forEach(function (r) {
      var g = gOf[r.i];
      if (!g) { UNITS.push({ voter: r.voterSet === false ? '-' : r.nm, name: r.nm, pre: r.pre || [], members: [r], sh: r.sh }); return; }
      if (seen[g.id]) return; seen[g.id] = 1;
      UNITS.push({ voter: g.voter, name: g.members[0].nm, pre: g.members[0].pre || [], members: g.members,
        sh: g.members.reduce(function (a, m) { return a + m.sh; }, 0), grp: 1 });
    });
    function vote(r, c) { return VOTES[(r.i * 7 + c * 3) % VOTES.length]; }
    function miss(r) { return r.i % 13 === 0 ? Math.round(r.sh * 0.001) : 0; }

    /* 탭 → 행사 단위 */
    function forTab(label) {
      var chs = opt.tabChannels(label);
      return UNITS.filter(function (u) { return u.pre.some(function (c) { return chs.indexOf(c) >= 0; }); })
        .map(function (u) {
          var ch = u.pre.filter(function (c) { return chs.indexOf(c) >= 0; })[0];
          return { u: u, method: opt.method(ch) };
        });
    }
    /* 탭 숫자(명 · 주)를 명부 기준으로 */
    document.querySelectorAll('.evtab[data-cnt]').forEach(function (t) {
      var list = forTab(t.textContent.trim()), n = 0, s = 0;
      list.forEach(function (x) { n += x.u.members.length; s += x.u.sh; });
      t.setAttribute('data-cnt', cm(n)); t.setAttribute('data-shr', cm(s));
    });

    var page = 1, pageSize = 20, sortSt = null;
    function activeLabel() { var a = document.querySelector('#evFilled .evtab.active[data-cnt]'); return a ? a.textContent.trim() : ''; }
    function factor() { var t = document.getElementById('dupTgl'); return (t && t.classList.contains('on')) ? 1 / (1 - DR) : 1; }

    function cells(r, method, f) {
      var h = '<td class="c">' + method + '</td><td class="num">' + cm(r.sh * f) + '</td><td class="num mi">' + cm(miss(r) * f) + '</td>';
      for (var c = 0; c < 4; c++) h += '<td class="c">' + OP[vote(r, c)] + '</td>';
      return h + '<td class="num">' + cm(r.sh * 2 * f) + '</td><td class="num">' + cm(r.sh * 2 * f) + '</td>';
    }
    /* 이름은 칸 폭을 넘으면 말줄임 — 의안 칸이 늘어도 가로 스크롤이 생기지 않게 */
    function nm(t) { return '<span class="hn" title="' + String(t).replace(/"/g, '&quot;') + '">' + t + '</span>'; }
    function rowHTML(x, gid, f) {
      var u = x.u;
      if (!u.grp) return '<tr><td><div class="voter">' + nm(u.voter) + '</div></td><td>' + nm(u.name) + '</td>' + cells(u.members[0], x.method, f) + '</tr>';
      var sum = { i: u.members[0].i, sh: u.sh };
      var h = '<tr class="grp"><td><div class="voter"><button class="tw-chevron collapsed" data-toggle="' + gid + '" aria-label="통합 계좌 펼치기">' + CHEV + '</button>' + nm(u.voter) + '</div></td>'
        + '<td><span class="tag">통합 ' + u.members.length + '건</span></td>' + cells(sum, x.method, f) + '</tr>';
      u.members.forEach(function (m) { h += '<tr class="child hidden" data-child="' + gid + '"><td class="tcell"><span class="cv"></span></td><td>' + nm(m.nm) + '</td>' + cells(m, x.method, f) + '</tr>'; });
      return h;
    }
    function sortVal(x, label) {
      var u = x.u;
      if (/투표권자/.test(label)) return u.voter;
      if (/주주명/.test(label)) return u.name;
      if (/행사방식/.test(label)) return x.method;
      if (/미행사/.test(label)) return u.members.reduce(function (a, m) { return a + miss(m); }, 0);
      return u.sh;   /* 행사가능의결권 · 4-1 · 4-2 */
    }
    /* 칸 글자 — 컬럼 필터(전체 데이터 기준)용 */
    function cellText(x, label) {
      var u = x.u;
      if (/투표권자/.test(label)) return u.voter;
      if (/주주명/.test(label)) return u.grp ? '통합 ' + u.members.length + '건' : u.name;
      if (/행사방식/.test(label)) return x.method;
      return '';
    }
    var filtPred = null, lastN = 0;
    function heads() { return [].map.call(table.tHead.rows[0].cells, function (th) { return (th.textContent || '').trim(); }); }
    function render() {
      var list = forTab(activeLabel()), f = factor();
      if (filtPred) { var hs = heads(); list = list.filter(function (x) { return filtPred(function (i) { return cellText(x, hs[i]); }); }); }
      if (sortSt && sortSt.dir) {
        list.forEach(function (x, i) { x.o = i; });
        list.sort(function (a, b) {
          var p = sortVal(a, sortSt.label), q = sortVal(b, sortSt.label);
          var d = (typeof p === 'number') ? p - q : String(p).localeCompare(String(q), 'ko');
          return d ? sortSt.dir * d : a.o - b.o;
        });
      }
      var pages = Math.max(1, Math.ceil(list.length / pageSize)); lastN = list.length;
      if (page > pages) page = pages;
      var start = (page - 1) * pageSize;
      tbody.innerHTML = list.slice(start, start + pageSize).map(function (x, i) { return rowHTML(x, 'h' + (start + i), f); }).join('');
      pager(list.length ? pages : 0);
    }
    function pager(pages) {
      var el = document.getElementById('hoPager'); if (!el) return;
      var dP = page <= 1 ? ' dis' : '', dN = page >= pages ? ' dis' : '';
      var h = '<span class="pp' + dP + '" data-pg="first" aria-label="처음"><i class="ph ph-caret-double-left"></i></span>'
        + '<span class="pp' + dP + '" data-pg="prev" aria-label="이전"><i class="ph ph-caret-left"></i></span>';
      var s = Math.max(1, page - 1), e = Math.min(pages, s + 2); s = Math.max(1, e - 2);   /* 번호는 3개만 */
      for (var p = s; p <= e; p++) h += '<span class="pp' + (p === page ? ' cur' : '') + '" data-pg="' + p + '">' + p + '</span>';
      h += '<span class="pp' + dN + '" data-pg="next" aria-label="다음"><i class="ph ph-caret-right"></i></span>'
        + '<span class="pp' + dN + '" data-pg="last" aria-label="마지막"><i class="ph ph-caret-double-right"></i></span>'
        + '<span class="pgtot2">' + (pages ? page : 0) + ' / ' + pages + '</span>';
      el.innerHTML = h;
    }

    document.getElementById('hoPager').addEventListener('click', function (e) {
      var b = e.target.closest('.pp'); if (!b || b.classList.contains('dis')) return;
      var pages = Math.max(1, Math.ceil(lastN / pageSize)), v = b.getAttribute('data-pg');
      page = v === 'first' ? 1 : v === 'prev' ? page - 1 : v === 'next' ? page + 1 : v === 'last' ? pages : +v;
      render();
    });
    var ps = document.getElementById('hoPageSize');
    if (ps) ps.addEventListener('change', function () { pageSize = parseInt(this.value, 10) || 20; page = 1; render(); });
    table.cxFilter = function (pred) { filtPred = pred; page = 1; render(); };
    table.cxValues = function (i) { var h = heads()[i]; return forTab(activeLabel()).map(function (x) { return cellText(x, h); }); };
    table.addEventListener('cxsort', function (e) { e.preventDefault(); sortSt = { label: e.detail.label, dir: e.detail.dir }; page = 1; render(); });
    tbody.addEventListener('click', function (e) {
      var ch = e.target.closest('.tw-chevron'); if (!ch) return;
      ch.classList.toggle('collapsed');
      tbody.querySelectorAll('tr.child[data-child="' + ch.getAttribute('data-toggle') + '"]').forEach(function (r) { r.classList.toggle('hidden'); });
    });
    var dl = document.getElementById('dupLbl'); if (dl) dl.addEventListener('click', function () { setTimeout(render, 0); });
    window.pgApply = function () { page = 1; render(); };   /* 탭 전환(setCnt) 때 첫 페이지부터 */
    render();
  };
})();

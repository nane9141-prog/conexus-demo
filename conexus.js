/* CONEXUS 공통 키보드 인터랙션: Enter=저장, 타이핑=검색창 포커스 */
(function(){
  function visible(el){ return !!(el && el.offsetParent!==null); }
  var OVL='.overlay,.sheet,.dlg-ov,.dmodal-ov,.adlg-ov,.ovl,.dmodal,.bmodal,.dlg,.pop,.selpop,.cal,.menupop,.rpop';
  function findSearchInput(){
    var els=document.querySelectorAll('.search input, input#msearch, input[type="search"], input[placeholder*="검색"]');
    for(var i=0;i<els.length;i++){ if(visible(els[i])) return els[i]; }
    return null;
  }
  function findSaveButton(){
    var btns=document.querySelectorAll('button');
    for(var i=0;i<btns.length;i++){ var b=btns[i];
      if((b.textContent||'').trim()!=='저장') continue;
      if(b.closest && b.closest(OVL)) continue;
      if(!visible(b)) continue;
      return b;
    }
    return null;
  }
  document.addEventListener('keydown', function(e){
    var ae=document.activeElement, tag=ae?ae.tagName:'';
    var editing=(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||(ae&&ae.isContentEditable));
    if(e.key==='Enter'){
      if(tag==='TEXTAREA') return;                       // 줄바꿈 허용
      if(e.isComposing) return;                          // 한글 조합 중 무시
      if(ae&&ae.closest&&ae.closest(OVL)) return;        // 모달/시트는 자체 처리
      if(ae&&ae.closest&&ae.closest('.search')) return;  // 검색 Enter는 저장 아님
      var sb=findSaveButton();
      if(sb){ e.preventDefault(); sb.click(); }
      return;
    }
    if(editing) return;
    if(e.ctrlKey||e.metaKey||e.altKey) return;
    if(e.key && e.key.length===1 && /\S/.test(e.key)){   // 인쇄 가능한 글자 입력 시
      var si=findSearchInput();
      if(si){ si.focus(); }
    }
  });
})();

/* CONEXUS 공통 토스트: 저장/불러오기/등록/발급/반영 등 커밋 버튼 클릭 후 노출 */
(function(){
  var st=document.createElement('style');
  st.textContent='.cx-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(10px);background:#171717;color:#fff;font-size:14px;font-weight:500;padding:11px 18px;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.22);opacity:0;pointer-events:none;transition:opacity .18s,transform .18s;z-index:4000;white-space:nowrap}.cx-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}';
  (document.head||document.documentElement).appendChild(st);
  var el=null,timer=null,last=0;
  function toast(msg){
    var now=Date.now(); if(now-last<500) return; last=now;
    if(!el){ el=document.createElement('div'); el.className='cx-toast'; (document.body||document.documentElement).appendChild(el); }
    el.textContent=msg||'저장되었습니다.';
    el.classList.add('show');
    clearTimeout(timer); timer=setTimeout(function(){ el.classList.remove('show'); },1900);
  }
  window.cxToast=toast;
  var MAP={'저장':'저장되었습니다.','저장하기':'저장되었습니다.','불러오기':'설정을 불러왔습니다.','등록':'등록되었습니다.','발급':'발급되었습니다.','반영':'반영되었습니다.','현장대본 반영':'현장 대본에 반영되었습니다.'};
  document.addEventListener('click',function(e){
    var b=e.target.closest('button,.btn,.mbtn,.primary,.as-ok,.sdlg-btn.ok,.dmdlg-f button.dark,.sheet .primary');
    if(!b||b.disabled) return;
    var t=(b.textContent||'').replace(/\s+/g,' ').trim();
    if(!MAP[t]) return;
    // 페이지 자체 토스트가 이미 떠 있으면 생략(중복 방지)
    if(document.querySelector('.toast.show,.cs-toast.show,.as-toast.show,.dl-toast.show')) return;
    toast(MAP[t]);
  }, false);
})();

/* CONEXUS 표 공통 규칙 ─────────────────────────────────────────────────────
   컬럼 성격 하나로 정렬·가로정렬·필터를 함께 정한다.

   · 정렬 표시(▲▼)는 두지 않는다. 헤더를 눌러 정렬하되 아이콘이 없으므로
     헤더 글자가 본문 글자와 같은 자리에서 시작한다.
   · 정렬은 사람·수치·분류·일시 컬럼에만 건다. 의안명·의안번호·더보기는 뺀다.
   · 가로 정렬 — 이름/코드는 왼쪽, 의결권·지분율 같은 수치는 오른쪽,
     유형·상태·제한 같은 분류는 가운데. dot 뱃지가 든 칸은 왼쪽으로 돌린다.
   · 투표권자 칸은 본문 글자를 굵게(600) 쓴다.
   · 칸 너비는 내용에 맞춘다. 투표권자·의안명만 남는 자리를 나눠 갖는다.
     colgroup 으로 너비를 미리 짜 둔 표는 그 계획을 그대로 둔다.
   · 찬성·반대·기권·중립 헤더는 같은 기호를 달고 가운데로 둔다.
   · 투표권자·주주명·의안명은 텍스트 필터, 행사방식 같은 분류는 목록 필터.
     칸이 좁은 컬럼(100px 미만)은 필터를 달지 않는다.
   · 표 위 도구 두 개 — 행 높이, 컬럼 표시.

   새로 만드는 표도 이 규칙을 그대로 따른다. 표를 다시 그렸으면
   cxTable.apply(table) 한 번만 불러 주면 된다. */
(function () {
  var L = 'left', C = 'center', R = 'right';
  /* [헤더 이름, {al:가로정렬, sort:정렬 가능, ft:필터 종류, bold:본문 굵게}] — 위에서부터 먼저 맞는 것 */
  var RULES = [
    [/투표권자/, { al: L, sort: 1, ft: 'text', bold: 1, flex: 1 }],
    [/(주주명|성명|예탁자명|대리인명|후보자?명|템플릿명|명부명|양식명|파일명)/, { al: L, sort: 1, ft: 'text' }],
    [/의안명/, { al: L, sort: 0, ft: 'text', flex: 1 }],
    [/(의안번호|^의안$|^번호$)/, { al: L, sort: 0 }],
    [/(더보기|^상세$|^비고$|^관리$|^액션$|^삭제$|^수정$|설정$|통합내역|특수관계인|해제)/, { al: C, sort: 0 }],
    [/(의결권\s*제한|의안별\s*제한|주주\s*제한|제한사유)/, { al: C, sort: 1 }],
    [/(입장코드|참석번호|주주번호|^코드$|사번)/, { al: L, sort: 1 }],
    [/(방식|^채널$|^유형$|^구분$|종류|여부|결의방법|주주\s*구분|통합방법|^상태$|^예상$|앱\s*사용|^공개$|^결과$|참석|중복\s*처리|카테고리|전달\s*대상|적용조건)/,
      { al: C, sort: 1, ft: 'list' }],
    /* 의안 번호가 그대로 컬럼이 되는 표가 있다(1 · 2-1 · 3-1-1 …).
       찬반 표기일 때도 집중투표 표수일 때도 있어 찬반 칸과 똑같이 다룬다. */
    [/^(제\s*)?\d+(-\d+)*(호)?(\s*의안)?$/, { al: C, sort: 0, vote: 1 }],
    /* 행사 채널이 컬럼이 되는 표 — 집계 수치인 곳도, 보기 버튼인 곳도 있다.
       칸 내용을 보고 헤더까지 함께 정한다. */
    [/(전자투표|서면투표|전자위임|서면위임|사전\s*투표|현장\s*투표|온라인\s*투표|위임장)/, { al: R, sort: 1, auto: 1 }],
    /* 찬반 칸은 표에 따라 표기(체크)이기도 하고 수치이기도 하다.
       헤더는 늘 가운데, 본문은 칸 내용을 보고 정한다. */
    [/^(찬성|반대|기권|중립)(\s*\d+)?$/, { al: C, sort: 1, vote: 1 }],   /* '찬성 1' 처럼 단축키가 붙어도 잡는다 */
    [/(의결권|주식수|주식\s*총수|주수|주주수|주주$|단수주|지분율|비율|득표|수량|금액|표수|건수|변수|보유주식|찬성률|투표|분배|나이|연령|률$|율$)/, { al: R, sort: 1 }],
    [/(일시|시간|시각|일자|날짜|생년월일|기준일|등록일|수정일|접수|적용일|최종\s*수정)/, { al: C, sort: 1 }],
    [/(내용|사유|주소|명의개서|제목|질의|발언)/, { al: L, sort: 0, ft: 'text' }]
  ];
  var DEF = { al: L, sort: 1 };

  function rule(label) {
    for (var i = 0; i < RULES.length; i++) if (RULES[i][0].test(label)) return RULES[i][1];
    return DEF;
  }
  function label(th) {
    var t = (th.textContent || '').replace(/\s+/g, ' ').trim();
    return t;
  }
  function num(s) { var m = (s || '').replace(/[^0-9.\-]/g, ''); return (m === '' || m === '-') ? NaN : parseFloat(m); }
  function txt(el) { return (el ? el.textContent : '').replace(/\s+/g, ' ').trim(); }

  /* ── 팝오버 한 장을 돌려 쓴다 ─────────────────────────────────────── */
  var pop = null, popOwner = null;
  function menu() {
    if (!pop) {
      pop = document.createElement('div');
      pop.className = 'cxmenu';
      document.body.appendChild(pop);
      pop.addEventListener('click', function (e) { e.stopPropagation(); });
      document.addEventListener('click', hide);
      window.addEventListener('resize', hide);
      document.addEventListener('scroll', hide, true);
    }
    return pop;
  }
  function hide() {
    if (!pop) return;
    pop.classList.remove('on');
    if (popOwner) popOwner.classList.remove('on');
    popOwner = null;
  }
  function show(anchor, html, wire) {
    var m = menu();
    if (popOwner === anchor) { hide(); return; }
    hide();
    m.innerHTML = html;
    m.classList.add('on');
    popOwner = anchor; anchor.classList.add('on');
    var r = anchor.getBoundingClientRect();
    var left = Math.min(r.left, window.innerWidth - m.offsetWidth - 8);
    var top = r.bottom + 4;
    if (top + m.offsetHeight > window.innerHeight - 8) top = Math.max(8, r.top - 4 - m.offsetHeight);
    m.style.left = Math.max(8, left) + 'px';
    m.style.top = top + 'px';
    if (wire) wire(m);
  }

  var CHECK = '<span class="ck"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span>';
  var BOX = '<span class="bx"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span>';
  var SEARCH = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  var FUNNEL = '<svg viewBox="0 0 24 24"><path d="M3 5h18"/><path d="M7 12h10"/><path d="M11 19h2"/></svg>';

  /* 찬반 기호는 한 벌만 쓴다 — 현장 제어 · 의결권 행사현황을 기준으로 삼았다 */
  var VOTE = {
    '찬성': ['for', '<circle cx="12" cy="12" r="9"/>'],
    '반대': ['ag', '<path d="M18 6 6 18M6 6l12 12"/>'],
    '기권': ['ab', '<path d="M5 12h14"/>'],
    '중립': ['nt', '<rect x="5" y="5" width="14" height="14" rx="2"/>']
  };
  function voteHead(th, lb) {
    var v = VOTE[lb.slice(0, 2)];
    if (!v || th.__cxvh) return;
    th.__cxvh = 1;
    var kbd = th.querySelector('.kbd');   /* 단축키 배지는 헤더에 그대로 남긴다 */
    th.innerHTML = '<span class="cx-vh ' + v[0] + '"><svg viewBox="0 0 24 24">' + v[1]
      + '</svg>' + lb.slice(0, 2) + '</span>';
    if (kbd) th.firstChild.appendChild(kbd);
  }

  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  /* ── 표 하나 ──────────────────────────────────────────────────────── */
  function bodyRows(tb) {
    return Array.prototype.filter.call(tb.rows, function (r) {
      return r.cells.length > 1 && !r.querySelector('th') && !r.querySelector('[colspan]');
    });
  }

  /* 통합기관처럼 접었다 펴는 줄은 상위 줄에 딸린 것이다.
     정렬도 필터도 상위 줄을 기준으로 하고, 딸린 줄은 함께 따라간다. */
  var CHILD = '.pchild,.child,.atchild,.vchild,.subrow,[data-child]';
  function isChild(r) { return !!(r.matches && r.matches(CHILD)); }
  function blocks(tb) {
    var out = [], cur = null;
    Array.prototype.forEach.call(tb.rows, function (r) {
      if (cur && isChild(r)) { cur.rows.push(r); return; }
      cur = { lead: r, rows: [r] };
      out.push(cur);
    });
    return out;
  }

  function applyFilters(t) {
    blocks(t.tb).forEach(function (b) {
      var lead = b.lead;
      if (lead.cells.length < 2 || lead.querySelector('th')) return;
      var keep = true;
      for (var k in t.filters) {
        if (!t.filters[k]) continue;
        if (!t.filters[k](txt(lead.cells[+k]))) { keep = false; break; }
      }
      /* 남길 때는 인라인 값을 비운다 — 접혀 있는 줄은 그대로 접힌 채로 둔다 */
      b.rows.forEach(function (r) { r.style.display = keep ? '' : 'none'; });
    });
  }

  function textFilter(t, idx, th, btn) {
    var f = t.draft[idx] || { op: 'has', q: '' };
    var OPS = [['has', '포함'], ['eq', '같음'], ['start', '시작'], ['end', '끝남']];
    var html = '<div class="lb">' + esc(label(th)) + ' 필터</div>'
      + '<select>' + OPS.map(function (o) {
          return '<option value="' + o[0] + '"' + (f.op === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
        }).join('') + '</select>'
      + '<label class="srch">' + SEARCH + '<input type="text" placeholder="검색" value="' + esc(f.q) + '"></label>'
      + '<div class="foot"><button type="button" data-rst>초기화</button><button type="button" class="dark" data-ok>적용</button></div>';
    show(btn, html, function (m) {
      var sel = m.querySelector('select'), inp = m.querySelector('input');
      inp.focus();
      function commit() {
        var op = sel.value, q = inp.value.trim();
        t.draft[idx] = { op: op, q: q };
        t.filters[idx] = q ? function (v) {
          if (op === 'eq') return v === q;
          if (op === 'start') return v.indexOf(q) === 0;
          if (op === 'end') return v.slice(-q.length) === q;
          return v.indexOf(q) >= 0;
        } : null;
        btn.classList.toggle('cx-act', !!q);
        applyFilters(t); hide();
      }
      m.querySelector('[data-ok]').addEventListener('click', commit);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') commit(); });
      m.querySelector('[data-rst]').addEventListener('click', function () {
        t.draft[idx] = null; t.filters[idx] = null; btn.classList.remove('cx-act');
        applyFilters(t); hide();
      });
    });
  }

  function listFilter(t, idx, th, btn) {
    var seen = {}, vals = [];
    bodyRows(t.tb).forEach(function (r) {
      var v = txt(r.cells[idx]); if (!v || seen[v]) return; seen[v] = 1; vals.push(v);
    });
    var picked = t.draft[idx] || null;                       /* null 이면 전체 */
    var html = '<label class="srch">' + SEARCH + '<input type="text" placeholder="검색"></label>'
      + '<div class="lb">' + esc(label(th)) + '</div>'
      + '<div data-list>' + vals.map(function (v) {
          var on = !picked || picked.indexOf(v) >= 0;
          return '<button class="it' + (on ? ' on' : '') + '" type="button" data-v="' + esc(v) + '">'
            + '<span class="tx">' + esc(v) + '</span>' + CHECK + '</button>';
        }).join('') + '</div>'
      + '<div class="foot"><button type="button" data-rst>초기화</button><button type="button" class="dark" data-ok>적용</button></div>';
    show(btn, html, function (m) {
      var list = m.querySelector('[data-list]');
      m.querySelector('input').addEventListener('input', function (e) {
        var q = e.target.value.trim();
        list.querySelectorAll('.it').forEach(function (b) {
          b.style.display = (!q || b.getAttribute('data-v').indexOf(q) >= 0) ? '' : 'none';
        });
      });
      list.addEventListener('click', function (e) {
        var b = e.target.closest('.it'); if (b) b.classList.toggle('on');
      });
      m.querySelector('[data-ok]').addEventListener('click', function () {
        var on = Array.prototype.filter.call(list.querySelectorAll('.it'), function (b) { return b.classList.contains('on'); })
          .map(function (b) { return b.getAttribute('data-v'); });
        var all = (on.length === vals.length);
        t.draft[idx] = all ? null : on;
        t.filters[idx] = all ? null : function (v) { return on.indexOf(v) >= 0; };
        btn.classList.toggle('cx-act', !all);
        applyFilters(t); hide();
      });
      m.querySelector('[data-rst]').addEventListener('click', function () {
        t.draft[idx] = null; t.filters[idx] = null; btn.classList.remove('cx-act');
        applyFilters(t); hide();
      });
    });
  }

  function sortBy(t, idx, th) {
    var bs = blocks(t.tb);
    bs.forEach(function (b, k) { if (b.lead.__i == null) b.lead.__i = k; });
    var dir = th.__d === 1 ? -1 : (th.__d === -1 ? 0 : 1);
    t.ths.forEach(function (o) { if (o !== th) o.__d = 0; });
    th.__d = dir;
    bs.sort(function (a, b) {
      if (!dir) return a.lead.__i - b.lead.__i;
      var x = txt(a.lead.cells[idx]), y = txt(b.lead.cells[idx]);
      var nx = num(x), ny = num(y);
      return dir * ((!isNaN(nx) && !isNaN(ny)) ? nx - ny : x.localeCompare(y, 'ko'));
    });
    bs.forEach(function (b) { b.rows.forEach(function (r) { t.tb.appendChild(r); }); });
  }

  function headRow(tbl) {
    if (tbl.tHead && tbl.tHead.rows.length) return tbl.tHead.rows[tbl.tHead.rows.length - 1];
    var tb = tbl.tBodies[0];                                  /* thead 없이 첫 줄이 머리인 표도 있다 */
    if (tb && tb.rows.length && tb.rows[0].cells.length && tb.rows[0].cells[0].tagName === 'TH') return tb.rows[0];
    return null;
  }

  function apply(tbl) {
    if (!tbl || tbl.hasAttribute('data-nocx')) return;
    var hrow = headRow(tbl), tb = tbl.tBodies[0];
    if (!hrow || !tb) return;
    var t = tbl.__cx;
    if (!t) { t = tbl.__cx = { tbl: tbl, tb: tb, filters: {}, draft: {}, rowh: 0 }; }
    t.tb = tb;
    t.ths = Array.prototype.slice.call(hrow.cells);
    var rows = bodyRows(tb);

    t.ths.forEach(function (th, idx) {
      var lb = label(th);
      var old = th.querySelector('.cx-fbtn');
      if (old) { lb = lb; }
      var rl = rule(lb);
      var cells = rows.map(function (r) { return r.cells[idx]; }).filter(Boolean);

      /* dot 뱃지가 든 칸은 왼쪽으로 */
      var al = rl.al;
      if (cells.some(function (c) { return c.querySelector('.qmdot,.stbadge,.dotbadge'); })) al = L;

      /* 찬반 칸은 표마다 다르다 — 집계 수치면 오른쪽, 체크 표기면 가운데.
         헤더는 본문을 따라가야 글자가 어긋나지 않는다. */
      function isNum(c) { var v = txt(c); return v !== '' && !isNaN(num(v)); }
      var allNum = cells.length > 0 && cells.every(isNum);
      if (rl.vote) voteHead(th, lb);
      if (lb) { th.style.textAlign = rl.vote ? C : (rl.auto ? (allNum ? R : C) : al); }
      cells.forEach(function (c) {
        c.style.textAlign = (rl.vote || rl.auto)
          ? ((c.querySelector('input') || isNum(c)) ? R : C)
          : al;
        if (rl.bold) c.style.fontWeight = '600';
      });

      /* 칸 너비 — 글자 길이에 맞춰 좁히고, 투표권자·의안명이 남는 자리를 가져간다 */
      if (lb) {
        th.style.width = rl.flex ? 'auto' : '1%';
        th.style.whiteSpace = 'nowrap';
      }
      cells.forEach(function (c) { c.style.whiteSpace = rl.flex ? '' : 'nowrap'; });

      /* 정렬 — 표시는 없다 */
      var grouped = !!tb.querySelector('tr [colspan]');   /* 소계·그룹 줄이 있는 표 */
      var canSort = rl.sort && lb && rows.length > 1 && !grouped
        && !th.matches('.sortable,[data-key],[data-sort]');
      th.classList.toggle('cx-sort', !!canSort);
      if (canSort && !th.__cxSort) {
        th.__cxSort = 1;
        th.addEventListener('click', function (e) {
          if (e.target.closest('.cx-fbtn,a,button,input,select,label')) return;
          sortBy(t, idx, th);
        });
      }

      /* 필터 — 칸이 좁으면 달지 않는다 */
      var w = th.getBoundingClientRect().width;
      /* 채널 칸이 표기라면 목록으로 고를 수 있게 해 준다 — 수치면 거를 것이 없다 */
      var ft = rl.ft || (rl.auto && !allNum ? 'list' : 0);
      var canFilter = ft && lb && rows.length > 0 && (w === 0 || w >= 100);
      if (canFilter && !th.querySelector('.cx-fbtn')) {
        th.classList.add('cx-filterable');
        /* sticky 헤더를 덮어쓰지 않도록, 자리 기준이 없을 때만 relative 를 준다 */
        if (getComputedStyle(th).position === 'static') th.style.position = 'relative';
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'cx-fbtn'; b.title = lb + ' 필터';
        b.innerHTML = FUNNEL;
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          (ft === 'list' ? listFilter : textFilter)(t, idx, th, b);
        });
        th.appendChild(b);
      } else if (!canFilter) {
        var f = th.querySelector('.cx-fbtn'); if (f) f.remove();
        th.classList.remove('cx-filterable');
      }
    });

    applyFilters(t);
    tools(tbl, t);

    /* 본문을 다시 그리는 표가 많다 — 새 줄에도 같은 규칙이 붙도록 지켜본다 */
    if (!t.watch) {
      t.watch = new MutationObserver(function () {
        clearTimeout(t.timer);
        t.timer = setTimeout(function () { apply(tbl); }, 60);
      });
      t.watch.observe(tb, { childList: true });
    }
  }

  /* ── 표 위 도구 — 행 높이 · 컬럼 표시 ──────────────────────────────── */
  var ROWH = [['좁게', 36], ['보통', 0], ['넓게', 60]];
  function tools(tbl, t) {
    var host = tbl.closest('[data-cx-host]');
    host = host ? host.querySelector('[data-cx-tools]') : null;
    if (!host || host.__cx) return;
    host.__cx = 1;
    host.classList.add('cx-tools');
    host.innerHTML =
      '<button class="cx-tbtn" type="button" data-rowh title="행 높이">'
      + '<svg viewBox="0 0 24 24"><path d="M3 5h18M3 12h18M3 19h18"/></svg></button>'
      + '<button class="cx-tbtn" type="button" data-cols title="컬럼 표시">'
      + '<svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 12h4M12 12h8M4 17h12M20 17h0"/>'
      + '<circle cx="16" cy="7" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="17" r="2"/></svg></button>';

    host.querySelector('[data-rowh]').addEventListener('click', function (e) {
      e.stopPropagation();
      var b = e.currentTarget;
      show(b, '<div class="lb">행 높이</div>' + ROWH.map(function (r) {
        return '<button class="it' + (t.rowh === r[1] ? ' on' : '') + '" type="button" data-h="' + r[1] + '">'
          + '<span class="tx">' + r[0] + '</span>' + CHECK + '</button>';
      }).join(''), function (m) {
        m.addEventListener('click', function (ev) {
          var it = ev.target.closest('[data-h]'); if (!it) return;
          var h = +it.getAttribute('data-h');
          t.rowh = h;
          bodyRows(t.tb).forEach(function (r) {
            Array.prototype.forEach.call(r.cells, function (c) { c.style.height = h ? h + 'px' : ''; });
          });
          hide();
        });
      });
    });

    host.querySelector('[data-cols]').addEventListener('click', function (e) {
      e.stopPropagation();
      var b = e.currentTarget;
      t.hidden = t.hidden || {};
      var items = t.ths.map(function (th, i) {
        var lb = label(th); if (!lb) return '';
        return '<button class="it' + (t.hidden[i] ? '' : ' on') + '" type="button" data-c="' + i + '">'
          + BOX + '<span class="tx">' + esc(lb) + '</span></button>';
      }).join('');
      show(b, '<div class="lb">컬럼 표시</div>' + items
        + '<div class="foot"><button type="button" data-rst>초기화</button><button type="button" class="dark" data-ok>적용</button></div>',
        function (m) {
          m.addEventListener('click', function (ev) {
            var it = ev.target.closest('[data-c]'); if (it) { it.classList.toggle('on'); return; }
            if (ev.target.closest('[data-rst]')) { t.hidden = {}; paintCols(t); hide(); return; }
            if (!ev.target.closest('[data-ok]')) return;
            t.hidden = {};
            m.querySelectorAll('[data-c]').forEach(function (x) {
              if (!x.classList.contains('on')) t.hidden[+x.getAttribute('data-c')] = 1;
            });
            paintCols(t); hide();
          });
        });
    });
  }
  function paintCols(t) {
    var all = [t.ths].concat(Array.prototype.slice.call(t.tb.rows).map(function (r) {
      return Array.prototype.slice.call(r.cells);
    }));
    all.forEach(function (cells) {
      cells.forEach(function (c, i) { c.style.display = t.hidden[i] ? 'none' : ''; });
    });
  }

  function run() { Array.prototype.forEach.call(document.querySelectorAll('table'), apply); }
  window.cxTable = { apply: apply, run: run };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  setTimeout(run, 400); setTimeout(run, 1200);
})();

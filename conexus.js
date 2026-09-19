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
      if(!si) return;
      if(e.key==='/'){ e.preventDefault(); si.focus(); return; }   // '/' 는 검색창으로 이동만(글자는 입력하지 않음)
      si.focus();
    }
  });
})();

/* CONEXUS 공통 토스트: 저장/불러오기/등록/발급/반영 등 커밋 버튼 클릭 후 노출 */
(function(){
  var st=document.createElement('style');
  st.textContent='.cx-toast{position:fixed;right:24px;bottom:24px;display:flex;align-items:center;gap:8px;max-width:calc(100vw - 48px);box-sizing:border-box;padding:12px 16px;background:#F5F5F5;color:#0A0A0A;border:1px solid #E5E5E5;border-radius:10px;font-size:14px;line-height:20px;font-weight:500;letter-spacing:-.01em;box-shadow:0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.1);opacity:0;pointer-events:none;transform:translateY(8px);transition:opacity .18s,transform .18s;z-index:4000;white-space:nowrap}.cx-toast.show{opacity:1;transform:none}.cx-toast.err{background:#FDF4F5;border-color:#F8D4D8}.cx-toast .ti{color:#E9081B;font-size:18px;flex:none}';
  (document.head||document.documentElement).appendChild(st);
  var el=null,timer=null,last=0;
  /* cxToast(문구, 오류여부) — 오류면 연빨강 배경 + 경고 아이콘 (Figma 토스트) */
  function toast(msg,err){
    var now=Date.now(); if(now-last<500) return; last=now;
    if(!el){ el=document.createElement('div'); (document.body||document.documentElement).appendChild(el); }
    el.className='cx-toast'+(err?' err':'');
    el.innerHTML=(err?'<i class="ph ph-warning-circle ti"></i>':'')+'<span></span>';
    el.lastChild.textContent=msg||'저장되었습니다.';
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
   · 표 위 도구 두 개 — 줄 간격, 컬럼 표시. 자리만 <span data-cx-tools> 로 잡아 두면 된다.

   새로 만드는 표도 이 규칙을 그대로 따른다. 표를 다시 그렸으면
   cxTable.apply(table) 한 번만 불러 주면 된다. */
(function () {
  var L = 'left', C = 'center', R = 'right';
  /* [헤더 이름, {al:가로정렬, sort:정렬 가능, ft:필터 종류, bold:본문 굵게}] — 위에서부터 먼저 맞는 것 */
  var RULES = [
    /* 로그인코드 관리의 '연결된 투표권자' — 필터 없음 */
    [/^연결된 투표권자$/, { al: L, sort: 1, bold: 1, flex: 1 }],
    [/투표권자/, { al: L, sort: 1, ft: 'text', bold: 1, flex: 1 }],
    /* 문서·명부 이름 — 리스트의 주인공이라 남는 자리를 가져간다 */
    [/(템플릿명|명부명|양식명|파일명)/, { al: L, sort: 1, ft: 'text', flex: 1 }],
    [/(주주명|성명|예탁자명|대리인명|후보자?명|^이름$)/, { al: L, sort: 1, ft: 'text' }],
    [/의안명/, { al: L, sort: 0, ft: 'text', flex: 1 }],
    [/^의안\s*종류$/, { al: L, sort: 1, ft: 'list' }],
    [/^통합방법$/, { al: L, sort: 1, ft: 'list' }],
    [/^통합내역$/, { al: L, sort: 0 }],
    [/(의안번호|^의안$|^번호$)/, { al: L, sort: 0 }],
    [/^(의결권\s*행사|질의|발언|참여\s*방법)$/, { al: C, sort: 0 }],
    [/(더보기|^상세$|^비고$|^관리$|^액션$|^삭제$|^수정$|^처리$|^주주확인$|설정$|특수관계인|해제)/, { al: C, sort: 0 }],
    [/(의결권\s*제한|의안별\s*제한|주주\s*제한|제한사유)/, { al: C, sort: 1 }],
    [/(입장코드|참석번호|주주번호|^코드$|사번)/, { al: L, sort: 1 }],
    [/(주식수|보유주식|의결권수|주수)/, { al: R, sort: 1 }],   /* 참석주식수 등 주식수 컬럼 — '참석' 상태규칙보다 먼저 잡아 우측 정렬 · 필터 없음 */
    [/(방식|^채널$|^유형$|^구분$|종류|여부|결의방법|주주\s*구분|^상태$|^예상$|앱\s*사용|^공개$|^결과$|^권한$|참석|중복\s*처리|카테고리|전달\s*대상|적용조건|출석|시청|질의권|등록\s*경로|답변자|^담당자$)/,
      { al: C, sort: 1, ft: 'list' }],
    /* 사전 질의 관리 작성자 — 왼쪽 정렬 · 필터 없음 */
    [/^작성자$/, { al: L, sort: 1 }],
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
    [/(일시|시간|시각|일자|날짜|생년월일|기준일|등록일|수정일|신청일|발급일|작성일|답변일|접수|적용일|최종\s*수정)/, { al: C, sort: 1 }],
    /* 긴 글이 들어가는 칸 — 남는 자리를 가져간다 */
    [/(내용|사유|주소|명의개서|제목|질의|발언|가결\s*조건)/, { al: L, sort: 0, ft: 'text', flex: 1 }]
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
    m.style.width = m.style.minWidth = '';
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
  var CHEV = '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>';
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
  var CHILD = '.pchild,.child,.atchild,.vchild,.subrow,.mg-child,.cf-child,[data-child]';
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
    /* 페이지로 나눠 그리는 표(tbl.cxFilter 제공)는 화면 줄이 아니라 전체 데이터에서 거른다.
       표는 pred(textOf) 를 받아 두었다가 줄마다 textOf(칸 번호) → 칸 글자로 판정한다. null 이면 전체. */
    if (t.tbl.cxFilter) {
      var on = Object.keys(t.filters).filter(function (k) { return t.filters[k]; });
      t.tbl.cxFilter(on.length ? function (textOf) {
        return on.every(function (k) { return t.filters[k](String(textOf(+k) || '')); });
      } : null);
      return;
    }
    blocks(t.tb).forEach(function (b) {
      var lead = b.lead;
      if (lead.cells.length < 2 || lead.querySelector('th')) return;
      var keep = true;
      for (var k in t.filters) {
        if (!t.filters[k]) continue;
        if (!t.filters[k](txt(lead.cells[+k]))) { keep = false; break; }
      }
      /* 필터는 .cx-off 로만 숨긴다 — 접힘(hidden·inline display)과 섞이면 필터 해제 때 접힌 줄이 펼쳐진다 */
      b.rows.forEach(function (r) { r.classList.toggle('cx-off', !keep); });
    });
  }

  function textFilter(t, idx, th, btn) {
    var f = t.draft[idx] || { op: 'has', q: '' };
    var OPS = [['has', '포함'], ['eq', '같음'], ['start', '시작'], ['end', '끝남']];
    var html = '<div class="lb">' + esc(label(th)) + ' 필터</div>'
      /* 조건 선택 — 시스템 select 대신 필터 목록과 같은 드롭다운(목록은 박스 아래로 펼침) */
      + '<div class="cx-dd" data-v="' + f.op + '"><button type="button" class="cx-dd-t"><span>'
      + OPS.filter(function (o) { return o[0] === f.op; })[0][1] + '</span>' + CHEV + '</button>'
      + '<div class="cx-dd-l">' + OPS.map(function (o) {
          return '<button type="button" class="it' + (f.op === o[0] ? ' on' : '') + '" data-v="' + o[0] + '">'
            + '<span class="tx">' + o[1] + '</span>' + CHECK + '</button>';
        }).join('') + '</div></div>'
      + '<label class="srch">' + SEARCH + '<input type="text" placeholder="검색" value="' + esc(f.q) + '"></label>'
      + '<div class="foot"><button type="button" data-rst>초기화</button><button type="button" class="dark" data-ok>적용</button></div>';
    show(btn, html, function (m) {
      var dd = m.querySelector('.cx-dd'), inp = m.querySelector('input');
      dd.querySelector('.cx-dd-t').addEventListener('click', function () { dd.classList.toggle('open'); });
      dd.querySelector('.cx-dd-l').addEventListener('click', function (e) {
        var it = e.target.closest('[data-v]'); if (!it) return;
        dd.setAttribute('data-v', it.getAttribute('data-v'));
        dd.querySelector('.cx-dd-t span').textContent = it.textContent;
        dd.querySelectorAll('.it').forEach(function (x) { x.classList.toggle('on', x === it); });
        dd.classList.remove('open'); inp.focus();
      });
      inp.focus();
      function commit() {
        var op = dd.getAttribute('data-v'), q = inp.value.trim();
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
    /* 목록 항목 — 전체 데이터를 가진 표(tbl.cxValues)는 그 값, 아니면 화면의 줄 */
    var src = t.tbl.cxValues ? t.tbl.cxValues(idx) : bodyRows(t.tb).map(function (r) { return txt(r.cells[idx]); });
    src.forEach(function (v) { v = String(v == null ? '' : v).trim(); if (!v || seen[v]) return; seen[v] = 1; vals.push(v); });
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
    /* 페이지로 나눠 그리는 표는 화면에 있는 줄만이 아니라 전체 데이터로 정렬해야 한다.
       'cxsort' 를 막으면(preventDefault) 표가 직접 정렬하고, 아니면 여기서 줄을 옮긴 뒤 'cxsorted' 로 알린다. */
    var ev = new CustomEvent('cxsort', { bubbles: true, cancelable: true, detail: { idx: idx, dir: dir, label: label(th) } });
    if (!t.tbl.dispatchEvent(ev)) return;
    bs.sort(function (a, b) {
      if (!dir) return a.lead.__i - b.lead.__i;
      var x = txt(a.lead.cells[idx]), y = txt(b.lead.cells[idx]);
      var nx = num(x), ny = num(y);
      return dir * ((!isNaN(nx) && !isNaN(ny)) ? nx - ny : x.localeCompare(y, 'ko'));
    });
    bs.forEach(function (b) { b.rows.forEach(function (r) { t.tb.appendChild(r); }); });
    t.tbl.dispatchEvent(new CustomEvent('cxsorted', { bubbles: true, detail: { idx: idx, dir: dir } }));
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
    /* colgroup 으로 칸 너비를 직접 적어 둔 표 — 너비를 다시 쓰면 칸이 무너진다 */
    var fixed = getComputedStyle(tbl).tableLayout === 'fixed';
    /* 너비를 적어 두지도 않고 fixed 로 둔 표는 칸이 균등분할된다 —
       글자 길이에 맞춰 줄이려면 auto 로 두어야 한다 */
    if (fixed && !tbl.querySelector('col[style*="width"],col[width]')) {
      tbl.style.tableLayout = 'auto';
      fixed = false;
    }
    t.tb = tb;
    t.ths = Array.prototype.slice.call(hrow.cells);
    var rows = bodyRows(tb);

    t.ths.forEach(function (th, idx) {
      var lb = label(th);
      var old = th.querySelector('.cx-fbtn');
      if (old) { lb = lb; }
      var rl = rule(lb);
      var cells = rows.map(function (r) { return r.cells[idx]; }).filter(Boolean);

      /* 머리글이 빈 칸은 버튼·체크박스 자리다 — 표가 정한 정렬을 건드리지 않는다 */
      if (!lb) return;

      /* dot 뱃지가 든 칸은 왼쪽으로 */
      /* 표마다 다르게 둘 칸은 머리글 data-al(l·c·r)로 정렬을 덮어쓴다 */
      var al = { l: L, c: C, r: R }[th.getAttribute('data-al')] || rl.al;
      if (cells.some(function (c) { return c.querySelector('.qmdot,.stbadge,.dotbadge'); })) al = L;

      /* 찬반 칸은 표마다 다르다 — 집계 수치면 오른쪽, 체크 표기면 가운데.
         헤더는 본문을 따라가야 글자가 어긋나지 않는다. */
      function isNum(c) { var v = txt(c); return v !== '' && !isNaN(num(v)); }
      /* 빈 칸은 세지 않는다 — 한 줄이 비었다고 머리글이 가운데로 튀면 글자가 어긋난다 */
      var filled = cells.filter(function (c) { return txt(c) !== ''; });
      var allNum = filled.length > 0 && filled.every(isNum);
      if (rl.vote) voteHead(th, lb);
      if (lb) { th.style.textAlign = (rl.vote || rl.auto) ? (allNum ? R : C) : al; }
      /* 왼쪽 맞춤 칸은 필터 버튼을 글자 옆에 둔다 — 칸이 넓으면 오른쪽 끝은 너무 멀다 */
      th.classList.toggle('cx-al-l', !!lb && !rl.vote && !rl.auto && al === L);
      /* 보조 수치 칸 — 본문 글자를 muted-foreground로 */
      var mute = /^(주주번호|보유\s*주식수?|지분율|참석\s*주식수)$/.test(lb);
      cells.forEach(function (c) {
        c.style.textAlign = (rl.vote || rl.auto)
          ? ((c.querySelector('input') || isNum(c) || txt(c) === '') ? (allNum ? R : C) : C)
          : al;
        if (rl.bold) c.style.fontWeight = '600';
        if (mute) c.style.color = '#737373';
      });

      /* 칸 너비 — 글자 길이에 맞춰 좁히고, 투표권자·의안명이 남는 자리를 가져간다 */
      if (lb && !fixed) {
        th.style.width = rl.flex ? 'auto' : '1%';
        th.style.whiteSpace = 'nowrap';
      }
      if (!fixed) cells.forEach(function (c) { c.style.whiteSpace = rl.flex ? '' : 'nowrap'; });

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

      /* 필터 — 칸이 좁으면 달지 않는다. 달 수 있어도 글자를 덮으면 fitFilter 가 감춘다. */
      var w = th.getBoundingClientRect().width;
      /* 채널 칸이 표기라면 목록으로 고를 수 있게 해 준다 — 수치면 거를 것이 없다 */
      var ft = rl.ft || (rl.auto && !allNum ? 'list' : 0);
      var canFilter = ft && lb;   /* 데이터 유무·폭과 무관하게 필터 가능한 컬럼엔 아이콘 항상 노출(헤더 흔들림 방지) */
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
        th.classList.remove('cx-filterable', 'cx-tight');
      }
      fitFilter(th);
    });

    if (!t.tbl.cxFilter) applyFilters(t);
    if (t.hidden) paintCols(t);        /* 다시 그린 줄에도 컬럼 숨김 유지 */
    tools(tbl, t);
    watchFit(t, tbl);
    freezeWidths(t, tbl, fixed);

    /* 본문을 다시 그리는 표가 많다 — 새 줄에도 같은 규칙이 붙도록 지켜본다 */
    if (!t.watch) {
      /* 다시 그린 그 프레임 안에서(그리기 전에) 바로 적용한다 — 지연을 두면 정렬·필터 아이콘이
         붙기 전 모습이 한 번 보였다가 움직인다 */
      t.watch = new MutationObserver(function () { apply(tbl); });
      t.watch.observe(tb, { childList: true });
    }
  }

  /* 컬럼 폭 고정 — 검색·필터·정렬로 행이 바뀌어도 폭이 움직이지 않게 한다.
     내용맞춤(auto)으로 잰 자연 폭을 '단조 최대'로 확정: 한번 넓어진 칸은 다시 줄지 않는다.
     이름·의안명(flex)만 남는 자리를 가져가 말줄임/줄바꿈으로 흡수한다.
     colgroup 등으로 폭을 직접 짜 둔 표(fixed)는 그대로 존중한다. */
  function freezeWidths(t, tbl, fixed) {
    if (fixed) return;
    var cw = tbl.clientWidth; if (!cw) return;     /* 숨겨진 표는 보일 때 다시 잡는다 */
    var ths = t.ths || []; if (!ths.length) return;
    tbl.style.tableLayout = 'auto';                /* 자연 폭 측정 */
    ths.forEach(function (th) { th.style.width = ''; });   /* loop 가 넣은 width:1%(min-content) 제거 → 컨테이너에 맞춘 '자연 분배' 폭으로 잰다 */
    t.colW = t.colW || [];
    var flex = [], meas = ths.map(function (th, i) {
      var rl = rule(label(th)); flex[i] = !!(rl && rl.flex);
      return th.getBoundingClientRect().width;
    });
    /* 칸별 내용맞춤 폭을 단조 최대로 확정(한번 넓어지면 검색·필터로 안 줄어든다) */
    var fit = ths.map(function (th, i) {
      var w = Math.max(t.colW[i] || 0, Math.ceil(meas[i])); t.colW[i] = w; return w;
    });
    /* flex(이름·의안명)는 '남는 자리'를 나눠 갖되, 최소한 자기 내용 폭은 지켜 0 붕괴를 막는다 */
    var flexN = 0, fixedSum = 0;
    ths.forEach(function (th, i) { if (flex[i]) flexN++; else fixedSum += fit[i]; });
    var leftover = cw - fixedSum;
    ths.forEach(function (th, i) {
      var w = fit[i];
      if (flex[i] && flexN) w = Math.max(fit[i], Math.floor(leftover / flexN));
      th.style.width = w + 'px';
    });
    tbl.style.tableLayout = 'fixed';
  }

  /* 아이콘이 헤더 글자와 겹치는지 재어 본다. 겹치면 cx-tight 를 달아 평소에는 감춘다. */
  function fitFilter(th) {
    if (!th.querySelector('.cx-fbtn')) return;
    var cs = getComputedStyle(th);
    var inner = th.getBoundingClientRect().width
      - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
    /* 아직 자리가 잡히지 않았으면(숨은 표 등) 판단을 미룬다 — 섣불리 감추지 않는다 */
    if (!inner) { th.classList.remove('cx-tight'); return; }
    var tw = 0, r = document.createRange();
    for (var i = 0; i < th.childNodes.length; i++) {
      var n = th.childNodes[i];
      if (n.nodeType === 3 && n.textContent.trim()) { r.selectNodeContents(n); tw = r.getBoundingClientRect().width; break; }
    }
    /* 아이콘 20px + 글자와의 사이 6px */
    th.classList.toggle('cx-tight', tw + 26 > inner);
  }
  /* 칸 너비가 바뀔 때마다 다시 잰다 — 창 크기, 감춰 둔 표가 드러날 때, 컬럼을 숨겼을 때.
     처음 그릴 때는 표가 숨어 있어 너비가 0 이라, 이 자리에서 다시 재지 않으면 잘못 판단한다. */
  function watchFit(t, tbl) {
    if (t.ro || !window.ResizeObserver) return;
    t.ro = new ResizeObserver(function () {
      (t.ths || []).forEach(fitFilter);
      /* 숨겨졌던 표(탭 뒤 등)가 처음 보이면 그제야 폭을 확정한다 — 로드 때는 폭이 0이라 못 잡는다 */
      if (!t.roFroze && tbl.clientWidth && getComputedStyle(tbl).tableLayout !== 'fixed') {
        t.roFroze = 1; freezeWidths(t, tbl, false);
      }
    });
    t.ro.observe(tbl);
  }
  /* 탭을 갈아 끼우면 그제야 칸 너비가 잡힌다. 누른 뒤 한 박자 쉬고 모두 다시 잰다. */
  function refit() {
    Array.prototype.forEach.call(document.querySelectorAll('th.cx-filterable'), fitFilter);
  }
  function refitSoon() {
    requestAnimationFrame(function () { requestAnimationFrame(refit); });
    setTimeout(refit, 120);
  }
  document.addEventListener('click', refitSoon, true);
  /* 첫 화면은 글꼴이 내려오고 나서야 글자 폭이 확정된다 */
  window.addEventListener('load', refitSoon);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refitSoon);

  /* ── 표 위 도구 — 줄 간격 · 컬럼 표시 ──────────────────────────────────
     표 위 어딘가에 <span data-cx-tools></span> 만 두면 두 버튼이 그려진다.
     한 자리에서 표를 바꿔 보여 주는 화면이 있어(의안 기준 ↔ 주주 기준),
     도구는 늘 지금 보이는 표를 본다. */
  var ROWH = [['좁게', 36], ['보통', 0], ['넓게', 60]];
  /* 도구를 누른 그 순간 보이는 표가 대상이다 — 화면을 갈아 끼워도 따라간다 */
  function target(host) {
    for (var i = 0; i < host.__ts.length; i++) {
      if (host.__ts[i].tbl.offsetParent !== null) return host.__ts[i];
    }
    return host.__ts[0];
  }
  function toolSlot(tbl) {
    for (var el = tbl.parentElement; el && el !== document.body; el = el.parentElement) {
      var slot = el.querySelector('[data-cx-tools]');
      if (slot) return slot;
    }
    return null;
  }
  function tools(tbl, t) {
    var host = toolSlot(tbl);
    if (!host) return;
    host.__ts = host.__ts || [];
    if (host.__ts.indexOf(t) < 0) host.__ts.push(t);
    if (host.__cx) return;
    host.__cx = 1;
    host.classList.add('cx-tools');
    host.innerHTML =
      /* 줄 간격: Tabler line-height · 컬럼 표시: Phosphor SlidersHorizontal(regular) */
      '<button class="cx-tbtn" type="button" data-rowh title="줄 간격">'
      + '<svg viewBox="0 0 24 24"><path d="M3 8l3 -3l3 3"/><path d="M3 16l3 3l3 -3"/><path d="M6 5l0 14"/>'
      + '<path d="M13 6l7 0"/><path d="M13 12l7 0"/><path d="M13 18l7 0"/></svg></button>'
      + '<button class="cx-tbtn" type="button" data-cols title="컬럼 표시">'
      + '<svg class="cx-ph" viewBox="0 0 256 256"><path d="M40,88H73a32,32,0,0,0,62,0h81a8,8,0,0,0,0-16H135a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16Zm64-24A16,16,0,1,1,88,80,16,16,0,0,1,104,64ZM216,168H199a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16h97a32,32,0,0,0,62,0h17a8,8,0,0,0,0-16Zm-48,24a16,16,0,1,1,16-16A16,16,0,0,1,168,192Z"/></svg></button>';

    host.querySelector('[data-rowh]').addEventListener('click', function (e) {
      e.stopPropagation();
      var b = e.currentTarget, t = target(host);
      show(b, '<div class="lb">줄 간격</div>' + ROWH.map(function (r) {
        return '<button class="it' + (t.rowh === r[1] ? ' on' : '') + '" type="button" data-h="' + r[1] + '">'
          + '<span class="tx">' + r[0] + '</span>' + CHECK + '</button>';
      }).join(''), function (m) {
        m.addEventListener('click', function (ev) {
          var it = ev.target.closest('[data-h]'); if (!it) return;
          var h = +it.getAttribute('data-h');
          t.rowh = h;
          /* 칸 height 는 '최소값'이라 패딩·뱃지가 큰 표에선 좁아지지 않는다 — 표 클래스로 패딩까지 바꾼다.
             클래스라서 페이지 이동·검색으로 줄을 다시 그려도 유지된다. */
          t.tbl.classList.remove('cx-rh-s', 'cx-rh-l');
          if (h) t.tbl.classList.add(h < 40 ? 'cx-rh-s' : 'cx-rh-l');
          hide();
        });
      });
    });

    host.querySelector('[data-cols]').addEventListener('click', function (e) {
      e.stopPropagation();
      var b = e.currentTarget, t = target(host);
      t.hidden = t.hidden || {};
      var items = t.ths.map(function (th, i) {
        var lb = label(th); if (!lb) return '';
        return '<button class="it' + (t.hidden[i] ? '' : ' on') + '" type="button" data-c="' + i + '">'
          + '<span class="tx">' + esc(lb) + '</span>' + CHECK + '</button>';
      }).join('');
      /* 컬럼 필터(목록형)와 같은 모양 — 검색 · 제목 · 체크 표시 · 초기화/적용 */
      show(b, '<label class="srch">' + SEARCH + '<input type="text" placeholder="검색"></label>'
        + '<div class="lb">컬럼 표시</div><div data-list>' + items + '</div>'
        + '<div class="foot"><button type="button" data-rst>초기화</button><button type="button" class="dark" data-ok>적용</button></div>',
        function (m) {
          m.querySelector('input').addEventListener('input', function (e) {
            var q = e.target.value.trim();
            m.querySelectorAll('[data-c]').forEach(function (x) {
              x.style.display = (!q || x.textContent.indexOf(q) >= 0) ? '' : 'none';
            });
          });
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

  /* 페이지당 선택 — 시스템 select 대신 필터 메뉴와 같은 드롭다운.
     select 는 숨겨 값의 원본으로 두고, 고르면 change 를 보내 페이지 코드가 그대로 동작한다. */
  function pageSelect(sel) {
    if (sel.__cxs) return;
    sel.__cxs = 1;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'cx-sel';
    var h = sel.offsetHeight, cs = getComputedStyle(sel);
    if (h) b.style.height = h + 'px';
    b.style.fontSize = cs.fontSize;
    function paint() { var o = sel.options[sel.selectedIndex]; b.innerHTML = '<span>' + esc(o ? o.text : '') + '</span>' + CHEV; }
    paint();
    sel.style.display = 'none';
    sel.parentNode.insertBefore(b, sel.nextSibling);
    sel.addEventListener('change', paint);
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      show(b, Array.prototype.map.call(sel.options, function (o) {
        return '<button class="it' + (o.selected ? ' on' : '') + '" type="button" data-v="' + esc(o.value) + '">'
          + '<span class="tx">' + esc(o.text) + '</span>' + CHECK + '</button>';
      }).join(''), function (m) {
        m.style.width = m.style.minWidth = Math.max(b.offsetWidth, 72) + 'px';
        m.addEventListener('click', function (ev) {
          var it = ev.target.closest('[data-v]'); if (!it) return;
          sel.value = it.getAttribute('data-v');
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          hide();
        });
      });
    });
  }
  function run() {
    Array.prototype.forEach.call(document.querySelectorAll('table'), apply);
    Array.prototype.forEach.call(document.querySelectorAll('select'), function (s) {
      if (s.parentElement && /페이지당/.test(s.parentElement.textContent)) pageSelect(s);
    });
  }
  window.cxTable = { apply: apply, run: run };
  window.cxSelect = pageSelect;   /* 다른 화면의 select 도 같은 드롭다운으로 */

  /* 좌상단 로고·'대시보드' 메뉴 → 설정 대시보드(dashboard.html?tab=set) */
  (function(){
    function wire(){
      var DEST='dashboard.html?tab=set';
      var logo=document.querySelector('.lnb-brand img');
      if(logo && !logo.__cxHome){ logo.__cxHome=1; logo.style.cursor='pointer';
        logo.addEventListener('click',function(){ location.href=DEST; }); }
      document.querySelectorAll('.lnb-menu .nav-item[href^="dashboard.html"],.lnb-rail .railbtn[href^="dashboard.html"]').forEach(function(a){
        a.setAttribute('href',DEST);
      });
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',wire); else wire();
  })();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();

  /* FOUC 방지 노출 — 페이지 렌더·글꼴이 끝난 뒤 표 폭 보정을 '최종 내용' 기준으로 한 번 더 끝내고,
     한 프레임 쉬었다가 노출한다. (컬럼 fit 재계산으로 가로폭이 흔들리는 깜빡임 제거) */
  (function () {
    var shown = false;
    function finalizeAndShow() {
      if (shown) return; shown = true;
      try { if (window.cxTable && window.cxTable.run) window.cxTable.run(); } catch (e) {}  /* 최종 DOM 기준 폭 확정 */
      requestAnimationFrame(function () { document.documentElement.classList.add('cx-ready'); });
    }
    function afterRender() { requestAnimationFrame(function () { setTimeout(finalizeAndShow, 0); }); }
    function schedule() {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(afterRender);
        setTimeout(afterRender, 500);        /* 글꼴이 늦어도 화면은 막지 않는다 */
      } else { afterRender(); }
      window.addEventListener('load', finalizeAndShow);   /* 최후 보루 */
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule); else schedule();
  })();
  setTimeout(run, 400); setTimeout(run, 1200);

  /* 오버레이 스크롤바 — 네이티브 스크롤바(Windows 15~17px)가 내용 폭을 잡아먹지 않게,
     스크롤 영역은 네이티브 바를 감추고(.cx-ovs) 내용 위에 얇은 바를 띄운다.
     휠·트랙패드 스크롤은 그대로, 바는 드래그로도 움직인다. 처리하지 못한 영역은 네이티브 바 유지. */
  (function () {
    var SKIP = { TEXTAREA: 1, SELECT: 1, INPUT: 1, HTML: 1, BODY: 1 };
    /* conexus.css 를 싣지 않는 페이지도 있어 스타일을 여기서 넣는다 */
    var st = document.createElement('style');
    st.textContent = '.cx-ovs{scrollbar-width:none;scrollbar-gutter:auto!important}.cx-ovs::-webkit-scrollbar{display:none;width:0;height:0}.cx-sb{position:absolute;z-index:20;border-radius:9999px;background:rgba(0,0,0,.28);opacity:.55;transition:opacity .15s,background .15s;cursor:default;touch-action:none}.cx-sb-y{width:6px;margin-left:1px}.cx-sb-x{height:6px;margin-top:1px}.cx-ovs:hover>.cx-sb{opacity:1}.cx-sb:hover,.cx-sb.on{background:rgba(0,0,0,.45);opacity:1}';
    document.head.appendChild(st);
    function bar(el, ax) {
      var b = document.createElement('div');
      b.className = 'cx-sb cx-sb-' + ax;
      b.addEventListener('pointerdown', function (e) {
        e.preventDefault(); e.stopPropagation(); b.setPointerCapture(e.pointerId);
        var p0 = ax === 'y' ? e.clientY : e.clientX, s0 = ax === 'y' ? el.scrollTop : el.scrollLeft;
        var track = ax === 'y' ? el.clientHeight : el.clientWidth, full = ax === 'y' ? el.scrollHeight : el.scrollWidth;
        function mv(ev) { var d = ((ax === 'y' ? ev.clientY : ev.clientX) - p0) * full / track;
          if (ax === 'y') el.scrollTop = s0 + d; else el.scrollLeft = s0 + d; }
        function up() { b.removeEventListener('pointermove', mv); b.removeEventListener('pointerup', up); b.classList.remove('on'); }
        b.classList.add('on'); b.addEventListener('pointermove', mv); b.addEventListener('pointerup', up);
      });
      el.appendChild(b);
      return b;
    }
    function paint(el) {
      var o = el.__ovs, ch = el.clientHeight, cw = el.clientWidth, sh = el.scrollHeight, sw = el.scrollWidth;
      var y = sh > ch + 1, x = sw > cw + 1;
      o.y.style.display = y ? '' : 'none'; o.x.style.display = x ? '' : 'none';
      if (y) { var h = Math.max(24, ch * ch / sh), t = el.scrollTop * (ch - h) / (sh - ch);
        o.y.style.height = h + 'px'; o.y.style.top = (el.scrollTop + t) + 'px'; o.y.style.left = (el.scrollLeft + cw - 8) + 'px'; }
      if (x) { var w = Math.max(24, cw * cw / sw), l = el.scrollLeft * (cw - w) / (sw - cw);
        o.x.style.width = w + 'px'; o.x.style.left = (el.scrollLeft + l) + 'px'; o.x.style.top = (el.scrollTop + ch - 8) + 'px'; }
    }
    function adopt(el) {
      if (el.__ovs || SKIP[el.tagName] || el.closest('[data-nocx-sb]')) return;
      var cs = getComputedStyle(el);
      if (!/(auto|scroll)/.test(cs.overflowY + cs.overflowX) || cs.scrollbarWidth === 'none') return;
      if (cs.position === 'static') el.style.position = 'relative';
      el.classList.add('cx-ovs');
      el.__ovs = { y: bar(el, 'y'), x: bar(el, 'x') };
      var p = function () { paint(el); };
      el.addEventListener('scroll', p, { passive: true });
      if (window.ResizeObserver) {
        var ro = new ResizeObserver(p); ro.observe(el);
        Array.prototype.forEach.call(el.children, function (c) { if (!c.classList.contains('cx-sb')) ro.observe(c); });
        new MutationObserver(function () {
          Array.prototype.forEach.call(el.children, function (c) { if (!c.classList.contains('cx-sb')) ro.observe(c); });
          if (el.lastElementChild !== el.__ovs.x) { el.appendChild(el.__ovs.y); el.appendChild(el.__ovs.x); }
          p();
        }).observe(el, { childList: true });
      }
      p();
    }
    var tm;
    function scan() { Array.prototype.forEach.call(document.querySelectorAll('body *'), adopt); }
    function soon() { clearTimeout(tm); tm = setTimeout(scan, 150); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
    window.addEventListener('load', soon);
    document.addEventListener('click', soon, true);
    setTimeout(scan, 1300);
  })();
})();

/* 왼쪽 맨 아래 프로필 — 눌러서 계정 메뉴를 연다.
   페이지마다 같은 .foot-btn 하나뿐이라 여기서 한 번만 달아 둔다. */
(function () {
  var GROUPS = [
    [['회사 정보', ''], ['담당자 관리', 'staff-manage.html'], ['로그 관리', '']],
    [['개인정보', ''], ['로그아웃', '']]
  ];
  var pop = null, owner = null;

  function build() {
    pop = document.createElement('div');
    pop.className = 'profmenu';
    pop.innerHTML = GROUPS.map(function (g) {
      return '<div class="grp">' + g.map(function (it) {
        return '<button type="button" data-go="' + it[1] + '">' + it[0] + '</button>';
      }).join('') + '</div>';
    }).join('<hr>');
    document.body.appendChild(pop);
    pop.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      hide();
      var go = b.getAttribute('data-go');
      if (go) { location.href = go; return; }        /* 화면이 있는 항목은 그리로 간다 */
      if (window.cxToast) {
        cxToast(b.textContent === '로그아웃' ? '로그아웃했습니다.' : b.textContent + ' 화면을 준비 중입니다.');
      }
    });
    document.addEventListener('click', hide);
    window.addEventListener('resize', hide);
    document.addEventListener('scroll', hide, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
  }
  function hide() { if (pop) pop.classList.remove('on'); owner = null; }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.foot-btn'); if (!btn) return;
    e.stopPropagation();
    if (!pop) build();
    if (owner === btn) { hide(); return; }
    owner = btn;
    pop.classList.add('on');
    /* 아래쪽 끝에 있는 버튼이라 위로 편다 */
    var r = btn.getBoundingClientRect();
    var top = r.top - pop.offsetHeight - 6;
    if (top < 8) top = Math.min(r.bottom + 6, window.innerHeight - pop.offsetHeight - 8);
    pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - pop.offsetWidth - 8)) + 'px';
    pop.style.top = Math.max(8, top) + 'px';
  });
})();

/* 현장 제어 ↔ 의장·사회자 화면 — 같은 브라우저의 다른 탭끼리 상태를 나눈다.
   localStorage 한 칸에 쓰고, storage 이벤트로 받는다(같은 탭에는 즉시 호출). */
/* 화면끼리 주고받는 칸. 같은 호스트에서 연 창이면 다른 탭·다른 페이지에도 닿는다.
   cx.live 는 의안·표결 상태, cx.clock 은 시계와 영상 위치다. 시계는 몇 초마다
   바뀌므로 같은 칸에 두면 표결 상태만 보는 화면(프롬퍼터 등)이 헛되이 다시 그려진다. */
function cxChannel(K) {
  var subs = [];
  function get() { try { return JSON.parse(localStorage.getItem(K) || '{}'); } catch (e) { return {}; } }
  function fire(s) { subs.forEach(function (f) { try { f(s); } catch (e) {} }); }
  window.addEventListener('storage', function (e) { if (e.key === K) fire(get()); });
  return {
    get: get,
    set: function (patch) {
      var s = get();
      for (var k in patch) s[k] = patch[k];
      s.ts = Date.now();
      try { localStorage.setItem(K, JSON.stringify(s)); } catch (e) {}
      fire(s);
    },
    on: function (f) { subs.push(f); f(get()); }
  };
}
window.cxSync = cxChannel('cx.live');
window.cxClock = cxChannel('cx.clock');

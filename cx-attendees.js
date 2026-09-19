/* 참석자 명단 — cx-roster.js(SSOT) 에서 파생. 참석자 관리와 주주총회 현장 제어(제안 주주 검색)가 같은 명단을 쓴다.
   CX.buildAttendees() 는 부를 때마다 새 배열을 돌려준다(참석자 관리는 이 배열에 등록·철회를 반영한다).
   현장 참석자: site !== '미참석' · 전자주총 참석자: evote === '참석' · 비주주 참관인: nonsh */
(function () {
  var CX = window.CX = window.CX || {};
  function nonSh(nm,kind,org,phone,mail,memo){ return {nonsh:1, kind:kind, org:org||'-', phone:phone||'-', mail:mail||'-', memo:memo||'', proxy:'-', voter:nm, name:nm, no:'-', pre:[], hold:0, attend:0, ratio:'0.00%', site:'참관', app:'미사용', evote:'미참석', limit:'-', ag:null, key:nm+kind}; }
  function build(){
    var R=(window.CX&&CX.roster)?CX.roster:[];
    /* 사전투표: 미행사(기본) · 단일 채널 7종 · 중복행사(채널 2개 이상) */
    var LIMIT=['자사주','상호주','무효주','최대주주','공익법인(3% 모수 포함)','공익법인(3% 모수 제외)','금융보험사','최대주주 특수관계인','공익법인 특수관계인','금융보험사 특수관계인'];
    var AG=[['제2-1호','제2-2호'],['제3호'],['제2-1호','제3-1호','제3-2호'],['제4-1호']];
    var rows=R.slice().sort(function(a,b){return b.sh-a.sh;}).map(function(r,i){
      var code=(i%3===0)?'미발급':('EG-2026'+('000'+((i%900)+1)).slice(-4));
      /* 주주번호(대시 없음, 뒷자리 *): 개인 생년월일+성별+******, 외국인 개인 식별번호 12자리(뒤 6자리 *), 기관·법인 사업자번호(뒤 5자리 *) */
      var no=(r.gb==='개인'&&r.fr==='외국인')?('00000'+(r.i*982451653)%1e12).slice(-12,-6)+'******'
        :r.id.replace(/-/g,'').replace(/^(\d{7})\*+$/,'$1******');
      var pre=r.pre||[];   /* 사전의결권 행사 내역 — cx-roster SSOT */
      var site=r.site||['미참석','참석','일부 참석','참석','미참석'][i%5];
      if(!r.site && site==='참석' && pre.length && i%3===0) site='철회 후 참석';   /* 사전행사 철회 후 현장 참석(데모) */
      if(!r.site && site==='참석' && pre.length && i%3===1) site='참관';          /* 사전행사 유지 · 참관 참석(데모) */
      var ppl=(i%6===1)?2:1;                                 /* 주주+대리인 / 대리인 다수 */
      var app=(site==='미참석'||site==='참관')?'미사용':(ppl>1?['사용','일부 사용','미사용'][i%3]:(i%4===3?'미사용':'사용'));
      var lim=(i%7===3)?LIMIT[i%LIMIT.length]:'-';
      var PXN=['김민준','이서연','박지호','최유나','정도윤','한예린'];
      var o={proxy:(site!=='미참석'&&site!=='참관'&&r.i%4===1)?PXN[r.i%6]:'-', ac:r.ac, voter:(i%150===75)?'-':r.nm, name:r.nm, no:no, pre:pre, hold:r.sh,
        attend:site==='일부 참석'?Math.round(r.sh*0.6):0, ratio:r.rt.toFixed(2)+'%', site:site, app:app,
        code:code, evote:(i%3===1?'미참석':'참석'), limit:lim, ag:(lim!=='-'&&i%2)?AG[i%AG.length]:null};
      o.ri=r.i; o.key=o.voter+o.name+o.no+'#'+r.i;   /* 같은 이름·주주번호(마스킹)가 있어 명부 순번까지 붙인다 */
      return o;
    });
    /* 통합기관(cx-roster rosterGroups): 대표 1줄 + 계좌 줄(접힘). 대표 줄 상태값은 최대 보유 계좌 기준 */
    var byI={}; rows.forEach(function(x){byI[x.ri]=x;});
    ((window.CX&&CX.rosterGroups)||[]).forEach(function(g){
      var mem=g.members.map(function(r){return byI[r.i];}).filter(Boolean); if(mem.length<2) return;
      var lead={}; for(var k in mem[0]) lead[k]=mem[0][k];
      lead.voter=g.voter; lead.name=mem[0].name+' 외 '+(mem.length-1);
      lead.hold=0; lead.attend=0; var rt=0;
      mem.forEach(function(m){m.attend=lead.site==='일부 참석'?Math.round(m.hold*0.6):0; lead.hold+=m.hold; lead.attend+=m.attend; rt+=parseFloat(m.ratio); m.grouped=1;});
      lead.ratio=rt.toFixed(2)+'%'; lead.sub='통합 '+mem.length+'건'; lead.members=mem;
      lead.key=g.voter+mem.map(function(m){return m.name+m.no;}).join('');
      rows.push(lead);
    });
    rows=rows.filter(function(x){return !x.grouped;}).sort(function(a,b){return b.hold-a.hold;});
    /* 현장 참석 주주 60명(현장 제어의 현장 참석 수와 같다, CX.meeting.onsiteHolders) — 사전투표 미행사 주주(사전행사 유지 '참관'은 사전투표 내역 그대로) 중 보유주식 상위만 참석, 나머지는 미참석. 비주주 참관인은 따로 */
    var siteN=0, SITE_MAX=(window.CX&&CX.meeting&&CX.meeting.onsiteHolders)||60;
    rows.forEach(function(x){
      if(x.site==='미참석' || ((!x.pre.length || x.site==='참관') && ++siteN<=SITE_MAX)) return;
      x.site='미참석'; x.app='미사용'; x.proxy='-'; x.attend=0;
      (x.members||[]).forEach(function(m){ m.attend=0; });
    });
    /* 비주주(참관인 등) — 의결권 없음, 현장 참관 */
    [['정다은','임직원','KVIDIA 경영지원팀','010-2381-4410','daeun.jung@kvidia.co.kr','주주총회 운영 지원'],
     ['오민석','기자','한국경제신문 증권부','010-5527-1093','minsuk.oh@hankyung.com','취재 목적 참관'],
     ['최하린','변호사','법무법인 세종','010-9142-6678','harin.choi@shinkim.com','총회 진행 법률 자문']].forEach(function(n){ rows.push(nonSh.apply(null,n)); });
    return applySaved(rows);
  }
  /* 현장 참석 등록 저장 — 참석자 관리에서 등록·철회·비주주 추가한 결과를 브라우저에 남긴다(cx.att).
     현장 제어도 같은 값을 읽는다. 주주총회 현장 제어에서 '총회 종료'를 누르면 지운다(CX.resetMeeting). */
  var KEY = 'cx.att';
  function saved() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function applySaved(rows) {
    var sv = saved(); if (!sv) return rows;
    var on = sv.on || {};
    rows.forEach(function (x) {
      if (x.nonsh) return;
      var v = on[x.key];
      if (v) { x.site = v[0]; x.app = v[1]; x.proxy = v[2]; if (x.site === '일부 참석' && !x.attend) x.attend = Math.round(x.hold * 0.6); }
      else if (x.site !== '미참석') { x.site = '미참석'; x.app = '미사용'; x.proxy = '-'; x.attend = 0; (x.members || []).forEach(function (m) { m.attend = 0; }); }
    });
    if (sv.ns) rows = rows.filter(function (x) { return !x.nonsh; }).concat(sv.ns);
    return rows;
  }
  function save(D) {
    var on = {};
    D.forEach(function (x) { if (!x.nonsh && x.site !== '미참석') on[x.key] = [x.site, x.app, x.proxy]; });
    var ns = D.filter(function (x) { return x.nonsh; });
    try { localStorage.setItem(KEY, JSON.stringify({ on: on, ns: ns, ts: Date.now() })); } catch (e) {}
  }
  /* 현장 참석 인원 — 주주(sh) · 비주주(ns) */
  function counts(D) {
    D = D || build();
    return { sh: D.filter(function (x) { return !x.nonsh && x.site !== '미참석'; }).length,
             ns: D.filter(function (x) { return x.nonsh; }).length };
  }
  CX.attNonSh = nonSh;
  CX.buildAttendees = build;
  CX.saveAttendees = save;
  CX.attCounts = counts;
  CX.ATT_KEY = KEY;
})();

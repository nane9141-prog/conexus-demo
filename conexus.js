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

/* CONEXUS 공통 테이블 정렬: 헤더 클릭 시 정렬(정렬 표시는 히든, 활성 시 노출) */
(function(){
  var st=document.createElement('style');
  st.textContent='th.cx-sortable{cursor:pointer;user-select:none}th.cx-sortable .cx-ar{display:inline-block;width:0;height:0;margin-left:5px;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid currentColor;opacity:0;vertical-align:middle;transition:opacity .12s}th.cx-sortable.cx-asc .cx-ar{opacity:.85;border-top:none;border-bottom:5px solid currentColor}th.cx-sortable.cx-desc .cx-ar{opacity:.85}';
  (document.head||document.documentElement).appendChild(st);
  function num(s){ var m=(s||'').replace(/[^0-9.\-]/g,''); return (m===''||m==='-')?NaN:parseFloat(m); }
  function enhance(tbl){
    if(tbl.__cxSort) return;
    var thead=tbl.tHead, tb=tbl.tBodies[0];
    if(!thead||!tb||!thead.rows.length) return;
    if(tbl.querySelector('th.sortable')) return;                 // 자체 정렬 보유
    if(tb.querySelector('tr.child,tr.atchild,tr.grp,tr.vgrp,tr[data-child],tr[data-grp],tr[data-toggle]')) return; // 그룹/트리 테이블 제외
    var brows=Array.prototype.filter.call(tb.rows,function(r){return r.cells.length>1 && !r.querySelector('[colspan]');});
    if(brows.length<2) return;
    tbl.__cxSort=true;
    var hrow=thead.rows[thead.rows.length-1], ths=hrow.cells;
    Array.prototype.forEach.call(ths,function(th,idx){
      if(!(th.textContent||'').trim()) return;                   // 액션/빈 헤더 제외
      th.classList.add('cx-sortable');
      var ar=document.createElement('span'); ar.className='cx-ar'; th.appendChild(ar);
      th.addEventListener('click',function(e){
        if(e.target.closest('a,button,input,select,label')) return;
        var rows=Array.prototype.slice.call(tb.rows);
        rows.forEach(function(r,k){ if(r.__cxIdx==null) r.__cxIdx=k; });
        var dir=th.__cxDir===1?-1:(th.__cxDir===-1?0:1);
        Array.prototype.forEach.call(ths,function(o){ if(o!==th){o.__cxDir=0;o.classList.remove('cx-asc','cx-desc');} });
        th.__cxDir=dir; th.classList.remove('cx-asc','cx-desc'); if(dir===1)th.classList.add('cx-asc'); else if(dir===-1)th.classList.add('cx-desc');
        rows.sort(function(a,b){
          if(dir===0) return a.__cxIdx-b.__cxIdx;
          var x=(a.cells[idx]?a.cells[idx].textContent:'').trim(), y=(b.cells[idx]?b.cells[idx].textContent:'').trim();
          var nx=num(x),ny=num(y), c;
          if(!isNaN(nx)&&!isNaN(ny)) c=nx-ny; else c=x.localeCompare(y,'ko');
          return dir*c;
        });
        rows.forEach(function(r){ tb.appendChild(r); });
      });
    });
  }
  function run(){ Array.prototype.forEach.call(document.querySelectorAll('table'),enhance); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
  setTimeout(run,500); setTimeout(run,1200);
})();

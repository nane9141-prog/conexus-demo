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

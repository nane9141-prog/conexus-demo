/* 전자주주총회 관리 패널 공용 — 숫자·이스케이프·페이지네이션·알림 다이얼로그 (em-logincode.css 의 lc-* 스타일 사용) */
(function () {
  function cm(n) { return Math.round(n || 0).toLocaleString('en-US'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function p2(n) { return ('0' + n).slice(-2); }
  function now() { var d = new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()); }
  function toast(m) { if (window.cxToast) cxToast(m); }

  /* 번호 3개 페이지네이션 — data-pg 로 이동 */
  function pagerHtml(page, pages) {
    var dP = page <= 1 ? ' dis' : '', dN = page >= pages ? ' dis' : '';
    var h = '<span class="pp' + dP + '" data-pg="first" aria-label="처음"><i class="ph ph-caret-double-left"></i></span><span class="pp' + dP + '" data-pg="prev" aria-label="이전"><i class="ph ph-caret-left"></i></span>';
    var e = Math.min(pages, Math.max(1, page - 1) + 2), s = Math.max(1, e - 2);
    for (var p = s; p <= e; p++) h += '<span class="pp' + (p === page ? ' cur' : '') + '" data-pg="' + p + '">' + p + '</span>';
    return h + '<span class="pp' + dN + '" data-pg="next" aria-label="다음"><i class="ph ph-caret-right"></i></span><span class="pp' + dN + '" data-pg="last" aria-label="마지막"><i class="ph ph-caret-double-right"></i></span><span class="tot">' + page + ' / ' + pages + '</span>';
  }
  function pagerGo(v, page, pages) {
    return v === 'first' ? 1 : v === 'prev' ? Math.max(1, page - 1) : v === 'next' ? Math.min(pages, page + 1) : v === 'last' ? pages : (parseInt(v, 10) || 1);
  }

  /* Alert Dialog(320) — {ic:check|trash|warn|info, t, d, cancel, ok, danger} */
  var el = null, cb = null, cancelCb = null;
  var ICON = { check: ['ph-check-circle', ''], trash: ['ph-trash', 'red'], warn: ['ph-warning-circle', 'red'], info: ['ph-warning-circle', ''], undo: ['ph-arrow-u-up-left', 'red'] };
  function alertDlg(o, ok, cancel) {
    if (!el) {
      el = document.createElement('div'); el.className = 'lc-ov'; el.style.zIndex = 195;
      el.innerHTML = '<div class="lc-al" role="alertdialog" aria-modal="true"><div class="ah"><div class="am"><i class="ph"></i></div><div style="width:100%"><div class="at"></div><div class="ad"></div></div></div><div class="af"></div></div>';
      document.body.appendChild(el);
      el.addEventListener('click', function (e) {
        if (e.target.closest('[data-x]')) { el.classList.remove('show'); var c = cancelCb; cancelCb = cb = null; if (c) c(); return; }
        if (e.target.closest('[data-ok]')) { el.classList.remove('show'); var f = cb; cb = cancelCb = null; if (f) f(); }
      });
    }
    var ic = ICON[o.ic || 'check'], m = el.querySelector('.am');
    m.className = 'am ' + ic[1]; m.querySelector('i').className = 'ph ' + ic[0];
    el.querySelector('.at').textContent = o.t; el.querySelector('.ad').textContent = o.d || '';
    el.querySelector('.af').innerHTML = (o.cancel ? '<button class="btn" data-x>' + (o.cancel === 1 ? '취소' : o.cancel) + '</button>' : '') + '<button class="btn ' + (o.danger ? 'danger' : 'dark') + '" data-ok>' + (o.ok || '확인') + '</button>';
    cb = ok || null; cancelCb = cancel || null; el.classList.add('show');
  }

  /* 저장 안 한 변경 — 패널별 dirty 표시, 다른 메뉴로 이동하려 하면 확인 */
  var dirty = {};
  function activePanel() { var t = document.querySelector('.st-tab.active'); return t ? t.dataset.panel : ''; }
  function setDirty(panel, on) { dirty[panel] = !!on; }
  var passing = false;
  document.addEventListener('click', function (e) {
    if (passing) return;
    var go = e.target.closest('.st-item,a[href]'); if (!go) return;
    var p = activePanel(); if (!dirty[p]) return;
    if (go.classList.contains('st-item') && go.dataset.tab === p) return;
    e.preventDefault(); e.stopPropagation();
    alertDlg({ ic: 'info', t: '변경사항이 저장되지 않았습니다', d: '페이지를 나가면 변경한 내용이 사라집니다.', cancel: '계속 작성', ok: '나가기' }, function () {
      dirty[p] = false; passing = true; go.click(); passing = false;
    });
  }, true);
  window.addEventListener('beforeunload', function (e) { if (dirty[activePanel()]) { e.preventDefault(); e.returnValue = ''; } });
  function markDone(panel) { var it = document.querySelector('.st-item[data-tab="' + panel + '"]'); if (it) it.classList.add('done'); }

  window.EM = { cm: cm, esc: esc, p2: p2, now: now, toast: toast, pagerHtml: pagerHtml, pagerGo: pagerGo, alertDlg: alertDlg, setDirty: setDirty, markDone: markDone };
})();

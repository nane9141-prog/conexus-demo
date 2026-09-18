/* 전자주주총회 관리 · 사이트 설정 — 시청 사이트 URL · 언어 · 공지사항/팝업 목록 · 등록/수정 화면
   목록은 노출중 · 노출예정만 먼저, 전체보기로 게시 종료 포함. 행 클릭은 미리보기, ⋯ 은 상단고정 해제 · 수정 · 게시종료(게시하기) · 삭제 */
(function () {
  var root = document.getElementById('bsRoot');
  if (!root || !window.EM) return;
  var esc = EM.esc, M = (window.CX && CX.meeting) || { org: '회사명' };
  var URL_ = 'https://evote.conexus.co.kr/kakaobank-12';
  var T0 = new Date(); T0.setHours(0, 0, 0, 0);
  function d(off) { var x = new Date(T0); x.setDate(x.getDate() + off); return x.getFullYear() + '-' + EM.p2(x.getMonth() + 1) + '-' + EM.p2(x.getDate()); }
  var TODAY = d(0);

  /* ---------- 데이터 ---------- */
  var langEn = true, seq = 0;
  function item(o) { o.id = ++seq; return o; }
  var LIST = {
    notice: [
      item({ pin: true, tk: '제10기 정기주주총회 개최 안내', te: 'Notice of the 10th Annual General Meeting', bk: '제10기 정기주주총회를 아래와 같이 개최합니다.\n\n일시: 2026년 3월 27일(금) 오전 10시\n장소: 카카오뱅크 본사 대강당 및 전자주주총회', be: 'The 10th AGM will be held as follows.\n\nDate: March 27, 2026 10:00 KST', s: d(-10), e: d(20) }),
      item({ tk: '전자투표 행사 기간 안내', te: 'Electronic voting period', bk: '전자투표는 총회 전날 오후 5시까지 행사할 수 있습니다.', be: 'Electronic voting closes at 5 p.m. the day before the meeting.', s: d(-3), e: d(12) }),
      item({ tk: '사전 질의 접수 안내', te: 'Pre-meeting questions', bk: '총회 전 질의를 사이트에서 등록할 수 있습니다.', be: 'You may submit questions before the meeting.', s: d(5), e: d(15) }),
      item({ tk: '주주총회 소집공고 정정 안내', te: 'Correction to the convocation notice', bk: '소집공고 일부 내용이 정정되었습니다.', be: 'Part of the convocation notice has been corrected.', s: d(-40), e: d(-20) }),
      item({ tk: '시스템 점검 안내', te: 'System maintenance', bk: '안정적인 서비스를 위해 시스템 점검이 진행됩니다.', be: 'Scheduled maintenance.', s: d(-5), e: d(10), ended: true })
    ],
    popup: [
      item({ tk: '전자주주총회 참여 안내', te: 'How to join the e-AGM', bk: '본인인증 후 생중계 시청과 전자투표가 가능합니다.', be: 'Verify your identity to watch and vote.', s: d(-2), e: d(14) }),
      item({ tk: '모바일 시청 안내', te: 'Watching on mobile', bk: '모바일에서도 생중계를 시청할 수 있습니다.', be: 'You can watch on mobile.', s: d(3), e: d(14) }),
      item({ tk: '제9기 정기주주총회 결과 안내', te: 'Results of the 9th AGM', bk: '제9기 정기주주총회 결과를 안내드립니다.', be: 'Results of the 9th AGM.', s: d(-380), e: d(-350) })
    ]
  };
  var NAME = { notice: '공지사항', popup: '팝업' };
  function status(x) { return x.ended || x.e < TODAY ? '게시종료' : x.s > TODAY ? '노출예정' : '노출중'; }
  var TONE = { '노출중': 'blue', '노출예정': 'orange', '게시종료': 'gray' };
  var showAll = { notice: false, popup: false }, view = 'list', form = null;

  /* ---------- 목록 화면 ---------- */
  function listHtml(k) {
    var all = LIST[k].slice().sort(function (a, b) { return (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || (a.s < b.s ? 1 : -1); });
    var rows = showAll[k] ? all : all.filter(function (x) { return status(x) !== '게시종료'; });
    var hidden = all.length - all.filter(function (x) { return status(x) !== '게시종료'; }).length;
    return '<div class="ns-list"><div class="ns-row hd"><span>제목</span><span style="text-align:center">노출 상태</span><span>노출 기간</span><span></span></div>' +
      (rows.length ? rows.map(function (x) {
        var st = status(x);
        return '<div class="ns-row' + (st === '게시종료' ? ' ended' : '') + '" data-k="' + k + '" data-id="' + x.id + '"><span class="tt">' + (x.pin ? '<i class="ph ph-push-pin" title="상단 고정"></i>' : '') + '<span class="x">' + esc(x.tk) + '</span></span>' +
          '<span style="text-align:center"><span class="lc-b ' + TONE[st] + '"><i></i>' + st + '</span></span><span class="mu">' + x.s + ' ~ ' + x.e + '</span>' +
          '<span style="text-align:center"><button type="button" class="lc-more" aria-label="더보기"><i class="ph ph-dots-three"></i></button></span></div>';
      }).join('') : '<div class="ns-empty">노출 중이거나 예정된 ' + NAME[k] + '이 없습니다.</div>') + '</div>' +
      (hidden ? '<div class="ns-more-row"><button type="button" data-all="' + k + '">' + (showAll[k] ? '접기<i class="ph ph-caret-up"></i>' : '전체보기 (게시 종료 ' + hidden + '건 포함)<i class="ph ph-caret-down"></i>') + '</button></div>' : '');
  }
  function renderList() {
    root.innerHTML = '<div class="lc st-form" style="gap:24px;max-width:none">' +
      '<div class="pg-hd lc-hd" style="padding-bottom:0"><div style="flex:1"><h2>사이트 설정</h2><p>전자주주총회 사이트의 기본 정보와 공지·팝업 콘텐츠를 설정합니다.</p></div>' +
        '<div style="display:flex;gap:8px;flex:none"><button type="button" class="btn" id="bsGo"><i class="ph ph-arrow-square-out"></i>' + esc(M.org) + ' 전자주주총회</button><button type="button" class="btn dark" id="bsSave">저장</button></div></div>' +
      '<div class="st-section"><div class="sub-h">전자주주총회 시청 사이트 설정</div>' +
        '<div class="field"><label>시청 사이트 URL</label><div class="urlbox"><i class="ph ph-arrow-square-out" style="font-size:16px"></i><span class="urltxt">' + URL_ + '</span><button class="urlcopy" id="bsCopy">복사</button></div></div>' +
        '<div class="field"><label>언어 설정</label><div class="pg-chk"><label style="color:#737373"><input type="checkbox" checked disabled>국문 (필수)</label><label><input type="checkbox" id="bsEn"' + (langEn ? ' checked' : '') + '>영문</label></div>' +
        '<div class="pg-hint">영문을 선택하면 의안명 · 안건 파일 · 공지 · 팝업을 영문으로도 등록할 수 있습니다.</div></div></div>' +
      '<div class="pg-hr"></div>' +
      sect('notice', '공지사항 설정', '전자주주총회 사이트 상단에 노출되는 공지를 관리합니다. 상단 고정과 노출 기간을 설정할 수 있습니다.') +
      '<div class="pg-hr"></div>' +
      sect('popup', '팝업 설정', '사이트 접속 시 노출될 팝업 콘텐츠를 등록·관리합니다.') +
      '</div>';
  }
  function sect(k, t, dsc) {
    return '<div class="st-section" style="gap:12px"><div class="sub-flex"><div><div class="sub-h">' + t + '</div><div class="sub-help">' + dsc + '</div></div><button type="button" class="btn" data-new="' + k + '"><i class="ph ph-plus"></i>등록</button></div>' + listHtml(k) + '</div>';
  }

  /* ---------- 등록 · 수정 화면 ---------- */
  function editor(id, lb, v) {
    return '<div class="pg-f" style="flex:1"><label for="' + id + '">' + lb + '<span style="color:#E9081B">*</span></label><div class="ns-ed"><div class="tb" aria-hidden="true">' +
      ['text-b', 'text-italic', 'text-underline', 'text-strikethrough', '|', 'list-bullets', 'list-numbers', '|', 'link-simple', 'image'].map(function (i) { return i === '|' ? '<span class="sep"></span>' : '<button type="button" tabindex="-1"><i class="ph ph-' + i + '"></i></button>'; }).join('') +
      '</div><textarea id="' + id + '" placeholder="내용을 입력해 주세요">' + esc(v || '') + '</textarea></div></div>';
  }
  function renderForm() {
    var f = form, x = f.x || {}, k = f.k, en = langEn;
    var ttl = en ? '<div class="row2">' + fld('fTk', '제목(국문)', x.tk) + fld('fTe', '제목(영문)', x.te) + '</div>' : '<div class="row2">' + fld('fTk', '제목', x.tk) + '</div>';
    var bdy = en ? '<div class="row2">' + editor('fBk', '본문(국문)', x.bk) + editor('fBe', '본문(영문)', x.be) + '</div>' : '<div class="row2">' + editor('fBk', '본문(국문)', x.bk) + '</div>';
    root.innerHTML = '<div class="lc ns-form">' +
      '<div class="pg-hd" style="padding-bottom:0;align-items:center"><div style="display:flex;align-items:center;gap:8px"><button type="button" class="lc-more" id="fBack" aria-label="목록으로"><i class="ph ph-arrow-left"></i></button><span style="font-size:16px;line-height:24px;font-weight:600;color:#0A0A0A">' + NAME[k] + ' ' + (f.x ? '수정' : '등록') + '</span></div><button type="button" class="btn dark" id="fSave" disabled>저장</button></div>' +
      (k === 'notice' ? '<div class="pg-chk"><label><input type="checkbox" id="fPin"' + (x.pin ? ' checked' : '') + '>상단 고정</label></div>' : '') +
      '<div class="pg-row"><div class="pg-f" style="width:200px"><label for="fS">노출 시작일<span style="color:#E9081B">*</span></label><input type="date" class="pg-in" id="fS" style="width:200px" value="' + (x.s || TODAY) + '"><div class="hint">시작일 0시부터 노출됩니다.</div></div>' +
        '<div class="pg-f" style="width:200px"><label for="fE">노출 종료일<span style="color:#E9081B">*</span></label><input type="date" class="pg-in" id="fE" style="width:200px" value="' + (x.e || '') + '"><div class="err" id="fErr" hidden></div></div></div>' +
      ttl + bdy + '</div>';
    check();
  }
  function fld(id, lb, v) { return '<div class="pg-f"><label for="' + id + '">' + lb + '<span style="color:#E9081B">*</span></label><input class="pg-in" id="' + id + '" value="' + esc(v || '') + '" placeholder="제목을 입력해 주세요"></div>'; }
  function $(id) { return document.getElementById(id); }
  function v(id) { var e = $(id); return e ? e.value.trim() : ''; }
  function check() {
    var bad = v('fS') && v('fE') && v('fE') < v('fS');
    $('fErr').hidden = !bad; $('fErr').textContent = bad ? '종료일은 시작일 이후여야 합니다.' : '';
    var need = ['fS', 'fE', 'fTk', 'fBk'].concat(langEn ? ['fTe', 'fBe'] : []);
    $('fSave').disabled = bad || need.some(function (id) { return !v(id); });
  }
  function openForm(k, x) { form = { k: k, x: x || null }; view = 'form'; renderForm(); EM.setDirty('basic', false); }
  function backToList() { view = 'list'; form = null; EM.setDirty('basic', false); renderList(); }
  function find(k, id) { return LIST[k].filter(function (x) { return x.id === +id; })[0]; }

  /* ---------- 미리보기 모달 ---------- */
  var pv = document.createElement('div'); pv.className = 'lc-ov';
  pv.innerHTML = '<div class="lc-dl ns-pv" role="dialog" aria-modal="true"><div class="dh"><div class="lc-dt" id="pvT"></div></div><div class="dc"><div class="lc-seg" id="pvTabs" style="align-self:flex-start"><button type="button" class="on" data-l="ko">국문</button><button type="button" data-l="en">영문</button></div><div class="pt" id="pvTt"></div><div class="pb" id="pvB"></div></div><div class="df"><button class="btn dark" data-x>확인</button></div></div>';
  document.body.appendChild(pv);
  var pvX = null;
  function paintPv(l) {
    [].forEach.call($('pvTabs').children, function (b) { b.classList.toggle('on', b.dataset.l === l); });
    $('pvTt').textContent = l === 'en' ? pvX.te : pvX.tk; $('pvB').textContent = l === 'en' ? pvX.be : pvX.bk;
  }
  function openPv(k, x) { pvX = x; $('pvT').textContent = NAME[k] + ' 미리보기'; $('pvTabs').style.display = langEn ? '' : 'none'; paintPv('ko'); pv.classList.add('show'); }
  pv.addEventListener('click', function (e) {
    if (e.target.closest('[data-x]')) return pv.classList.remove('show');
    var t = e.target.closest('[data-l]'); if (t) paintPv(t.dataset.l);
  });

  /* ---------- 더보기 메뉴(128) ---------- */
  var menu = document.createElement('div'); menu.className = 'lc-menu'; menu.style.width = '128px'; document.body.appendChild(menu);
  var mx = null;
  function mi(a, ic, t, c) { return '<button type="button" data-a="' + a + '"' + (c ? ' class="' + c + '"' : '') + '><i class="ph ' + ic + '"></i>' + t + '</button>'; }
  function hideMenu() { menu.classList.remove('on'); }
  function openMenu(k, x, btn) {
    var ended = status(x) === '게시종료';
    menu.innerHTML = '<div class="g">' + (x.pin ? mi('unpin', 'ph-push-pin-slash', '상단고정 해제') : '') + mi('edit', 'ph-pencil-simple', '수정') + (ended ? mi('post', 'ph-arrow-counter-clockwise', '게시하기') : mi('end', 'ph-x', '게시종료')) + '</div><div class="sep"></div><div class="g">' + mi('del', 'ph-trash', '삭제', 'danger') + '</div>';
    mx = { k: k, x: x }; menu.classList.add('on');
    var r = btn.getBoundingClientRect();
    menu.style.left = Math.max(8, r.right - menu.offsetWidth) + 'px';
    menu.style.top = (r.bottom + 4 + menu.offsetHeight > innerHeight ? r.top - 4 - menu.offsetHeight : r.bottom + 4) + 'px';
  }
  menu.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b) return; hideMenu();
    var k = mx.k, x = mx.x, a = b.dataset.a;
    if (a === 'unpin') { x.pin = false; renderList(); EM.toast('상단 고정을 해제했습니다.'); }
    else if (a === 'edit') openForm(k, x);
    else if (a === 'end') { x.ended = true; renderList(); EM.toast('게시를 종료했습니다.'); }
    else if (a === 'post') { x.ended = false; if (x.e < TODAY) x.e = d(7); if (x.s > x.e) x.s = TODAY; renderList(); EM.toast('다시 게시했습니다.'); }
    else if (a === 'del') {
      var live = status(x) === '노출중';
      EM.alertDlg({ ic: 'trash', t: NAME[k] + (k === 'notice' ? '을' : '을') + ' 삭제하시겠습니까?', d: live ? '현재 사이트에 노출 중입니다. 삭제하면 즉시 사이트에서 내려갑니다.' : '삭제한 ' + NAME[k] + '은 복구할 수 없습니다.', cancel: 1, ok: '삭제', danger: 1 }, function () {
        LIST[k].splice(LIST[k].indexOf(x), 1); renderList(); EM.toast('삭제되었습니다.');
      });
    }
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.lc-menu') && !e.target.closest('.lc-more')) hideMenu(); });
  window.addEventListener('scroll', hideMenu, true);

  /* ---------- 이벤트 ---------- */
  root.addEventListener('click', function (e) {
    var t = e.target;
    if (view === 'form') {
      if (t.closest('#fBack')) {
        if (form.dirty) return EM.alertDlg({ ic: 'info', t: '변경사항이 저장되지 않았습니다', d: '목록으로 돌아가면 작성한 내용이 사라집니다.', cancel: '계속 작성', ok: '나가기' }, backToList);
        return backToList();
      }
      if (t.closest('#fSave') && !$('fSave').disabled) {
        var x = form.x || item({}), isNew = !form.x;
        x.pin = !!($('fPin') && $('fPin').checked); x.s = v('fS'); x.e = v('fE'); x.tk = v('fTk'); x.bk = v('fBk');
        if (langEn) { x.te = v('fTe'); x.be = v('fBe'); }
        if (isNew) LIST[form.k].unshift(x);
        var k = form.k; backToList(); EM.toast(NAME[k] + (isNew ? '을 등록했습니다.' : '을 수정했습니다.'));
      }
      return;
    }
    if (t.closest('#bsGo')) return window.open(URL_, '_blank');
    if (t.closest('#bsCopy')) { try { navigator.clipboard.writeText(URL_); } catch (_) {} return EM.toast('사이트 URL이 복사되었습니다'); }
    if (t.closest('#bsSave')) { EM.setDirty('basic', false); EM.markDone('basic'); return EM.toast('언어 설정을 저장했습니다.'); }
    var nw = t.closest('[data-new]'); if (nw) return openForm(nw.dataset.new);
    var all = t.closest('[data-all]'); if (all) { showAll[all.dataset.all] = !showAll[all.dataset.all]; return renderList(); }
    var row = t.closest('.ns-row[data-id]'); if (!row) return;
    var x = find(row.dataset.k, row.dataset.id), m = t.closest('.lc-more');
    if (m) { if (menu.classList.contains('on') && mx && mx.x === x) hideMenu(); else openMenu(row.dataset.k, x, m); return; }
    openPv(row.dataset.k, x);
  });
  root.addEventListener('input', function () { if (view === 'form') { form.dirty = true; EM.setDirty('basic', true); check(); } });
  root.addEventListener('change', function (e) {
    if (view === 'form') { form.dirty = true; EM.setDirty('basic', true); return check(); }
    if (e.target.id !== 'bsEn') return;
    if (e.target.checked) { langEn = true; EM.setDirty('basic', true); return; }
    e.target.checked = true;
    EM.alertDlg({ ic: 'warn', t: '영문 서비스를 해제하시겠습니까?', d: '영문 서비스를 해제하면 등록된 영문 의안명 및 파일 데이터가 모두 삭제됩니다. 계속하시겠습니까?', cancel: 1, ok: '해제하기', danger: 1 }, function () {
      langEn = false; $('bsEn').checked = false;
      ['notice', 'popup'].forEach(function (k) { LIST[k].forEach(function (x) { x.te = ''; x.be = ''; }); });
      EM.setDirty('basic', true);
    });
  });

  renderList();
})();

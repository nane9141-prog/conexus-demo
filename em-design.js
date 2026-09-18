/* 전자주주총회 관리 · 디자인 설정 — 기존 마크업 위에 동작을 붙인다
   컬러: HEX 입력 + 컬러피커 / 이미지: 파일 선택 → 형식·용량 검사 → 첨부·미리보기, X 는 삭제 확인
   메인 배너: 헤드라인 사용 토글(켜면 텍스트 컬러 선택, 기본 #000000) / SNS 이미지: 회사명·기수 문구 자동 합성 / 디자인 미리보기 */
(function () {
  var dp = document.querySelector('.st-tab[data-panel="design"]');
  if (!dp || !window.EM) return;
  var M = (window.CX && CX.meeting) || { org: '회사명', term: 'N', kind: '정기' };
  var TITLE = M.org + ' 제' + M.term + '기 ' + M.kind + '주주총회';
  function dirty() { EM.setDirty('design', true); }

  /* ---------- 컬러 — 스와치를 누르면 컬러피커 ---------- */
  var HEX = /^#([0-9a-fA-F]{6})$/;
  dp.querySelectorAll('.colorbox').forEach(function (box) {
    var sw = box.querySelector('.swatch'), tx = box.querySelector('input[data-color]');
    var pk = document.createElement('input'); pk.type = 'color'; pk.className = 'dz-pick'; box.appendChild(pk);
    sw.style.cursor = 'pointer'; sw.title = '컬러 선택';
    sw.addEventListener('click', function () { pk.value = HEX.test(tx.value.trim()) ? tx.value.trim() : '#000000'; pk.click(); });
    pk.addEventListener('input', function () { tx.value = pk.value.toUpperCase(); sw.style.background = pk.value; dirty(); });
    tx.addEventListener('input', dirty);
  });

  /* ---------- 이미지 업로드 ---------- */
  var OPTIONAL = { '로고 이미지 (영문/가로형)': 1, 'SNS 공유 이미지': 1 };
  var blocks = [].slice.call(dp.querySelectorAll('.imgblk,.og-left')).filter(function (b) { return b.querySelector('.attach') || /이미지/.test(b.querySelector('.ib-t') ? b.querySelector('.ib-t').textContent : ''); });
  function prevImg(b) { var p = b.querySelector('.ib-prev .pimg'); if (p) return p; if (b.classList.contains('og-left')) return dp.querySelector('.og-img .pimg'); return null; }
  function kb(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + 'MB' : Math.max(1, Math.round(n / 1024)) + 'KB'; }
  function attachHtml(name, size) {
    return '<span class="at-ic"><i class="ph ph-file" style="font-size:16px"></i></span><div class="at-body"><div class="at-n">' + EM.esc(name) + '</div><div class="at-m">' + name.split('.').pop().toLowerCase() + '・' + size + '</div></div>' +
      '<button class="at-x" data-atx aria-label="삭제"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>';
  }
  blocks.forEach(function (b) {
    var t = b.querySelector('.ib-t'); if (!t) return;
    var label = t.textContent.trim(), fav = /파비콘/.test(label);
    if (OPTIONAL[label]) t.innerHTML = EM.esc(label) + ' <span style="color:#737373;font-weight:400">(선택)</span>';
    var file = document.createElement('input'); file.type = 'file'; file.hidden = true;
    file.accept = fav ? '.png,.ico,.svg' : '.png,.jpg,.jpeg,.svg,.gif,.webp';
    var pick = document.createElement('button'); pick.type = 'button'; pick.className = 'btn'; pick.style.cssText = 'height:32px;border-radius:10px;align-self:flex-start';
    pick.innerHTML = '<i class="ph ph-upload-simple" style="font-size:16px"></i>파일 선택';
    b.querySelector('.ib-hd').after(pick); b.appendChild(file);
    var LIMIT = fav ? 1 : 5, EXT = fav ? /\.(png|ico|svg)$/i : /\.(png|jpe?g|svg|gif|webp)$/i;
    function sync() { pick.style.display = b.querySelector('.attach') ? 'none' : ''; }
    pick.addEventListener('click', function () { file.value = ''; file.click(); });
    file.addEventListener('change', function () {
      var f = file.files[0]; if (!f) return;
      if (!EXT.test(f.name)) return EM.toast('지원하지 않는 파일 형식입니다.');
      if (f.size > LIMIT * 1048576) return EM.toast('파일 용량이 ' + LIMIT + 'MB를 초과했습니다.');
      var at = document.createElement('div'); at.className = 'attach'; at.innerHTML = attachHtml(f.name, kb(f.size));
      pick.after(at);
      var img = prevImg(b); if (img) { img.src = URL.createObjectURL(f); img.style.visibility = ''; }
      sync(); dirty(); renderOg();
    });
    b._sync = sync; sync();
  });
  /* X — 기존 인라인 핸들러보다 먼저 받아 삭제 확인을 거친다 */
  dp.addEventListener('click', function (e) {
    var x = e.target.closest('[data-atx]'); if (!x) return;
    e.stopImmediatePropagation();
    var at = x.closest('.attach'), b = x.closest('.imgblk,.og-left');
    EM.alertDlg({ ic: 'trash', t: '이미지를 삭제하시겠습니까?', d: at.querySelector('.at-n').textContent + ' 파일이 삭제됩니다.', cancel: 1, ok: '삭제', danger: 1 }, function () {
      at.remove(); var img = prevImg(b); if (img) img.style.visibility = 'hidden';
      if (b._sync) b._sync(); dirty(); renderOg();
    });
  }, true);

  /* ---------- 메인 배너 — 헤드라인 사용 ---------- */
  var headBlk = [].filter.call(dp.querySelectorAll('.imgblk'), function (b) { return /헤드라인/.test(b.textContent); })[0];
  if (headBlk) {
    headBlk.querySelector('.ib-hd').innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><div class="ib-t">헤드라인 사용</div><button type="button" class="pg-sw" id="dzHead" role="switch" aria-checked="false"></button></div>' +
      '<div class="ib-d">배너 위에 총회명 헤드라인을 표시합니다. 배너 이미지는 <a href="#" id="dzHomeBan" style="color:#0071F3;text-decoration:underline">기업 홈 배너</a>와 같은 규격을 사용합니다.</div>';
    var line = headBlk.querySelector('.cbx-line'), white = line.querySelector('[data-cbx]'), ci = line.querySelector('input[data-color]');
    white.remove();   /* 기본 #000000 — 필요한 색은 직접 고른다 */
    ci.value = '#000000'; line.querySelector('.swatch').style.background = '#000000';
    line.insertAdjacentHTML('afterbegin', '<span style="font-size:14px;font-weight:500;color:#0A0A0A;min-width:96px">텍스트 컬러</span>');
    line.style.display = 'none';
    document.getElementById('dzHead').addEventListener('click', function () {
      var on = !this.classList.contains('on'); this.classList.toggle('on', on); this.setAttribute('aria-checked', on); line.style.display = on ? '' : 'none'; dirty();
    });
    document.getElementById('dzHomeBan').addEventListener('click', function (e) { e.preventDefault(); EM.toast('기업 홈 > 배너 설정으로 이동합니다.'); });
  }

  /* ---------- SNS 공유 이미지 — 문구 자동 합성 ---------- */
  var ogImg = dp.querySelector('.og-img');
  function renderOg() {
    if (!ogImg) return;
    var has = !!dp.querySelector('.og-left .attach');
    var ov = ogImg.querySelector('.ov');
    if (!ov) { ogImg.style.position = 'relative'; ov = document.createElement('div'); ov.className = 'ov'; ov.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:14px;background:linear-gradient(180deg,rgba(0,0,0,0) 35%,rgba(0,0,0,.6));color:#fff;gap:2px'; ogImg.appendChild(ov); }
    ov.innerHTML = '<b style="font-size:15px;line-height:21px">' + EM.esc(TITLE) + '</b><span style="font-size:12px;opacity:.85">전자주주총회 생중계</span>';
    ov.style.display = has ? 'flex' : 'none';
    var t = dp.querySelector('.og-t'); if (t) t.textContent = TITLE + ' 생중계';
  }
  renderOg();

  /* ---------- 디자인 미리보기 ---------- */
  var pv = document.createElement('div'); pv.className = 'lc-ov';
  pv.innerHTML = '<div class="lc-dl dz-prev" role="dialog" aria-modal="true"><button class="lc-x" data-x aria-label="닫기"><i class="ph ph-x"></i></button><div class="dh"><div class="lc-dt">디자인 미리보기</div></div><div class="dz-site" id="dzSite"></div><div class="df"><button class="btn dark" data-x>닫기</button></div></div>';
  document.body.appendChild(pv);
  pv.addEventListener('click', function (e) { if (e.target === pv || e.target.closest('[data-x]')) pv.classList.remove('show'); });
  var pvBtn = [].filter.call(dp.querySelectorAll('.st-head .btn'), function (b) { return /미리보기/.test(b.textContent); })[0];
  if (pvBtn) {
    pvBtn.innerHTML = '<i class="ph ph-eye" style="font-size:16px"></i>디자인 미리보기';
    pvBtn.addEventListener('click', function () {
      var cols = dp.querySelectorAll('.dc-colors input[data-color]'), main = cols[0] ? cols[0].value : '#4521E6';
      var logo = dp.querySelector('.imgblk .ib-prev .pimg'), ban = [].filter.call(dp.querySelectorAll('.imgblk'), function (b) { return /배너 이미지 \(PC\)/.test(b.textContent); })[0];
      var banImg = ban && ban.querySelector('.pimg'), headOn = document.getElementById('dzHead') && document.getElementById('dzHead').classList.contains('on');
      var hc = headBlk ? headBlk.querySelector('input[data-color]').value : '#000000';
      document.getElementById('dzSite').innerHTML = '<div class="top">' + (logo && logo.style.visibility !== 'hidden' ? '<img src="' + logo.src + '" alt="">' : '<span class="nm">' + EM.esc(M.org) + '</span>') + '<span class="sp"></span><span class="cta" style="background:' + main + '">생중계 입장</span></div>' +
        '<div class="ban" style="background-color:#F5F5F5;' + (banImg && banImg.style.visibility !== 'hidden' ? 'background-image:url(' + banImg.src + ');' : '') + 'color:' + hc + '">' + (headOn ? '<b>' + EM.esc(TITLE) + '</b><span>' + EM.esc(M.dateText || '') + '</span>' : '') + '</div>' +
        '<div class="body"><div></div><div></div><div></div></div>';
      pv.classList.add('show');
    });
  }

  /* ---------- 저장 ---------- */
  var save = dp.querySelector('.st-save');
  if (save) save.addEventListener('click', function () { EM.setDirty('design', false); EM.toast('저장되었습니다'); });
})();

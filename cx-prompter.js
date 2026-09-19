/* ============================================================
 * CONEXUS 데모 — 의장용 · 사회자용 프롬프터 (공용)
 * 두 화면은 구성이 같다. 대본만 배역에 따라 갈린다.
 *   cxPrompter({ role:'chair' })  ·  cxPrompter({ role:'mc' })
 * 현장 제어(onsite-control)의 표결 콘트롤을 cxSync 로 받아 자동 전환한다.
 * ============================================================ */
(function (global) {
  'use strict';
  var CX = global.CX, cm = CX.util.comma, M = CX.meeting;

  /* ---------- 뼈대 스타일 ---------- */
  var CSS = [
    '*{margin:0;padding:0;box-sizing:border-box}',
    'html,body{height:100%}',
    "body{font-family:'Pretendard',system-ui,sans-serif;background:#0A0A0A;color:#E5E5E5;overflow:hidden}",
    '.pv{height:100%;display:flex;flex-direction:column}',
    '.pv-ct{flex:1;min-height:0;display:flex;align-items:stretch;padding:32px;gap:24px;position:relative}',
    /* 식순 세로 탭 */
    '.pv-left{width:auto;min-width:44px;flex:none;display:flex;flex-direction:column;gap:10px;overflow:auto}',
    '.pv-left::-webkit-scrollbar{display:none}',
    '.pv-vt{min-width:44px;height:32px;flex:none;display:flex;align-items:center;justify-content:center;padding:4px 8px;white-space:nowrap;',
    '  border:1px solid transparent;border-radius:8px;background:none;cursor:pointer;',
    "  font-family:inherit;font-size:16px;line-height:24px;font-weight:500;letter-spacing:-.01em;color:#A3A3A3}",
    '.pv-vt:hover{color:#E5E5E5}',
    '.pv-vt.on{color:#FAFAFA;background:rgba(255,255,255,.045);border-color:rgba(255,255,255,.15);box-shadow:0 1px 3px rgba(0,0,0,.1),0 1px 2px -1px rgba(0,0,0,.1)}',
    '.pv-sep{width:1px;flex:none;background:rgba(255,255,255,.1)}',
    /* 본문 */
    '.pv-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:16px}',
    '.pv-top{min-height:32px;flex:none;display:flex;align-items:center;gap:12px}',
    '.pv-tabs{display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0}',
    '.pv-t{height:32px;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:4px 8px;',
    '  border:1px solid transparent;border-radius:8px;background:none;cursor:pointer;white-space:nowrap;',
    "  font-family:inherit;font-size:16px;line-height:24px;font-weight:500;letter-spacing:-.01em;color:#A3A3A3}",
    '.pv-t:hover{color:#E5E5E5}',
    '.pv-t.on{color:#FAFAFA;background:rgba(255,255,255,.045);border-color:rgba(255,255,255,.15);box-shadow:0 1px 3px rgba(0,0,0,.1),0 1px 2px -1px rgba(0,0,0,.1)}',
    '.pv-cast{height:32px;display:inline-flex;align-items:center;padding:8px 10px;border:1px solid #0071F3;border-radius:10px;',
    '  background:#0A0A0A;font-size:16px;line-height:16px;font-weight:600;letter-spacing:-.01em;color:#0071F3}',
    '.pv-ctrl{margin-left:auto;display:flex;align-items:center;gap:8px;flex:none}',
    '.pv-nav{width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;border:none;border-radius:8px;background:none;cursor:pointer;color:#FAFAFA}',
    '.pv-nav:hover{background:rgba(255,255,255,.08)}',
    '.pv-nav svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}',
    '.pv-btn{height:32px;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 10px;',
    '  border:1px solid rgba(255,255,255,.15);border-radius:10px;background:rgba(255,255,255,.045);cursor:pointer;',
    "  font-family:inherit;font-size:14px;line-height:20px;font-weight:500;letter-spacing:-.01em;color:#FAFAFA}",
    '.pv-btn:hover{background:rgba(255,255,255,.1)}',
    '.pv-btn.ic{width:32px;padding:8px}',
    '.pv-btn.solid{background:#E5E5E5;border-color:#E5E5E5;color:#171717}',
    '.pv-btn svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}',
    /* 스크립트 */
    '.pv-body{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:32px}',
    '.pv-body::-webkit-scrollbar{width:0}',
    '.pv-scr{font-size:32px;line-height:1.62;font-weight:700;letter-spacing:-.01em;color:#FAFAFA;white-space:pre-line}',
    '.pv-scr .v{color:#0071F3}',
    /* 고쳐 쓰는 동안에도 글자리가 그대로여야 한다 — 테두리나 안여백을 더하지 않는다 */
    '.pv-scr[contenteditable="true"]{outline:none;cursor:text}',
    '.pv-mid{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center}',
    '.pv-big{font-size:64px;line-height:1.2;font-weight:700;letter-spacing:-.01em;color:#E5E5E5}',
    '.pv-tm{font-size:36px;font-weight:600;color:#A3A3A3;font-variant-numeric:tabular-nums}',
    '.pv-e1{font-size:24px;line-height:32px;font-weight:500;color:#A3A3A3}',
    '.pv-e2{font-size:14px;line-height:1;color:#A3A3A3;letter-spacing:-.01em}',
    '.pv-sec{display:flex;flex-direction:column;gap:12px}',
    '.pv-lb{font-size:18px;line-height:1;font-weight:500;color:#A3A3A3}',
    '.pv-who{font-size:32px;line-height:1.5;font-weight:700;letter-spacing:-.015em;color:#0071F3}',
    '.pv-q{font-size:32px;line-height:1.62;font-weight:400;letter-spacing:-.01em;color:#A3A3A3;white-space:pre-line}',
    '.pv-a{font-size:32px;line-height:1.62;font-weight:700;letter-spacing:-.01em;color:#E5E5E5;white-space:pre-line}',
    /* 글자 크기 */
    '.pv-zoom{position:absolute;right:32px;bottom:32px;display:flex;align-items:center;gap:8px}',
    /* 지표 */
    '.pv-mt{flex:none;display:flex;border-bottom:1px solid rgba(255,255,255,.1)}',
    '.pv-card{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;padding:12px 16px;background:#171717;',
    '  border-right:1px solid rgba(255,255,255,.1);border-bottom:1px solid rgba(255,255,255,.1);box-shadow:0 1px 2px rgba(0,0,0,.05)}',
    '.pv-card:last-child{border-right:none}',
    '.pv-ck{font-size:12px;line-height:1;font-weight:500;letter-spacing:-.01em;color:#A3A3A3}',
    '.pv-cv{display:flex;align-items:center;gap:8px;height:20px;font-size:16px;line-height:1;font-weight:600;letter-spacing:-.01em;color:#FAFAFA}',
    '.pv-cv .sub{font-weight:400;color:#A3A3A3}',
    '.pv-cs{font-size:12px;line-height:1;font-weight:500;letter-spacing:-.01em;color:#A3A3A3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    /* 편집 모드 */
    '.pv-et{height:32px;display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:8px;cursor:grab;',
    '  color:#FAFAFA;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.15);font-size:16px;font-weight:500}',
    '.pv-et.over{border-color:#0071F3;box-shadow:0 0 0 2px rgba(0,113,243,.4)}',
    '.pv-et .lbl{outline:none;min-width:16px;cursor:text}',
    '.pv-et .x{border:none;background:none;color:#A3A3A3;cursor:pointer;display:inline-flex;padding:0}',
    '.pv-et .x:hover{color:#fff}',
    '.pv-et .dg{color:#A3A3A3;display:inline-flex}',
    '.pv-add{height:32px;display:inline-flex;align-items:center;gap:6px;padding:8px 10px;border-radius:10px;border:1px dashed rgba(255,255,255,.3);',
    "  background:none;color:#A3A3A3;cursor:pointer;font-family:inherit;font-size:14px;font-weight:500}",
    '.pv-add:hover{color:#FAFAFA;border-color:rgba(255,255,255,.5)}',
    '.pv-add svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round}',
    '.pv-sel{position:relative;height:32px;display:inline-flex;align-items:center;gap:6px;padding:8px 8px 8px 10px;width:200px;',
    '  border:1px solid rgba(255,255,255,.15);border-radius:10px;background:rgba(255,255,255,.045);cursor:pointer;',
    "  font-family:inherit;font-size:14px;line-height:20px;color:#FAFAFA}",
    '.pv-sel .cap{flex:1;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.pv-sel svg{width:12px;height:12px;flex:none;fill:none;stroke:#A3A3A3;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}',
    '.pv-menu{position:fixed;z-index:50;width:200px;min-width:128px;display:none;flex-direction:column;padding:4px;background:#262626;',
    '  border:1px solid rgba(250,250,250,.1);border-radius:10px;box-shadow:0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.1)}',
    '.pv-menu.on{display:flex}',
    '.pv-menu .ml{padding:4px 6px;font-size:12px;line-height:16px;font-weight:500;letter-spacing:-.01em;color:#A3A3A3}',
    '.pv-menu .mi{height:28px;display:flex;align-items:center;padding:4px 6px;border:none;border-radius:8px;background:none;cursor:pointer;',
    "  font-family:inherit;font-size:14px;line-height:20px;letter-spacing:-.01em;color:#FAFAFA;text-align:left}",
    '.pv-menu .mi:hover{background:rgba(255,255,255,.08)}',
    /* 전체화면 — 식순 탭을 접는다 */
    '.pv.wide .pv-left,.pv.wide .pv-sep{display:none}'
  ].join('\n');

  /* ---------- 아이콘 ---------- */
  var I = {
    prev: '<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M14.5 6.5 17.5 9.5"/></svg>',
    wide: '<svg viewBox="0 0 24 24"><path d="M15 4h5v5M20 4l-7 7M9 20H4v-5M4 20l7-7"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
    x: '<svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    dots: '<svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:currentColor"><circle cx="9" cy="6" r="1.3"/><circle cx="15" cy="6" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="9" cy="18" r="1.3"/><circle cx="15" cy="18" r="1.3"/></svg>',
    caret: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>'
  };

  /* ---------- 대본 ---------- */
  var TEMPLATES = ['주총 선언문', '의안 상정문', '표결 선포문', '질의 안내문', '폐회문'];
  /* 템플릿은 값을 채우기 전의 원문이다. 변수 자리는 {{ }} 로 남겨 두어
     어디를 채워야 하는지 한눈에 보이게 한다. */
  var TPLBODY = {
    '주총 선언문':
      '{{기준일}} 기준 당사의 총 발행 주식수는 {{발행주식총수}} 이며, 총 주주수는 {{총 주주수}} 입니다.\n\n'
      + '이중 의결권 있는 주식수는 {{의결권 있는 주식수}} 입니다.\n\n'
      + '{{총회 일시}} 현재 참석 주식수는 {{참석 주식수}} 이며, 참석 주주수는 {{참석 주주수}} 입니다.\n\n'
      + '당사의 의결권 있는 주식의 총수인 {{의결권 있는 주식수}} 의 {{출석률}} 가 출석하였음을 보고 드리며, '
      + '본 총회가 적법하게 성립되었음을 선언합니다.',
    '의안 상정문':
      '{{의안 번호}} 의안\n{{의안명}} 을 상정합니다.\n\n'
      + '본 의안은 {{결의 요건}} 요건이 적용되는 의안으로, {{결의 요건 계산식}} 이 필요합니다.\n\n'
      + '표결에 앞서 본 안건에 대해 질문이나 의견이 있으신 주주께서는 발언 신청 버튼을 눌러 주시기 바랍니다.\n\n'
      + '신청해 주신 주주님께 순서대로 발언권을 부여해 드리겠으며, 발언이 끝난 후 표결을 진행하겠습니다.',
    '표결 선포문':
      '{{의안 번호}} 에 대한 표결 결과를 말씀드리겠습니다.\n'
      + '본 의안은 {{결의 요건}} 요건이 적용되는 의안으로, {{결의 요건 계산식}} 이 필요합니다.\n\n'
      + '오늘 주주총회장에서 참석한 의결권 있는 주식은 총 {{참석 주식수(중복투표 주식수 제외)}} 이며, '
      + '집계 결과는 다음과 같습니다.\n\n'
      + '찬성하는 주식수는 총 {{(중립 분배 후) 찬성 주식수}}\n'
      + '반대하는 주식수는 총 {{(중립 분배 후) 반대 주식수}}\n'
      + '기권하는 주식수는 총 {{(중립 분배 후) 기권 주식수}} 로\n\n'
      + '찬성 주식수는 출석한 의결권수 대비 {{출석 의결권 대비 찬성률}} 이며, '
      + '의결권 있는 발행주식 총수 대비 {{총 의결권 대비 찬성률}} 로 집계되었습니다.\n\n'
      + '이에 {{의안 번호}} 은 {{가결 여부}} 되었음을 선포합니다.',
    '질의 안내문':
      '{{의안 번호}} 에 대해 질문이나 의견이 있으신 주주께서는 발언 신청 버튼을 눌러 주시기 바랍니다.\n\n'
      + '신청 순서에 따라 발언권을 드리며, 발언 시간은 한 분당 {{발언 제한 시간}} 이내로 부탁드립니다.\n\n'
      + '접수된 질의는 {{질의 접수 건수}} 이며, 순서대로 의장님께 전달해 드리겠습니다.',
    '폐회문':
      '오늘 상정된 {{총 의안 수}} 의안에 대한 표결이 모두 종료되었습니다.\n\n'
      + '바쁘신 가운데 끝까지 참석해 주신 주주 여러분의 협조에 진심으로 감사드립니다.\n\n'
      + '이것으로 {{주주총회명}} 의 폐회를 선언합니다. 감사합니다.'
  };
  /* 값을 채운 자리 — 화면에서 파랗게 보인다 */
  var V0 = '\u0001', V1 = '\u0002';
  function V(x) { return V0 + x + V1; }
  /* {{변수}} 가 가리키는 값. 의안에 딸린 값은 지금 보고 있는 의안에서 가져온다. */
  function varsOf(no) {
    var d = (no && CX.center[no]) || {}, ty = d.type || '보통결의';
    var present = (d['for'] || 0) + (d.against || 0) + (d.abs || 0);
    var r1 = present ? ((d['for'] / present) * 100).toFixed(2) : '0.00';
    var r2 = ((d['for'] || 0) / M.sharesIssued * 100).toFixed(2);
    return {
      '기준일': '2026년 3월 27일',
      '발행주식총수': cm(M.sharesIssued) + ' 주',
      '총 주주수': cm(M.holdersTotal) + ' 명',
      '의결권 있는 주식수': cm(M.sharesVoting) + ' 주',
      '총회 일시': M.dateText + ' ' + M.time,
      '참석 주식수': cm(M.attendShares) + ' 주',
      '참석 주주수': cm(M.attendHolders) + ' 명',
      '출석률': (M.attendShares / M.sharesVoting * 100).toFixed(1) + ' %',
      '주주총회명': M.org + ' ' + M.name,
      '총 의안 수': CX.votingUnits.length + ' 건',
      '의안 번호': no ? chip(no) + ' 의안' : '',
      '의안명': d.name || '',
      '결의 요건': ty,
      '결의 요건 계산식': thrText(d),
      '참석 주식수(중복투표 주식수 제외)': cm(present) + ' 주',
      '(중립 분배 후) 찬성 주식수': cm(d['for'] || 0) + ' 주',
      '(중립 분배 후) 반대 주식수': cm(d.against || 0) + ' 주',
      '(중립 분배 후) 기권 주식수': cm(d.abs || 0) + ' 주',
      '출석 의결권 대비 찬성률': r1 + ' %',
      '총 의결권 대비 찬성률': r2 + ' %',
      '가결 여부': '가결',
      '발언 제한 시간': '4분',
      '질의 접수 건수': ((window.QUESTIONS && window.QUESTIONS.length) || 0) + ' 건'
    };
  }
  /* 저장할 때 한 번 — 아는 이름은 값으로 바꾸고, 모르는 이름은 그대로 둔다 */
  function fillVars(text, no) {
    var map = varsOf(no);
    return String(text || '').replace(/\{\{([^{}]*)\}\}/g, function (m, key) {
      var k = String(key).trim();
      return (k in map) ? V(map[k]) : m;
    });
  }

  function thrText(d) {
    return (d.thrLabel || '').indexOf('2/3') >= 0
      ? '의결권 있는 발행주식 총수의 3분의 1 이상, 출석한 주주의 의결권의 3분의 2 이상의 찬성'
      : '의결권 있는 발행주식 총수의 4분의 1 이상, 출석한 주주의 의결권의 과반수의 찬성';
  }
  function chip(no) { return String(no).replace('제', '제 '); }
  function cand(name) { return String(name).replace('사외이사 후보 ', ''); }

  /* 의장 — 의안별 상정문 · 표결문 */
  function chairAgenda(no) {
    var d = CX.center[no] || {}, nm = d.name || '', ty = d.type || '보통결의';
    var open = V(chip(no)) + ' 의안\n' + V(nm) + ' 을 상정합니다.\n\n'
      + '본 의안은 ' + V(ty) + ' 요건이 적용되는 의안으로, ' + V(thrText(d)) + ' 이 필요합니다.\n\n'
      + '표결에 앞서 본 안건에 대해 질문이나 의견이 있으신 주주께서는 발언 신청 버튼을 눌러 주시기 바랍니다.\n\n'
      + '신청해 주신 주주님께 순서대로 발언권을 부여해 드리겠으며, 발언이 끝난 후 표결을 진행하겠습니다.';
    var close;
    if (d.cands) {
      var el = d.cands.filter(function (c) { return c.elected; });
      close = V(chip(no)) + ' 의안 에 대한 표결 결과를 말씀드리겠습니다.\n\n'
        + '본 의안은 집중투표 방식으로 진행되었으며, 후보자별 득표수는 다음과 같습니다.\n\n'
        + d.cands.map(function (c) { return V(cand(c.name)) + ' 후보 ' + V(cm(c.votes) + ' 표'); }).join('\n')
        + '\n\n이에 다득표 순으로 ' + V(el.map(function (c) { return cand(c.name); }).join(' · '))
        + ' 후보가 사외이사로 선임되었음을 선포합니다.';
    } else if (d.options) {
      var won = d.options.filter(function (o) { return o.result === '가결'; })[0] || d.options[0];
      close = V(chip(no)) + ' 의안 에 대한 표결 결과를 말씀드리겠습니다.\n\n'
        + d.options.map(function (o) {
            return V(o.name) + '\n찬성 ' + V(cm(o['for']) + ' 주') + ' · 반대 ' + V(cm(o.against) + ' 주')
              + ' → ' + V(o.result);
          }).join('\n\n')
        + '\n\n이에 ' + V(won.name) + ' 이 가결되었음을 선포합니다.';
    } else {
      var present = (d['for'] || 0) + (d.against || 0) + (d.abs || 0);
      var r1 = present ? ((d['for'] / present) * 100).toFixed(2) : '0.00';
      var r2 = ((d['for'] || 0) / M.sharesIssued * 100).toFixed(2);
      close = V(chip(no)) + ' 의안 에 대한 표결 결과를 말씀드리겠습니다.\n'
        + '본 의안은 ' + V(ty) + ' 요건이 적용되는 의안으로, ' + V(thrText(d)) + ' 이 필요합니다.\n\n'
        + '오늘 주주총회에 참석한 의결권 있는 주식은 총 ' + V(cm(present) + ' 주') + ' 이며, 집계 결과는 다음과 같습니다.\n\n'
        + '찬성하는 주식수는 총 ' + V(cm(d['for']) + ' 주') + '\n'
        + '반대하는 주식수는 총 ' + V(cm(d.against) + ' 주') + '\n'
        + '기권하는 주식수는 총 ' + V(cm(d.abs) + ' 주') + '로\n\n'
        + '찬성 주식수는 출석한 의결권수 대비 ' + V(r1 + ' %') + ' 이며, 의결권 있는 발행주식 총수 대비 '
        + V(r2 + ' %') + ' 로 집계되었습니다.\n\n'
        + '이에 ' + V(chip(no)) + ' 의안 은 ' + V('가결') + ' 되었음을 선포합니다.';
    }
    return [{ t: '상정문', s: open }, { t: '표결문', s: close }];
  }

  /* 사회자 — 의안별 진행 안내 (질의접수 · 발언신청 · 표결개시 · 표결마감 · 결과공표).
     {{변수}} 자리는 지금 의안·총회 값으로 채운다. 질의 제한은 시청 화면(주주PASS)과 같은 3회 · 100자. */
  var MC = { qMax: 3, qLen: 100, spTime: '3분', voteTime: '5분' };
  function voteEnd() {
    var d = new Date(), t = new Date(d.getTime() + 5 * 60000), h = t.getHours(), m = t.getMinutes();
    return (h < 12 ? '오전 ' : '오후 ') + (h % 12 || 12) + '시 ' + (m < 10 ? '0' : '') + m + '분';
  }
  function mcAgenda(no) {
    var d = CX.center[no] || {}, nm = d.name || '', n = String(no).replace(/^제\s*/, '');
    var i = CX.votingUnits.indexOf(no), nx = CX.votingUnits[i + 1];
    var res = d.result || (d.cands ? '가결' : '가결');
    var N = '제' + V(n);
    return [
      { t: '질의접수 안내', s: N + ' 의안에 대한 질의를 접수하겠습니다.\n\n'
        + '현장에 계신 주주님께서는 좌석에서 손을 들어 주시기 바랍니다. 진행요원이 확인 후 순서대로 안내해 드리겠습니다.\n\n'
        + '전자주총으로 출석하신 주주님께서는 화면 하단의 \'질의 작성\' 기능을 통해 질의 내용을 입력해 주시기 바랍니다.\n\n'
        + '질의는 ' + N + ' 의안과 관련된 내용으로 한정하여 ' + V(MC.qMax) + '회, ' + V(MC.qLen) + '자 이내로 부탁드립니다.' },
      { t: '발언신청 안내', s: '이어서 직접 발언을 원하시는 주주님의 신청을 받겠습니다.\n\n'
        + '현장에 계신 주주님께서는 좌석에서 손을 들어 주시기 바랍니다. 진행요원이 마이크를 전달해 드리면 주주님 성함을 말씀하신 후 발언해 주시기 바랍니다.\n\n'
        + '전자주총으로 출석하신 주주님께서는 화면의 \'발언 신청\' 버튼을 누르시면 신청이 접수되며, 의장님께서 발언권을 부여하시는 순서에 따라 음성 연결을 통해 직접 발언하실 수 있습니다. 연결 안내가 표시되면 마이크 사용을 허용해 주시기 바랍니다.\n\n'
        + '발언은 신청 순서대로 1인당 ' + V(MC.spTime) + ' 이내로 부탁드리며, 제한 시간이 경과하면 마이크가 자동으로 종료됩니다.\n\n'
        + '음성 연결이 원활하지 않은 경우에는 \'질의 작성\' 기능을 활용해 주시기 바랍니다.' },
      { t: '표결개시 안내', s: N + ' 의안 ' + V(nm) + '에 대한 표결을 시작하겠습니다.\n\n'
        + '지금부터 ' + V(MC.voteTime) + ' 동안 투표가 가능하며, 마감 시각은 ' + V(voteEnd()) + '입니다. 마감 전까지는 투표 내용을 자유롭게 변경하거나 철회하실 수 있습니다.\n\n'
        + '현장에 참석하신 주주님께서는 스마트폰 화면에서 ' + N + ' 의안을 선택하신 후 찬성·반대·기권 중 하나를 선택하시고 \'투표하기\' 버튼을 눌러 주시기 바랍니다. '
        + '마지막 비밀번호 확인 절차까지 완료하셔야 투표가 최종 확정됩니다. 스마트폰 사용이 어려우신 주주님께서는 서면 투표용지의 ' + N + ' 의안란에 표기하신 후 진행요원에게 제출해 주시기 바랍니다.\n\n'
        + '전자주총으로 출석하신 주주님께서는 의안 목록에서 \'투표중\'으로 표시된 ' + N + ' 의안을 선택하시면 투표 화면으로 이동합니다.' },
      { t: '표결마감 안내', s: N + ' 의안의 표결 마감까지 30초 남았습니다. 아직 투표하지 않으신 주주님께서는 서둘러 투표를 완료해 주시고, 서면 투표용지를 작성하신 주주님께서는 진행요원에게 제출해 주시기 바랍니다.\n\n'
        + '(마감) ' + N + ' 의안에 대한 표결을 마감하겠습니다. 지금부터는 투표 및 변경이 불가합니다.\n\n'
        + '사전 전자투표·전자위임장, 서면위임장, 현장 투표, 전자주총 투표를 하나의 기준으로 통합하여 집계하겠습니다. 중복 행사 여부와 법령상 의결권 제한이 자동으로 검증되오니 잠시만 기다려 주시기 바랍니다.\n\n'
        + '(집계 완료) 집계가 완료되었습니다. ' + N + ' 의안의 표결 결과를 의장님께 보고드립니다.' },
      { t: '결과공표 안내', s: '(의장 가결/부결 선포 후)\n\n'
        + N + ' 의안 ' + V(nm) + '은 의장님께서 선포하신 바와 같이 ' + V(res) + '되었습니다.\n\n'
        + '표결 결과는 현장 화면과 전자주총 의안 목록에 즉시 표시되며, 주주님께서는 본인의 투표 내역과 의안별 전체 찬반 집계 결과를 함께 확인하실 수 있습니다.\n\n'
        + '집계된 결과는 관계 법령에 따라 기록으로 보존되며, 오늘 총회 종료 후 금융감독원 전자공시시스템을 통해 공시될 예정입니다.\n\n'
        + (nx ? '이어서 제' + V(String(nx).replace(/^제\s*/, '')) + ' 의안을 진행하겠습니다. 의장님.'
              : '이상으로 오늘 상정된 모든 의안의 표결을 마쳤습니다. 의장님.') }
    ];
  }

  /* 주총선언문 화면에서 '현장대본 반영' 한 문구 — 이번 총회에만 적용(원본 템플릿은 그대로) */
  function savedDecl() { try { return localStorage.getItem('cx.decl'); } catch (e) { return null; } }
  var role0 = null;
  window.addEventListener('storage', function (e) { if (e.key === 'cx.decl' && role0 && role0 !== 'mc') location.reload(); });
  function buildOrder(role) {
    role0 = role;
    var chair = (role !== 'mc');
    var list = [];
    list.push({ key: 'open', lb: '개회', tabs: chair
      ? [{ t: '주총 선언문', s: savedDecl() ||
          V('2026년 3월 27일') + ' 기준일 현재 당사의 총 발행 주식수는 ' + V(cm(M.sharesIssued) + ' 주') + ' 이며, 총 주주수는 ' + V(cm(M.holdersTotal) + ' 명') + ' 입니다.\n\n'
          + '이중 의결권 있는 주식수는 ' + V(cm(M.sharesVoting) + ' 주') + ' 입니다.\n\n'
          + V(M.dateText + ' ' + M.time) + ' 현재 참석 주식수는 ' + V(cm(M.attendShares) + ' 주') + ' 이며, 참석 주주수는 ' + V(cm(M.attendHolders) + ' 명') + ' 입니다.\n\n'
          + '당사의 의결권 있는 주식의 총수인 ' + V(cm(M.sharesVoting) + ' 주') + ' 의 '
          + V((M.attendShares / M.sharesVoting * 100).toFixed(1) + ' %') + ' 가 출석하였음을 보고 드리며, 본 총회가 적법하게 성립되었음을 선언합니다.' }]
      : [{ t: '진행 안내', s: '주주 여러분, 안녕하십니까. 지금부터 ' + V(M.org + ' ' + M.name) + '를 시작하겠습니다. 저는 오늘 진행을 맡은 사회자입니다.\n\n'
           + '본 총회는 현장과 전자주주총회로 함께 진행됩니다. 현장에 계신 주주님께서는 휴대전화를 무음으로 설정해 주시고, 전자주총으로 출석하신 주주님께서는 화면 안내를 따라 주시기 바랍니다.\n\n'
           + '각 의안은 의장님의 상정 말씀 이후 질의 접수, 발언 신청, 표결, 결과 공표 순으로 진행됩니다. 질의는 의안별 ' + V(MC.qMax) + '회, ' + V(MC.qLen) + '자 이내, 발언은 1인당 ' + V(MC.spTime) + ' 이내로 부탁드립니다.' },
         { t: '의장 소개', s: '이어서 오늘 총회의 의장을 소개해 드리겠습니다.\n\n'
           + '정관 제' + V('20') + '조에 따라 ' + V('대표이사') + '님께서 본 총회의 의장을 맡아 주시겠습니다.\n\n'
           + '의장님께서는 개회 선언과 함께 총회 성립 요건을 보고해 주실 예정입니다. 주주 여러분께서는 큰 박수로 맞이해 주시기 바랍니다.\n\n'
           + '의장님, 부탁드립니다.' }] });
    /* 식순은 표결 단위 그대로 — 현장 제어의 '의안 진행' 과 같은 기준이다.
       양립불가로 폐기된 의안도 의장이 폐기를 선포하므로 남겨 둔다. */
    CX.votingUnits.forEach(function (no) {
      list.push({ key: no, lb: no.replace('제', '').replace('호', ''), ag: no, tabs: chair ? chairAgenda(no) : mcAgenda(no) });
    });
    list.push({ key: 'close', lb: '폐회', tabs: chair
      ? [{ t: '폐회문', s:
          '오늘 상정된 모든 의안에 대한 표결이 종료되었습니다.\n\n'
          + '바쁘신 가운데 끝까지 참석해 주신 주주 여러분의 협조에 진심으로 감사드립니다.\n\n'
          + '이것으로 ' + V(M.name) + ' 의 폐회를 선언합니다. 감사합니다.' }]
      : [{ t: '폐회 안내', s: '이상으로 오늘 상정된 ' + V(CX.votingUnits.length + '건') + '의 의안에 대한 심의와 표결이 모두 마무리되었습니다.\n\n'
         + '의안별 표결 결과는 전자주총 의안 목록에서 다시 확인하실 수 있으며, 총회 종료 후 금융감독원 전자공시시스템을 통해 공시될 예정입니다.\n\n'
         + '잠시 후 의장님의 폐회 선언이 있겠습니다. 현장에서 받으신 서면 투표용지와 태그는 퇴장하실 때 진행요원에게 반납해 주시기 바랍니다.\n\n'
         + '바쁘신 가운데 끝까지 참석해 주신 주주 여러분께 진심으로 감사드립니다.' }] });
    return list;
  }

  /* ---------- 본체 ---------- */
  function mount(opts) {
    var role = (opts && opts.role) || 'chair';
    var ORDER = buildOrder(role);
    var st = { oi: 0, ti: 0, fs: 32, wide: false, editing: false, live: null, edit: null, drag: null };

    var style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    var root = document.createElement('div'); root.className = 'pv';
    root.innerHTML =
      '<div class="pv-ct">'
      + '<div class="pv-left" id="pvLeft"></div><div class="pv-sep"></div>'
      + '<div class="pv-main">'
      +   '<div class="pv-top"><div class="pv-tabs" id="pvTabs"></div><div class="pv-ctrl" id="pvCtrl"></div></div>'
      +   '<div class="pv-body" id="pvBody"></div>'
      + '</div>'
      + '<div class="pv-zoom"><button class="pv-btn ic" id="pvUp" type="button" title="글자 크게">' + I.plus + '</button>'
      +   '<button class="pv-btn ic" id="pvDn" type="button" title="글자 작게">' + I.minus + '</button></div>'
      + '</div>'
      + '<div class="pv-mt" id="pvMt"></div>';
    document.body.appendChild(root);
    var menu = document.createElement('div'); menu.className = 'pv-menu'; document.body.appendChild(menu);

    var left = root.querySelector('#pvLeft'), tabs = root.querySelector('#pvTabs'),
        ctrl = root.querySelector('#pvCtrl'), body = root.querySelector('#pvBody'), mt = root.querySelector('#pvMt');

    function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    /* 표시만 걷어 낸 글 — 고쳐 쓸 때는 표시가 보이면 안 된다 */
    function plain(t) { return String(t == null ? '' : t).split(V0).join('').split(V1).join(''); }
    /* 채워 넣은 값과 아직 채우지 않은 {{ }} 를 같은 파란색으로 */
    function hi(h) {
      return h.replace(/\{\{[^{}]*\}\}/g, function (m) { return '<span class="v">' + m + '</span>'; });
    }
    function marked(t) {
      return hi(esc(t).split(V0).join('<span class="v">').split(V1).join('</span>'));
    }
    /* 고쳐 쓸 때도 같은 규칙으로 칠한다 — 표시는 스팬으로 바뀌어 글자로는 남지 않는다 */
    function cur() { return ORDER[st.oi] || ORDER[0]; }
    function tabList() { return st.editing ? st.edit : cur().tabs; }

    /* 식순 세로 탭 */
    function drawLeft() {
      left.innerHTML = ORDER.map(function (o, i) {
        return '<button class="pv-vt' + (i === st.oi ? ' on' : '') + '" data-o="' + i + '" type="button">' + esc(o.lb) + '</button>';
      }).join('');
    }
    /* 상단 스크립트 탭 */
    function drawTabs() {
      if (st.editing) {
        tabs.innerHTML = st.edit.map(function (t, i) {
          return '<div class="pv-et" draggable="true" data-e="' + i + '"><span class="dg">' + I.dots + '</span>'
            + '<span class="lbl" contenteditable="true">' + esc(t.t) + '</span>'
            + '<button class="x" type="button" title="삭제">' + I.x + '</button></div>';
        }).join('') + '<button class="pv-add" id="pvAdd" type="button">' + I.plus + '탭 추가</button>';
        bindEdit();
        return;
      }
      var html = tabList().map(function (t, i) {
        return '<button class="pv-t' + (i === st.ti ? ' on' : '') + '" data-t="' + i + '" type="button">' + esc(t.t) + '</button>';
      }).join('');
      if (st.live && st.live.cast) html += '<span class="pv-cast">운영 송출</span>';
      tabs.innerHTML = html;
    }
    /* 우측 제어 */
    function drawCtrl() {
      ctrl.innerHTML = st.editing
        ? '<button class="pv-sel" id="pvTpl" type="button"><span class="cap">템플릿 불러오기</span>' + I.caret + '</button>'
          + '<button class="pv-btn" id="pvCancel" type="button">취소</button>'
          + '<button class="pv-btn solid" id="pvSave" type="button">저장</button>'
        : '<button class="pv-nav" id="pvPrev" type="button" title="이전">' + I.prev + '</button>'
          + '<button class="pv-nav" id="pvNext" type="button" title="다음">' + I.next + '</button>'
          + '<button class="pv-btn" id="pvEdit" type="button">' + I.edit + '수정</button>'
          + '<button class="pv-btn ic" id="pvWide" type="button" title="전체 화면">' + I.wide + '</button>';
    }

    /* 본문 */
    var tmr = null, tsec = 0;
    function stopTimer() { if (tmr) { clearInterval(tmr); tmr = null; } }
    function mmss(s) { var m = Math.floor(s / 60), x = s % 60; return (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x; }

    function sec(lb, v, cls) {
      return '<div class="pv-sec"><div class="pv-lb" style="font-size:' + Math.round(st.fs * 0.56) + 'px">' + esc(lb) + '</div>'
        + '<div class="pv-' + cls + '" style="font-size:' + st.fs + 'px">' + esc(v || '') + '</div></div>';
    }

    function drawBody() {
      stopTimer();
      var L = st.live || {};
      if (!st.editing && L.cast === 'qna') {
        body.innerHTML = sec('질의 주주', L.who, 'who') + sec('질의 내용', L.q, 'q') + (L.a ? sec('답변 내용', L.a, 'a') : '');
        return;
      }
      if (!st.editing && (L.cast === 'speech' || L.cast === 'amend')) {
        var lb = L.cast === 'amend' ? '수정 동의 주주' : '발언 주주';
        var ml = L.cast === 'amend' ? '수정 동의 내용' : '담당자 전달 내용';
        body.innerHTML = sec(lb, L.who, 'who')
          + (L.msg ? sec(ml, L.msg, 'a')
                   : '<div class="pv-mid"><div class="pv-big">' + (L.cast === 'amend' ? '수정 동의 접수' : '발언 중') + '</div></div>');
        return;
      }
      if (!st.editing && L.cast === 'voting') {
        tsec = L.sec || 0;
        body.innerHTML = '<div class="pv-mid"><div class="pv-big">투표 중</div><div class="pv-tm" id="pvTm">' + mmss(tsec) + '</div></div>';
        tmr = setInterval(function () { tsec++; var e = document.getElementById('pvTm'); if (e) e.textContent = mmss(tsec); }, 1000);
        return;
      }
      if (!st.editing && L.cast === 'counting') {
        body.innerHTML = '<div class="pv-mid"><div class="pv-big">표결 집계 중</div></div>';
        return;
      }
      var t = tabList()[st.ti];
      if (!t || !String(t.s || '').trim()) {
        body.innerHTML = '<div class="pv-mid"><div class="pv-e1">작성된 스크립트가 없습니다.</div>'
          + '<div class="pv-e2">등록된 템플릿을 선택하거나 스크립트 내용을 직접 입력 할 수 있습니다.</div></div>';
        return;
      }
      body.innerHTML = '<div class="pv-scr" id="pvScr"' + (st.editing ? ' contenteditable="true"' : '') + ' style="font-size:' + st.fs + 'px">'
        + marked(t.s) + '</div>';
      if (st.editing) {
        var scr = document.getElementById('pvScr');
        scr.addEventListener('input', function () { st.edit[st.ti].s = scr.innerText; });
      }
    }

    /* 하단 지표 */
    function drawMetrics() {
      var units = ORDER.filter(function (o) { return o.ag; });
      var L = st.live || {};
      var ag = L.ag || cur().ag || units[0].ag;
      var pos = 1; units.forEach(function (o, i) { if (o.ag === ag) pos = i + 1; });
      var d = CX.center[ag] || {};
      var stName = ['상정 대기', '상정중', '투표중', '집계중', '표결 마감'][L.stage == null ? 0 : L.stage];
      /* 현장 제어가 보내 준 값이 있으면 그대로 쓴다 — 같은 화면을 보는 사람끼리 숫자가 어긋나지 않도록 */
      var K = L.kpi || {};
      var num = function (v, unit) { return cm(v) + '<span class="sub">' + unit + '</span>'; };
      var cards = [
        ['의안 진행', (K.i != null ? K.i : pos) + '<span class="sub"> / ' + (K.tot || units.length) + '</span>',
          K.sub || (chip(ag) + ' ' + stName)],
        ['출석률', K.rate || ((M.attendShares / M.sharesIssued * 100).toFixed(1) + '%'),
          cm(M.sharesIssued) + '주 기준'],
        ['전체 출석 주주수', num(M.attendHolders, '명'), '출석의결권 ' + cm(M.attendShares) + '주'],
        ['현장 참석', num(M.onsiteHolders, '명'), cm(M.onsiteShares) + '주 행사 가능'],
        ['현장 표결', (K.siteN || 0) + '<span class="sub"> / ' + (K.siteTot || 30) + '</span>',
          cm(K.siteW || 0) + '주 행사'],
        ['온라인 참석', num(M.onlineHolders, '명'), cm(M.onlineShares) + '주']
      ];
      mt.innerHTML = cards.map(function (c) {
        return '<div class="pv-card"><div class="pv-ck">' + c[0] + '</div><div class="pv-cv">' + c[1] + '</div><div class="pv-cs">' + c[2] + '</div></div>';
      }).join('');
    }

    function render() { drawLeft(); drawTabs(); drawCtrl(); drawBody(); drawMetrics(); }

    /* 편집 */
    function bindEdit() {
      Array.prototype.forEach.call(tabs.querySelectorAll('.pv-et'), function (el) {
        var i = +el.getAttribute('data-e');
        el.addEventListener('dragstart', function () { st.drag = i; el.style.opacity = '.5'; });
        el.addEventListener('dragend', function () { el.style.opacity = ''; st.drag = null; });
        el.addEventListener('dragover', function (e) { e.preventDefault(); el.classList.add('over'); });
        el.addEventListener('dragleave', function () { el.classList.remove('over'); });
        el.addEventListener('drop', function (e) {
          e.preventDefault(); if (st.drag == null || st.drag === i) return;
          st.edit.splice(i, 0, st.edit.splice(st.drag, 1)[0]); st.ti = i; drawTabs(); drawBody();
        });
        var lbl = el.querySelector('.lbl');
        lbl.addEventListener('input', function () { st.edit[i].t = lbl.textContent.trim() || '새 탭'; });
        lbl.addEventListener('focus', function () { st.ti = i; drawBody(); });
        lbl.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); lbl.blur(); } });
        el.querySelector('.x').addEventListener('click', function (e) {
          e.stopPropagation(); if (st.edit.length <= 1) return;
          st.edit.splice(i, 1); st.ti = Math.min(st.ti, st.edit.length - 1); drawTabs(); drawBody();
        });
      });
      var add = tabs.querySelector('#pvAdd');
      if (add) add.addEventListener('click', function () { st.edit.push({ t: '새 탭', s: '' }); st.ti = st.edit.length - 1; drawTabs(); drawBody(); });
    }
    function openTpl(btn) {
      menu.innerHTML = '<div class="ml">템플릿 불러오기</div>'
        + TEMPLATES.map(function (t) { return '<button class="mi" data-tpl="' + esc(t) + '" type="button">' + esc(t) + '</button>'; }).join('');
      var r = btn.getBoundingClientRect();
      menu.style.left = Math.max(8, Math.min(r.left, innerWidth - 208)) + 'px';
      menu.style.top = (r.bottom + 6) + 'px';
      menu.classList.add('on');
    }
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tpl]'); if (!b) return;
      menu.classList.remove('on');
      st.edit[st.ti].t = b.getAttribute('data-tpl');
      var tpl = b.getAttribute('data-tpl');
      st.edit[st.ti].s = TPLBODY[tpl] || ('템플릿 · ' + tpl + ' 의 내용을 불러왔습니다.\n필요한 부분을 직접 고쳐 주세요.');
      drawTabs(); drawBody();
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('#pvTpl') && !menu.contains(e.target)) menu.classList.remove('on'); });

    /* 우측 상단 < > — 운영 송출 중에도 사람이 직접 넘길 수 있다 */
    function step(d) {
      if (st.live && st.live.cast) { st.live.cast = null; }
      var n = st.ti + d;
      if (n < 0) { if (st.oi > 0) { st.oi--; st.ti = cur().tabs.length - 1; } }
      else if (n >= cur().tabs.length) { if (st.oi < ORDER.length - 1) { st.oi++; st.ti = 0; } }
      else st.ti = n;
      render();
    }

    /* 조작 */
    root.addEventListener('click', function (e) {
      var v = e.target.closest('[data-o]');
      if (v && !st.editing) { st.oi = +v.getAttribute('data-o'); st.ti = 0; if (st.live) st.live.cast = null; render(); return; }
      var t = e.target.closest('[data-t]');
      if (t) { st.ti = +t.getAttribute('data-t'); drawTabs(); drawBody(); return; }
      var btn = e.target.closest('button'); if (!btn) return;
      var id = btn.id;
      if (id === 'pvPrev') step(-1);
      else if (id === 'pvNext') step(1);
      else if (id === 'pvUp') { st.fs = Math.min(64, st.fs + 2); drawBody(); }
      else if (id === 'pvDn') { st.fs = Math.max(18, st.fs - 2); drawBody(); }
      else if (id === 'pvWide') { st.wide = !st.wide; root.classList.toggle('wide', st.wide); }
      else if (id === 'pvEdit') { st.editing = true; st.edit = cur().tabs.map(function (x) { return { t: x.t, s: x.s }; }); render(); }
      else if (id === 'pvCancel') { st.editing = false; st.edit = null; st.ti = 0; render(); }
      else if (id === 'pvSave') {
        /* 불러온 템플릿의 {{ }} 자리를 이 의안의 값으로 채워 둔다 */
        var ag = cur().ag;
        cur().tabs = st.edit.map(function (x) { return { t: x.t, s: fillVars(x.s, ag) }; });
        st.editing = false; st.edit = null; st.ti = Math.min(st.ti, cur().tabs.length - 1);
        render(); if (global.cxToast) global.cxToast('스크립트를 저장했습니다.');
      }
      else if (id === 'pvTpl') openTpl(btn);
    });
    document.addEventListener('keydown', function (e) {
      if (st.editing) return;
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    });

    /* ---------- 현장 제어 연동 ---------- */
    var CAST = { 2: 'voting', 3: 'counting' };
    var mcAg = null, mcQ = null, mcSt = null;
    function applyLive(s) {
      if (!s || !s.ts) { render(); return; }
      /* 사회자 — 상정 · 발언 신청 · 표결 안내는 투표 전 대본이라 의안이 넘어갈 때만 따라간다.
         발언 대기열을 조작하면 표결 안내로, 표결 마감 뒤에는 결과 공표로. 발언 송출 화면은 쓰지 않는다. */
      if (role === 'mc') {
        var oi2 = -1;
        ORDER.forEach(function (o, i) { if (o.ag && o.ag === s.ag) oi2 = i; });
        if (s.ag === 'open' || s.ag === '개회') oi2 = 0;
        if (s.ag === 'closing' || s.ag === '폐회') oi2 = ORDER.length - 1;
        var stg = isFinite(s.stage) ? +s.stage : 0, first = (mcAg === null);
        if (oi2 >= 0 && s.ag !== mcAg) { st.oi = oi2; st.ti = 0; }
        else if (!first && s.mcq && s.mcq !== mcQ && cur().tabs.length > 2) st.ti = 2;
        else if (stg >= 4 && mcSt !== null && mcSt < 4) st.ti = cur().tabs.length - 1;
        mcAg = s.ag; mcQ = s.mcq; mcSt = stg;
        var c2 = CAST[stg];
        st.live = { ts: s.ts, ag: s.ag, stage: stg, sec: s.sec, cast: c2 || null, kpi: s.kpi };
        render(); return;
      }
      if (s.cast === 'qna' || s.cast === 'speech' || s.cast === 'amend') { st.live = s; render(); return; }
      /* 표결 콘트롤 단계 → 화면 자동 전환 */
      var stage = isFinite(s.stage) ? +s.stage : 0;
      var oi = -1;
      ORDER.forEach(function (o, i) { if (o.ag && o.ag === s.ag) oi = i; });
      /* 개회·폐회 선언도 같은 신호로 띄운다 */
      if (s.ag === 'open' || s.ag === '개회') oi = 0;
      if (s.ag === 'closing' || s.ag === '폐회') oi = ORDER.length - 1;
      if (oi >= 0) st.oi = oi;
      var c = CAST[stage];
      st.live = { ts: s.ts, ag: (oi >= 0 ? ORDER[oi].ag : s.ag), stage: stage, sec: s.sec, cast: c || null, kpi: s.kpi };
      if (!c) st.ti = (stage >= 4 && cur().tabs.length > 1) ? cur().tabs.length - 1 : 0;
      render();
    }
    if (global.cxSync) global.cxSync.on(applyLive);
    else render();

    /* URL 로 바로 띄우기 — 현장 제어의 '의장 송출' 버튼이 쓴다 */
    var p = new URLSearchParams(location.search);
    if (p.get('view') === 'qna') applyLive({ ts: Date.now(), cast: 'qna', who: p.get('who') || '', q: p.get('q') || '', a: p.get('a') || '' });
    else if (p.get('ag')) applyLive({ ts: Date.now(), ag: p.get('ag'), stage: +(p.get('st') || 0) });
  }

  global.cxPrompter = mount;
  global.cxScripts = { chair: chairAgenda };
})(window);

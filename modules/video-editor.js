/**
 * 탭 7: 🎬 웹 영상 편집기 (1차 프로토타입 — 추가 서버비 0원, 브라우저 실시간 Canvas + Web Audio 릴스 편집/출력)
 * - 9:16 인스타 릴스 · 쇼츠 / 16:9 가로 영상 전환
 * - 영상·이미지 업로드 + BGM/AI 성우 오디오 믹싱 + 3초 후킹 상단/하단 자막 + 워터마크 + 컬러 필터
 * - 구간 자르기(In/Out 트림) 타임라인 + 편집 완료 영상(.webm) 로컬 다운로드
 */
(function () {
  'use strict';
  var A = window.AgencyApp;
  if (!A) return;

  var HOOK_PRESETS = [
    { label: '🏥 병원 경고형', top: '투석실 개원할 때 이 배관 하나 잘못 놓으면', bottom: '5천만 원 그대로 날립니다! 꼭 확인하세요' },
    { label: '🛡️ 보험 팩트형', top: '내 보험료 매달 12만 원씩 새고 있다면?', bottom: '댓글에 "점검" 남기면 무료 분석표 발송!' },
    { label: '💰 정책자금 속보', top: '올해 정책자금 서류 탈락하는 대표님 90%의 실수', bottom: '프로필 링크 1분 무료 한도진단 확인' },
    { label: '🏪 자영업 바이럴', top: '동네 사람들이 줄 서서 먹는 진짜 이유', bottom: '오늘 방문 시 알림받기 쿠폰 즉시 증정!' },
  ];

  var ed = {
    aspect: '9:16', // '9:16' | '16:9'
    mediaType: 'none', // 'none' | 'video' | 'image'
    mediaUrl: '',
    mediaName: '',
    duration: 10,
    trimStart: 0,
    trimEnd: 10,
    bgmUrl: '',
    bgmName: '',
    videoVol: 0.85,
    bgmVol: 0.35,
    topText: '투석실 개원할 때 이 배관 하나 잘못 놓으면',
    bottomText: '5천만 원 그대로 날립니다! 3초 핵심 요약',
    watermark: 'MIDAM FACTORY',
    topColor: '#fde047',
    bottomColor: '#ffffff',
    fontSize: 34,
    filter: 'none',
    playing: false,
    exporting: false,
    curTime: 0,
  };

  var videoEl = null;
  var imgEl = null;
  var bgmEl = null;
  var rafId = 0;

  function canvasDims() {
    return ed.aspect === '9:16' ? { w: 540, h: 960 } : { w: 960, h: 540 };
  }

  function cssFilterVal() {
    if (ed.filter === 'vivid') return 'contrast(1.14) saturate(1.28)';
    if (ed.filter === 'cinema') return 'contrast(1.18) saturate(0.88) brightness(0.94)';
    if (ed.filter === 'warm') return 'sepia(0.22) saturate(1.15) brightness(1.03)';
    if (ed.filter === 'bw') return 'grayscale(1) contrast(1.2)';
    return 'none';
  }

  function wrapTextLines(ctx, text, maxW) {
    if (!text) return [];
    var rawLines = String(text).split(/\r?\n/);
    var out = [];
    rawLines.forEach(function (line) {
      var words = line.split(' ');
      var cur = '';
      words.forEach(function (w) {
        var test = cur ? (cur + ' ' + w) : w;
        if (ctx.measureText(test).width > maxW && cur) {
          out.push(cur);
          cur = w;
        } else {
          cur = test;
        }
      });
      if (cur) out.push(cur);
    });
    return out;
  }

  function drawFrame(canvas) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dims = canvasDims();
    if (canvas.width !== dims.w || canvas.height !== dims.h) {
      canvas.width = dims.w;
      canvas.height = dims.h;
    }

    // 배경
    var g = ctx.createLinearGradient(0, 0, dims.w, dims.h);
    g.addColorStop(0, '#091529');
    g.addColorStop(1, '#020617');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, dims.w, dims.h);

    // 미디어 렌더링 (cover 비율 유지 + 필터)
    ctx.save();
    ctx.filter = cssFilterVal();
    var src = ed.mediaType === 'video' ? videoEl : (ed.mediaType === 'image' ? imgEl : null);
    var sw = src ? (src.videoWidth || src.naturalWidth || 0) : 0;
    var sh = src ? (src.videoHeight || src.naturalHeight || 0) : 0;
    if (src && sw > 0 && sh > 0) {
      var scale = Math.max(dims.w / sw, dims.h / sh);
      var dw = sw * scale, dh = sh * scale;
      ctx.drawImage(src, (dims.w - dw) / 2, (dims.h - dh) / 2, dw, dh);
    } else {
      // 샘플 미리보기 안내 그래픽
      ctx.fillStyle = 'rgba(56,189,248,0.12)';
      ctx.beginPath();
      ctx.arc(dims.w / 2, dims.h / 2, dims.w * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7dd3fc';
      ctx.font = '700 18px "Malgun Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('왼쪽에서 영상(.mp4) 또는 이미지를 올려보세요', dims.w / 2, dims.h / 2);
    }
    ctx.restore();

    // 상단·하단 가독성 그라데이션 비네팅
    var topG = ctx.createLinearGradient(0, 0, 0, dims.h * 0.28);
    topG.addColorStop(0, 'rgba(0,0,0,0.68)');
    topG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topG;
    ctx.fillRect(0, 0, dims.w, dims.h * 0.28);

    var botG = ctx.createLinearGradient(0, dims.h * 0.72, 0, dims.h);
    botG.addColorStop(0, 'rgba(0,0,0,0)');
    botG.addColorStop(1, 'rgba(0,0,0,0.78)');
    ctx.fillStyle = botG;
    ctx.fillRect(0, dims.h * 0.72, dims.w, dims.h * 0.28);

    // 워터마크
    if (ed.watermark) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.font = '800 14px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(ed.watermark, dims.w - 22, 34);
      ctx.restore();
    }

    // 상단 3초 후킹 강조 자막
    var fs = Number(ed.fontSize || 34);
    if (ed.topText) {
      ctx.save();
      ctx.font = '900 ' + fs + 'px "Apple SD Gothic Neo","Malgun Gothic",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var lines = wrapTextLines(ctx, ed.topText, dims.w - 64);
      var lh = fs * 1.32;
      var startY = dims.h * 0.14;
      lines.forEach(function (ln, idx) {
        var tw = ctx.measureText(ln).width;
        var y = startY + idx * lh;
        ctx.fillStyle = 'rgba(15,23,42,0.78)';
        ctx.fillRect((dims.w - tw) / 2 - 14, y - fs * 0.65, tw + 28, fs * 1.28);
        ctx.fillStyle = ed.topColor || '#fde047';
        ctx.fillText(ln, dims.w / 2, y);
      });
      ctx.restore();
    }

    // 하단 메인 자막
    if (ed.bottomText) {
      ctx.save();
      var bfs = Math.max(20, Math.round(fs * 0.84));
      ctx.font = '800 ' + bfs + 'px "Apple SD Gothic Neo","Malgun Gothic",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var blines = wrapTextLines(ctx, ed.bottomText, dims.w - 64);
      var blh = bfs * 1.35;
      var bStartY = dims.h * 0.84 - ((blines.length - 1) * blh) / 2;
      blines.forEach(function (ln, idx) {
        var y = bStartY + idx * blh;
        ctx.lineWidth = 6;
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.strokeText(ln, dims.w / 2, y);
        ctx.fillStyle = ed.bottomColor || '#ffffff';
        ctx.fillText(ln, dims.w / 2, y);
      });
      ctx.restore();
    }
  }

  function startRenderLoop() {
    cancelAnimationFrame(rafId);
    function tick() {
      var cv = document.getElementById('veCanvas');
      if (!cv) return;
      if (ed.playing && ed.mediaType === 'video' && videoEl) {
        if (videoEl.currentTime >= ed.trimEnd) {
          videoEl.currentTime = ed.trimStart;
          if (bgmEl) bgmEl.currentTime = 0;
        }
        ed.curTime = videoEl.currentTime;
        var tLbl = document.getElementById('veTimeLbl');
        if (tLbl) tLbl.textContent = ed.curTime.toFixed(1) + 's / ' + ed.trimEnd.toFixed(1) + 's';
      }
      drawFrame(cv);
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  }

  function stopPlayback() {
    ed.playing = false;
    if (videoEl) videoEl.pause();
    if (bgmEl) bgmEl.pause();
  }

  function exportEditedVideo() {
    var cv = document.getElementById('veCanvas');
    if (!cv) return;
    if (typeof MediaRecorder === 'undefined') {
      A.toast('⚠️ 이 브라우저는 내장 영상 내보내기(MediaRecorder)를 지원하지 않습니다. Chrome/Edge를 사용해 주세요.');
      return;
    }
    var clipDur = Math.max(2, Number(ed.trimEnd || 5) - Number(ed.trimStart || 0));
    ed.exporting = true;
    var btn = document.getElementById('veExportBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ 렌더링 중 (' + clipDur.toFixed(0) + '초)…'; }

    try {
      var stream = cv.captureStream(30);
      var audioCtx = null, dest = null;
      if ((videoEl && ed.mediaType === 'video') || bgmEl) {
        try {
          var AC = window.AudioContext || window.webkitAudioContext;
          audioCtx = new AC();
          dest = audioCtx.createMediaStreamDestination();
          if (bgmEl && ed.bgmUrl) {
            var bgmClone = new Audio(ed.bgmUrl);
            bgmClone.volume = ed.bgmVol;
            var bSrc = audioCtx.createMediaElementSource(bgmClone);
            bSrc.connect(dest);
            bgmClone.play().catch(function () {});
            ed._expBgm = bgmClone;
          }
          dest.stream.getAudioTracks().forEach(function (tr) { stream.addTrack(tr); });
        } catch (e) {}
      }

      var mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';
      var chunks = [];
      var rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4500000 });
      rec.ondataavailable = function (e) { if (e.data && e.data.size > 0) chunks.push(e.data); };
      rec.onstop = function () {
        ed.exporting = false;
        stopPlayback();
        if (ed._expBgm) { ed._expBgm.pause(); ed._expBgm = null; }
        if (audioCtx) audioCtx.close().catch(function () {});
        var blob = new Blob(chunks, { type: 'video/webm' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'midam_reels_' + A.todayKst() + '.webm';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
        if (btn) { btn.disabled = false; btn.textContent = '🎬 편집 영상 내보내기 (.webm)'; }
        A.toast('✅ 릴스 편집 영상 내보내기 완료!');
      };

      if (videoEl && ed.mediaType === 'video') {
        videoEl.currentTime = ed.trimStart;
        videoEl.volume = ed.videoVol;
        videoEl.play().catch(function () {});
      }
      ed.playing = true;
      rec.start();
      setTimeout(function () { if (rec.state !== 'inactive') rec.stop(); }, Math.round(clipDur * 1000));
    } catch (err) {
      ed.exporting = false;
      if (btn) { btn.disabled = false; btn.textContent = '🎬 편집 영상 내보내기 (.webm)'; }
      A.toast('❌ 내보내기 오류: ' + (err.message || ''));
    }
  }

  function render() {
    var root = document.getElementById('pane-video');
    if (!root) return;

    root.innerHTML = '<div class="ws-split">' +
      // 왼쪽: 미디어 라이브러리 · 자막 · 필터 · 오디오 편집
      '<div class="split-editor">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">' +
          '<h3 style="margin:0;font-size:15px;color:#0c4a6e">🎬 브라우저 웹 영상 편집기 (릴스 · 쇼츠 프로토타입)</h3>' +
          '<span class="tag-pill ok">서버비 0원 · 로컬 렌더링</span>' +
        '</div>' +

        '<div class="ws-card" style="padding:12px">' +
          '<h3 style="margin-bottom:8px;font-size:13px">📁 1. 미디어 · 오디오 불러오기</h3>' +
          '<div class="ws-actions">' +
            '<input type="file" id="veMediaInp" accept="video/*,image/*" hidden>' +
            '<input type="file" id="veBgmInp" accept="audio/*" hidden>' +
            '<button type="button" class="ws-btn sm primary" id="veMediaBtn">🎥 영상 · 이미지 불러오기</button>' +
            '<button type="button" class="ws-btn sm" id="veBgmBtn">🎵 BGM · AI 성우 오디오 추가</button>' +
            '<select id="veAspect" style="padding:5px 9px;border-radius:9px;border:1px solid var(--line-strong);font-size:12px;font-weight:700">' +
              '<option value="9:16"' + (ed.aspect === '9:16' ? ' selected' : '') + '>📱 9:16 릴스·쇼츠</option>' +
              '<option value="16:9"' + (ed.aspect === '16:9' ? ' selected' : '') + '>🖥️ 16:9 유튜브 가로</option>' +
            '</select>' +
          '</div>' +
          '<div style="margin-top:8px;font-size:11.6px;color:var(--muted)">' +
            '영상/이미지: <b>' + A.esc(ed.mediaName || '미선택 (업로드해 주세요)') + '</b> · 오디오: <b>' + A.esc(ed.bgmName || '없음') + '</b>' +
          '</div>' +
        '</div>' +

        '<div class="ws-card" style="padding:12px">' +
          '<h3 style="margin-bottom:8px;font-size:13px">✍️ 2. 3초 후킹 자막 · 워터마크</h3>' +
          '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px">' +
            HOOK_PRESETS.map(function (p, i) {
              return '<button type="button" class="ws-btn sm" data-hp="' + i + '">' + p.label + '</button>';
            }).join('') +
          '</div>' +
          '<div class="ws-field"><label>상단 3초 후킹 강조 자막</label><input data-ve="topText" value="' + A.esc(ed.topText) + '"></div>' +
          '<div class="ws-field" style="margin-top:6px"><label>하단 메인 자막</label><input data-ve="bottomText" value="' + A.esc(ed.bottomText) + '"></div>' +
          '<div class="ws-grid-3" style="margin-top:8px">' +
            '<div class="ws-field"><label>워터마크</label><input data-ve="watermark" value="' + A.esc(ed.watermark) + '"></div>' +
            '<div class="ws-field"><label>자막 크기(px)</label><input type="number" min="18" max="60" data-ve="fontSize" value="' + ed.fontSize + '"></div>' +
            '<div class="ws-field"><label>컬러 필터</label><select data-ve="filter">' +
              [['none', '원본'], ['vivid', '선명하게'], ['cinema', '시네마틱'], ['warm', '따뜻한 감성'], ['bw', '고급 흑백']].map(function (f) {
                return '<option value="' + f[0] + '"' + (ed.filter === f[0] ? ' selected' : '') + '>' + f[1] + '</option>';
              }).join('') +
            '</select></div>' +
          '</div>' +
        '</div>' +

        '<div class="ws-card" style="padding:12px">' +
          '<h3 style="margin-bottom:8px;font-size:13px">✂️ 3. 타임라인 구간 자르기 (트림) &amp; 볼륨</h3>' +
          '<div class="ws-grid-2">' +
            '<div class="ws-field"><label>시작 시간 (초): <b id="veStartVal">' + ed.trimStart.toFixed(1) + 's</b></label><input type="range" id="veTrimStart" min="0" max="' + Math.max(1, ed.duration - 0.5) + '" step="0.1" value="' + ed.trimStart + '"></div>' +
            '<div class="ws-field"><label>종료 시간 (초): <b id="veEndVal">' + ed.trimEnd.toFixed(1) + 's</b></label><input type="range" id="veTrimEnd" min="0.5" max="' + Math.max(2, ed.duration) + '" step="0.1" value="' + ed.trimEnd + '"></div>' +
            '<div class="ws-field"><label>원본 영상 볼륨</label><input type="range" id="veVidVol" min="0" max="1" step="0.05" value="' + ed.videoVol + '"></div>' +
            '<div class="ws-field"><label>BGM · 성우 볼륨</label><input type="range" id="veBgmVol" min="0" max="1" step="0.05" value="' + ed.bgmVol + '"></div>' +
          '</div>' +
          '<div style="margin-top:8px;font-size:11.4px;color:var(--muted)">💡 <b>RTX 2070 SUPER (8GB VRAM)</b> 로컬 PC에서 추후 <code>Fish-Speech</code>(한국어 보이스 클로닝) + <code>ACE-Step-1.5</code>(BGM) 오디오를 만들어 여기 BGM으로 바로 얹을 수 있습니다!</div>' +
        '</div>' +
      '</div>' +

      // 오른쪽: 실시간 릴스 캔버스 뷰어 + 타임라인 컨트롤
      '<div class="split-preview" style="align-items:center">' +
        '<div class="preview-toolbar" style="max-width:760px">' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<button type="button" class="ws-btn sm primary" id="vePlayBtn">' + (ed.playing ? '⏸️ 일시정지' : '▶️ 미리보기 재생') + '</button>' +
            '<span id="veTimeLbl" style="font-size:12px;font-weight:800;color:#0c4a6e">' + ed.curTime.toFixed(1) + 's / ' + ed.trimEnd.toFixed(1) + 's</span>' +
          '</div>' +
          '<div class="ws-actions">' +
            '<button type="button" class="ws-btn sm ok" id="veExportBtn">🎬 편집 영상 내보내기 (.webm)</button>' +
          '</div>' +
        '</div>' +

        '<div style="background:#020617;padding:14px;border-radius:18px;box-shadow:0 20px 50px rgba(0,0,0,0.45);border:1px solid rgba(56,189,248,0.28);display:flex;justify-content:center;align-items:center">' +
          '<canvas id="veCanvas" style="max-height:66dvh;max-width:100%;border-radius:10px;display:block"></canvas>' +
        '</div>' +

        '<div style="width:100%;max-width:760px;background:rgba(15,23,42,0.84);border:1px solid rgba(56,189,248,0.25);border-radius:14px;padding:12px 14px;color:#e2e8f0;font-size:11.5px">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:6px"><b>🎞️ 타임라인 트랙</b><span>선택 구간: ' + ed.trimStart.toFixed(1) + 's ~ ' + ed.trimEnd.toFixed(1) + 's (총 ' + Math.max(0.5, ed.trimEnd - ed.trimStart).toFixed(1) + '초)</span></div>' +
          '<div style="height:22px;background:rgba(255,255,255,0.08);border-radius:8px;position:relative;overflow:hidden;margin-bottom:5px">' +
            '<div style="position:absolute;top:0;bottom:0;left:' + ((ed.trimStart / Math.max(1, ed.duration)) * 100).toFixed(1) + '%;width:' + (((ed.trimEnd - ed.trimStart) / Math.max(1, ed.duration)) * 100).toFixed(1) + '%;background:linear-gradient(90deg,#0284c7,#38bdf8);display:flex;align-items:center;padding-left:8px;font-weight:800;font-size:10.5px;color:#fff">🎥 비디오 트랙</div>' +
          '</div>' +
          '<div style="height:18px;background:rgba(255,255,255,0.06);border-radius:6px;display:flex;align-items:center;padding-left:8px;color:#fde047;font-size:10.5px;font-weight:700">✍️ 자막 트랙: ' + A.esc(ed.topText || '(자막 없음)') + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

    bindEvents(root);
    startRenderLoop();
  }

  function bindEvents(root) {
    var q = function (s) { return root.querySelector(s); };
    Array.prototype.forEach.call(root.querySelectorAll('[data-ve]'), function (el) {
      var ev = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(ev, function () {
        var k = el.getAttribute('data-ve');
        ed[k] = el.type === 'number' ? Number(el.value || 30) : el.value;
      });
    });

    var asp = q('#veAspect');
    if (asp) asp.addEventListener('change', function () { ed.aspect = asp.value; render(); });

    Array.prototype.forEach.call(root.querySelectorAll('[data-hp]'), function (b) {
      b.addEventListener('click', function () {
        var p = HOOK_PRESETS[parseInt(b.getAttribute('data-hp'), 10)];
        if (p) { ed.topText = p.top; ed.bottomText = p.bottom; render(); }
      });
    });

    var mBtn = q('#veMediaBtn'), mInp = q('#veMediaInp');
    if (mBtn && mInp) {
      mBtn.addEventListener('click', function () { mInp.click(); });
      mInp.addEventListener('change', function () {
        var f = mInp.files && mInp.files[0];
        if (!f) return;
        stopPlayback();
        if (ed.mediaUrl) URL.revokeObjectURL(ed.mediaUrl);
        ed.mediaUrl = URL.createObjectURL(f);
        ed.mediaName = f.name;
        if ((f.type || '').indexOf('video/') === 0) {
          ed.mediaType = 'video';
          videoEl = document.createElement('video');
          videoEl.src = ed.mediaUrl;
          videoEl.muted = false;
          videoEl.playsInline = true;
          videoEl.onloadedmetadata = function () {
            ed.duration = Math.max(1, videoEl.duration || 10);
            ed.trimStart = 0;
            ed.trimEnd = Math.min(ed.duration, 30);
            videoEl.currentTime = 0;
            render();
            A.toast('🎥 영상 로드 완료 (' + ed.duration.toFixed(1) + '초)');
          };
        } else {
          ed.mediaType = 'image';
          imgEl = new Image();
          imgEl.src = ed.mediaUrl;
          imgEl.onload = function () {
            ed.duration = 8;
            ed.trimStart = 0;
            ed.trimEnd = 8;
            render();
            A.toast('🖼️ 이미지 로드 완료 (8초 클립으로 설정)');
          };
        }
      });
    }

    var bBtn = q('#veBgmBtn'), bInp = q('#veBgmInp');
    if (bBtn && bInp) {
      bBtn.addEventListener('click', function () { bInp.click(); });
      bInp.addEventListener('change', function () {
        var f = bInp.files && bInp.files[0];
        if (!f) return;
        if (ed.bgmUrl) URL.revokeObjectURL(ed.bgmUrl);
        ed.bgmUrl = URL.createObjectURL(f);
        ed.bgmName = f.name;
        bgmEl = new Audio(ed.bgmUrl);
        bgmEl.volume = ed.bgmVol;
        render();
        A.toast('🎵 오디오(' + f.name + ') 추가 완료!');
      });
    }

    var ts = q('#veTrimStart'), te = q('#veTrimEnd');
    if (ts) ts.addEventListener('input', function () {
      ed.trimStart = Math.min(Number(ts.value), ed.trimEnd - 0.5);
      if (videoEl) videoEl.currentTime = ed.trimStart;
      var l = q('#veStartVal'); if (l) l.textContent = ed.trimStart.toFixed(1) + 's';
    });
    if (te) te.addEventListener('input', function () {
      ed.trimEnd = Math.max(Number(te.value), ed.trimStart + 0.5);
      var l = q('#veEndVal'); if (l) l.textContent = ed.trimEnd.toFixed(1) + 's';
    });

    var vv = q('#veVidVol'), bv = q('#veBgmVol');
    if (vv) vv.addEventListener('input', function () { ed.videoVol = Number(vv.value); if (videoEl) videoEl.volume = ed.videoVol; });
    if (bv) bv.addEventListener('input', function () { ed.bgmVol = Number(bv.value); if (bgmEl) bgmEl.volume = ed.bgmVol; });

    var playBtn = q('#vePlayBtn');
    if (playBtn) playBtn.addEventListener('click', function () {
      if (ed.playing) {
        stopPlayback();
        playBtn.textContent = '▶️ 미리보기 재생';
      } else {
        ed.playing = true;
        if (videoEl && ed.mediaType === 'video') {
          if (videoEl.currentTime < ed.trimStart || videoEl.currentTime >= ed.trimEnd) videoEl.currentTime = ed.trimStart;
          videoEl.volume = ed.videoVol;
          videoEl.play().catch(function () {});
        }
        if (bgmEl) { bgmEl.currentTime = 0; bgmEl.volume = ed.bgmVol; bgmEl.play().catch(function () {}); }
        playBtn.textContent = '⏸️ 일시정지';
      }
    });

    var expBtn = q('#veExportBtn');
    if (expBtn) expBtn.addEventListener('click', exportEditedVideo);
  }

  A.on('tab-changed', function (t) {
    if (t === 'video') render();
    else { stopPlayback(); cancelAnimationFrame(rafId); }
  });
})();

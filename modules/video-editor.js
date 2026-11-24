/**
 * 탭 7: 🎬 웹 영상 편집기 & 🎙️ AI 성우·BGM·릴스 대본 스튜디오 (서버비 0원 + 로컬 GPU 하이브리드)
 * - 서브탭 1 [🎬 타임라인 영상 편집]: 9:16 릴스/16:9 가로, 영상·이미지 + BGM/성우 믹싱 + 3초 후킹 자막 + 워터마크 + 필터 + 트림 + .webm 내보내기
 * - 서브탭 2 [🎙️ AI 성우·BGM·릴스 대본 스튜디오]:
 *   ① 업종별 AI 3초 후킹 릴스 대본 + 장면별 AI 영상(B-roll) 프롬프트 자동 생성 → 원클릭 편집기 적용
 *   ② 한국어 AI 성우 나레이션(TTS): 브라우저 한국어 성우 즉시 미리듣기 + 로컬 Fish-Speech/CosyVoice API 연동 → 편집기 오디오 트랙 장착
 *   ③ 저작권 0% AI BGM 즉시 합성기: 브라우저 Web Audio API로 4종 무드 15초 실제 .wav 생성 → 미리듣기/다운로드/편집기 장착 + 로컬 ACE-Step-1.5 연동
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

  var BGM_MOODS = [
    { id: 'trust', label: '🏥 신뢰 · 전문 피아노 (병원/보험 추천)', bpm: 96, freqs: [261.63, 329.63, 392.0, 523.25], bass: [130.81, 146.83, 164.81, 130.81], wave: 'triangle' },
    { id: 'trendy', label: '🔥 트렌디 릴스 비트 (자영업/브랜드)', bpm: 118, freqs: [293.66, 349.23, 440.0, 587.33], bass: [146.83, 116.54, 130.81, 146.83], wave: 'sawtooth' },
    { id: 'warm', label: '✨ 감성 브랜딩 패드 (스토리/후기)', bpm: 84, freqs: [220.0, 261.63, 329.63, 392.0], bass: [110.0, 87.31, 98.0, 110.0], wave: 'sine' },
    { id: 'hook', label: '⚡ 3초 후킹 긴장 텐션 (경고/정책자금)', bpm: 128, freqs: [246.94, 293.66, 369.99, 493.88], bass: [123.47, 110.0, 98.0, 123.47], wave: 'square' },
  ];

  var ed = {
    subTab: 'edit', // 'edit' | 'studio'
    aspect: '9:16',
    mediaType: 'none',
    mediaUrl: '',
    mediaName: '',
    duration: 10,
    trimStart: 0,
    trimEnd: 10,
    bgmUrl: '',
    bgmName: '',
    videoVol: 0.85,
    bgmVol: 0.4,
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
    // AI 스튜디오 상태
    stIndustry: '병원',
    stClientName: '미담공장 고객사',
    stTopic: '신규 상담 문의 2배 늘리는 핵심 포인트',
    stScript: '[0~3초 후킹]\n잠깐! 이 영상 3초만 보시면 수백만 원 시행착오를 줄일 수 있습니다.\n\n[4~20초 핵심 본론]\n현장에서 대표님들이 가장 많이 놓치는 3가지 기준만 딱 점검해 보세요.\n첫째, 첫 화면에서 고객 고민을 정확히 짚어줄 것.\n둘째, 신뢰할 수 있는 실제 사례와 수치를 보여줄 것.\n셋째, 1분 안에 신청 가능한 간편 상담 동선을 열 것.\n\n[21~30초 CTA]\n프로필 링크에서 무료 진단 체크리스트 바로 받아가세요!',
    stVideoPrompt: 'Vertical 9:16 commercial b-roll, clean bright modern clinic consultation room, warm natural sunlight, shallow depth of field, cinematic slow camera push-in, 4k photorealistic',
    ttsRate: 1.05,
    ttsPitch: 1.0,
    ttsVoice: 'ko-KR-SunHiNeural',
    ttsEndpoint: localStorage.getItem('buja_tts_endpoint') || 'http://127.0.0.1:8787/api/tts',
    ttsPreviewUrl: '',
    ttsPreviewLabel: '',
    ttsBusy: false,
    cloneFile: null,
    cloneFileName: '',
    cloneFileUrl: '',
    cloneRefText: '',
    cloneRecording: false,
    cloneBusy: false,
    cloneStatusMsg: '',
    bridgeUrl: localStorage.getItem('buja_media_bridge') || 'http://127.0.0.1:8787',
    bridgeOk: false,
    bridgeInfo: null,
    crewRunning: false,
    bgmMood: 'trust',
    bgmSeconds: 15,
    bgmGenerating: false,
    generatedBgmUrl: '',
    generatedBgmName: '',
    aceEndpoint: localStorage.getItem('buja_ace_endpoint') || 'http://127.0.0.1:7865/api/generate',
  };

  var videoEl = null;
  var imgEl = null;
  var bgmEl = null;
  var previewAudioEl = null;
  var cloneRecorder = null;
  var cloneChunks = [];
  var rafId = 0;

  var VOICE_LIST = [
    ['ko-KR-SunHiNeural', '👩 선희 (차분·신뢰 여성 아나운서 · 병원/보험 추천)', 1.05],
    ['ko-KR-InJoonNeural', '👨 인준 (힘있는 남성 아나운서 · 정책자금 추천)', 0.82],
    ['ko-KR-HyunsuMultilingualNeural', '🧑 현수 (트렌디 젊은 남성 · 릴스/자영업 추천)', 0.9],
    ['ko-KR-JiMinNeural', '👧 지민 (밝고 친근한 여성)', 1.18],
    ['ko-KR-BongJinNeural', '🧔 봉진 (중후한 전문 대표님 톤)', 0.75],
    ['ko-KR-SeoHyeonNeural', '👱‍♀️ 서현 (또렷한 뉴스·정보 전달)', 1.1],
  ];

  function getVoiceMeta(voiceId) {
    for (var i = 0; i < VOICE_LIST.length; i++) {
      if (VOICE_LIST[i][0] === voiceId) return VOICE_LIST[i];
    }
    return VOICE_LIST[0];
  }

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

    var g = ctx.createLinearGradient(0, 0, dims.w, dims.h);
    g.addColorStop(0, '#091529');
    g.addColorStop(1, '#020617');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, dims.w, dims.h);

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
      ctx.fillStyle = 'rgba(56,189,248,0.12)';
      ctx.beginPath();
      ctx.arc(dims.w / 2, dims.h / 2, dims.w * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7dd3fc';
      ctx.font = '700 17px "Malgun Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('왼쪽에서 영상(.mp4) 또는 이미지를 올려보세요', dims.w / 2, dims.h / 2);
    }
    ctx.restore();

    var topGrad = ctx.createLinearGradient(0, 0, 0, dims.h * 0.3);
    topGrad.addColorStop(0, 'rgba(2,6,23,0.72)');
    topGrad.addColorStop(1, 'rgba(2,6,23,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, dims.w, dims.h * 0.3);

    var botGrad = ctx.createLinearGradient(0, dims.h * 0.68, 0, dims.h);
    botGrad.addColorStop(0, 'rgba(2,6,23,0)');
    botGrad.addColorStop(1, 'rgba(2,6,23,0.82)');
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, dims.h * 0.68, dims.w, dims.h * 0.32);

    if (ed.watermark) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.86)';
      ctx.font = '800 13px "Malgun Gothic", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(ed.watermark, dims.w - 18, 32);
      ctx.restore();
    }

    var fs = Math.max(18, Math.min(54, Number(ed.fontSize || 34)));
    var padX = 28;
    var maxW = dims.w - padX * 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (ed.topText) {
      ctx.font = '900 ' + fs + 'px "Malgun Gothic", sans-serif';
      var tLines = wrapTextLines(ctx, ed.topText, maxW);
      var lineH = fs * 1.28;
      var y0 = dims.h * 0.14;
      tLines.forEach(function (ln, idx) {
        var y = y0 + idx * lineH;
        var tw = ctx.measureText(ln).width;
        ctx.fillStyle = 'rgba(2,6,23,0.78)';
        ctx.fillRect((dims.w - tw) / 2 - 12, y - lineH / 2 + 2, tw + 24, lineH - 4);
        ctx.fillStyle = ed.topColor || '#fde047';
        ctx.fillText(ln, dims.w / 2, y);
      });
    }

    if (ed.bottomText) {
      var bfs = Math.max(16, Math.round(fs * 0.78));
      ctx.font = '800 ' + bfs + 'px "Malgun Gothic", sans-serif';
      var bLines = wrapTextLines(ctx, ed.bottomText, maxW);
      var bLineH = bfs * 1.32;
      var by0 = dims.h * 0.84 - ((bLines.length - 1) * bLineH) / 2;
      bLines.forEach(function (ln, idx) {
        var y = by0 + idx * bLineH;
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.strokeText(ln, dims.w / 2, y);
        ctx.fillStyle = ed.bottomColor || '#ffffff';
        ctx.fillText(ln, dims.w / 2, y);
      });
    }
  }

  function startRenderLoop() {
    cancelAnimationFrame(rafId);
    function tick() {
      var canvas = document.getElementById('veCanvas');
      if (!canvas || A.store.activeTab !== 'video' || ed.subTab !== 'edit') return;
      if (ed.playing && videoEl && ed.mediaType === 'video') {
        if (videoEl.currentTime >= ed.trimEnd) {
          videoEl.currentTime = ed.trimStart;
          if (bgmEl) { bgmEl.currentTime = 0; bgmEl.play().catch(function () {}); }
        }
        ed.curTime = videoEl.currentTime;
        var lbl = document.getElementById('veTimeLbl');
        if (lbl) lbl.textContent = ed.curTime.toFixed(1) + 's / ' + ed.trimEnd.toFixed(1) + 's';
      }
      drawFrame(canvas);
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  }

  function stopPlayback() {
    ed.playing = false;
    if (videoEl) { try { videoEl.pause(); } catch (e) {} }
    if (bgmEl) { try { bgmEl.pause(); } catch (e) {} }
  }

  function attachAudioBlobToEditor(blob, fileName) {
    if (ed.bgmUrl) URL.revokeObjectURL(ed.bgmUrl);
    ed.bgmUrl = URL.createObjectURL(blob);
    ed.bgmName = fileName;
    bgmEl = new Audio(ed.bgmUrl);
    bgmEl.volume = ed.bgmVol;
    A.toast('🎵 오디오 [' + fileName + '] 편집기 트랙에 장착 완료!');
  }

  // 🎵 브라우저 OfflineAudioContext 기반 저작권 0% WAV BGM 합성기 (서버비 0원)
  function audioBufferToWavBlob(buffer) {
    var numCh = buffer.numberOfChannels;
    var sr = buffer.sampleRate;
    var length = buffer.length * numCh * 2 + 44;
    var ab = new ArrayBuffer(length);
    var view = new DataView(ab);
    function writeStr(off, s) { for (var i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); }
    writeStr(0, 'RIFF');
    view.setUint32(4, length - 8, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numCh, true);
    view.setUint32(24, sr, true);
    view.setUint32(28, sr * numCh * 2, true);
    view.setUint16(32, numCh * 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, buffer.length * numCh * 2, true);
    var offset = 44;
    var channels = [];
    for (var c = 0; c < numCh; c++) channels.push(buffer.getChannelData(c));
    for (var i = 0; i < buffer.length; i++) {
      for (var ch = 0; ch < numCh; ch++) {
        var sample = Math.max(-1, Math.min(1, channels[ch][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }
    return new Blob([ab], { type: 'audio/wav' });
  }

  function generateInstantBgmWav() {
    var mood = BGM_MOODS.find(function (m) { return m.id === ed.bgmMood; }) || BGM_MOODS[0];
    var sec = Math.max(5, Math.min(30, Number(ed.bgmSeconds || 15)));
    var sr = 44100;
    var OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OfflineCtx) { A.toast('이 브라우저는 오디오 합성을 지원하지 않습니다.', 'error'); return; }

    ed.bgmGenerating = true;
    render();
    var ctx = new OfflineCtx(2, sr * sec, sr);
    var beatSec = 60 / mood.bpm;
    var totalBeats = Math.floor(sec / beatSec);

    for (var b = 0; b < totalBeats; b++) {
      var t = b * beatSec;
      // 1) 멜로디 신스 아르페지오
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = mood.wave;
      osc.frequency.setValueAtTime(mood.freqs[b % mood.freqs.length], t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.14, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + beatSec * 0.92);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + beatSec);

      // 2) 부드러운 베이스 패드 (2박자마다)
      if (b % 2 === 0) {
        var bOsc = ctx.createOscillator();
        var bGain = ctx.createGain();
        bOsc.type = 'sine';
        bOsc.frequency.setValueAtTime(mood.bass[(b / 2) % mood.bass.length], t);
        bGain.gain.setValueAtTime(0.001, t);
        bGain.gain.exponentialRampToValueAtTime(0.18, t + 0.06);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + beatSec * 1.9);
        bOsc.connect(bGain);
        bGain.connect(ctx.destination);
        bOsc.start(t);
        bOsc.stop(t + beatSec * 2);
      }

      // 3) 리듬 킥/펄스
      if (mood.id === 'trendy' || mood.id === 'hook') {
        var kOsc = ctx.createOscillator();
        var kGain = ctx.createGain();
        kOsc.type = 'sine';
        kOsc.frequency.setValueAtTime(135, t);
        kOsc.frequency.exponentialRampToValueAtTime(42, t + 0.11);
        kGain.gain.setValueAtTime(0.28, t);
        kGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        kOsc.connect(kGain);
        kGain.connect(ctx.destination);
        kOsc.start(t);
        kOsc.stop(t + 0.15);
      }
    }

    ctx.startRendering().then(function (rendered) {
      var wavBlob = audioBufferToWavBlob(rendered);
      var fname = 'AI_BGM_' + mood.id + '_' + sec + 's.wav';
      if (ed.generatedBgmUrl) URL.revokeObjectURL(ed.generatedBgmUrl);
      ed.generatedBgmUrl = URL.createObjectURL(wavBlob);
      ed.generatedBgmName = fname;
      attachAudioBlobToEditor(wavBlob, fname);
    }).catch(function (e) {
      A.toast('BGM 합성 실패: ' + e.message, 'error');
    }).finally(function () {
      ed.bgmGenerating = false;
      render();
    });
  }

  // 🎙️ AI 릴스 대본 + B-roll 프롬프트 자동 생성
  function buildAutoReelScript() {
    var ind = ed.stIndustry;
    var cname = ed.stClientName || '우리 회사';
    var topic = ed.stTopic || '핵심 포인트';
    var hooks = {
      '병원': [cname + ' 예약 전, 이거 모르면 후회합니다!', '원장님이 직접 알려주는 ' + topic + ' 3초 요약'],
      '보험설계사': ['내 보험료 매달 새고 있는 진짜 이유!', topic + ' — 1분 무료 보장점검'],
      '정책자금': ['올해 정책자금 탈락하는 대표님 90%의 실수!', topic + ' — 1분 무료 한도진단'],
      '자영업/소상공인': ['동네 사람들이 줄 서서 찾는 진짜 이유!', cname + ' ' + topic + ' 방문 혜택'],
    };
    var h = hooks[ind] || hooks['병원'];
    ed.topText = h[0];
    ed.bottomText = h[1];
    ed.stScript =
      '[0~3초 후킹]\n"' + h[0] + '"\n\n' +
      '[4~18초 핵심 본론]\n안녕하세요, ' + cname + '입니다.\n오늘 주제는 바로 "' + topic + '"입니다.\n' +
      '많은 분들이 가장 많이 놓치는 기준 3가지만 기억하세요.\n' +
      '첫째, 겉으로 보이는 가격보다 실제 조건과 사후 관리를 확인하세요.\n' +
      '둘째, 실제 사례와 객관적 수치로 검증된 곳인지 비교해 보세요.\n' +
      '셋째, 미루기 전에 전문가와 1분 사전 점검부터 받아보세요.\n\n' +
      '[19~30초 강력한 CTA]\n"' + h[1] + '" 지금 프로필 링크를 확인하세요!';

    var promptMap = {
      '병원': 'Vertical 9:16, Korean doctor explaining warmly in a bright modern clinic, clean minimalist medical interior, soft daylight, cinematic 4k b-roll',
      '보험설계사': 'Vertical 9:16, trustworthy Korean financial advisor reviewing clean tablet chart in sunlit office, confident smile, shallow depth of field, 4k',
      '정책자금': 'Vertical 9:16, Korean CEO and consultant discussing business funding roadmap with laptop and documents, modern Seoul office, crisp corporate lighting, 4k',
      '자영업/소상공인': 'Vertical 9:16, appetizing close-up of signature craft food and warm cozy Korean shop interior, dynamic slow motion, vibrant warm lighting, 4k',
    };
    ed.stVideoPrompt = promptMap[ind] || promptMap['병원'];
    A.toast('✨ ' + cname + ' (' + ind + ') 3초 후킹 대본 & AI 영상 프롬프트 생성 완료!');
    render();
  }

  function stopTtsPreview() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (previewAudioEl) {
      try { previewAudioEl.pause(); previewAudioEl.currentTime = 0; } catch (e) {}
    }
  }

  function speakKoreanPreview() {
    stopTtsPreview();
    var cleanText = String(ed.stScript || '').replace(/\[[^\]]+\]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) { A.toast('읽을 대본을 먼저 입력해 주세요.', 'error'); return; }
    var vMeta = getVoiceMeta(ed.ttsVoice);
    // 1순위: 로컬 AI 스튜디오(edge-tts)가 연결되어 있으면 선택한 6종 방송국급 성우 실제 목소리로 즉시 재생!
    if (ed.bridgeOk) {
      var base = String(ed.bridgeUrl || 'http://127.0.0.1:8787').replace(/\/$/, '');
      var ratePct = Math.round((Number(ed.ttsRate || 1.05) - 1) * 100);
      var rateStr = (ratePct >= 0 ? '+' : '') + ratePct + '%';
      // 빠른 미리듣기는 앞 180자만 1초 만에 초고속 생성
      var sampleText = cleanText.slice(0, 180);
      ed.ttsBusy = true;
      render();
      A.toast('🎙️ [' + vMeta[1].split(' ')[1] + '] 방송국급 실제 성우 미리듣기 생성 중...');
      fetch(base + '/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sampleText, voice: ed.ttsVoice || 'ko-KR-SunHiNeural', rate: rateStr, engine: 'edge' }),
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.blob();
      }).then(function (blob) {
        if (ed.ttsPreviewUrl) URL.revokeObjectURL(ed.ttsPreviewUrl);
        ed.ttsPreviewUrl = URL.createObjectURL(blob);
        ed.ttsPreviewLabel = vMeta[1];
        ed.ttsBusy = false;
        render();
        previewAudioEl = new Audio(ed.ttsPreviewUrl);
        previewAudioEl.play().catch(function () {});
        A.toast('🔊 [' + vMeta[1].split(' ')[1] + '] 실제 성우 목소리 재생 중!');
      }).catch(function () {
        ed.ttsBusy = false;
        render();
        speakBrowserFallback(cleanText, vMeta);
      });
      return;
    }
    speakBrowserFallback(cleanText, vMeta);
  }

  function speakBrowserFallback(cleanText, vMeta) {
    if (!('speechSynthesis' in window)) { A.toast('이 브라우저는 음성 합성을 지원하지 않습니다.', 'error'); return; }
    var u = new SpeechSynthesisUtterance(cleanText);
    u.lang = 'ko-KR';
    u.rate = Number(ed.ttsRate || 1.05);
    u.pitch = Number((vMeta && vMeta[2]) || 1.0);
    var voices = window.speechSynthesis.getVoices() || [];
    var koVoices = voices.filter(function (v) { return /ko/i.test(v.lang); });
    if (koVoices.length) {
      var idx = VOICE_LIST.indexOf(vMeta);
      u.voice = koVoices[Math.max(0, idx) % koVoices.length];
    }
    window.speechSynthesis.speak(u);
    A.toast('🔊 브라우저 기본 음성으로 미리듣기 중 (로컬 스튜디오 실행 시 6종 실제 성우 목소리 지원)');
  }

  function toggleCloneMicRecord() {
    if (ed.cloneRecording && cloneRecorder) {
      try { cloneRecorder.stop(); } catch (e) {}
      ed.cloneRecording = false;
      render();
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      A.toast('이 브라우저는 마이크 녹음을 지원하지 않습니다. 음성 파일을 직접 열어주세요.', 'error');
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      cloneChunks = [];
      cloneRecorder = new MediaRecorder(stream);
      cloneRecorder.ondataavailable = function (ev) { if (ev.data && ev.data.size > 0) cloneChunks.push(ev.data); };
      cloneRecorder.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        var blob = new Blob(cloneChunks, { type: 'audio/webm' });
        var f = new File([blob], '원장님_마이크녹음_' + A.todayKst() + '.webm', { type: 'audio/webm' });
        if (ed.cloneFileUrl) URL.revokeObjectURL(ed.cloneFileUrl);
        ed.cloneFile = f;
        ed.cloneFileName = f.name + ' (' + Math.max(1, Math.round(f.size / 1024)) + 'KB)';
        ed.cloneFileUrl = URL.createObjectURL(blob);
        ed.cloneRecording = false;
        ed.cloneStatusMsg = '✅ 원장님 목소리 녹음 완료! 아래 [🧬 원장님 보이스클로닝 생성] 버튼을 누르세요.';
        render();
      };
      ed.cloneRecording = true;
      ed.cloneStatusMsg = '🎙️ 녹음 중... 10~15초 정도 자연스럽게 말씀하신 뒤 [⏹️ 녹음 끝내기]를 누르세요!';
      render();
      cloneRecorder.start();
    }).catch(function (err) {
      A.toast('마이크 권한을 허용해 주세요: ' + err.message, 'error');
    });
  }

  function runVoiceClone() {
    var base = String(ed.bridgeUrl || 'http://127.0.0.1:8787').replace(/\/$/, '');
    var cleanText = String(ed.stScript || '').replace(/\[[^\]]+\]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) { A.toast('생성할 대본을 먼저 입력해 주세요.', 'error'); return; }
    if (!ed.cloneFile) {
      A.toast('⚠️ 먼저 [📂 컴퓨터에서 원장님 음성 파일 열기] 또는 [🎙️ 마이크 녹음]으로 원본 목소리 파일을 선택해 주세요!', 'error');
      var fInp = document.getElementById('stCloneFileInp');
      if (fInp) fInp.click();
      return;
    }
    var fd = new FormData();
    fd.append('reference_audio', ed.cloneFile, ed.cloneFile.name || 'voice_sample.wav');
    fd.append('text', cleanText);
    fd.append('reference_text', String(ed.cloneRefText || '').trim());
    ed.cloneBusy = true;
    ed.cloneStatusMsg = '⏳ 원장님 음성 파일 전송 및 Fish-Speech 클로닝 처리 중...';
    render();
    fetch(base + '/api/voice-clone', { method: 'POST', body: fd })
      .then(function (r) {
        var ct = r.headers.get('content-type') || '';
        if (ct.indexOf('application/json') !== -1) {
          return r.json().then(function (j) { return { isJson: true, ok: r.ok, data: j }; });
        }
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.blob().then(function (b) { return { isJson: false, ok: true, blob: b }; });
      })
      .then(function (res) {
        ed.cloneBusy = false;
        if (!res.isJson && res.blob) {
          if (ed.ttsPreviewUrl) URL.revokeObjectURL(ed.ttsPreviewUrl);
          ed.ttsPreviewUrl = URL.createObjectURL(res.blob);
          ed.ttsPreviewLabel = '🧬 원장님 보이스클로닝 결과';
          attachAudioBlobToEditor(res.blob, '원장님_보이스클로닝_' + A.todayKst() + '.wav');
          ed.cloneStatusMsg = '🎉 원장님 보이스클로닝 생성 완료! 영상 편집기 오디오 트랙에 자동 장착되었습니다.';
          render();
          previewAudioEl = new Audio(ed.ttsPreviewUrl);
          previewAudioEl.play().catch(function () {});
        } else {
          var msg = (res.data && (res.data.message || res.data.detail)) || '원장님 음성 파일 저장 완료';
          ed.cloneStatusMsg = msg;
          A.toast(msg);
          render();
        }
      })
      .catch(function (err) {
        ed.cloneBusy = false;
        ed.cloneStatusMsg = '⚠️ 로컬 스튜디오(8787) 연결 실패: ' + err.message;
        A.toast(ed.cloneStatusMsg, 'error');
        render();
      });
  }

  function checkLocalBridge() {
    var base = String(ed.bridgeUrl || 'http://127.0.0.1:8787').replace(/\/$/, '');
    return fetch(base + '/health', { method: 'GET' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        ed.bridgeOk = !!(d && d.ok);
        ed.bridgeInfo = d || null;
        if (A.store.activeTab === 'video') render();
      })
      .catch(function () {
        ed.bridgeOk = false;
        ed.bridgeInfo = null;
      });
  }

  function runLocalCrewAi() {
    var base = String(ed.bridgeUrl || 'http://127.0.0.1:8787').replace(/\/$/, '');
    ed.crewRunning = true;
    render();
    A.toast('🤖 CrewAI + 로컬 Ollama(exaone3.5:7.8b) 특수부대가 협업 대본을 작성 중입니다... (약 15~30초)');
    fetch(base + '/api/crew/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: ed.stClientName || '미담공장 고객사',
        industry: ed.stIndustry || '병원',
        topic: ed.stTopic || '핵심 마케팅 포인트',
        model: 'exaone3.5:7.8b',
      }),
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (e) { throw new Error(e.detail || ('HTTP ' + r.status)); });
      return r.json();
    }).then(function (res) {
      if (res && res.result) {
        ed.stScript = res.result;
        A.toast('✅ CrewAI 특수부대 협업 대본 완성! (로컬 Ollama 무료 구동)');
      }
    }).catch(function (e) {
      A.toast('CrewAI 실행 실패: ' + e.message + ' (E:\\ai-studio\\AI미디어스튜디오_시작하기.bat 실행 필요)', 'error');
    }).finally(function () {
      ed.crewRunning = false;
      render();
    });
  }

  function callLocalTtsEngine(engineMode) {
    var base = String(ed.bridgeUrl || 'http://127.0.0.1:8787').replace(/\/$/, '');
    var ep = engineMode === 'fish' ? (base + '/api/tts') : (String(ed.ttsEndpoint || (base + '/api/tts')).trim());
    localStorage.setItem('buja_tts_endpoint', ep);
    var cleanText = String(ed.stScript || '').replace(/\[[^\]]+\]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) { A.toast('생성할 대본을 먼저 입력해 주세요.', 'error'); return; }
    var ratePct = Math.round((Number(ed.ttsRate || 1.05) - 1) * 100);
    var rateStr = (ratePct >= 0 ? '+' : '') + ratePct + '%';
    A.toast('⏳ 방송국급 한국어 AI 성우 생성 중 (' + (ed.ttsVoice || 'ko-KR-SunHiNeural') + ')...');
    fetch(ep, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText, voice: ed.ttsVoice || 'ko-KR-SunHiNeural', rate: rateStr, engine: engineMode || 'edge' }),
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.blob();
    }).then(function (blob) {
      attachAudioBlobToEditor(blob, 'AI성우_' + (ed.ttsVoice || 'ko').replace('ko-KR-', '') + '.mp3');
      render();
    }).catch(function (e) {
      A.toast('로컬 AI 스튜디오 미실행: E:\\ai-studio\\AI미디어스튜디오_시작하기.bat 을 실행하세요! (' + e.message + ')', 'error');
    });
  }

  function exportEditedVideo(asMp4) {
    var canvas = document.getElementById('veCanvas');
    if (!canvas) return;
    if (ed.exporting) return;
    if (typeof MediaRecorder === 'undefined') {
      A.toast('이 브라우저는 영상 내보내기를 지원하지 않습니다. Chrome/Edge 최신 버전을 사용해 주세요.', 'error');
      return;
    }
    stopPlayback();
    ed.exporting = true;
    var btn = document.getElementById('veExportBtn');
    var mp4Btn = document.getElementById('veExportMp4Btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ 렌더링 중...'; }
    if (mp4Btn) { mp4Btn.disabled = true; mp4Btn.textContent = '⏳ MP4 렌더링 중...'; }

    var durSec = Math.max(1, Math.min(60, ed.trimEnd - ed.trimStart));
    var stream = canvas.captureStream(30);

    var audioCtx = null;
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx && (bgmEl || (videoEl && ed.mediaType === 'video'))) {
        audioCtx = new AudioCtx();
        var dest = audioCtx.createMediaStreamDestination();
        if (bgmEl && ed.bgmUrl) {
          var bgmCopy = new Audio(ed.bgmUrl);
          bgmCopy.crossOrigin = 'anonymous';
          bgmCopy.volume = ed.bgmVol;
          var bgmSrc = audioCtx.createMediaElementSource(bgmCopy);
          bgmSrc.connect(dest);
          bgmSrc.connect(audioCtx.destination);
          bgmCopy.play().catch(function () {});
        }
        dest.stream.getAudioTracks().forEach(function (t) { stream.addTrack(t); });
      }
    } catch (e) {}

    var mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : (MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '');
    var chunks = [];
    var rec;
    function resetBtns() {
      ed.exporting = false;
      stopPlayback();
      if (btn) { btn.disabled = false; btn.textContent = '🎬 웹 영상 내보내기 (.webm)'; }
      if (mp4Btn) { mp4Btn.disabled = false; mp4Btn.textContent = '📱 진짜 릴스 .MP4 추출 (로컬 FFmpeg)'; }
    }
    try {
      rec = mime ? new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4500000 }) : new MediaRecorder(stream);
    } catch (e) {
      resetBtns();
      A.toast('녹화 초기화 실패: ' + e.message, 'error');
      return;
    }
    rec.ondataavailable = function (ev) { if (ev.data && ev.data.size > 0) chunks.push(ev.data); };
    rec.onstop = function () {
      var blob = new Blob(chunks, { type: mime || 'video/webm' });
      if (audioCtx) { try { audioCtx.close(); } catch (e) {} }
      if (asMp4) {
        var base = String(ed.bridgeUrl || 'http://127.0.0.1:8787').replace(/\/$/, '');
        var fd = new FormData();
        fd.append('file', blob, 'edit.webm');
        A.toast('⏳ 로컬 FFmpeg 8.1.2로 인스타 릴스 표준 .MP4(H.264/AAC) 변환 중...');
        fetch(base + '/api/convert-mp4', { method: 'POST', body: fd })
          .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob(); })
          .then(function (mp4Blob) {
            var u2 = URL.createObjectURL(mp4Blob);
            var a2 = document.createElement('a');
            a2.href = u2;
            a2.download = '미담공장_릴스완성_' + A.todayKst() + '.mp4';
            document.body.appendChild(a2);
            a2.click();
            document.body.removeChild(a2);
            setTimeout(function () { URL.revokeObjectURL(u2); }, 3000);
            A.toast('🎉 인스타 릴스 표준 .MP4 추출 완료!');
          })
          .catch(function (err) {
            A.toast('MP4 변환 실패(로컬 스튜디오 꺼짐): .webm 원본으로 대신 저장합니다. (' + err.message + ')', 'error');
            var u3 = URL.createObjectURL(blob);
            var a3 = document.createElement('a');
            a3.href = u3;
            a3.download = '미담공장_릴스편집_' + A.todayKst() + '.webm';
            document.body.appendChild(a3);
            a3.click();
            document.body.removeChild(a3);
          })
          .finally(resetBtns);
        return;
      }
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = '미담공장_릴스편집_' + A.todayKst() + '.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
      resetBtns();
      A.toast('✅ 릴스 편집 영상(.webm) 다운로드 완료!');
    };

    if (videoEl && ed.mediaType === 'video') {
      videoEl.currentTime = ed.trimStart;
      videoEl.volume = ed.videoVol;
      videoEl.play().catch(function () {});
    }
    ed.playing = true;
    rec.start(200);
    A.toast('🎬 ' + durSec.toFixed(1) + '초 구간 렌더링 시작! 완료되면 자동 저장됩니다.');
    setTimeout(function () {
      if (rec.state !== 'inactive') rec.stop();
    }, durSec * 1000);
  }

  function renderStudioSubtab() {
    var clients = A.store.clients || [];
    return '' +
      '<div style="padding:14px;overflow-y:auto;height:100%">' +
        '<div class="ws-grid-2" style="align-items:start">' +
          // 왼쪽: AI 릴스 3초 후킹 대본 + 장면별 AI 영상 프롬프트 생성기
          '<div class="ws-card" style="padding:14px">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px">' +
              '<h3 style="margin:0;font-size:14.5px">✍️ 1. AI 릴스 3초 후킹 대본 &amp; 영상 프롬프트 생성</h3>' +
              '<span class="tag-pill ok">편집기 자막 즉시 연동</span>' +
            '</div>' +
            '<div class="ws-grid-3">' +
              '<div class="ws-field"><label>고객사 선택</label><select id="stClientSel">' +
                '<option value="">직접 입력</option>' +
                clients.map(function (c) { return '<option value="' + A.esc(c.name) + '" data-ind="' + A.esc(c.industry) + '"' + (ed.stClientName === c.name ? ' selected' : '') + '>' + A.esc(c.name) + '</option>'; }).join('') +
              '</select></div>' +
              '<div class="ws-field"><label>업종</label><select id="stInd">' +
                ['병원', '보험설계사', '정책자금', '자영업/소상공인'].map(function (ind) { return '<option value="' + ind + '"' + (ed.stIndustry === ind ? ' selected' : '') + '>' + ind + '</option>'; }).join('') +
              '</select></div>' +
              '<div class="ws-field"><label>업체명</label><input id="stCName" value="' + A.esc(ed.stClientName) + '"></div>' +
            '</div>' +
            '<div class="ws-field" style="margin-top:8px"><label>릴스 핵심 주제 · 혜택</label><input id="stTopic" value="' + A.esc(ed.stTopic) + '" placeholder="예: 12월 무료 건강검진 / 정책자금 탈락 방지 3가지"></div>' +
            '<div class="ws-actions" style="margin-top:8px">' +
              '<button type="button" class="ws-btn sm primary" id="stGenScript">⚡ 3초 후킹 대본 + AI 영상 프롬프트 자동 생성</button>' +
              '<button type="button" class="ws-btn sm ok" id="stCrewRunBtn"' + (ed.crewRunning ? ' disabled' : '') + '>' + (ed.crewRunning ? '⏳ CrewAI 협업 중...' : '🤖 CrewAI 특수부대 실행 (로컬 무료)') + '</button>' +
              '<button type="button" class="ws-btn sm ok" id="stApplyEdit">🎬 편집기 자막에 즉시 적용</button>' +
              '<button type="button" class="ws-btn sm accent" id="stAskAi">🏫 일진 종합반에 대본 고도화 요청</button>' +
            '</div>' +
            '<div class="ws-field" style="margin-top:10px"><label>30초 AI 성우 나레이션 대본</label><textarea id="stScriptBox" style="min-height:155px">' + A.esc(ed.stScript) + '</textarea></div>' +
            '<div class="ws-field" style="margin-top:8px"><label>🎥 AI 영상 생성용 영어 프롬프트 (ComfyUI · LTX-Video · Wan2.2 · Kling/Runway 복사용)</label><textarea id="stPromptBox" style="min-height:66px;font-family:monospace;font-size:11.5px">' + A.esc(ed.stVideoPrompt) + '</textarea></div>' +
            '<div class="ws-actions" style="margin-top:6px"><button type="button" class="ws-btn sm" id="stCopyPrompt">📋 AI 영상 프롬프트 복사</button></div>' +
          '</div>' +

          // 오른쪽: 한국어 AI 성우 나레이션(TTS) + 저작권 0% AI BGM 즉시 합성 스튜디오
          '<div style="display:flex;flex-direction:column;gap:12px">' +
            '<div class="ws-card" style="padding:14px">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">' +
                '<h3 style="margin:0;font-size:14.5px">🎙️ 2. 한국어 AI 성우 나레이션 (TTS)</h3>' +
                '<span class="tag-pill ok">즉시 미리듣기 + 로컬 GPU 연동</span>' +
              '</div>' +
              '<div class="ws-grid-2">' +
                '<div class="ws-field"><label>한국어 방송국급 AI 성우 선택 (6종 무료 무제한)</label><select id="stTtsVoice">' +
                  VOICE_LIST.map(function (v) { return '<option value="' + v[0] + '"' + (ed.ttsVoice === v[0] ? ' selected' : '') + '>' + v[1] + '</option>'; }).join('') +
                '</select></div>' +
                '<div class="ws-field"><label>말하기 속도: <b>' + Number(ed.ttsRate).toFixed(2) + 'x</b></label><input type="range" id="stTtsRate" min="0.7" max="1.5" step="0.05" value="' + ed.ttsRate + '"></div>' +
              '</div>' +
              '<div class="ws-actions" style="margin-top:8px">' +
                '<button type="button" class="ws-btn sm ok" id="stLocalTtsBtn">🎙️ 방송국급 AI 성우 MP3 생성 → 편집기 자동 장착</button>' +
                '<button type="button" class="ws-btn sm primary" id="stSpeakBtn"' + (ed.ttsBusy ? ' disabled' : '') + '>' + (ed.ttsBusy ? '⏳ 성우 로딩 중...' : '🔊 선택한 AI 성우 즉시 미리듣기') + '</button>' +
                '<button type="button" class="ws-btn sm" id="stStopSpeakBtn">⏹️ 정지</button>' +
              '</div>' +
              (ed.ttsPreviewUrl ? (
                '<div style="margin-top:8px;padding:9px 11px;border-radius:10px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.32)">' +
                  '<div style="font-size:11.6px;font-weight:800;color:#7dd3fc;margin-bottom:5px">🎧 현재 미리듣기 음성: ' + A.esc(ed.ttsPreviewLabel) + '</div>' +
                  '<audio controls src="' + ed.ttsPreviewUrl + '" style="width:100%;height:32px"></audio>' +
                '</div>'
              ) : '') +
              '<div style="margin-top:12px;padding:11px 12px;border-radius:12px;background:rgba(168,85,247,0.1);border:1.5px dashed rgba(192,132,252,0.45)">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:7px">' +
                  '<b style="font-size:12.6px;color:#e9d5ff">🧬 원장님 · 대표님 보이스 클로닝 (Fish-Speech)</b>' +
                  '<span class="tag-pill">10~30초 음성 샘플 필요</span>' +
                '</div>' +
                '<input type="file" id="stCloneFileInp" accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm" hidden>' +
                '<div class="ws-actions">' +
                  '<button type="button" class="ws-btn sm primary" id="stCloneFileBtn">📂 컴퓨터에서 원장님 음성 파일 열기 (.mp3/.wav/.m4a)</button>' +
                  '<button type="button" class="ws-btn sm ' + (ed.cloneRecording ? 'danger' : '') + '" id="stCloneMicBtn">' + (ed.cloneRecording ? '⏹️ 녹음 끝내기' : '🎙️ 마이크로 10초 바로 녹음') + '</button>' +
                '</div>' +
                (ed.cloneFileName ? (
                  '<div style="margin-top:7px;padding:8px 10px;border-radius:9px;background:rgba(15,23,42,0.65);border:1px solid rgba(192,132,252,0.35)">' +
                    '<div style="font-size:11.6px;font-weight:800;color:#86efac;margin-bottom:4px">✅ 장착된 원장님 샘플 음성: ' + A.esc(ed.cloneFileName) + '</div>' +
                    (ed.cloneFileUrl ? '<audio controls src="' + ed.cloneFileUrl + '" style="width:100%;height:30px"></audio>' : '') +
                  '</div>'
                ) : '<div style="margin-top:6px;font-size:11.3px;color:var(--muted)">💡 컴퓨터에 저장된 원장님 목소리 녹음 파일(10~30초)을 열거나, 마이크로 바로 녹음해 주세요.</div>') +
                '<div class="ws-field" style="margin-top:7px"><label>샘플 음성 속 실제 대사 (선택 · 입력하면 클로닝 발음이 더 정확해집니다)</label><input id="stCloneRefText" value="' + A.esc(ed.cloneRefText) + '" placeholder="예: 안녕하세요, 미담한의원 대표원장입니다."></div>' +
                '<div class="ws-actions" style="margin-top:8px">' +
                  '<button type="button" class="ws-btn sm ai" id="stFishTtsBtn"' + (ed.cloneBusy ? ' disabled' : '') + '>' + (ed.cloneBusy ? '⏳ 보이스 클로닝 생성 중...' : '🧬 Fish-Speech 원장님 보이스클로닝 생성') + '</button>' +
                '</div>' +
                (ed.cloneStatusMsg ? '<div style="margin-top:6px;font-size:11.5px;color:#fde047;line-height:1.5">' + A.esc(ed.cloneStatusMsg) + '</div>' : '') +
              '</div>' +
              '<div class="ws-field" style="margin-top:10px">' +
                '<label>로컬 AI 미디어 스튜디오 주소 (E:\\ai-studio\\media_bridge.py)</label>' +
                '<input id="stTtsEp" value="' + A.esc(ed.ttsEndpoint) + '" placeholder="http://127.0.0.1:8787/api/tts">' +
              '</div>' +
            '</div>' +

            '<div class="ws-card" style="padding:14px">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">' +
                '<h3 style="margin:0;font-size:14.5px">🎵 3. 저작권 0% AI BGM 즉시 작곡 스튜디오</h3>' +
                '<span class="tag-pill ok">WAV 즉시 생성 · 0원</span>' +
              '</div>' +
              '<div class="ws-grid-2">' +
                '<div class="ws-field"><label>BGM 분위기(무드) 선택</label><select id="stBgmMood">' +
                  BGM_MOODS.map(function (m) { return '<option value="' + m.id + '"' + (ed.bgmMood === m.id ? ' selected' : '') + '>' + m.label + '</option>'; }).join('') +
                '</select></div>' +
                '<div class="ws-field"><label>길이(초)</label><input type="number" id="stBgmSec" min="5" max="30" value="' + ed.bgmSeconds + '"></div>' +
              '</div>' +
              '<div class="ws-actions" style="margin-top:10px">' +
                '<button type="button" class="ws-btn sm primary" id="stGenBgmBtn"' + (ed.bgmGenerating ? ' disabled' : '') + '>' + (ed.bgmGenerating ? '⏳ 합성 중...' : '🎼 저작권 0% BGM 즉시 생성 → 편집기 자동 장착') + '</button>' +
              '</div>' +
              (ed.generatedBgmUrl ? (
                '<div style="margin-top:10px;padding:10px;border-radius:10px;background:rgba(14,165,233,0.08);border:1px solid rgba(14,165,233,0.28)">' +
                  '<div style="font-size:12px;font-weight:800;margin-bottom:6px">✅ 생성 완료 &amp; 편집기 장착됨: ' + A.esc(ed.generatedBgmName) + '</div>' +
                  '<audio controls src="' + ed.generatedBgmUrl + '" style="width:100%;height:34px"></audio>' +
                  '<div class="ws-actions" style="margin-top:6px">' +
                    '<a class="ws-btn sm" href="' + ed.generatedBgmUrl + '" download="' + A.esc(ed.generatedBgmName) + '">💾 WAV 파일 다운로드</a>' +
                    '<button type="button" class="ws-btn sm ok" id="stGoEditBtn">🎬 영상 편집기로 이동해서 합치기</button>' +
                  '</div>' +
                '</div>'
              ) : '') +
              '<div style="margin-top:8px;font-size:11.3px;color:var(--muted)">💡 추후 RTX 2070 SUPER에서 <code>ACE-Step-1.5</code> 로컬 서버를 띄우면 스튜디오급 보컬·악기 풀트랙 BGM도 무료로 무제한 생성해 바로 올릴 수 있습니다.</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function render() {
    var root = document.getElementById('pane-video');
    if (!root) return;

    var headerBar =
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 14px 0">' +
        '<div class="ws-actions">' +
          '<button type="button" class="ws-btn sm neon-yellow-tab ' + (ed.subTab === 'edit' ? 'active' : '') + '" data-ve-tab="edit">🎬 타임라인 웹 영상 편집기</button>' +
          '<button type="button" class="ws-btn sm neon-yellow-tab ' + (ed.subTab === 'studio' ? 'active' : '') + '" data-ve-tab="studio">🎙️ AI 성우 · BGM · 릴스 대본 스튜디오</button>' +
        '</div>' +
        '<div class="ws-actions">' +
          '<span class="tag-pill ' + (ed.bridgeOk ? 'ok' : 'warn') + '">' + (ed.bridgeOk ? '🟢 로컬 AI 스튜디오 연결됨 (FFmpeg·TTS·CrewAI)' : '⚪ 로컬 스튜디오 꺼짐 (E:\\ai-studio 실행)') + '</span>' +
          '<span class="tag-pill ok">장착 오디오: ' + A.esc(ed.bgmName || '없음') + '</span>' +
        '</div>' +
      '</div>';

    if (ed.subTab === 'studio') {
      root.innerHTML = '<div style="display:flex;flex-direction:column;height:100%">' + headerBar + '<div style="flex:1;min-height:0">' + renderStudioSubtab() + '</div></div>';
      bindEvents(root);
      return;
    }

    root.innerHTML = '<div style="display:flex;flex-direction:column;height:100%">' + headerBar +
      '<div class="ws-split" style="flex:1;min-height:0">' +
      '<div class="split-editor">' +
        '<div class="ws-card" style="padding:12px">' +
          '<h3 style="margin-bottom:8px;font-size:13px">📁 1. 미디어 · 오디오 불러오기</h3>' +
          '<div class="ws-actions">' +
            '<input type="file" id="veMediaInp" accept="video/*,image/*" hidden>' +
            '<input type="file" id="veBgmInp" accept="audio/*" hidden>' +
            '<button type="button" class="ws-btn sm primary" id="veMediaBtn">🎥 영상 · 이미지 불러오기</button>' +
            '<button type="button" class="ws-btn sm" id="veBgmBtn">🎵 BGM · AI 성우 오디오 추가</button>' +
            '<button type="button" class="ws-btn sm accent" data-ve-tab="studio">🎙️ AI 성우·BGM 바로 만들기</button>' +
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
        '</div>' +
      '</div>' +

      '<div class="split-preview" style="align-items:center">' +
        '<div class="preview-toolbar" style="max-width:760px">' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<button type="button" class="ws-btn sm primary" id="vePlayBtn">' + (ed.playing ? '⏸️ 일시정지' : '▶️ 미리보기 재생') + '</button>' +
            '<span id="veTimeLbl" style="font-size:12px;font-weight:800;color:#0c4a6e">' + ed.curTime.toFixed(1) + 's / ' + ed.trimEnd.toFixed(1) + 's</span>' +
          '</div>' +
          '<div class="ws-actions">' +
            '<button type="button" class="ws-btn sm primary" id="veExportMp4Btn">📱 진짜 릴스 .MP4 추출 (로컬 FFmpeg)</button>' +
            '<button type="button" class="ws-btn sm ok" id="veExportBtn">🎬 웹 영상 내보내기 (.webm)</button>' +
          '</div>' +
        '</div>' +

        '<div style="background:#020617;padding:14px;border-radius:18px;box-shadow:0 20px 50px rgba(0,0,0,0.45);border:1px solid rgba(56,189,248,0.28);display:flex;justify-content:center;align-items:center">' +
          '<canvas id="veCanvas" style="max-height:62dvh;max-width:100%;border-radius:10px;display:block"></canvas>' +
        '</div>' +

        '<div style="width:100%;max-width:760px;background:rgba(15,23,42,0.84);border:1px solid rgba(56,189,248,0.25);border-radius:14px;padding:12px 14px;color:#e2e8f0;font-size:11.5px">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:6px"><b>🎞️ 타임라인 트랙</b><span>선택 구간: ' + ed.trimStart.toFixed(1) + 's ~ ' + ed.trimEnd.toFixed(1) + 's (총 ' + Math.max(0.5, ed.trimEnd - ed.trimStart).toFixed(1) + '초)</span></div>' +
          '<div style="height:22px;background:rgba(255,255,255,0.08);border-radius:8px;position:relative;overflow:hidden;margin-bottom:5px">' +
            '<div style="position:absolute;top:0;bottom:0;left:' + ((ed.trimStart / Math.max(1, ed.duration)) * 100).toFixed(1) + '%;width:' + (((ed.trimEnd - ed.trimStart) / Math.max(1, ed.duration)) * 100).toFixed(1) + '%;background:linear-gradient(90deg,#0284c7,#38bdf8);display:flex;align-items:center;padding-left:8px;font-weight:800;font-size:10.5px;color:#fff">🎥 비디오 트랙</div>' +
          '</div>' +
          '<div style="height:18px;background:rgba(255,255,255,0.06);border-radius:6px;display:flex;align-items:center;padding-left:8px;color:#86efac;font-size:10.5px;font-weight:700;margin-bottom:4px">🎵 오디오/BGM 트랙: ' + A.esc(ed.bgmName || '미장착 (🎙️ AI 스튜디오에서 1초 생성 가능)') + '</div>' +
          '<div style="height:18px;background:rgba(255,255,255,0.06);border-radius:6px;display:flex;align-items:center;padding-left:8px;color:#fde047;font-size:10.5px;font-weight:700">✍️ 자막 트랙: ' + A.esc(ed.topText || '(자막 없음)') + '</div>' +
        '</div>' +
      '</div>' +
    '</div></div>';

    bindEvents(root);
    startRenderLoop();
  }

  function bindEvents(root) {
    var q = function (s) { return root.querySelector(s); };
    Array.prototype.forEach.call(root.querySelectorAll('[data-ve-tab]'), function (b) {
      b.addEventListener('click', function () {
        stopPlayback();
        ed.subTab = b.getAttribute('data-ve-tab');
        render();
      });
    });

    if (ed.subTab === 'studio') {
      var sc = q('#stClientSel'), si = q('#stInd'), scn = q('#stCName'), stp = q('#stTopic');
      if (sc) sc.addEventListener('change', function () {
        var opt = sc.options[sc.selectedIndex];
        if (sc.value) {
          ed.stClientName = sc.value;
          var ind = opt.getAttribute('data-ind');
          if (ind) ed.stIndustry = ind;
          render();
        }
      });
      if (si) si.addEventListener('change', function () { ed.stIndustry = si.value; });
      if (scn) scn.addEventListener('input', function () { ed.stClientName = scn.value; });
      if (stp) stp.addEventListener('input', function () { ed.stTopic = stp.value; });

      var sBox = q('#stScriptBox'), pBox = q('#stPromptBox');
      if (sBox) sBox.addEventListener('input', function () { ed.stScript = sBox.value; });
      if (pBox) pBox.addEventListener('input', function () { ed.stVideoPrompt = pBox.value; });

      var bGen = q('#stGenScript'), bCrew = q('#stCrewRunBtn'), bApply = q('#stApplyEdit'), bAsk = q('#stAskAi'), bCopyP = q('#stCopyPrompt');
      if (bGen) bGen.addEventListener('click', buildAutoReelScript);
      if (bCrew) bCrew.addEventListener('click', runLocalCrewAi);
      if (bApply) bApply.addEventListener('click', function () {
        ed.subTab = 'edit';
        A.toast('✅ 생성된 3초 후킹 자막이 영상 편집기에 적용되었습니다!');
        render();
      });
      if (bAsk) bAsk.addEventListener('click', function () {
        A.requestAiAssist(
          '[AI 릴스 대본 · 3초 후킹 카피 고도화 요청]\n- 고객사: ' + ed.stClientName + ' (' + ed.stIndustry + ')\n- 주제: ' + ed.stTopic + '\n- 현재 초안:\n' + ed.stScript + '\n\n요청: 홍보부 드럼통과 대장 비서실이 조회수와 DB 문의 전환율이 폭발하도록 3초 후킹 멘트 3버전과 30초 대본을 다듬어 줘!',
          'general'
        );
      });
      if (bCopyP) bCopyP.addEventListener('click', function () {
        navigator.clipboard.writeText(ed.stVideoPrompt || '').then(function () { A.toast('📋 AI 영상 프롬프트 복사 완료!'); });
      });

      var rInp = q('#stTtsRate'), vSel = q('#stTtsVoice'), epInp = q('#stTtsEp');
      if (rInp) rInp.addEventListener('input', function () { ed.ttsRate = Number(rInp.value); render(); });
      if (vSel) vSel.addEventListener('change', function () { ed.ttsVoice = vSel.value; });
      if (epInp) epInp.addEventListener('input', function () { ed.ttsEndpoint = epInp.value; });

      var spBtn = q('#stSpeakBtn'), stpBtn = q('#stStopSpeakBtn'), locTts = q('#stLocalTtsBtn'), fishTts = q('#stFishTtsBtn');
      if (spBtn) spBtn.addEventListener('click', speakKoreanPreview);
      if (stpBtn) stpBtn.addEventListener('click', stopTtsPreview);
      if (locTts) locTts.addEventListener('click', function () { callLocalTtsEngine('edge'); });
      if (fishTts) fishTts.addEventListener('click', runVoiceClone);

      var cFileBtn = q('#stCloneFileBtn'), cFileInp = q('#stCloneFileInp'), cMicBtn = q('#stCloneMicBtn'), cRefInp = q('#stCloneRefText');
      if (cFileBtn && cFileInp) {
        cFileBtn.addEventListener('click', function () { cFileInp.click(); });
        cFileInp.addEventListener('change', function () {
          var f = cFileInp.files && cFileInp.files[0];
          if (!f) return;
          if (ed.cloneFileUrl) URL.revokeObjectURL(ed.cloneFileUrl);
          ed.cloneFile = f;
          ed.cloneFileName = f.name + ' (' + Math.max(1, Math.round(f.size / 1024)) + 'KB)';
          ed.cloneFileUrl = URL.createObjectURL(f);
          ed.cloneStatusMsg = '✅ 원장님 샘플 파일 선택 완료! [🧬 Fish-Speech 원장님 보이스클로닝 생성]을 누르세요.';
          render();
          A.toast('📂 원장님 음성 샘플 파일(' + f.name + ')이 불러와졌습니다!');
        });
      }
      if (cMicBtn) cMicBtn.addEventListener('click', toggleCloneMicRecord);
      if (cRefInp) cRefInp.addEventListener('input', function () { ed.cloneRefText = cRefInp.value; });

      var mSel = q('#stBgmMood'), sNum = q('#stBgmSec'), gBgm = q('#stGenBgmBtn'), goEd = q('#stGoEditBtn');
      if (mSel) mSel.addEventListener('change', function () { ed.bgmMood = mSel.value; });
      if (sNum) sNum.addEventListener('input', function () { ed.bgmSeconds = Number(sNum.value || 15); });
      if (gBgm) gBgm.addEventListener('click', generateInstantBgmWav);
      if (goEd) goEd.addEventListener('click', function () { ed.subTab = 'edit'; render(); });
      return;
    }

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
        attachAudioBlobToEditor(f, f.name);
        render();
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

    var expBtn = q('#veExportBtn'), expMp4Btn = q('#veExportMp4Btn');
    if (expBtn) expBtn.addEventListener('click', function () { exportEditedVideo(false); });
    if (expMp4Btn) expMp4Btn.addEventListener('click', function () { exportEditedVideo(true); });
  }

  A.on('transfer-video', function (payload) {
    if (!payload) return;
    if (payload.topHook) ed.topText = payload.topHook;
    else if (payload.title) ed.topText = payload.title;
    if (payload.script) ed.stScript = payload.script;
    ed.subTab = 'studio';
    A.toast('🎬 캘린더·10편 공장의 릴스 대본을 AI 스튜디오에 불러왔습니다!');
    checkLocalBridge();
    render();
  });

  A.on('tab-changed', function (t) {
    if (t === 'video') { checkLocalBridge(); render(); }
    else { stopPlayback(); cancelAnimationFrame(rafId); }
  });
})();

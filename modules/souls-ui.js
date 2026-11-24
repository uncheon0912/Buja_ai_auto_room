/**
 * 🧬 AI 인격체별 SOUL.md · MEMORY.md 웹 편집 팝업 모듈
 * - 상단 "🧬 영혼·기억" 버튼 클릭 시 6개 인격 + 공통 회사/공유 기억을 탭별로 보고 즉시 편집·저장 (/api/souls)
 * - 로컬 agents/ 폴더와 scripts/soul_sync.ps1 로 양방향 동기화
 */
(function () {
  'use strict';
  var A = window.AgencyApp;
  if (!A) return;

  var TABS = [
    { id: '_shared', label: '🏢 공통 (COMPANY · 공유기억)' },
    { id: 'antigo', label: '⚡ 안티고 휘발유' },
    { id: 'hongbo', label: '📢 홍보부 드럼통' },
    { id: 'cs', label: '🔔 CS 딸랑이' },
    { id: 'secretary', label: '📝 대장 비서실' },
    { id: 'jipigo', label: '🫧 지피고 씹던껌' },
    { id: 'ollago', label: '🔥 올라고 개거품' },
  ];

  var data = { shared: { company: '', memory: '' }, agents: {} };
  var curTab = 'hongbo';

  function ensureShape(raw) {
    var out = { shared: { company: '', memory: '' }, agents: {} };
    if (raw && raw.shared) {
      out.shared.company = String(raw.shared.company || '');
      out.shared.memory = String(raw.shared.memory || '');
    }
    ['antigo', 'hongbo', 'cs', 'secretary', 'jipigo', 'ollago'].forEach(function (id) {
      var src = raw && raw.agents && raw.agents[id];
      out.agents[id] = {
        soul: String((src && src.soul) || ''),
        memory: String((src && src.memory) || ''),
      };
    });
    return out;
  }

  function renderModal() {
    var bg = document.getElementById('soulModal');
    if (!bg) return;

    var isShared = curTab === '_shared';
    var topTitle = isShared ? '🏢 COMPANY.md (회사 공통 정체성 · 단가 · 원칙)' : '✨ SOUL.md (인격체 정체성 · 말투 · 절대 규칙)';
    var botTitle = isShared ? '🧠 SHARED_MEMORY.md (전 AI 공유 장기 기억)' : '🧠 MEMORY.md (이 인격체의 누적 장기 기억 · 자동 추가됨)';
    var topVal = isShared ? data.shared.company : (data.agents[curTab] ? data.agents[curTab].soul : '');
    var botVal = isShared ? data.shared.memory : (data.agents[curTab] ? data.agents[curTab].memory : '');

    bg.innerHTML = '<div class="modal" style="max-width:820px">' +
      '<div class="modal-head">' +
        '<h3>🧬 AI 인격체 영혼(SOUL.md) · 장기 기억(MEMORY.md) 관리</h3>' +
        '<button type="button" class="modal-x" id="soulClose">×</button>' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
        TABS.map(function (t) {
          return '<button type="button" class="filter-pill' + (curTab === t.id ? ' active' : '') + '" data-stab="' + t.id + '">' + t.label + '</button>';
        }).join('') +
      '</div>' +
      '<div>' +
        '<label class="lbl">' + topTitle + '</label>' +
        '<textarea id="soulTopTa" rows="7" placeholder="마크다운 형식으로 입력하세요...">' + A.esc(topVal) + '</textarea>' +
      '</div>' +
      '<div>' +
        '<label class="lbl">' + botTitle + '</label>' +
        '<textarea id="soulBotTa" rows="7" placeholder="기억할 핵심 사실을 - [날짜] 내용 형식으로 적거나 자동 누적됩니다...">' + A.esc(botVal) + '</textarea>' +
      '</div>' +
      '<div style="font-size:11.6px;color:var(--muted);background:rgba(14,165,233,0.08);padding:8px 11px;border-radius:10px;line-height:1.5">' +
        '💡 <b>양방향 동기화 팁</b>: 여기서 저장하면 Cloudflare D1과 브레인 백업에 영구 보관됩니다. 로컬 <code>agents/</code> 폴더와 동기화하려면 <code>scripts\\soul_sync.ps1 -Action pull</code> 또는 <code>push</code>를 실행하세요.' +
      '</div>' +
      '<div class="modal-foot">' +
        '<span class="mstat" id="soulStat"></span>' +
        '<div class="mbtns">' +
          '<button type="button" class="mbtn" id="soulCancel">닫기</button>' +
          '<button type="button" class="mbtn primary" id="soulSave">💾 서버 저장 및 적용</button>' +
        '</div>' +
      '</div>' +
    '</div>';

    var saveDraft = function () {
      var tEl = bg.querySelector('#soulTopTa');
      var bEl = bg.querySelector('#soulBotTa');
      if (!tEl || !bEl) return;
      if (curTab === '_shared') {
        data.shared.company = tEl.value;
        data.shared.memory = bEl.value;
      } else {
        if (!data.agents[curTab]) data.agents[curTab] = { soul: '', memory: '' };
        data.agents[curTab].soul = tEl.value;
        data.agents[curTab].memory = bEl.value;
      }
    };

    Array.prototype.forEach.call(bg.querySelectorAll('[data-stab]'), function (b) {
      b.addEventListener('click', function () {
        saveDraft();
        curTab = b.getAttribute('data-stab');
        renderModal();
      });
    });

    var closeFn = function () { bg.hidden = true; };
    bg.querySelector('#soulClose').addEventListener('click', closeFn);
    bg.querySelector('#soulCancel').addEventListener('click', closeFn);
    bg.querySelector('#soulSave').addEventListener('click', function () {
      saveDraft();
      var st = bg.querySelector('#soulStat');
      st.textContent = '저장 중…';
      A.api('/api/souls', { method: 'POST', body: JSON.stringify(data) })
        .then(function () {
          A.store.souls = ensureShape(data);
          st.textContent = '✅ 모든 인격체의 SOUL.md · MEMORY.md 저장 완료!';
          A.toast('🧬 AI 영혼·기억이 서버에 저장되었습니다.');
          if (window.triggerSkyBurst) window.triggerSkyBurst();
        })
        .catch(function (err) { st.textContent = '저장 실패: ' + (err.message || ''); });
    });
  }

  function openModal() {
    var bg = document.getElementById('soulModal');
    if (!bg) return;
    bg.hidden = false;
    A.api('/api/souls')
      .then(function (d) {
        if (d && d.data) data = ensureShape(d.data);
        else if (A.store.souls) data = ensureShape(A.store.souls);
        renderModal();
      })
      .catch(function () { renderModal(); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('soulOpenBtn');
    var bg = document.getElementById('soulModal');
    if (btn) btn.addEventListener('click', openModal);
    if (bg) bg.addEventListener('click', function (e) { if (e.target === bg) bg.hidden = true; });
  });
})();

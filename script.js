// script.js — Thrive Up (fixed, frontend-only)
// -------------------------------------------------
// Navigation, symptom checker, drug lookup,
// reminders (localStorage), assistant bubble, theme toggle.

// ===== Element refs & initial data =====
const pages = document.querySelectorAll('.page');
const navBtns = document.querySelectorAll('.nav-btn');
const app = document.getElementById('app');
const themeCheckbox = document.getElementById('theme-checkbox');
const themeLabel = document.getElementById('theme-label');


// Local mock drug DB
const drugsDB = {
  paracetamol: {
    name: 'Paracetamol',
    use: 'Pain relief and fever reducer.',
    sideEffects: 'Rare: nausea, allergic reaction.',
    dose: 'Usually 500mg every 4-6 hours (adult).'
  },
  ibuprofen: {
    name: 'Ibuprofen',
    use: 'Anti-inflammatory for pain and swelling.',
    sideEffects: 'Stomach upset, avoid if allergic.',
    dose: '200-400mg every 4-6 hours (adult).'
  },
  amoxicillin: {
    name: 'Amoxicillin',
    use: 'Antibiotic for bacterial infections.',
    sideEffects: 'Diarrhea, possible allergy.',
    dose: 'Follow prescription.'
  },
  Omeprazole: {
    name: 'Omeprazole',
    use: 'Reduces stomach acid (ulcer,reflux).',
    sideEffects:'Headache,low magnesium(long-termuse).',
    Dose:'20 mg once daily.',
    AvoidIn:'Severe liver disease (with caution).',
  }
};

const REM_KEY = 'thrive_reminders_v1';

// Add missing drug search button reference (was used later but not declared)
const drugSearchBtn = document.getElementById('drug-search');

// ===== Navigation =====
function openPage(id) {
  pages.forEach(p => p.classList.remove('active-page'));
  const page = document.getElementById(id);
  if (page) page.classList.add('active-page');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Ensure one nav button is active
(function initNavButtons() {
  if (!navBtns || navBtns.length === 0) return;
  // Attach handlers
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.querySelector('.nav-btn.active');
      if (current) current.classList.remove('active');
      btn.classList.add('active');
      const target = btn.dataset.target;
      openPage(target);
    });
  });

  // If none active, set first as active
  const hasActive = document.querySelector('.nav-btn.active');
  if (!hasActive && navBtns[0]) {
    navBtns[0].classList.add('active');
    const t = navBtns[0].dataset.target;
    openPage(t);
  }
})();

// Quick action buttons on Home
const jumpSymptom = document.getElementById('jump-symptom');
const jumpDrug = document.getElementById('jump-drug');
if (jumpSymptom) jumpSymptom.addEventListener('click', () => document.querySelector('[data-target="symptoms"]').click());
if (jumpDrug) jumpDrug.addEventListener('click', () => document.querySelector('[data-target="drug-info"]').click());

// ===== Mini reminders (home) =====
function renderMiniReminders() {
  const list = document.getElementById('mini-reminders');
  if (!list) return;
  list.innerHTML = '';
  const rems = loadReminders();
  rems.slice(0, 3).forEach(r => {
    const li = document.createElement('li');
    li.textContent = `${r.name} — ${r.time}`;
    list.appendChild(li);
  });
}

// ===== Symptom checker (frontend mock) =====
const symptomCheckBtn = document.getElementById('symptom-check');
if (symptomCheckBtn) {
  symptomCheckBtn.addEventListener('click', () => {
    const inputEl = document.getElementById('symptom-input');
    const out = document.getElementById('symptom-output');
    if (!inputEl || !out) return;
    const q = inputEl.value.trim().toLowerCase();
    out.innerHTML = '';
    if (!q) {
      out.innerHTML = `<div class="assistant-msg">Please enter a symptom.</div>`;
      return;
    }

    let rec = 'Please consult a doctor for accurate diagnosis.';
    if (q.includes('headache')) rec = 'Recommendation: Paracetamol 500mg, rest, hydrate.';
    else if (q.includes('fever')) rec = 'Recommendation: Paracetamol; monitor temperature and see doctor if >38.5°C.';
    else if (q.includes('cough')) rec = 'Recommendation: Stay hydrated; seek medical care if persistent.';
    else if (q.includes('pain')) rec = 'Recommendation: Ibuprofen for inflammation/pain (if suitable).';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<h4>Symptom</h4><p class="muted">${escapeHtml(q)}</p><hr><p>${escapeHtml(rec)}</p>`;
    out.appendChild(card);
  });
}

// ===== Drug lookup (local DB only) =====
if (drugSearchBtn) {
  drugSearchBtn.addEventListener('click', () => {
    const input = document.getElementById('drug-input');
    const results = document.getElementById('drug-results');
    if (!input || !results) return;
    const q = input.value.trim().toLowerCase();
    results.innerHTML = '';
    if (!q) {
      results.innerHTML = `<div class="assistant-msg">Please enter a drug name.</div>`;
      return;
    }

    if (drugsDB[q]) {
      const d = drugsDB[q];
      const c = document.createElement('div');
      c.className = 'card';
      c.innerHTML = `<h3>💊 ${escapeHtml(d.name)}</h3>
                     <p><strong>Use:</strong> ${escapeHtml(d.use)}</p>
                     <p><strong>Dose:</strong> ${escapeHtml(d.dose)}</p>
                     <p><strong>Side effects:</strong> ${escapeHtml(d.sideEffects)}</p>`;
      results.appendChild(c);
    } else {
      const c = document.createElement('div');
      c.className = 'card';
      c.innerHTML = `<h3>Not found</h3><p class="muted">Drug not found in local DB. You can extend the DB later.</p>`;
      results.appendChild(c);
    }
  });
}

// ===== Quick search from topbar (Enter key) =====
const quickSearch = document.getElementById('quick-search');
if (quickSearch) {
  quickSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim().toLowerCase();
      if (!q) return;
      if (drugsDB[q]) {
        document.querySelector('[data-target="drug-info"]').click();
        document.getElementById('drug-input').value = q;
        document.getElementById('drug-search').click();
      } else {
        document.querySelector('[data-target="symptoms"]').click();
        document.getElementById('symptom-input').value = q;
        document.getElementById('symptom-check').click();
      }
    }
  });
}

// ===== Reminders (localStorage) =====
function loadReminders() {
  try {
    const raw = localStorage.getItem(REM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
function saveReminders(list) {
  localStorage.setItem(REM_KEY, JSON.stringify(list));
}
function renderReminders() {
  const listEl = document.getElementById('rem-list');
  if (!listEl) return;
  listEl.innerHTML = '';
  const items = loadReminders();
  if (!items || items.length === 0) {
    listEl.innerHTML = `<li class="muted">No reminders set.</li>`;
    return;
  }
  items.forEach((r, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${escapeHtml(r.name)} — ${escapeHtml(r.time)}</span><div><button class="btn ghost" data-idx="${idx}">Delete</button></div>`;
    listEl.appendChild(li);
  });
}
const remSetBtn = document.getElementById('rem-set');
if (remSetBtn) {
  remSetBtn.addEventListener('click', () => {
    const name = document.getElementById('rem-med').value.trim();
    const time = document.getElementById('rem-time').value;
    if (!name || !time) return alert('Please provide medication name and time');
    const items = loadReminders();
    items.push({ name, time });
    saveReminders(items);
    renderReminders();
    renderMiniReminders();
    document.getElementById('rem-med').value = '';
    document.getElementById('rem-time').value = '';
  });
}
// delete handler (event delegation)
const remListEl = document.getElementById('rem-list');
if (remListEl) {
  remListEl.addEventListener('click', (e) => {
    if (e.target.matches('button[data-idx]')) {
      const idx = Number(e.target.dataset.idx);
      const items = loadReminders();
      items.splice(idx, 1);
      saveReminders(items);
      renderReminders();
      renderMiniReminders();
    }
  });
}

// ===== Assistant bubble (frontend-only) =====
const assistantBubble = document.getElementById('assistant-bubble');
const assistantPanel = document.getElementById('assistant-panel');
const assistantSend = document.getElementById('assistant-send');
const assistantInput = document.getElementById('assistant-input');
const assistantMessages = document.getElementById('assistant-messages');


if (assistantBubble) {
  // Auto-close configuration
  const ASSISTANT_AUTO_CLOSE_MS = 30000; // 30s of inactivity
  let assistantAutoCloseTimer = null;

  function clearAssistantTimer() {
    if (assistantAutoCloseTimer) {
      clearTimeout(assistantAutoCloseTimer);
      assistantAutoCloseTimer = null;
    }
  }
  function resetAssistantAutoClose() {
    clearAssistantTimer();
    assistantAutoCloseTimer = setTimeout(() => {
      closeAssistantPanel();
    }, ASSISTANT_AUTO_CLOSE_MS);
  }

  function openAssistantPanel() {
    if (!assistantPanel) return;
    assistantPanel.classList.remove('hidden');
    if (assistantInput) assistantInput.focus();
    resetAssistantAutoClose();
  }

  function closeAssistantPanel() {
    if (!assistantPanel) return;
    assistantPanel.classList.add('hidden');
    clearAssistantTimer();
  }

  // Toggle on bubble click but use helpers so timer is tracked
  assistantBubble.addEventListener('click', (ev) => {
    if (!assistantPanel) return;
    if (assistantPanel.classList.contains('hidden')) openAssistantPanel();
    else closeAssistantPanel();
    ev.stopPropagation();
  });

  // Reset timer on interactions inside the panel
  ['click', 'keydown', 'input', 'focus'].forEach(evt =>
    assistantPanel.addEventListener(evt, () => resetAssistantAutoClose())
  );

  // Close when clicking outside bubble/panel
  document.addEventListener('click', (e) => {
    if (!assistantPanel || !assistantBubble) return;
    if (assistantPanel.classList.contains('hidden')) return;
    const target = e.target;
    if (!assistantPanel.contains(target) && !assistantBubble.contains(target)) {
      closeAssistantPanel();
    }
  });

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAssistantPanel();
    }
  });

  // When the panel is programmatically closed (e.g., send), ensure timer is cleared
  if (assistantSend) {
    assistantSend.addEventListener('click', () => {
      // keep behavior: send will clear/reset inside message handler; ensure timer restarts
      resetAssistantAutoClose();
    });
  }
}

// map keywords to pages
const sectionMap = {
  symptom: 'symptoms',
  symptoms: 'symptoms',
  drug: 'drug-info',
  drugs: 'drug-info',
  reminder: 'reminder',
  reminders: 'reminder',
  home: 'home'
};

if (assistantSend) {
  assistantSend.addEventListener('click', () => {
    if (!assistantInput) return;
    const t = assistantInput.value.trim();
    if (!t) return;

    // add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'assistant-msg';
    userMsg.style.background = '#0074D9';
    userMsg.style.color = '#fff';
    userMsg.textContent = t;
    assistantMessages && assistantMessages.appendChild(userMsg);

    // generate response
    let botText = 'Sorry, I can only do simple navigation hints: try "symptom", "drug", or "reminder".';
    const key = Object.keys(sectionMap).find(k => t.toLowerCase().includes(k));
    if (key) {
      const pageId = sectionMap[key];
      const btn = document.querySelector(`[data-target="${pageId}"]`);
      if (btn) btn.click();
      botText = `Opened the ${pageId} section for you.`;
      // highlight page briefly
      const p = document.getElementById(pageId);
      if (p) {
        p.style.background = 'rgba(255,221,87,0.18)';
        setTimeout(() => p.style.background = '', 900);
      }
    } else if (t.toLowerCase().includes('hello')) {
      botText = 'Hi! I can jump to sections or remind you how to set reminders.';
    } else if (t.toLowerCase().includes('thanks')) {
      botText = "You're welcome! Good luck at the hackathon 🎉";
    }

    const botMsg = document.createElement('div');
    botMsg.className = 'assistant-msg';
    botMsg.textContent = botText;
    assistantMessages && assistantMessages.appendChild(botMsg);

    assistantInput.value = '';
    if (assistantMessages) assistantMessages.scrollTop = assistantMessages.scrollHeight;
  });
}

// chips on assistant page
document.querySelectorAll('.chip').forEach(c => {
  c.addEventListener('click', () => {
    const target = c.dataset.target;
    const btn = document.querySelector(`[data-target="${target}"]`);
    if (btn) btn.click();
  });
});

// ===== Theme toggle =====
function setTheme(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark');
    app.classList.add('dark');
    themeLabel && (themeLabel.textContent = 'Dark');
    themeCheckbox && (themeCheckbox.checked = true);
  } else {
    document.documentElement.classList.remove('dark');
    app.classList.remove('dark');
    themeLabel && (themeLabel.textContent = 'Light');
    themeCheckbox && (themeCheckbox.checked = false);
  }
  localStorage.setItem('thrive_theme_dark', isDark ? '1' : '0');
}
if (themeCheckbox) {
  themeCheckbox.addEventListener('change', (e) => setTheme(e.target.checked));
}
const persistedTheme = localStorage.getItem('thrive_theme_dark') === '1';
setTheme(persistedTheme);

// ===== On load =====
renderReminders();
renderMiniReminders();
renderReminders(); // ensure UI sync

// ===== Utility =====
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"'`=\/]/g, s => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    return map[s];
  });
}

// Toogle 
   var sidemenu = document.getElementById('sidemenu');

    function openmenu(){
        sidemenu.style.right = "0";
    }
    function closemenu(){
        sidemenu.style.right = "-200px";
    }
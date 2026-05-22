// ============================================================
//  HVAC Quiz — UI (ui.js)
//  Handles: rendering, animations, screen flow, events
// ============================================================

(function () {
  "use strict";

  const { GameState, EPB_LEVELS, t, loadQuestions, prepareSession,
          currentQuestion, applyFiftyFifty, callPhoneFriend, submitAnswer } = window.QuizModel;

  // ─── ROOT ─────────────────────────────────────────────────
  const root = document.getElementById("app");

  // ─── SFXS (simple Web Audio tones) ───────────────────────
  let audioCtx = null;
  function getAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }
  function playTone(freq, duration, type = "sine", vol = 0.18) {
    try {
      const ctx = getAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = type; osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(); osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  }
  function sfxCorrect() { playTone(660, 0.15); setTimeout(() => playTone(880, 0.25), 160); }
  function sfxWrong()   { playTone(220, 0.4, "sawtooth"); }
  function sfxClick()   { playTone(440, 0.08, "sine", 0.08); }
  function sfxReveal()  { playTone(540, 0.12, "triangle", 0.1); }

  // ─── UTILITIES ────────────────────────────────────────────
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function clearRoot() {
    root.innerHTML = "";
  }

  function fadeIn(element) {
    element.style.opacity = "0";
    element.style.transform = "translateY(18px)";
    requestAnimationFrame(() => {
      element.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      element.style.opacity = "1";
      element.style.transform = "translateY(0)";
    });
  }

  // ─── THEME ICONS ─────────────────────────────────────────
  const THEME_ICONS = {
    all: "⚡",
    heating: "🔥",
    ventilation: "💨",
    sanitaire: "💧",
    "smart appliances": "📡",
    general: "🏗️",
  };

  // ─── SCREEN: LANGUAGE SELECT ──────────────────────────────
  function renderLanguageScreen() {
    clearRoot();
    const wrap = el("div", "screen language-screen");

    const logo = el("div", "logo-area");
    logo.innerHTML = `<div class="logo-icon">🌡️</div>
      <h1 class="app-title">HVAC Quiz</h1>
      <p class="app-sub">Who wants to win EPB label A?</p>`;
    wrap.appendChild(logo);

    const label = el("p", "section-label", "Choisissez votre langue / Kies uw taal");
    wrap.appendChild(label);

    const btns = el("div", "lang-buttons");

    const frBtn = el("button", "lang-btn", `<span class="flag">🇫🇷</span><span>Français</span>`);
    frBtn.addEventListener("click", () => {
      sfxClick();
      GameState.lang = "fr";
      GameState.phase = "theme";
      renderThemeScreen();
    });

    const nlBtn = el("button", "lang-btn", `<span class="flag">🇧🇪</span><span>Nederlands</span>`);
    nlBtn.addEventListener("click", () => {
      sfxClick();
      GameState.lang = "nl";
      GameState.phase = "theme";
      renderThemeScreen();
    });

    btns.appendChild(frBtn);
    btns.appendChild(nlBtn);
    wrap.appendChild(btns);
    root.appendChild(wrap);
    fadeIn(wrap);
  }

  // ─── SCREEN: THEME SELECT ────────────────────────────────
  function renderThemeScreen() {
    clearRoot();
    const wrap = el("div", "screen theme-screen");

    const header = el("div", "screen-header");
    header.innerHTML = `<div class="logo-icon small">🌡️</div><h2>${t("appTitle")}</h2>`;
    wrap.appendChild(header);

    const label = el("p", "section-label", t("chooseTheme"));
    wrap.appendChild(label);

    const grid = el("div", "theme-grid");
    const themes = ["all", "heating", "ventilation", "sanitaire", "smart appliances", "general"];

    themes.forEach((theme) => {
      const btn = el("button", "theme-btn");
      btn.innerHTML = `<span class="theme-icon">${THEME_ICONS[theme]}</span>
        <span class="theme-name">${t(`themes.${theme}`)}</span>`;
      btn.addEventListener("click", () => {
        sfxClick();
        GameState.theme = theme;
        try {
          prepareSession();
        } catch (e) {
          showModal(t("notEnoughQuestions"));
          return;
        }
        if (GameState.sessionQuestions.length < 5) {
          showModal(t("notEnoughQuestions"));
          return;
        }
        GameState.phase = "playing";
        renderGameScreen();
      });
      grid.appendChild(btn);
    });

    wrap.appendChild(grid);

    // Language back
    const back = el("button", "back-btn", "← 🌐");
    back.addEventListener("click", () => { sfxClick(); renderLanguageScreen(); });
    wrap.appendChild(back);

    root.appendChild(wrap);
    fadeIn(wrap);
  }

  // ─── SCREEN: GAME ────────────────────────────────────────
  function renderGameScreen() {
    clearRoot();
    const q = currentQuestion();
    const qNum = GameState.currentIndex + 1;
    const lang = GameState.lang;

    const wrap = el("div", "screen game-screen");

    // ── Top bar ──
    const topBar = el("div", "top-bar");

    // Progress / EPB ladder
    const ladder = el("div", "epb-ladder");
    EPB_LEVELS.forEach((lvl, i) => {
      const step = el("div", `epb-step${i === GameState.currentIndex ? " current" : i < GameState.currentIndex ? " done" : ""}`);
      step.innerHTML = `<span class="epb-label">${lvl.label}</span>`;
      step.style.setProperty("--epb-color", lvl.color);
      ladder.appendChild(step);
    });
    topBar.appendChild(ladder);

    // Lifelines panel
    const lifelines = el("div", "lifelines");
    const lifelineTitle = el("div", "lifeline-title", t("lifelineTitle"));
    lifelines.appendChild(lifelineTitle);

    const ll5050 = createLifelineBtn("5050", "lifeline5050", "½", GameState.lifelines.fiftyFifty, () => {
      sfxReveal();
      const removed = applyFiftyFifty();
      removed.forEach((i) => {
        const btn = document.querySelector(`.answer-btn[data-index="${i}"]`);
        if (btn) { btn.disabled = true; btn.classList.add("hidden-answer"); }
      });
    });

    const llPhone = createLifelineBtn("phone", "lifelinePhone", "📞", GameState.lifelines.phone, async () => {
      sfxClick();
      const modal = showPhoneModal(t("thinking"), true);
      try {
        const answer = await callPhoneFriend();
        updatePhoneModal(modal, answer);
      } catch {
        updatePhoneModal(modal, lang === "fr" ? "Désolé, je ne peux pas répondre maintenant." : "Sorry, ik kan nu niet antwoorden.");
      }
    });

    const llTool = createLifelineBtn("tool", "lifelineTool", "🔧", GameState.lifelines.tool, () => {
      sfxClick();
      GameState.lifelines.tool = true;
      llTool.classList.add("used");
      llTool.disabled = true;
      showToolModal();
    });

    lifelines.appendChild(ll5050);
    lifelines.appendChild(llPhone);
    lifelines.appendChild(llTool);
    topBar.appendChild(lifelines);
    wrap.appendChild(topBar);

    // ── Question number badge ──
    const qBadge = el("div", "q-badge",
      `${t("question")} ${qNum} ${t("of")} 5 <span class="epb-badge" style="background:${q.epbLevel.color}">${q.epbLevel.emoji} ${q.epbLevel.label}</span>`);
    wrap.appendChild(qBadge);

    // ── Question text ──
    const qBox = el("div", "question-box");
    const qText = el("p", "question-text", q.question);
    qBox.appendChild(qText);
    wrap.appendChild(qBox);

    // ── Answers grid ──
    const answersGrid = el("div", "answers-grid");
    q.answers.forEach((ans, i) => {
      const btn = el("button", "answer-btn");
      btn.dataset.index = i;
      btn.innerHTML = `<span class="answer-letter">${t("answerLabels")[i]}</span><span class="answer-text">${ans}</span>`;
      btn.addEventListener("click", () => handleAnswer(i, q, answersGrid, btn));
      answersGrid.appendChild(btn);
    });
    wrap.appendChild(answersGrid);

    // ── Lock-in button ──
    const lockBtn = el("button", "lock-btn", `✅ ${t("lockIn")}`);
    lockBtn.style.display = "none";
    wrap.appendChild(lockBtn);

    root.appendChild(wrap);
    fadeIn(wrap);
    sfxReveal();
  }

  function createLifelineBtn(id, i18nKey, icon, used, onClick) {
    const btn = el("button", `lifeline-btn${used ? " used" : ""}`);
    btn.id = `ll-${id}`;
    btn.title = t(i18nKey);
    btn.innerHTML = `<span class="ll-icon">${icon}</span><span class="ll-label">${t(i18nKey)}</span>`;
    if (used) { btn.disabled = true; }
    else { btn.addEventListener("click", onClick); }
    return btn;
  }

  // ─── ANSWER HANDLING ──────────────────────────────────────
  function handleAnswer(index, q, grid, clickedBtn) {
    // Disable all buttons
    grid.querySelectorAll(".answer-btn").forEach((b) => { b.disabled = true; });

    // Highlight selected
    clickedBtn.classList.add("selected");

    setTimeout(() => {
      const result = submitAnswer(index);

      if (result.correct) {
        clickedBtn.classList.remove("selected");
        clickedBtn.classList.add("correct");
        sfxCorrect();

        if (GameState.phase === "result") {
          // Won the game!
          setTimeout(() => renderResultScreen(true), 1200);
        } else {
          setTimeout(() => { renderGameScreen(); }, 1400);
        }
      } else {
        clickedBtn.classList.remove("selected");
        clickedBtn.classList.add("wrong");
        // Show the correct answer
        const correctBtn = grid.querySelector(`.answer-btn[data-index="${result.correctIndex}"]`);
        if (correctBtn) { correctBtn.classList.add("correct"); }
        sfxWrong();
        setTimeout(() => renderResultScreen(false), 1800);
      }
    }, 700);
  }

  // ─── SCREEN: RESULT ───────────────────────────────────────
  function renderResultScreen(won) {
    clearRoot();
    const wrap = el("div", "screen result-screen");

    const correctAnswers = GameState.score;
    const maxLevel = correctAnswers > 0 ? EPB_LEVELS[correctAnswers - 1] : null;

    const icon = el("div", "result-icon", won ? "🏆" : "💡");
    wrap.appendChild(icon);

    const title = el("h2", "result-title", won ? t("finalWin") : t("finalLose"));
    wrap.appendChild(title);

    if (maxLevel) {
      const levelEl = el("div", "result-level");
      levelEl.style.setProperty("--lvl-color", maxLevel.color);
      levelEl.innerHTML = `<span>${t("finalScore")}</span><span class="big-label">${maxLevel.emoji} ${maxLevel.label}</span>`;
      wrap.appendChild(levelEl);
    } else {
      const levelEl = el("div", "result-level");
      levelEl.innerHTML = `<span>${t("finalScore")}</span><span class="big-label">—</span>`;
      wrap.appendChild(levelEl);
    }

    // Score bar
    const scoreBar = el("div", "score-bar");
    EPB_LEVELS.forEach((lvl, i) => {
      const seg = el("div", `score-seg${i < correctAnswers ? " achieved" : ""}`);
      seg.style.setProperty("--seg-color", lvl.color);
      seg.textContent = lvl.label;
      scoreBar.appendChild(seg);
    });
    wrap.appendChild(scoreBar);

    const actions = el("div", "result-actions");

    const replayBtn = el("button", "primary-btn", t("playAgain"));
    replayBtn.addEventListener("click", () => {
      sfxClick();
      prepareSession();
      GameState.phase = "playing";
      renderGameScreen();
    });

    const themeBtn = el("button", "secondary-btn", t("changeTheme"));
    themeBtn.addEventListener("click", () => {
      sfxClick();
      GameState.phase = "theme";
      renderThemeScreen();
    });

    actions.appendChild(replayBtn);
    actions.appendChild(themeBtn);
    wrap.appendChild(actions);

    root.appendChild(wrap);
    fadeIn(wrap);
  }

  // ─── MODALS ───────────────────────────────────────────────
  function showModal(message) {
    const overlay = el("div", "modal-overlay");
    const box = el("div", "modal-box");
    box.innerHTML = `<p>${message}</p>`;
    const closeBtn = el("button", "modal-close-btn", t("close"));
    closeBtn.addEventListener("click", () => overlay.remove());
    box.appendChild(closeBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    fadeIn(box);
    return overlay;
  }

  function showPhoneModal(initialText, loading) {
    const overlay = el("div", "modal-overlay");
    const box = el("div", "modal-box phone-modal");
    box.innerHTML = `
      <div class="phone-header">
        <span class="phone-avatar">🤖</span>
        <div>
          <div class="phone-name">${t("phoneCallTitle")}</div>
          <div class="phone-status${loading ? " typing" : ""}">${loading ? "..." : ""}</div>
        </div>
      </div>
      <div class="phone-message" id="phone-msg">${loading ? '<span class="dots">●●●</span>' : initialText}</div>`;
    const closeBtn = el("button", "modal-close-btn", t("close"));
    closeBtn.addEventListener("click", () => overlay.remove());
    box.appendChild(closeBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    fadeIn(box);
    return overlay;
  }

  function updatePhoneModal(overlay, text) {
    const msgEl = overlay.querySelector("#phone-msg");
    const status = overlay.querySelector(".phone-status");
    if (msgEl) { msgEl.textContent = text; }
    if (status) { status.textContent = ""; status.classList.remove("typing"); }
  }

  function showToolModal() {
    const overlay = el("div", "modal-overlay");
    const box = el("div", "modal-box tool-modal");
    box.innerHTML = `
      <div class="tool-header">🔧 ${t("toolCallTitle")}</div>
      <p>${t("toolCallDesc")}</p>
      <a href="https://www.rehva.eu/rehva-journal/tools" target="_blank" rel="noopener" class="tool-link-btn">${t("toolCallBtn")} ↗</a>`;
    const closeBtn = el("button", "modal-close-btn", t("close"));
    closeBtn.addEventListener("click", () => overlay.remove());
    box.appendChild(closeBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    fadeIn(box);
  }

  // ─── INIT ─────────────────────────────────────────────────
  async function init() {
    try {
      await loadQuestions();
    } catch (e) {
      root.innerHTML = `<div class="load-error">${t("loadError")}</div>`;
      return;
    }
    GameState.phase = "language";
    renderLanguageScreen();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

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
  const THEME_IMG = {
    all: "img/img_all.png",
    heating: 'img/website_chauffage_cards.webp',
    ventilation: 'img/website_ventilatie_cards.webp',
    sanitaire: "img/shutterstock_2389567943_cards.webp",
    "smart appliances": "img/smartbuildings.png"
  };

	function getLogoSrc() {
	  return GameState.lang === "fr"
		? "img/who-wants-to-be-a-millionaire_mod.svg"
		: "img/who-wants-to-be-a-millionaire_mod_nl.svg";
	}

  // ─── SCREEN: LANGUAGE SELECT ──────────────────────────────
  function renderLanguageScreen() {
    clearRoot();
    const wrap = el("div", "screen language-screen");

	const leftSide = el("div","leftSide")
	const rightSide = el("div","rightSide")

	wrap.appendChild(leftSide)
	wrap.appendChild(rightSide)

    const logo = el("div", "logo-area");
	logo.innerHTML = `
	  <img style="width:300px" src="${getLogoSrc()}">
	`;    
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

    const nlBtn = el("button", "lang-btn", `<span class="flag">NL</span><span>Nederlands</span>`);
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
	addLanguageSelector(wrap);

    const header = el("div", "screen-header");
	header.innerHTML = `
	  <img style="width:300px" src="${getLogoSrc()}">
	`;    
    wrap.appendChild(header);

    const label = el("p", "section-label", t("chooseTheme"));
    wrap.appendChild(label);

    const grid = el("div", "theme-grid");
    const themes = ["all", "heating", "ventilation", "sanitaire", "smart appliances"];

    themes.forEach((theme) => {
      const btn = el("button", "theme-btn");
      btn.innerHTML = `<span class="theme-icon"><img style="width:250px" src="${THEME_IMG[theme]}"</img></span>
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
	//addLanguageSelector(wrap);
	
	const twocols = el("div","twocols")
	wrap.appendChild(twocols)

	const leftSide = el("div","leftSide")
	const rightSide = el("div","rightSide")

	twocols.appendChild(leftSide)
	twocols.appendChild(rightSide)


    // ── Top bar ──
    const topBar = el("div", "top-bar");

    // Progress / EPB ladder
    const ladder = el("div", "epb-ladder");
    [...EPB_LEVELS].reverse().forEach((lvl, reversedIndex) => {
		  const i = EPB_LEVELS.length - 1 - reversedIndex;

		  const step = el(
			"div",
			`epb-step${
			  i === GameState.currentIndex
				? " current"
				: i < GameState.currentIndex
				? " done"
				: ""
			}`
		  );

		  step.innerHTML = `<span class="epb-label">${lvl.label}</span>`;
		  step.style.setProperty("--epb-color", lvl.color);

		  ladder.appendChild(step);
		});
    //topBar.appendChild(ladder);
	rightSide.append(ladder)

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
      //llTool.classList.add("used");
      //llTool.disabled = true;
      showToolModal(llTool);
    });

    lifelines.appendChild(ll5050);
    lifelines.appendChild(llPhone);
    lifelines.appendChild(llTool);
    topBar.appendChild(lifelines);
    wrap.appendChild(topBar);

    // ── Question number badge ──
    const qBadge = el("div", "q-badge",
      `${t("question")} ${qNum} ${t("of")} 5`);
    leftSide.appendChild(qBadge);

    // ── Question text ──
    const qBoxWrapper = el("div", "question-box-wrapper");
    const qBox = el("div", "question-box");
    const qText = el("p", "question-text", q.question);

	qBoxWrapper.appendChild(qBox)
	qBox.appendChild(qText);
    leftSide.appendChild(qBoxWrapper);

    // ── Answers grid ──
    const answersGrid = el("div", "answers-grid");
    q.answers.forEach((ans, i) => {
	  const wrap = el("div", "answer-wrap");
      
	  const btn = el("button", "answer-btn");
      btn.dataset.index = i;
      btn.innerHTML = `<span class="answer-letter">${t("answerLabels")[i]}</span><span class="answer-text">${ans}</span>`;
      btn.addEventListener("click", () => handleAnswer(i, q, answersGrid, btn, wrap));
      
	  wrap.appendChild(btn)
	  answersGrid.appendChild(wrap);
    });
    leftSide.appendChild(answersGrid);

    // ── Lock-in button ──
    const lockBtn = el("button", "lock-btn", `✅ ${t("lockIn")}`);
    lockBtn.style.display = "none";
    leftSide.appendChild(lockBtn);

    root.appendChild(wrap);
    fadeIn(wrap);
    sfxReveal();
  }

  function createLifelineBtn(id, i18nKey, icon, used, onClick) {
    const btn = el("button", `lifeline-btn${used ? " used" : ""}`);
    btn.id = `ll-${id}`;
    btn.title = t(i18nKey);
    btn.innerHTML = `<span class="ll-icon">${icon}</span>`;
    if (used) { btn.disabled = true; }
    else { btn.addEventListener("click", onClick); }
    return btn;
  }

  // ─── ANSWER HANDLING ──────────────────────────────────────
  function handleAnswer(index, q, grid, clickedBtn, clickedWrap) {
    // Disable all buttons
    grid.querySelectorAll(".answer-btn").forEach((b) => { b.disabled = true; });

    // Highlight selected
    clickedBtn.classList.add("selected");
    clickedWrap.classList.add("selected");

    setTimeout(() => {
      const result = submitAnswer(index);

      if (result.correct) {
        clickedBtn.classList.remove("selected");
        clickedBtn.classList.add("correct");

		clickedWrap.classList.remove("selected");
		clickedWrap.classList.add("correct");

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

        clickedWrap.classList.remove("selected");
        clickedWrap.classList.add("wrong");

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
	addLanguageSelector(wrap);

    const correctAnswers = GameState.score;
    const maxLevel = correctAnswers > 0 ? EPB_LEVELS[correctAnswers - 1] : null;

    const icon = el("div", "result-icon", won ? "🏆" : "💡");
    wrap.appendChild(icon);

    const title = el("h2", "result-title", won ? t("finalWin") : t("finalLose"));
    wrap.appendChild(title);

    if (maxLevel) {
      const levelEl = el("div", "result-level");
      levelEl.style.setProperty("--lvl-color", maxLevel.color);
      levelEl.innerHTML = `<span>${t("finalScore")}</span><span class="big-label"> ${maxLevel.label}</span>`;
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

function showPhoneModal(initialText, loading, url = "https://tooli.be/c/new") {

	buildQuizPrompt()

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const box = el("div", "modal-box phone-modal");

  box.innerHTML = `
    <div class="phone-header">

      <div class="phone-header-info">
        <div class="phone-name">${t("phoneCallTitle")}</div>
        <div class="phone-status ${loading ? "typing" : ""}">
          ${loading ? "..." : ""}
        </div>
      </div>

      <button class="modal-close-x">✕</button>
    </div>



    <div class="phone-message">
	${t("ask_tooli_you_question_is_copied")}
    </div>

  <div class="phone-actions">
      <button class="ai-tool-btn">
        <img src="img/Tooli_Logo_Pos_L.avif" style="width:300px"></img>
      </button>
    </div>
    `;

  // Close modal
  box.querySelector(".modal-close-x")
    .addEventListener("click", () => {
      overlay.remove();
    });

  // Open URL in new tab
  box.querySelector(".ai-tool-btn")
    .addEventListener("click", () => {
      window.open(url, "_blank");
    });

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


const tools = [
  {
    title: "Heatload",
    description: "heatload_description",
    image: "heatload_notext_square.svg",
    url: "https://heatload.buildwise.be/"
  },
  {
    title: "Waterdim",
    description: "Application rendant les modèles BIM accessibles.",
    image: "sww2_01_notext_square.svg",
    url: "https://waterdim.buildwise.be"
  },
  {
    title: "BoilerRoom App",
    description: "boiler_room_rules",
    image: "boiler_svg_notext_square.svg",
    url: "https://boilerroomapp.buildwise.be/"
  },
  {
    title: "SilentHeatPump",
    description: "acoustic_heat_pump",
    image: "silentheatpump_notext_square.svg",
    url: "https://silentheatpump.buildwise.be/"
  },
  {
    title: "Optivent App",
    description: "reglage_debit",
    image: "optivent_notext_square.svg",
    url: "https://silentheatpump.buildwise.be/"
  },
  {
    title: "PowerHeat",
    description: "radiateurs",
    image: "powerheat_final_notext_square.svg",
    url: "https://powerheat.buildwise.be/"
  }  
  
];

function showToolModal(lltool) {

  const overlay = el("div", "modal-overlay");
  const box = el("div", "modal-box tool-modal");

  box.innerHTML = `
    <div class="tool-header">🔧 ${t("toolCallTitle")}</div>
    <p>${t("toolCallDesc")}</p>

    <div class="tools-grid">

      ${tools.map(tool => `
        <div class="tool-card" data-url="${tool.url}">

          <img
            src="${tool.image}"
            alt="${tool.title}"
            class="tool-card-img"
          >

          <div class="tool-card-body">
            <h3>${tool.title}</h3>
            <p>${tool.description}</p>
          </div>

        </div>
      `).join("")}

    </div>
  `;

  // Handle tool card click
  box.querySelectorAll(".tool-card").forEach(card => {

    card.addEventListener("click", () => {

      const url = card.dataset.url;

      // Mark tool as used
      lltool.classList.add("used");
      lltool.disabled = true;

      // Open URL
      window.open(url, "_blank");

      // Optional: close modal automatically
      overlay.remove();
    });
  });

  // Close button
  const closeBtn = el("button", "modal-close-btn", t("close"));

  closeBtn.addEventListener("click", () => {
    overlay.remove();
  });

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
	GameState.phase = "theme";
	renderThemeScreen();
    //GameState.phase = "language";
    //renderLanguageScreen();
  }

  document.addEventListener("DOMContentLoaded", init);


function addLanguageSelector(container) {
  const langBox = el("div", "language-selector");

  langBox.innerHTML = `
    <button class="lang-switch ${GameState.lang === "fr" ? "active" : ""}" data-lang="fr">FR</button>
    <button class="lang-switch ${GameState.lang === "nl" ? "active" : ""}" data-lang="nl">NL</button>
  `;

  langBox.querySelectorAll(".lang-switch").forEach((btn) => {
    btn.addEventListener("click", () => {
      const newLang = btn.dataset.lang;
      if (newLang === GameState.lang) return;

      sfxClick();
      GameState.lang = newLang;

      if (GameState.phase === "theme") {
        renderThemeScreen();
      } else if (GameState.phase === "playing") {
        refreshSessionLanguage();
        renderGameScreen();
      } else if (GameState.phase === "result") {
        renderResultScreen(GameState.gameOver && GameState.score >= EPB_LEVELS.length);
      }
    });
  });

  container.appendChild(langBox);
}

function refreshSessionLanguage() {
  GameState.sessionQuestions = GameState.sessionQuestions.map((sessionQ) => {
    const originalQ = GameState.allQuestions.find(q => q.id === sessionQ.id);
    if (!originalQ) return sessionQ;

    return {
      ...sessionQ,
      question: GameState.lang === "fr"
        ? originalQ.question_fr
        : originalQ.question_nl,
      answers: GameState.lang === "fr"
        ? originalQ.answers_fr
        : originalQ.answers_nl,
    };
  });
}

}
)();


async function buildQuizPrompt() {

  // Get question
  const questionEl = document.querySelector(".question-text");
  const question = questionEl
    ? questionEl.innerText.trim()
    : "";

  // Get all answers
  const answerEls = document.querySelectorAll(".answer-btn");

  const proposals = [];

  answerEls.forEach((btn) => {

    const letter =
      btn.querySelector(".answer-letter")?.innerText.trim() || "";

    const text =
      btn.querySelector(".answer-text")?.innerText.trim() || "";

    proposals.push(`${letter}: ${text}`);
  });

  // Build AI prompt
  const prompt = 
t("i_have_this_question")
+`
"${question}"
`+
t("here_are_the_proposals")+
`
${proposals.join("\n")}
`
+t("what_is_the_right_answer")
+`
  `.trim();
console.log(prompt)

	// Copy to clipboard
  try {
    await navigator.clipboard.writeText(prompt);

    console.log("Prompt copied to clipboard!");

  } catch (err) {

    console.error("Clipboard copy failed:", err);
  }


  return prompt;
}



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

	addBWLogo(document.getElementById('app'));

    const header = el("div", "screen-header");
	header.innerHTML = `
	  <img style="width:300px" src="${getLogoSrc()}">
	`;    
    wrap.appendChild(header);

    const label = el("p", "section-label", t("chooseTheme"));
    wrap.appendChild(label);

    const grid = el("div", "theme-grid");
    const themes = ["heating", "ventilation", "sanitaire", "smart appliances"];

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
		//GameState.phase = "rules";
        //renderRules();
		
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
  
  // ─── SCREEN : RULES 
  
  function renderRules(){
	  
	  clearRoot()
	  const wrap = el("div", "screen rules-screen");
	  addBWLogo(document.getElementById('app'))

	  var heading = el("h1")
	  heading.innerHTML = "Rules of the game"
	  wrap.appendChild(heading)
	  
	  var rules = [
		{'id':1,'rule':'there are 5 questions to get label A'},
		{'id':2,'rule':'only 1 correct answer'},
		{'id':3,'rule':'you have 3 jokers'}
		]
	
	rules.forEach(rule => {
		var elem = el('h2')
		elem.innerText = rule.rule
		wrap.appendChild(elem)
	
	})
	 
 	const llPhone = createLifelineBtn("", "", "📞", null, ()=>{})
    const llTool = createLifelineBtn("", "", "🔧", null,  ()=>{} )
	const ll5050 = createLifelineBtn("", "", "<p style='font-size:13px'>50:50</p>", null,  ()=>{})

  var jokers = [
	{'id':3,'rule':'50/50 will remove two incorrect answers','btn':ll5050},
	{'id':4,'rule':'The friend you can call is Tooli, the Belgian construction sector AI platform','btn':llPhone},
	{'id':5,'rule':'No public, but you can use our Buildwise tools to help you answer','btn':llTool}
	];

	 
	jokers.forEach(rule => {
		var item = el('span')
		item.classList.add("lifeline-description")
		
		var elem = el('h3')
		elem.innerText = rule.rule
		item.appendChild(rule.btn)
		item.appendChild(elem)
		
		wrap.appendChild(item)
		
		
	
	})
	  
	  
	var btn = el("btn","start-button")
	btn.innerHTML = "Start"
	btn.addEventListener("click",() => {
	  GameState.phase = "playing";
	  renderGameScreen();

	})
	wrap.appendChild(btn)
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
	addBWLogo(document.getElementById('app'))
	
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
		  step.style.setProperty("--epb-width", lvl.width);

		  ladder.appendChild(step);
		});
    //topBar.appendChild(ladder);
	rightSide.append(ladder)

    // Lifelines panel
    const lifelines = el("div", "lifelines");
    const lifelineTitle = el("div", "lifeline-title", t("lifelineTitle"));
    lifelines.appendChild(lifelineTitle);

    const ll5050 = createLifelineBtn("5050", "lifeline5050", "<p style='font-size:13px'>50:50</p>", GameState.lifelines.fiftyFifty, () => {
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


	const footerDiv = el("div","footerdiv","")
	footerDiv.id = "footer_div"

	const explainDiv = el("div","explanation-div","")
	explainDiv.id = "explain_div"
	
	const nextBtn = el("button","next-btn",'&rarr;')
	nextBtn.addEventListener("click",() => {pushNext()})
	nextBtn.id = "nextbtn"
	
	
	
	footerDiv.appendChild(nextBtn);
	footerDiv.appendChild(explainDiv);
	footerDiv.style.display = "none"

	wrap.append(footerDiv)


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

	function pushNext(){

		var nextbtn = document.getElementById("nextbtn")

		if (nextbtn.classList.contains("lost")){
			console.log("LOST")
	      renderResultScreen(false);
		  return
		}
		if (GameState.phase === "result") {
          // Won the game!
          renderResultScreen(true);
        } else {
           renderGameScreen(); 
        }
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

	  var explanation = document.getElementById("explain_div")
	  explanation.innerHTML = currentExplanation()


      if (result.correct) {
		var nextbtn = document.getElementById("nextbtn")
		nextbtn.classList.remove("lost")

		  
        clickedBtn.classList.remove("selected");
        clickedBtn.classList.add("correct");

		clickedWrap.classList.remove("selected");
		clickedWrap.classList.add("correct");

        sfxCorrect();

		var footer = document.getElementById("footer_div")
		setTimeout(() => { footer.style.display = "" }, 1400);

        if (GameState.phase === "result") {
          // Won the game!
          setTimeout(() => renderResultScreen(true), 1200);
        } else {
          //setTimeout(() => { renderGameScreen(); }, 3400);
        }
      } 
	  else {
        clickedBtn.classList.remove("selected");
        clickedBtn.classList.add("wrong");

        clickedWrap.classList.remove("selected");
        clickedWrap.classList.add("wrong");

        // Show the correct answer
        const correctBtn = grid.querySelector(`.answer-btn[data-index="${result.correctIndex}"]`);
        if (correctBtn) { correctBtn.classList.add("correct"); }

		var footer = document.getElementById("footer_div")
		var nextbtn = document.getElementById("nextbtn")
		nextbtn.classList.add("lost")
		setTimeout(() => { footer.style.display = "" }, 1400);
	}
		

    }, 700);
  }

  // ─── SCREEN: RESULT ───────────────────────────────────────
  function renderResultScreen(won) {
    clearRoot();
    const wrap = el("div", "screen result-screen");
	addLanguageSelector(wrap);

	addBWLogo(document.getElementById("app"))

    const correctAnswers = GameState.score;
    const maxLevel = correctAnswers > 0 ? EPB_LEVELS[correctAnswers - 1] : null;

    const icon = el("div", "result-icon", won ? "🏆" : "💡");
    wrap.appendChild(icon);

    const title = el("h2", "result-title", won ? t("finalWin") : t("finalLose"));
    wrap.appendChild(title);

    if (maxLevel) {
      const levelEl = el("div", "result-level");
      levelEl.style.setProperty("--lvl-color", maxLevel.color);
      levelEl.style.setProperty("--lvl-width", maxLevel.width);
      levelEl.innerHTML = `<span>${t("finalScore")}</span><span class="big-label"> ${maxLevel.label}</span>`;
      wrap.appendChild(levelEl);
    } else {
      const levelEl = el("div", "result-level");
      levelEl.innerHTML = `<span>${t("finalScore")}</span><span class="big-label">—</span>`;
      wrap.appendChild(levelEl);
    }

    // Score bar
    /*const scoreBar = el("div", "score-bar");
    [...EPB_LEVELS].reverse().forEach((lvl, reversedIndex) => {
	  const i = EPB_LEVELS.length - 1 - reversedIndex;

      const seg = el("div", `score-seg${i < correctAnswers ? " achieved" : ""}`);
      seg.style.setProperty("--seg-color", lvl.color);
      seg.style.setProperty("--seg-width", lvl.width);
      seg.textContent = lvl.label;
      scoreBar.appendChild(seg);
    });
    wrap.appendChild(scoreBar);
	*/
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
    description: {'fr':"Déperditions thermiques des bâtiments",'nl':'Warmteverliezen van gebouwen'},
    image: "img/heatload_notext_square.svg",
    url: "https://heatload.buildwise.be/"
  },
  {
    title: "Waterdim",
    description: {'fr':"Dimensionnement des installations ECS pour le logement individuel ou collectiff",'nl':'SWW dimensionering'},
    image: "img/sww2_01_notext_square.svg",
    url: "https://waterdim.buildwise.be"
  },
  {
    title: "BoilerRoom App",
    description: {'fr':"Réglementations et normes sur les chaufferies",'nl':'Stookplaatsen normen en regelgeving'},
    image: "img/boiler_svg_notext_square.svg",
    url: "https://boilerroomapp.buildwise.be/"
  },
  {
    title: "SilentHeatPump",
    description: {'fr':"Acoustique des pompes à chaleur",'nl':'Akoestiek van Warmtepompen'},
    image: "img/silentheatpump_notext_square.svg",
    url: "https://silentheatpump.buildwise.be/"
  },
  {
    title: "Optivent App",
    description: {'fr':"Réglage des débits de ventilation",'nl':'Afstelling van ventilatiedebieten'},
    image: "img/optivent_notext_square.svg",
    url: "https://optivent-app.buildwise.be/home"
  },
  {
    title: "PowerHeat",
    description: {'fr':"Estimer la puissance des radiateurs existants pour différents régimes de température",'nl':'Schatting van bestaande radiatoren vermogen'},
    image: "img/powerheat_final_notext_square.svg",
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
            <p>${tool.description[GameState.lang]}</p>
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

function addBWLogo(container){
	
	const div = el("div","bw-logo")
	div.innerHTML=`<img id="company-logo" alt="No Image" class="company-logo-image" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFYAAAAwCAYAAACL+42wAAAABGdBTUEAALGPC/xhBQAACklpQ0NQc1JHQiBJRUM2MTk2Ni0yLjEAAEiJnVN3WJP3Fj7f92UPVkLY8LGXbIEAIiOsCMgQWaIQkgBhhBASQMWFiApWFBURnEhVxILVCkidiOKgKLhnQYqIWotVXDjuH9yntX167+3t+9f7vOec5/zOec8PgBESJpHmomoAOVKFPDrYH49PSMTJvYACFUjgBCAQ5svCZwXFAADwA3l4fnSwP/wBr28AAgBw1S4kEsfh/4O6UCZXACCRAOAiEucLAZBSAMguVMgUAMgYALBTs2QKAJQAAGx5fEIiAKoNAOz0ST4FANipk9wXANiiHKkIAI0BAJkoRyQCQLsAYFWBUiwCwMIAoKxAIi4EwK4BgFm2MkcCgL0FAHaOWJAPQGAAgJlCLMwAIDgCAEMeE80DIEwDoDDSv+CpX3CFuEgBAMDLlc2XS9IzFLiV0Bp38vDg4iHiwmyxQmEXKRBmCeQinJebIxNI5wNMzgwAABr50cH+OD+Q5+bk4eZm52zv9MWi/mvwbyI+IfHf/ryMAgQAEE7P79pf5eXWA3DHAbB1v2upWwDaVgBo3/ldM9sJoFoK0Hr5i3k4/EAenqFQyDwdHAoLC+0lYqG9MOOLPv8z4W/gi372/EAe/tt68ABxmkCZrcCjg/1xYW52rlKO58sEQjFu9+cj/seFf/2OKdHiNLFcLBWK8ViJuFAiTcd5uVKRRCHJleIS6X8y8R+W/QmTdw0ArIZPwE62B7XLbMB+7gECiw5Y0nYAQH7zLYwaC5EAEGc0Mnn3AACTv/mPQCsBAM2XpOMAALzoGFyolBdMxggAAESggSqwQQcMwRSswA6cwR28wBcCYQZEQAwkwDwQQgbkgBwKoRiWQRlUwDrYBLWwAxqgEZrhELTBMTgN5+ASXIHrcBcGYBiewhi8hgkEQcgIE2EhOogRYo7YIs4IF5mOBCJhSDSSgKQg6YgUUSLFyHKkAqlCapFdSCPyLXIUOY1cQPqQ28ggMor8irxHMZSBslED1AJ1QLmoHxqKxqBz0XQ0D12AlqJr0Rq0Hj2AtqKn0UvodXQAfYqOY4DRMQ5mjNlhXIyHRWCJWBomxxZj5Vg1Vo81Yx1YN3YVG8CeYe8IJAKLgBPsCF6EEMJsgpCQR1hMWEOoJewjtBK6CFcJg4Qxwicik6hPtCV6EvnEeGI6sZBYRqwm7iEeIZ4lXicOE1+TSCQOyZLkTgohJZAySQtJa0jbSC2kU6Q+0hBpnEwm65Btyd7kCLKArCCXkbeQD5BPkvvJw+S3FDrFiOJMCaIkUqSUEko1ZT/lBKWfMkKZoKpRzame1AiqiDqfWkltoHZQL1OHqRM0dZolzZsWQ8ukLaPV0JppZ2n3aC/pdLoJ3YMeRZfQl9Jr6Afp5+mD9HcMDYYNg8dIYigZaxl7GacYtxkvmUymBdOXmchUMNcyG5lnmA+Yb1VYKvYqfBWRyhKVOpVWlX6V56pUVXNVP9V5qgtUq1UPq15WfaZGVbNQ46kJ1Bar1akdVbupNq7OUndSj1DPUV+jvl/9gvpjDbKGhUaghkijVGO3xhmNIRbGMmXxWELWclYD6yxrmE1iW7L57Ex2Bfsbdi97TFNDc6pmrGaRZp3mcc0BDsax4PA52ZxKziHODc57LQMtPy2x1mqtZq1+rTfaetq+2mLtcu0W7eva73VwnUCdLJ31Om0693UJuja6UbqFutt1z+o+02PreekJ9cr1Dund0Uf1bfSj9Rfq79bv0R83MDQINpAZbDE4Y/DMkGPoa5hpuNHwhOGoEctoupHEaKPRSaMnuCbuh2fjNXgXPmasbxxirDTeZdxrPGFiaTLbpMSkxeS+Kc2Ua5pmutG003TMzMgs3KzYrMnsjjnVnGueYb7ZvNv8jYWlRZzFSos2i8eW2pZ8ywWWTZb3rJhWPlZ5VvVW16xJ1lzrLOtt1ldsUBtXmwybOpvLtqitm63Edptt3xTiFI8p0in1U27aMez87ArsmuwG7Tn2YfYl9m32zx3MHBId1jt0O3xydHXMdmxwvOuk4TTDqcSpw+lXZxtnoXOd8zUXpkuQyxKXdpcXU22niqdun3rLleUa7rrStdP1o5u7m9yt2W3U3cw9xX2r+00umxvJXcM970H08PdY4nHM452nm6fC85DnL152Xlle+70eT7OcJp7WMG3I28Rb4L3Le2A6Pj1l+s7pAz7GPgKfep+Hvqa+It89viN+1n6Zfgf8nvs7+sv9j/i/4XnyFvFOBWABwQHlAb2BGoGzA2sDHwSZBKUHNQWNBbsGLww+FUIMCQ1ZH3KTb8AX8hv5YzPcZyya0RXKCJ0VWhv6MMwmTB7WEY6GzwjfEH5vpvlM6cy2CIjgR2yIuB9pGZkX+X0UKSoyqi7qUbRTdHF09yzWrORZ+2e9jvGPqYy5O9tqtnJ2Z6xqbFJsY+ybuIC4qriBeIf4RfGXEnQTJAntieTE2MQ9ieNzAudsmjOc5JpUlnRjruXcorkX5unOy553PFk1WZB8OIWYEpeyP+WDIEJQLxhP5aduTR0T8oSbhU9FvqKNolGxt7hKPJLmnVaV9jjdO31D+miGT0Z1xjMJT1IreZEZkrkj801WRNberM/ZcdktOZSclJyjUg1plrQr1zC3KLdPZisrkw3keeZtyhuTh8r35CP5c/PbFWyFTNGjtFKuUA4WTC+oK3hbGFt4uEi9SFrUM99m/ur5IwuCFny9kLBQuLCz2Lh4WfHgIr9FuxYji1MXdy4xXVK6ZHhp8NJ9y2jLspb9UOJYUlXyannc8o5Sg9KlpUMrglc0lamUycturvRauWMVYZVkVe9ql9VbVn8qF5VfrHCsqK74sEa45uJXTl/VfPV5bdra3kq3yu3rSOuk626s91m/r0q9akHV0IbwDa0b8Y3lG19tSt50oXpq9Y7NtM3KzQM1YTXtW8y2rNvyoTaj9nqdf13LVv2tq7e+2Sba1r/dd3vzDoMdFTve75TsvLUreFdrvUV99W7S7oLdjxpiG7q/5n7duEd3T8Wej3ulewf2Re/ranRvbNyvv7+yCW1SNo0eSDpw5ZuAb9qb7Zp3tXBaKg7CQeXBJ9+mfHvjUOihzsPcw83fmX+39QjrSHkr0jq/dawto22gPaG97+iMo50dXh1Hvrf/fu8x42N1xzWPV56gnSg98fnkgpPjp2Snnp1OPz3Umdx590z8mWtdUV29Z0PPnj8XdO5Mt1/3yfPe549d8Lxw9CL3Ytslt0utPa49R35w/eFIr1tv62X3y+1XPK509E3rO9Hv03/6asDVc9f41y5dn3m978bsG7duJt0cuCW69fh29u0XdwruTNxdeo94r/y+2v3qB/oP6n+0/rFlwG3g+GDAYM/DWQ/vDgmHnv6U/9OH4dJHzEfVI0YjjY+dHx8bDRq98mTOk+GnsqcTz8p+Vv9563Or59/94vtLz1j82PAL+YvPv655qfNy76uprzrHI8cfvM55PfGm/K3O233vuO+638e9H5ko/ED+UPPR+mPHp9BP9z7nfP78L/eE8/stRzjPAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAJcEhZcwAA2P8AANj/AYYzabAAAAT0SURBVHic7ZpNaB1VFMd/k9ckbfwo0sQoaoX6UUVEceFGlKgLCbhwoRu1KGrbjZZKFQTxg4qlCAoFg9WWUBXBhS5U0Kx0ows3uhGlYiumKdbWj6Y2bWry3nVx7nSS6T13Zl7effNemB8M7+V+zL35vzP3nnvORMYYKlpPT9kTWK5UwgaiEjYQlbCBqIQNxApXYbRzYgNwZwvHaQBfAB/n7jEDXANcb+AkEJ3TYj2wBegHYtcmAqaBV4G/lTvfDjwM1FL9DgKvAfNKvwdxa/KNGRndly6MXO5WtHNiGrhQGaBZTgGXAcdztT5tW99kYJZEgoTtwAtK7/uAT5S6z4FRpW498LNSN2VnlGbGjIyeny7UloJVSvlSGABeyt26HzgC/AWsdLYY9PQe8tT5+vnq+oqUa8LOeAZYCk8Bq3O1rAFzwGTkWgZAngCNWU/dSU/dGU+dNp6zvN2bVw15hLMxyHPzB/Cn/d5Fh0RN2FrAMZ8EzsvVsoZsJYes1bottyPRhL0g8Jgf5WoZW+3vwDHCrPyBcLpbwKPAHQHHNcBGT32E2Opn1DhGHbHaNUZqumBJ0IR9114h+QDxDX3swrCVPuAEsk30oXuaHUSZJ69H8O/QsNCVqbEs1th2MA/syGjjc386mrJjBW/QxeL5KFvYM8ArnnptD+h4yhYWJPAxp9Qlh9k6XeENxGgWMQLcGmjMCPgN+ND+PQfcgkScehH5YndrnMi2uAiRWfsJOgxN2K/aMPa3wK/2+w/Ac85WDft5uRHZ/ws/sVagLQW+AEercMes0swCFwPDSCixS9CEbYdd1DNbNJBnap0RPza7R8fQCZtXNl10MIjRhNWCuq0kO4LWg2xhByOx3u4wA0Cf6kAbxvYFoxNWIjHZo8isEperU3xc5zy0yd1FOHcLYJLEIwC4AXgoNZ86sI8e9mOAqQiGjZiCiNsbcH5FcMaWfe5WO1yueA7f4xZqEMNGBhCLPYp4BzNAxBhwN5IALJNnXIWdsGo9i259slz0IPZ72O5iMusfgeuATUjqeiG+M5pvK/TVpX2SvcBVwOuuxmUL24c/cyuR1ziTcATJJCz2gPcg/+AmkuWl33PPSzPmo7HOfr4DXIsE6tM/6FnK3gCexi9CwsL815Azk7DHXi/i93jfQkRJW+dh4Celz2pgHBgDvssz3TKFXQE8n9EmsSCDeAWx1Q6incS2A+8D9wNbgQOp+l32yssWYBtwI5LHyEWZS8E42UnLxUmY+PQ1af1afUUcAO4FfgF2I0tFUZ4A9iM/wlryvg9h0Sx2A5JMDJG6i+X42l4ueeKY1qeLSg2czX+dxpf/Wugjb7bX28g7XYcy5vc4EhC6OlVeyL3ThH2vyE2aYALZBIoRIVGMIWQzKxbR2Aw8hmxCU0qb3bbdktGWgn9bcXOFBvBAUz3nEbu5suk0eC9ws6dee1muMJqwIeNIY2RnZ88lQh7/YWTjyncgduHr+U/Td03R7s2rgbhDxakja+pakwS/m8Nn5y3bTzRh871bVZw3yft+7EJia70EWEOegLfvZSTfIcDXr5Br2s4Mwing5aZ61pFjxBXWWrPtyvca6rSnzpeKL7TvaL/CNuC2IjfKwABf0uwa1kCEXYVsYNmB772ISGnDmUZiDBo7gHsc5QeQEFBunK/KVyydsoMwy5ZK2EBUwgaiEjYQlbCB+B90AP2N35GqkAAAAABJRU5ErkJggg==" width="86" height="48">`
	container.appendChild(div);
	
}


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



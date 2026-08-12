// ============================================================
//  HVAC Quiz — Model (model.js)
//  Handles: i18n, questions, game state, lifelines
// ============================================================

// ─── TRANSLATIONS ────────────────────────────────────────────
const I18N = {
  fr: {
    appTitle: "Qui Veut Gagner l'EPB A ?",
    chooseLanguage: "Choisissez votre langue",
    chooseTheme: "Choisissez un thème",
    themes: {
      all: "Toutes catégories",
      heating: "Chauffage",
      ventilation: "Ventilation",
      sanitaire: "Sanitaire",
      "smart appliances": "Smart Buildings",
      general: "Général",
    },
    startGame: "Commencer",
    question: "Question",
    of: "sur",
    lifelineTitle: "Jokers",
    lifeline5050: "50/50",
    lifelinePhone: "Appel à l'ami (chatbot)",
    lifelineTool: "Outil de calcul",
    lifelineUsed: "Joker utilisé",
    phoneCallTitle: "Appel à un ami",
    toolCallTitle: "Outil de calcul",
    toolCallDesc: "Simulez vos calculs HVAC avec notre outil en ligne.",
    toolCallBtn: "Ouvrir l'outil de calcul",
    close: "Fermer",
    correct: "Correct !",
    wrong: "Mauvaise réponse…",
    levelLabels: ["E", "D", "C", "B", "A"],
    finalWin: "Félicitations !",
    finalLose: "Dommage !",
    finalScore: "Vous avez atteint le niveau",
    playAgain: "Rejouer",
    changeTheme: "Changer de thème",
    answerLabels: ["A", "B", "C", "D"],
    thinking: "Votre ami réfléchit…",
    loadError: "Impossible de charger les questions.",
    notEnoughQuestions: "Pas assez de questions pour ce thème. Veuillez choisir 'Toutes catégories'.",
    timerLabel: "Temps",
    lockIn: "Valider",
	ask_tooli_you_question_is_copied: "Ouvrez Tooli grâce au bouton ci-dessous. La question est déja copiée, plus qu'à la coller!",
	i_have_this_question:"Je joue à qui sera millionnaire. J'ai cette question : ",
	here_are_the_proposals:"Voici les propositions",
	what_is_the_right_answer:"Quelle est la bonne réponse, et quelle est la source chez Buildwise ? ",
	want_to_know_more:"En savoir plus ?"
  },
  nl: {
    appTitle: "Wie Wil EPB-label A Winnen?",
    chooseLanguage: "Kies uw taal",
    chooseTheme: "Kies een thema",
    themes: {
      all: "Alle categorieën",
      heating: "Verwarming",
      ventilation: "Ventilatie",
      sanitaire: "Sanitair",
      "smart appliances": "Slimme apparaten",
      general: "Algemeen",
    },
    startGame: "Starten",
    question: "Vraag",
    of: "van",
    lifelineTitle: "Jokers",
    lifeline5050: "50/50",
    lifelinePhone: "Bel een vriend (chatbot)",
    lifelineTool: "Berekeningstool",
    lifelineUsed: "Joker gebruikt",
    phoneCallTitle: "Uw vriend (chatbot) antwoordt…",
    toolCallTitle: "Berekeningstool",
    toolCallDesc: "Simuleer uw HVAC-berekeningen met onze online tool.",
    toolCallBtn: "Berekeningstool openen",
    close: "Sluiten",
    correct: "Correct!",
    wrong: "Fout antwoord…",
    levelLabels: ["E", "D", "C", "B", "A+"],
    finalWin: "Proficiat!",
    finalLose: "Jammer!",
    finalScore: "U heeft niveau bereikt",
    playAgain: "Opnieuw spelen",
    changeTheme: "Thema wijzigen",
    answerLabels: ["A", "B", "C", "D"],
    thinking: "Uw vriend denkt na…",
    loadError: "Kan de vragen niet laden.",
    notEnoughQuestions: "Niet genoeg vragen voor dit thema. Kies 'Alle categorieën'.",
    timerLabel: "Tijd",
    lockIn: "Bevestigen",
	ask_tooli_you_question_is_copied: "Gebruik Tooli dankzij de knop hieronder. De vraag and antwoorden zijn al gekopieerd, je moet gewoon in de chat plakken!",
	i_have_this_question:"I speek wie wordt milljonair. Hier is een vraag : ",
	here_are_the_proposals:"Hier zijn de mogelijke antwoorden",
	what_is_the_right_answer:"Wat is de correcte antwoord, en kan je naar Buildwise bronnen verwijzen? ",
	want_to_know_more:"Meer weten ?"


  },
};

// ─── EPB SCALE ───────────────────────────────────────────────
// Questions 1–5 map to EPB levels E → A
const EPB_LEVELS = [
  { label: "F", color: "#DD974F",width:"170px"},
  { label: "E", color: "#EAC24F",width:"150px"},
  { label: "D", color: "#DDD95A",width:"130px"},
  { label: "C", color: "#C5D45A",width:"110px"},
  { label: "B", color: "#8ABD5A",width:"90px"},
  { label: "A", color: "#49AF57",width:"70px"},
];

/*
const energyLabels = {
  "A+": "#169CD6",
  "A": "#49AF57",
  "B": "#8ABD5A",
  "C": "#C5D45A",
  "D": "#DDD95A",
  "E": "#EAC24F",
  "F": "#DD974F",
  "G": "#CB342D"
};
*/


// ─── GAME STATE ───────────────────────────────────────────────
const GameState = {
  lang: "fr",
  theme: "all",
  allQuestions: [],
  sessionQuestions: [],
  currentIndex: 0,
  score: 1,        // how many answered correctly
  lastCorrect: false,
  lifelines: {
    fiftyFifty: false, // true = used
    phone: false,
    tool: false,
  },
  removedAnswers: [],  // indices removed by 50/50
  phase: "language",   // language | theme | playing | result
  gameOver: false,
};

// ─── HELPERS ─────────────────────────────────────────────────
function t(key, lang) {
  lang = lang || GameState.lang;
  const parts = key.split(".");
  let obj = I18N[lang];
  for (const p of parts) {
    if (obj == null) return key;
    obj = obj[p];
  }
  return obj != null ? obj : key;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── LOAD & PREPARE QUESTIONS ────────────────────────────────
async function loadQuestions() {
  if (!window.HVAC_QUESTIONS || window.HVAC_QUESTIONS.length === 0) {
    throw new Error("Questions not found — make sure questions.js is loaded before model.js");
  }
  GameState.allQuestions = window.HVAC_QUESTIONS;
}

function prepareSession() {
  const lang = GameState.lang;
  const theme = GameState.theme;
  let pool = GameState.allQuestions;

  if (theme !== "all") {
    pool = pool.filter((q) => q.theme === theme);
  }

  // Sort by difficulty then shuffle within each difficulty bucket
  const byDiff = [1, 2, 3, 4, 5].map((d) =>
    shuffle(pool.filter((q) => q.difficulty === d))
  );

  // Pick one from each difficulty level; fall back if not enough
  let chosen = [];
  for (const bucket of byDiff) {
    if (bucket.length > 0) chosen.push(bucket[0]);
  }

  // If fewer than 5, fill from remaining pool
  if (chosen.length < 5) {
    const usedIds = new Set(chosen.map((q) => q.id));
    const extra = shuffle(pool.filter((q) => !usedIds.has(q.id)));
    while (chosen.length < 5 && extra.length > 0) {
      chosen.push(extra.shift());
    }
  }

  // Exactly 5 questions (trim if somehow we have more)
  chosen = chosen.slice(0, 5);
  chosen.sort((a, b) => a.difficulty - b.difficulty); //sort again by increasing difficulty
  
  // Build session objects with localised text
  GameState.sessionQuestions = chosen.map((q, i) => ({
    id: q.id,
    theme: q.theme,
    difficulty: q.difficulty,
    epbLevel: EPB_LEVELS[i+1],
    question: lang === "fr" ? q.question_fr : q.question_nl,
    answers: lang === "fr" ? q.answers_fr : q.answers_nl,
    correct: q.correct,
	explanation: lang ==="fr" ? q.explanation_fr: q.explanation_nl,
	reference: lang ==="fr" ? q.reference_fr: q.reference_nl,
	explanationImage: lang ==="fr" ? q.explanationImage: q.explanationImage,
  }));

  GameState.currentIndex = 0;
  GameState.score = 1;
  GameState.gameOver = false;
  GameState.lifelines = { fiftyFifty: false, phone: false, tool: false };
  GameState.removedAnswers = [];
}

// ─── CURRENT QUESTION ACCESSOR ───────────────────────────────
function currentQuestion() {
  return GameState.sessionQuestions[GameState.currentIndex];
}

function currentExplanation() {
  
  try{
  return GameState.sessionQuestions[GameState.currentIndex-1]["explanation"];
  }
	catch(e){
	return null
	}
}
function currentReference() {
  
  try{
  return GameState.sessionQuestions[GameState.currentIndex-1]["reference"];
  }
	catch(e){
	return null
	}
}
function currentExplanationImage() {
  
  try{
  return GameState.sessionQuestions[GameState.currentIndex-1]["explanationImage"];
  }
	catch(e){
	return null
	}
}


// ─── LIFELINE: 50/50 ─────────────────────────────────────────
function applyFiftyFifty() {
  if (GameState.lifelines.fiftyFifty) return [];
  GameState.lifelines.fiftyFifty = true;
  const q = currentQuestion();
  const wrong = [];
  for (let i = 0; i < 4; i++) {
    if (i !== q.correct) wrong.push(i);
  }
  // Remove 2 of the 3 wrong answers
  const toRemove = shuffle(wrong).slice(0, 2);
  GameState.removedAnswers = toRemove;
  return toRemove;
}

// ─── LIFELINE: PHONE (AI chatbot) ────────────────────────────
async function callPhoneFriend() {
  if (GameState.lifelines.phone) return null;
  GameState.lifelines.phone = true;

  const q = currentQuestion();
  const lang = GameState.lang;

  const systemPrompt = lang === "fr"
    ? `Tu es un expert HVAC qui aide un technicien lors d'un quiz. Réponds de façon naturelle, comme si tu téléphonais à un ami. Sois concis (2-3 phrases). Ne donne pas directement la réponse, mais oriente vers la bonne. La question porte sur le domaine ${q.theme}.`
    : `Je bent een HVAC-expert die een technicien helpt tijdens een quiz. Antwoord op een natuurlijke manier, alsof je een vriend belt. Wees beknopt (2-3 zinnen). Geef het antwoord niet direct, maar stuur in de goede richting. De vraag gaat over het domein ${q.theme}.`;

  const userPrompt = lang === "fr"
    ? `Question : "${q.question}"\nPropositions : ${q.answers.map((a, i) => `${["A","B","C","D"][i]}) ${a}`).join(" | ")}\nQuelle est ta meilleure intuition ?`
    : `Vraag: "${q.question}"\nMogelijkheden: ${q.answers.map((a, i) => `${["A","B","C","D"][i]}) ${a}`).join(" | ")}\nWat is uw beste gevoel?`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) throw new Error("API error");
  const data = await response.json();
  return data.content.map((c) => c.text || "").join("");
}

// ─── ANSWER SUBMISSION ───────────────────────────────────────
function submitAnswer(answerIndex) {
  const q = currentQuestion();
  const correct = answerIndex === q.correct;
  GameState.lastCorrect = correct;
  if (correct) {
    GameState.score++;
    GameState.currentIndex++;
    GameState.removedAnswers = [];
    if (GameState.currentIndex >= GameState.sessionQuestions.length) {
      GameState.phase = "result";
      GameState.gameOver = true;
    }
  } else {
	  GameState.currentIndex++;

    GameState.phase = "result";
    GameState.gameOver = true;
  }
  return { correct, correctIndex: q.correct };
}

// ─── EXPORTS ─────────────────────────────────────────────────
window.QuizModel = {
  I18N,
  EPB_LEVELS,
  GameState,
  t,
  shuffle,
  loadQuestions,
  prepareSession,
  currentQuestion,
  applyFiftyFifty,
  callPhoneFriend,
  submitAnswer,
};

const assetVersion = "20260531-real-objects-v2";
const asset = (name) => `/assets/school-bag/${name}.svg?v=${assetVersion}`;
const assetPng = (name) => `/assets/school-bag/${name}.png?v=${assetVersion}`;

const labObjects = [
  { word: "book", thai: "หนังสือ", phrase: "This is a book.", image: asset("book") },
  { word: "pencil", thai: "ดินสอ", phrase: "This is a pencil.", image: assetPng("real-pencil") },
  { word: "ruler", thai: "ไม้บรรทัด", phrase: "This is a ruler.", image: asset("ruler") },
  { word: "eraser", thai: "ยางลบ", phrase: "This is an eraser.", image: asset("eraser") },
];

const gameConfigs = [
  game("word-hunt", "Word Hunt", "ฟังคำศัพท์เดี่ยว แล้วแตะของให้ถูก", "word", (item) => ({
    speech: `Tap the ${item.word}.`,
    visible: `Tap the ${item.word}.`,
    target: item.word,
    explain: `${item.word} = ${item.thai}`,
  })),
  game("this-is", "This Is...", "ฟังประโยค This is a/an ... แล้วแตะรูป", "sentence", (item) => ({
    speech: item.phrase,
    visible: item.phrase,
    target: item.word,
    explain: `${item.phrase} = นี่คือ${item.thai}`,
  })),
  game("i-have", "I Have...", "ฟังประโยค I have a/an ... แล้วแตะของ", "word", (item) => ({
    speech: `I have ${withArticle(item.word)}.`,
    visible: `I have ${withArticle(item.word)}.`,
    target: item.word,
    explain: `I have ${withArticle(item.word)}. = ฉันมี${item.thai}`,
  })),
  game("meaning-match", "Meaning Match", "ดูคำศัพท์กับคำแปล แล้วแตะรูปให้ตรง", "thai", (item) => ({
    speech: `${item.word} means ${item.thai}. Tap the ${item.word}.`,
    visible: `${item.word} = ${item.thai}`,
    target: item.word,
    explain: `${item.word} แปลว่า ${item.thai}`,
  })),
  game("classroom-tap", "Classroom Tap", "ฟังคำสั่งสั้นในห้องเรียน", "word", (item) => ({
    speech: `Find the ${item.word}.`,
    visible: `Find the ${item.word}.`,
    target: item.word,
    explain: `Find = หา / ${item.word} = ${item.thai}`,
  })),
  game("listen-carefully", "Listen Carefully", "ฟังคำซ้ำช้า ๆ แล้วแตะ", "image", (item) => ({
    speech: `${item.word}. ${item.word}. Tap the ${item.word}.`,
    visible: `${item.word}. ${item.word}.`,
    target: item.word,
    explain: `ได้ยินคำว่า ${item.word}`,
  })),
  game("pack-again", "Pack Again", "ทบทวนของในกระเป๋าแบบเร็ว", "word", (item) => ({
    speech: `Put the ${item.word} in the bag.`,
    visible: `Put the ${item.word} in the bag.`,
    target: item.word,
    explain: `Put in the bag = ใส่ในกระเป๋า`,
  })),
  game("article-a-an", "A or An", "ฝึกฟัง a/an จากประโยคจริง", "sentence", (item) => ({
    speech: `This is ${withArticle(item.word)}.`,
    visible: `This is ${withArticle(item.word)}.`,
    target: item.word,
    explain: item.word === "eraser" ? "eraser ใช้ an" : `${item.word} ใช้ a`,
  })),
  game("my-item", "My Item", "ฟัง My แล้วเลือกของ", "word", (item) => ({
    speech: `This is my ${item.word}.`,
    visible: `This is my ${item.word}.`,
    target: item.word,
    explain: `my ${item.word} = ${item.thai}ของฉัน`,
  })),
  game("touch-and-say", "Touch And Say", "แตะให้ถูก แล้วดูประโยคสำหรับพูดตาม", "sentence", (item) => ({
    speech: `Touch the ${item.word}.`,
    visible: `Touch the ${item.word}.`,
    target: item.word,
    explain: `พูดตาม: ${item.phrase}`,
  })),
  game("school-words", "School Words", "แยกคำศัพท์ของใช้ในโรงเรียน", "word", (item) => ({
    speech: `School word: ${item.word}.`,
    visible: `School word: ${item.word}`,
    target: item.word,
    explain: `${item.word} เป็นของใช้ในโรงเรียน`,
  })),
  game("hear-sentence", "Hear The Sentence", "ฟังประโยคเต็มแล้วเลือกภาพ", "image", (item) => ({
    speech: `Look. ${item.phrase}`,
    visible: `Look. ${item.phrase}`,
    target: item.word,
    explain: `ประโยคคือ ${item.phrase}`,
  })),
  game("teacher-says", "Teacher Says", "เหมือนครูบอกในห้องเรียน", "word", (item) => ({
    speech: `Teacher says, tap the ${item.word}.`,
    visible: `Teacher says: tap the ${item.word}.`,
    target: item.word,
    explain: `Teacher says = ครูบอกว่า`,
  })),
  game("quick-check", "Quick Check", "เช็กว่าเด็กจำคำได้เร็วไหม", "word", (item) => ({
    speech: `${item.word}.`,
    visible: item.word,
    target: item.word,
    explain: `จำคำว่า ${item.word} ได้แล้ว`,
  })),
  game("thai-clue", "Thai Clue", "ใช้คำใบ้ภาษาไทย แล้วแตะคำอังกฤษ", "thai", (item) => ({
    speech: `Tap ${withArticle(item.word)}.`,
    visible: `แตะ: ${item.thai}`,
    target: item.word,
    explain: `${item.thai} คือ ${item.word}`,
  })),
  game("what-is-this", "What Is This?", "ฟังคำถามง่าย แล้วแตะคำตอบ", "sentence", (item) => ({
    speech: `What is this? This is ${withArticle(item.word)}.`,
    visible: `What is this?`,
    target: item.word,
    explain: `คำตอบคือ ${item.phrase}`,
  })),
  game("slow-listen", "Slow Listen", "ฟังช้าพิเศษสำหรับเด็กเล็ก", "image", (item) => ({
    speech: `Listen. ${item.word}. Tap the ${item.word}.`,
    visible: `Listen... ${item.word}`,
    target: item.word,
    explain: `ฟังช้า ๆ: ${item.word}`,
  })),
  game("sentence-review", "Sentence Review", "ทวนประโยค This is... อีกครั้ง", "sentence", (item) => ({
    speech: `${item.phrase} Tap the picture.`,
    visible: item.phrase,
    target: item.word,
    explain: `จับคู่ประโยคกับภาพ`,
  })),
  game("parent-check", "Parent Check", "ด่านสั้นให้ผู้ปกครองดูว่าเด็กจำอะไรได้", "word", (item) => ({
    speech: `Can you find the ${item.word}?`,
    visible: `Can you find the ${item.word}?`,
    target: item.word,
    explain: `เด็กหา ${item.word} ได้`,
  })),
  game("unit-review", "Unit Review", "รวมคำกับประโยคก่อนจบชุด", "sentence", (item, index) => ({
    speech: index % 2 === 0 ? `Tap the ${item.word}.` : item.phrase,
    visible: index % 2 === 0 ? `Tap the ${item.word}.` : item.phrase,
    target: item.word,
    explain: index % 2 === 0 ? `${item.word} = ${item.thai}` : item.phrase,
  })),
];

const gameList = document.querySelector("#gameList");
const gameSelect = document.querySelector("#gameSelect");
const labTitle = document.querySelector("#labTitle");
const labSubtitle = document.querySelector("#labSubtitle");
const gameBadge = document.querySelector("#gameBadge");
const gameTitle = document.querySelector("#gameTitle");
const gameDescription = document.querySelector("#gameDescription");
const roundProgress = document.querySelector("#roundProgress");
const promptText = document.querySelector("#missionPromptText");
const promptHint = document.querySelector("#missionPromptHint");
const stars = document.querySelector("#missionStars");
const itemsBox = document.querySelector("#missionItems");
const feedback = document.querySelector("#missionFeedback");
const completeBox = document.querySelector("#missionComplete");
const soundButton = document.querySelector("#missionSoundButton");
const missionScreen = document.querySelector(".mission-screen");
const correctBurst = document.querySelector("#correctBurst");
const correctBurstWord = document.querySelector("#correctBurstWord");

let selectedGameIndex = gameIndexFromUrl();
let currentRound = 0;
let score = 0;
let missionStarted = false;
let isTransitioning = false;
let correctBurstTimer = 0;
let nextPromptTimer = 0;
let preferredEnglishVoice = null;
let audioContext = null;

installNoZoomGuard();
loadVoices();
if ("speechSynthesis" in window) {
  window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

renderGameList();
loadGame(selectedGameIndex);

gameSelect?.addEventListener("change", () => {
  loadGame(Number(gameSelect.value || 0));
});

soundButton?.addEventListener("click", () => {
  if (!missionStarted) {
    startGame();
    return;
  }
  speakPrompt();
});

function game(id, title, description, choiceLabel, makeQuestion) {
  return {
    id,
    title,
    description,
    choiceLabel,
    questions: labObjects.map((item, index) => makeQuestion(item, index)),
  };
}

function gameIndexFromUrl() {
  const params = new URLSearchParams(location.search);
  const raw = Number(params.get("game") || 1);
  return Number.isFinite(raw) ? Math.max(0, Math.min(gameConfigs.length - 1, raw - 1)) : 0;
}

function renderGameList() {
  if (gameSelect) {
    gameSelect.innerHTML = gameConfigs.map((gameItem, index) => `
      <option value="${index}">${String(index + 1).padStart(2, "0")} · ${escapeHtml(gameItem.title)}</option>
    `).join("");
    gameSelect.value = String(selectedGameIndex);
  }
  if (!gameList) return;
  gameList.innerHTML = gameConfigs.map((gameItem, index) => `
    <button class="game-picker ${index === selectedGameIndex ? "active" : ""}" type="button" data-game-index="${index}">
      <span>${String(index + 1).padStart(2, "0")}</span>
      <strong>${escapeHtml(gameItem.title)}</strong>
    </button>
  `).join("");
  gameList.querySelectorAll(".game-picker").forEach((button) => {
    button.addEventListener("click", () => {
      loadGame(Number(button.dataset.gameIndex || 0));
    });
  });
}

function loadGame(index) {
  selectedGameIndex = Math.max(0, Math.min(gameConfigs.length - 1, index));
  currentRound = 0;
  score = 0;
  missionStarted = false;
  isTransitioning = false;
  window.clearTimeout(correctBurstTimer);
  window.clearTimeout(nextPromptTimer);
  correctBurst?.classList.add("hidden");
  completeBox?.classList.add("hidden");
  missionScreen?.classList.add("awaiting-start");
  missionScreen?.classList.remove("is-transitioning", "is-speaking");
  renderGameList();
  renderGameShell();
  renderChoices();
  setStartButton();
}

function currentGame() {
  return gameConfigs[selectedGameIndex] || gameConfigs[0];
}

function currentQuestion() {
  return currentGame().questions[currentRound] || currentGame().questions[0];
}

function renderGameShell() {
  const gameItem = currentGame();
  if (labTitle) labTitle.textContent = "Mission Lab";
  if (labSubtitle) labSubtitle.textContent = "20 เกมสั้นสำหรับลองกับเด็ก ป.1";
  if (gameBadge) gameBadge.textContent = `Game ${String(selectedGameIndex + 1).padStart(2, "0")}`;
  if (gameTitle) gameTitle.textContent = gameItem.title;
  if (gameDescription) gameDescription.textContent = gameItem.description;
  if (stars) stars.textContent = `${score}/${gameItem.questions.length}`;
  if (promptHint) promptHint.textContent = "กดเริ่ม แล้วฟังโจทย์";
  if (promptText) promptText.textContent = "Ready?";
  if (feedback) {
    feedback.innerHTML = `<strong>${escapeHtml(gameItem.title)}</strong><span>${escapeHtml(gameItem.description)}</span>`;
  }
  renderRoundProgress();
}

function renderChoices() {
  const gameItem = currentGame();
  if (!itemsBox) return;
  itemsBox.innerHTML = labObjects.map((item) => choiceMarkup(item, gameItem.choiceLabel)).join("");
  itemsBox.querySelectorAll(".mission-item").forEach((button) => {
    button.addEventListener("click", () => chooseItem(button.dataset.word || "", button));
  });
}

function choiceMarkup(item, mode) {
  const label = {
    sentence: item.phrase,
    thai: item.thai,
    image: item.word,
    word: item.word,
  }[mode] || item.word;
  const sublabel = {
    sentence: `นี่คือ${item.thai}`,
    thai: item.word,
    image: item.thai,
    word: item.thai,
  }[mode] || item.thai;

  return `
    <button class="mission-item mission-object lab-choice" type="button" data-word="${escapeHtml(item.word)}" data-thai="${escapeHtml(item.thai)}">
      <img class="object-image" src="${escapeHtml(item.image)}" alt="" />
      <strong>${escapeHtml(label)}</strong>
      <small>${escapeHtml(sublabel)}</small>
    </button>
  `;
}

function startGame() {
  unlockAudio();
  playUiSound("start");
  missionStarted = true;
  completeBox?.classList.add("hidden");
  renderQuestion();
  window.setTimeout(speakPrompt, 420);
}

function renderQuestion() {
  const question = currentQuestion();
  setReplayButton();
  if (promptHint) promptHint.textContent = "ฟังแล้วแตะคำตอบ";
  if (promptText) promptText.textContent = question.visible;
  if (stars) stars.textContent = `${score}/${currentGame().questions.length}`;
  if (feedback) {
    feedback.innerHTML = `<strong>โจทย์ที่ ${currentRound + 1}</strong><span>${escapeHtml(question.visible)}</span>`;
  }
  missionScreen?.classList.remove("awaiting-start");
  renderRoundProgress();
  itemsBox?.querySelectorAll(".mission-item").forEach((item) => {
    item.disabled = false;
    item.classList.remove("correct", "wrong", "target-hint", "target-hint-strong");
    item.querySelector(".object-feedback-bubble")?.remove();
    item.classList.toggle("target-hint", item.dataset.word === question.target);
  });
}

function chooseItem(word, item) {
  if (!missionStarted || isTransitioning || !word || !item) return;
  unlockAudio();
  const question = currentQuestion();
  const selected = labObjects.find((entry) => entry.word === word) || { word, thai: item.dataset.thai || "" };
  const target = labObjects.find((entry) => entry.word === question.target) || selected;
  if (word !== question.target) {
    item.classList.remove("wrong");
    void item.offsetWidth;
    item.classList.add("wrong");
    playUiSound("wrong");
    showWrongBubble(item, selected);
    recordAttempt({ correct: false, selected, target, question });
    const phrase = `No, this is ${withArticle(selected.word)}.`;
    if (feedback) {
      feedback.innerHTML = `
        <strong>${escapeHtml(phrase)}</strong>
        <span>โจทย์ถามหา ${escapeHtml(target.word)} (${escapeHtml(target.thai)}) ลองแตะอีกครั้ง</span>
      `;
    }
    highlightTarget(question.target);
    speakText(phrase, { rate: 0.64, fallbackMs: 2300 });
    return;
  }

  item.classList.remove("correct");
  void item.offsetWidth;
  item.classList.add("correct");
  playUiSound("correct");
  showCorrectBurst(question.explain);
  lockMission();
  recordAttempt({ correct: true, selected: target, target, question });
  score += 1;
  currentRound += 1;
  if (stars) stars.textContent = `${score}/${currentGame().questions.length}`;
  if (feedback) {
    feedback.innerHTML = `<strong>Yes, correct!</strong><span>${escapeHtml(question.explain)}</span>`;
  }
  renderRoundProgress();
  const startedAt = Date.now();
  const advanceAfterPraise = () => {
    const waitMs = Math.max(0, 2300 - (Date.now() - startedAt));
    window.clearTimeout(nextPromptTimer);
    nextPromptTimer = window.setTimeout(advanceGame, waitMs);
  };
  const speechStarted = speakText(`Yes, correct. ${question.explain}`, {
    rate: 0.62,
    fallbackMs: 3300,
    onEnd: advanceAfterPraise,
  });
  if (!speechStarted) {
    window.clearTimeout(nextPromptTimer);
    nextPromptTimer = window.setTimeout(advanceGame, 2300);
  }
}

function advanceGame() {
  if (currentRound >= currentGame().questions.length) {
    unlockMission();
    completeGame();
    return;
  }
  renderQuestion();
  unlockMission();
  window.setTimeout(speakPrompt, 320);
}

function completeGame() {
  missionStarted = false;
  playUiSound("complete");
  if (promptHint) promptHint.textContent = "เกมนี้จบแล้ว";
  if (promptText) promptText.textContent = "Great job!";
  if (feedback) {
    feedback.innerHTML = `<strong>Game complete</strong><span>${escapeHtml(currentGame().title)} จบแล้ว ลองเกมถัดไปได้เลย</span>`;
  }
  completeBox?.classList.remove("hidden");
  if (completeBox) {
    const nextIndex = (selectedGameIndex + 1) % gameConfigs.length;
    completeBox.innerHTML = `
      <span class="mini-label">Game Complete</span>
      <h3>${escapeHtml(currentGame().title)}</h3>
      <p>คะแนน ${score}/${currentGame().questions.length} เกมนี้ใช้ดูว่าเด็กฟังโจทย์แล้วแตะได้มั่นใจแค่ไหน</p>
      <button id="replayGameButton" class="button secondary" type="button">เล่นซ้ำ</button>
      <button id="nextGameButton" class="button primary" type="button">เกมถัดไป</button>
    `;
    completeBox.querySelector("#replayGameButton")?.addEventListener("click", () => loadGame(selectedGameIndex));
    completeBox.querySelector("#nextGameButton")?.addEventListener("click", () => loadGame(nextIndex));
  }
  setStartButton();
  recordGameComplete();
}

function renderRoundProgress() {
  if (!roundProgress) return;
  roundProgress.innerHTML = currentGame().questions.map((question, index) => {
    const target = labObjects.find((item) => item.word === question.target);
    const status = index < currentRound ? "done" : index === currentRound ? "active" : "";
    return `<span class="${status}">${escapeHtml(target?.word || question.target)}</span>`;
  }).join("");
}

function setStartButton() {
  if (!soundButton) return;
  soundButton.textContent = "Start Game";
  soundButton.setAttribute("aria-label", "เริ่มเกม");
  soundButton.classList.add("start-button");
}

function setReplayButton() {
  if (!soundButton) return;
  soundButton.textContent = "Listen Again";
  soundButton.setAttribute("aria-label", "ฟังอีกครั้ง");
  soundButton.classList.remove("start-button");
}

function speakPrompt() {
  setSpeaking(true);
  playUiSound("prompt");
  const started = speakText(currentQuestion().speech, {
    rate: 0.6,
    fallbackMs: 2900,
    onEnd: () => setSpeaking(false),
  });
  if (!started) window.setTimeout(() => setSpeaking(false), 1100);
}

function highlightTarget(word) {
  itemsBox?.querySelectorAll(".mission-item").forEach((node) => {
    node.classList.toggle("target-hint-strong", node.dataset.word === word);
  });
  window.setTimeout(() => {
    itemsBox?.querySelectorAll(".mission-item").forEach((node) => node.classList.remove("target-hint-strong"));
  }, 1300);
}

function showWrongBubble(item, selected) {
  item.querySelector(".object-feedback-bubble")?.remove();
  const bubble = document.createElement("span");
  bubble.className = "object-feedback-bubble wrong-bubble";
  bubble.innerHTML = `<strong>${escapeHtml(selected.word)}</strong><small>${escapeHtml(selected.thai)}</small>`;
  item.append(bubble);
  window.setTimeout(() => bubble.remove(), 1700);
}

function showCorrectBurst(text) {
  if (!correctBurst) return;
  if (correctBurstWord) correctBurstWord.textContent = text;
  window.clearTimeout(correctBurstTimer);
  correctBurst.classList.remove("hidden", "burst-running");
  void correctBurst.offsetWidth;
  correctBurst.classList.add("burst-running");
  correctBurstTimer = window.setTimeout(() => {
    correctBurst.classList.add("hidden");
    correctBurst.classList.remove("burst-running");
  }, 1800);
}

function lockMission() {
  isTransitioning = true;
  missionScreen?.classList.add("is-transitioning");
}

function unlockMission() {
  isTransitioning = false;
  missionScreen?.classList.remove("is-transitioning");
}

function recordAttempt({ correct, selected, target, question }) {
  const attempts = readAttempts();
  attempts.push({
    mission: "english-p1-mission-lab",
    game: currentGame().id,
    gameTitle: currentGame().title,
    prompt: question.visible,
    target: target.word,
    selected: selected.word,
    correct,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem("101future.learningAttempts", JSON.stringify(attempts.slice(-120)));
}

function recordGameComplete() {
  const completed = readCompletedGames();
  completed[currentGame().id] = {
    title: currentGame().title,
    score,
    total: currentGame().questions.length,
    completedAt: new Date().toISOString(),
  };
  localStorage.setItem("101future.missionLab.completed", JSON.stringify(completed));
}

function readAttempts() {
  try {
    const parsed = JSON.parse(localStorage.getItem("101future.learningAttempts") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readCompletedGames() {
  try {
    const parsed = JSON.parse(localStorage.getItem("101future.missionLab.completed") || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function speakText(text, options = {}) {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = options.rate || 0.64;
  utterance.pitch = 1.04;
  if (preferredEnglishVoice) utterance.voice = preferredEnglishVoice;
  if (typeof options.onEnd === "function") {
    let ended = false;
    const finish = () => {
      if (ended) return;
      ended = true;
      window.clearTimeout(fallbackTimer);
      options.onEnd();
    };
    const fallbackTimer = window.setTimeout(finish, options.fallbackMs || estimateSpeechMs(text, utterance.rate));
    utterance.onend = finish;
    utterance.onerror = finish;
  }
  window.speechSynthesis.speak(utterance);
  return true;
}

function loadVoices() {
  if (!("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith("en"));
  const preferredNames = [
    "ava",
    "samantha",
    "google us english",
    "microsoft jenny",
    "microsoft aria",
    "natural",
    "premium",
    "enhanced",
    "neural",
    "alex",
  ];
  preferredEnglishVoice =
    preferredNames.map((name) => englishVoices.find((voice) => voice.name.toLowerCase().includes(name))).find(Boolean) ||
    englishVoices.find((voice) => voice.lang === "en-US") ||
    englishVoices[0] ||
    null;
}

function setSpeaking(isSpeaking) {
  missionScreen?.classList.toggle("is-speaking", Boolean(isSpeaking));
}

function unlockAudio() {
  const context = getAudioContext();
  if (context?.state === "suspended") context.resume();
}

function getAudioContext() {
  if (audioContext) return audioContext;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext = new AudioContextClass();
  return audioContext;
}

function playUiSound(name) {
  const context = getAudioContext();
  if (!context) return;
  if (context.state === "suspended") context.resume();

  const sounds = {
    start: [[523, 0.1, 0, 0.05], [659, 0.1, 0.09, 0.05], [784, 0.16, 0.18, 0.055]],
    prompt: [[740, 0.08, 0, 0.035], [880, 0.08, 0.08, 0.032]],
    correct: [[660, 0.11, 0, 0.055], [880, 0.16, 0.11, 0.06], [1046, 0.22, 0.26, 0.05]],
    wrong: [[220, 0.12, 0, 0.04, 185], [164, 0.16, 0.11, 0.035, 146]],
    complete: [[523, 0.1, 0, 0.05], [659, 0.1, 0.1, 0.052], [784, 0.1, 0.2, 0.055], [1046, 0.26, 0.32, 0.05]],
  };
  (sounds[name] || []).forEach(([frequency, duration, offset, volume, endFrequency]) => {
    scheduleTone(context, frequency, duration, offset, volume, endFrequency);
  });
}

function scheduleTone(context, frequency, duration, offset, volume, endFrequency) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startTime = context.currentTime + offset;
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startTime + duration);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.001), startTime + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.04);
}

function installNoZoomGuard() {
  const prevent = (event) => event.preventDefault();
  const isLockedMission = () => document.body?.classList.contains("no-zoom-body");
  document.addEventListener("gesturestart", prevent, { passive: false });
  document.addEventListener("gesturechange", prevent, { passive: false });
  document.addEventListener("gestureend", prevent, { passive: false });
  document.addEventListener("touchmove", (event) => {
    if (event.touches && (event.touches.length > 1 || isLockedMission())) event.preventDefault();
  }, { passive: false });

  let lastTouchEnd = 0;
  document.addEventListener("touchend", (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 320) event.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
}

function estimateSpeechMs(text, rate) {
  const wordCount = String(text).trim().split(/\s+/).filter(Boolean).length || 1;
  return Math.max(1800, Math.min(4400, (wordCount * 620) / Math.max(rate, 0.5)));
}

function withArticle(word) {
  const article = /^[aeiou]/i.test(word) ? "an" : "a";
  return `${article} ${word}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char];
  });
}

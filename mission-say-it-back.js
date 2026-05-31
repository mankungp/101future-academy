const assetVersion = "20260531-real-objects-v2";
const asset = (name) => `/assets/school-bag/${name}.svg?v=${assetVersion}`;
const assetPng = (name) => `/assets/school-bag/${name}.png?v=${assetVersion}`;

const sentenceItems = [
  { word: "book", thai: "หนังสือ", phrase: "This is a book.", image: asset("book") },
  { word: "pencil", thai: "ดินสอ", phrase: "This is a pencil.", image: assetPng("real-pencil") },
  { word: "ruler", thai: "ไม้บรรทัด", phrase: "This is a ruler.", image: asset("ruler") },
  { word: "eraser", thai: "ยางลบ", phrase: "This is an eraser.", image: asset("eraser") },
];

const promptText = document.querySelector("#missionPromptText");
const promptHint = document.querySelector("#missionPromptHint");
const stars = document.querySelector("#missionStars");
const feedback = document.querySelector("#missionFeedback");
const completeBox = document.querySelector("#missionComplete");
const soundButton = document.querySelector("#missionSoundButton");
const missionScreen = document.querySelector(".mission-screen");
const correctBurst = document.querySelector("#correctBurst");
const correctBurstWord = document.querySelector("#correctBurstWord");
const sentenceProgress = document.querySelector("#sentenceProgress");
const sayObjectImage = document.querySelector("#sayObjectImage");
const sayObjectPhrase = document.querySelector("#sayObjectPhrase");
const sayObjectThai = document.querySelector("#sayObjectThai");
const micButton = document.querySelector("#micButton");
const micButtonLabel = document.querySelector("#micButtonLabel");
const sayHeard = document.querySelector("#sayHeard");
const playSelfButton = document.querySelector("#playSelfButton");
const iSaidItButton = document.querySelector("#iSaidItButton");

const resetRequested = new URLSearchParams(window.location.search).get("reset") === "1";

let currentIndex = Number(localStorage.getItem("101future.sayItBackMission.index") || 0);
let score = Number(localStorage.getItem("101future.sayItBackMission.score") || 0);
let retryCount = 0;
let isTransitioning = false;
let correctBurstTimer = 0;
let nextPromptTimer = 0;
let preferredEnglishVoice = null;
let missionStarted = false;
let audioContext = null;

// Speech recognition (in-browser word match) and recorder fallback are detected lazily.
const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition || null;
let recognition = null;
let isListening = false;
let mediaRecorder = null;
let recordedChunks = [];
let recordedUrl = "";
let recordedAudio = null;

installNoZoomGuard();
loadVoices();
if ("speechSynthesis" in window) {
  window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

if (resetRequested) {
  localStorage.removeItem("101future.sayItBackMission.index");
  localStorage.removeItem("101future.sayItBackMission.score");
  localStorage.removeItem("101future.sayItBackMission.completedAt");
  currentIndex = 0;
  score = 0;
}

if (currentIndex >= sentenceItems.length) {
  currentIndex = 0;
  score = 0;
  saveProgress();
}

renderStartScreen();

soundButton?.addEventListener("click", () => {
  if (!missionStarted) {
    startMission();
    return;
  }
  speakPrompt();
});

micButton?.addEventListener("click", onMicTap);
playSelfButton?.addEventListener("click", playRecording);
iSaidItButton?.addEventListener("click", () => acceptAttempt({ heard: "", selfConfirmed: true }));

function currentTarget() {
  return sentenceItems[currentIndex] || sentenceItems[0];
}

function slugifyWord(word) {
  return String(word).replace(/\s+/g, "-").replace(/[^a-z0-9-]/gi, "").toLowerCase();
}

function renderMission() {
  const target = currentTarget();
  setSoundButtonReplay();
  if (promptHint) promptHint.textContent = "ฟังครูพูด แล้วกดไมค์พูดตาม";
  promptText.textContent = target.phrase;
  stars.textContent = `${score}/${sentenceItems.length}`;
  feedback.innerHTML = `<strong>พูดตามครู</strong><span>${escapeHtml(target.phrase)} = นี่คือ${escapeHtml(target.thai)}</span>`;
  missionScreen?.classList.remove("awaiting-start");
  if (sayObjectImage) {
    sayObjectImage.src = target.image;
    sayObjectImage.className = `object-image object-image-${slugifyWord(target.word)}`;
  }
  if (sayObjectPhrase) sayObjectPhrase.textContent = target.phrase;
  if (sayObjectThai) sayObjectThai.textContent = `นี่คือ${target.thai}`;
  renderSentenceProgress();
  resetTurnControls();
}

function resetTurnControls() {
  retryCount = 0;
  clearRecording();
  if (sayHeard) sayHeard.textContent = "";
  setMicLabel("พูดตาม");
  setMicEnabled(true);
  playSelfButton?.classList.add("say-hidden");
  iSaidItButton?.classList.add("say-hidden");
}

function onMicTap() {
  if (!missionStarted || isTransitioning) return;
  if (isListening) {
    stopListening();
    return;
  }
  unlockAudio();
  if (SpeechRecognitionClass) {
    startRecognition();
  } else {
    startRecorderFallback();
  }
}

function startRecognition() {
  try {
    recognition = new SpeechRecognitionClass();
  } catch {
    startRecorderFallback();
    return;
  }
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;
  recognition.continuous = false;

  let gotResult = false;
  setListeningUi(true);
  if (sayHeard) sayHeard.textContent = "กำลังฟัง... พูดเลย";

  recognition.onresult = (event) => {
    gotResult = true;
    const heardOptions = [];
    for (let i = 0; i < event.results.length; i += 1) {
      const result = event.results[i];
      for (let j = 0; j < result.length; j += 1) {
        heardOptions.push(result[j].transcript);
      }
    }
    handleHeard(heardOptions);
  };
  recognition.onerror = (event) => {
    setListeningUi(false);
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      offerManualPath(
        "ไมค์ยังไม่เปิด ให้ผู้ปกครองกดอนุญาตไมค์ในเบราว์เซอร์ แล้วลองกดไมค์อีกครั้ง หรือให้เด็กพูดตามแล้วกดไปต่อ",
        { allowMicRetry: true },
      );
    } else if (event.error === "no-speech") {
      if (sayHeard) sayHeard.textContent = "ครูยังไม่ได้ยินเสียง ลองกดไมค์แล้วพูดอีกครั้ง";
      offerRetryControls();
    } else {
      startRecorderFallback();
    }
  };
  recognition.onend = () => {
    setListeningUi(false);
    if (!gotResult && missionStarted && !isTransitioning) {
      // No result event fired (some browsers). Let the child retry or move on.
      offerRetryControls();
    }
  };

  try {
    recognition.start();
  } catch {
    setListeningUi(false);
    startRecorderFallback();
  }
}

function stopListening() {
  try {
    recognition?.stop();
  } catch {
    /* ignore */
  }
  if (mediaRecorder && mediaRecorder.state === "recording") {
    try {
      mediaRecorder.stop();
    } catch {
      /* ignore */
    }
  }
}

function handleHeard(heardOptions) {
  const target = currentTarget();
  const matched = heardOptions.some((text) => transcriptMatchesWord(text, target.word));
  const heardText = (heardOptions[0] || "").trim();
  if (matched) {
    acceptAttempt({ heard: heardText, selfConfirmed: false });
    return;
  }
  retryCount += 1;
  recordAttempt({ correct: false, heard: heardText, selfConfirmed: false, target });
  if (sayHeard) {
    sayHeard.innerHTML = heardText
      ? `ครูได้ยินว่า <strong>${escapeHtml(heardText)}</strong> ลองพูด ${escapeHtml(target.phrase)} อีกครั้งนะ`
      : "ยังไม่ชัดเท่าไหร่ ลองพูดอีกครั้งช้า ๆ นะ";
  }
  playUiSound("wrong");
  speakText(`Almost! Try again. ${target.phrase}`, { rate: 0.6, fallbackMs: 2800 });
  offerRetryControls();
}

// Fallback: record the child's own voice locally so they can hear themselves, then self-confirm.
function startRecorderFallback() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    offerManualPath("เครื่องนี้ยังเทียบเสียงไม่ได้ ให้เด็กพูดตามครู แล้วกดพูดแล้วไปต่อได้เลย");
    return;
  }
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      recordedChunks = [];
      try {
        mediaRecorder = new MediaRecorder(stream);
      } catch {
        stream.getTracks().forEach((track) => track.stop());
        offerManualPath("เครื่องนี้ยังบันทึกเสียงไม่ได้ ให้เด็กพูดตามครู แล้วกดพูดแล้วไปต่อได้เลย");
        return;
      }
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) recordedChunks.push(event.data);
      };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (recordedChunks.length) {
          const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || "audio/webm" });
          recordedUrl = URL.createObjectURL(blob);
        }
        setListeningUi(false);
        if (sayHeard) sayHeard.textContent = "ฟังเสียงตัวเอง แล้วกดพูดแล้วเพื่อไปต่อได้เลย";
        playSelfButton?.classList.toggle("say-hidden", !recordedUrl);
        offerRetryControls();
      };
      setListeningUi(true);
      if (sayHeard) sayHeard.textContent = "กำลังอัด... พูดเลย แล้วกดอีกครั้งเพื่อหยุด";
      mediaRecorder.start();
      // Safety auto-stop so young children are not stuck recording.
      window.setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop();
      }, 4000);
    })
    .catch((error) => {
      if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
        offerManualPath(
          "ไมค์ยังไม่เปิด ให้ผู้ปกครองกดอนุญาตไมค์ในเบราว์เซอร์ แล้วลองกดไมค์อีกครั้ง หรือให้เด็กพูดตามแล้วกดไปต่อ",
          { allowMicRetry: true },
        );
        return;
      }
      offerManualPath("เครื่องนี้ยังใช้ไมค์ไม่ได้ ให้เด็กพูดตามครู แล้วกดพูดแล้วไปต่อได้เลย");
    });
}

function offerManualPath(message, options = {}) {
  setListeningUi(false);
  if (sayHeard) sayHeard.textContent = message;
  const allowMicRetry = Boolean(options.allowMicRetry);
  setMicEnabled(allowMicRetry);
  setMicLabel(allowMicRetry ? "ลองเปิดไมค์อีกครั้ง" : "พูดตามเอง");
  iSaidItButton?.classList.remove("say-hidden");
}

function offerRetryControls() {
  setMicLabel("พูดอีกครั้ง");
  setMicEnabled(true);
  iSaidItButton?.classList.remove("say-hidden");
}

function acceptAttempt({ heard, selfConfirmed }) {
  if (isTransitioning) return;
  const target = currentTarget();
  setListeningUi(false);
  setMicEnabled(false);
  playSelfButton?.classList.add("say-hidden");
  iSaidItButton?.classList.add("say-hidden");
  playUiSound("correct");
  showCorrectBurst(target);
  lockMission();
  recordAttempt({ correct: true, heard, selfConfirmed, target });
  currentIndex += 1;
  score += 1;
  saveProgress();
  stars.textContent = `${score}/${sentenceItems.length}`;
  feedback.innerHTML = `<strong>${selfConfirmed ? "เก่งมาก!" : "Yes! เก่งมาก"}</strong><span>${escapeHtml(target.phrase)} = นี่คือ${escapeHtml(target.thai)}</span>`;
  renderSentenceProgress();

  const correctStartedAt = Date.now();
  const advanceAfterPraise = () => {
    const waitMs = Math.max(0, 2600 - (Date.now() - correctStartedAt));
    window.clearTimeout(nextPromptTimer);
    nextPromptTimer = window.setTimeout(advanceMission, waitMs);
  };
  const speechStarted = speakText("Great speaking! Well done.", {
    rate: 0.62,
    fallbackMs: 3000,
    onEnd: advanceAfterPraise,
  });
  if (!speechStarted) {
    window.clearTimeout(nextPromptTimer);
    nextPromptTimer = window.setTimeout(advanceMission, 2600);
  }
}

function advanceMission() {
  if (currentIndex >= sentenceItems.length) {
    unlockMission();
    completeMission();
    return;
  }
  renderMission();
  unlockMission();
  window.setTimeout(speakPrompt, 320);
}

function renderStartScreen() {
  const hasProgress = currentIndex > 0;
  missionStarted = false;
  stars.textContent = `${score}/${sentenceItems.length}`;
  if (promptHint) promptHint.textContent = hasProgress ? "เล่นต่อจากประโยคที่ค้างไว้" : "กดเริ่ม แล้วฟังประโยคแรก";
  promptText.textContent = hasProgress ? "Ready to continue?" : "Ready to speak?";
  feedback.innerHTML = hasProgress
    ? "<strong>Mission 3</strong><span>กด Resume Mission แล้วพูดประโยคถัดไป</span>"
    : "<strong>Mission 3</strong><span>ฟังครูพูด This is... แล้วลองพูดตาม</span>";
  missionScreen?.classList.add("awaiting-start");
  renderSentenceProgress();
  setSoundButtonStart(hasProgress);
  setMicEnabled(false);
  setMicLabel("พูดตาม");
  playSelfButton?.classList.add("say-hidden");
  iSaidItButton?.classList.add("say-hidden");
  if (sayHeard) sayHeard.textContent = "";
}

function startMission() {
  unlockAudio();
  playUiSound("start");
  missionStarted = true;
  renderMission();
  window.setTimeout(speakPrompt, 440);
}

function setSoundButtonStart(isResume = false) {
  if (!soundButton) return;
  soundButton.textContent = isResume ? "Resume Mission" : "Start Mission";
  soundButton.setAttribute("aria-label", isResume ? "เล่น Mission ต่อ" : "เริ่ม Mission");
  soundButton.classList.add("start-button");
}

function setSoundButtonReplay() {
  if (!soundButton) return;
  soundButton.textContent = "Listen Again";
  soundButton.setAttribute("aria-label", "ฟังประโยคอีกครั้ง");
  soundButton.classList.remove("start-button");
}

function setMicEnabled(enabled) {
  if (!micButton) return;
  micButton.disabled = !enabled;
}

function setMicLabel(label) {
  if (micButtonLabel) micButtonLabel.textContent = label;
}

function setListeningUi(listening) {
  isListening = listening;
  micButton?.classList.toggle("is-listening", listening);
  setMicLabel(listening ? "กำลังฟัง... กดเพื่อหยุด" : "พูดตาม");
  setSpeaking(false);
}

function renderSentenceProgress() {
  if (!sentenceProgress) return;
  sentenceProgress.innerHTML = sentenceItems.map((item, index) => {
    const status = index < currentIndex ? "done" : index === currentIndex ? "active" : "";
    return `<span class="${status}">${escapeHtml(item.word)}</span>`;
  }).join("");
}

function lockMission() {
  isTransitioning = true;
  missionScreen?.classList.add("is-transitioning");
}

function unlockMission() {
  isTransitioning = false;
  missionScreen?.classList.remove("is-transitioning");
}

function showCorrectBurst(item) {
  if (!correctBurst) return;
  if (correctBurstWord) correctBurstWord.textContent = item.phrase;
  window.clearTimeout(correctBurstTimer);
  correctBurst.classList.remove("hidden", "burst-running");
  void correctBurst.offsetWidth;
  correctBurst.classList.add("burst-running");
  correctBurstTimer = window.setTimeout(() => {
    correctBurst.classList.add("hidden");
    correctBurst.classList.remove("burst-running");
  }, 1900);
}

function completeMission() {
  missionStarted = false;
  playUiSound("complete");
  stars.textContent = `${score}/${sentenceItems.length}`;
  if (promptHint) promptHint.textContent = "Mission นี้จบแล้ว";
  promptText.textContent = "Great job!";
  feedback.innerHTML = `<strong>Mission complete</strong><span>เด็กได้ลองพูดประโยค This is... ครบทุกคำแล้ว</span>`;
  speakText("Great job! You said all four sentences.", { rate: 0.62, fallbackMs: 3600 });
  completeBox?.classList.remove("hidden");
  if (completeBox) {
    completeBox.innerHTML = `
      <span class="mini-label">สรุปสำหรับผู้ปกครอง</span>
      <h3>Speaking Practice</h3>
      <p>วันนี้ลูกฝึกพูด This is a book, This is a pencil, This is a ruler และ This is an eraser.</p>
      ${renderParentRetrySummary()}
      <button id="restartMissionButton" class="button primary" type="button">เล่นอีกครั้ง</button>
      <a class="button secondary" href="/learn">กลับหน้าเรียน</a>
    `;
    completeBox.querySelector("#restartMissionButton")?.addEventListener("click", restartMission);
  }
  localStorage.setItem("101future.sayItBackMission.completedAt", new Date().toISOString());
}

function renderParentRetrySummary() {
  const retried = summarizeRetriedWords();
  if (!retried.length) {
    return `<p class="say-heard">ออกเสียงได้ลื่นไหลดีมาก ไม่ต้องทวนคำไหนเป็นพิเศษ</p>`;
  }
  const list = retried.map((word) => escapeHtml(word)).join(", ");
  return `<p class="say-heard">คำที่ควรชวนทวนอีกนิด: <strong>${list}</strong></p>`;
}

function summarizeRetriedWords() {
  const attempts = readAttempts().filter((entry) => entry.mission === "english-p1-unit1-say-it-back");
  const wrongByWord = new Set();
  attempts.forEach((entry) => {
    if (entry.correct === false && entry.target) wrongByWord.add(entry.target);
  });
  return [...wrongByWord];
}

function restartMission() {
  window.clearTimeout(correctBurstTimer);
  window.clearTimeout(nextPromptTimer);
  unlockMission();
  currentIndex = 0;
  score = 0;
  saveProgress();
  correctBurst?.classList.add("hidden");
  completeBox?.classList.add("hidden");
  missionStarted = true;
  renderMission();
  window.setTimeout(speakPrompt, 380);
}

function speakPrompt() {
  setSpeaking(true);
  playUiSound("prompt");
  const started = speakText(currentTarget().phrase, {
    rate: 0.58,
    fallbackMs: 2600,
    onEnd: () => setSpeaking(false),
  });
  if (!started) {
    window.setTimeout(() => setSpeaking(false), 1100);
  }
}

function playRecording() {
  if (!recordedUrl) return;
  unlockAudio();
  if (!recordedAudio) recordedAudio = new Audio();
  recordedAudio.src = recordedUrl;
  recordedAudio.currentTime = 0;
  recordedAudio.play().catch(() => {
    /* ignore playback rejection */
  });
}

function clearRecording() {
  if (recordedUrl) {
    URL.revokeObjectURL(recordedUrl);
    recordedUrl = "";
  }
  recordedChunks = [];
}

function transcriptMatchesWord(transcript, word) {
  const cleaned = String(transcript || "").toLowerCase().replace(/[^a-z\s]/g, " ");
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.includes(word)) return true;
  // Accept a couple of gentle near-misses so young speakers are not blocked.
  const nearMisses = {
    eraser: ["erase", "razor", "eraze"],
    ruler: ["rular", "roller"],
    pencil: ["pencel", "pensil"],
    book: ["boo", "books"],
  };
  return (nearMisses[word] || []).some((variant) => tokens.includes(variant));
}

function speakText(text, options = {}) {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = options.rate || 0.62;
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

function recordAttempt({ correct, heard, selfConfirmed, target }) {
  const attempts = readAttempts();
  attempts.push({
    mission: "english-p1-unit1-say-it-back",
    target: target.word,
    targetPhrase: target.phrase,
    heard: heard || "",
    selfConfirmed: Boolean(selfConfirmed),
    correct,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem("101future.learningAttempts", JSON.stringify(attempts.slice(-80)));
}

function readAttempts() {
  try {
    const parsed = JSON.parse(localStorage.getItem("101future.learningAttempts") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
    start: [
      [523, 0.1, 0, 0.05],
      [659, 0.1, 0.09, 0.05],
      [784, 0.16, 0.18, 0.055],
    ],
    prompt: [
      [740, 0.08, 0, 0.035],
      [880, 0.08, 0.08, 0.032],
    ],
    correct: [
      [660, 0.11, 0, 0.055],
      [880, 0.16, 0.11, 0.06],
      [1046, 0.22, 0.26, 0.05],
    ],
    wrong: [
      [220, 0.12, 0, 0.04, 185],
      [164, 0.16, 0.11, 0.035, 146],
    ],
    complete: [
      [523, 0.1, 0, 0.05],
      [659, 0.1, 0.1, 0.052],
      [784, 0.1, 0.2, 0.055],
      [1046, 0.26, 0.32, 0.05],
    ],
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

function estimateSpeechMs(text, rate) {
  const wordCount = String(text).trim().split(/\s+/).filter(Boolean).length || 1;
  return Math.max(1800, Math.min(4200, (wordCount * 600) / Math.max(rate, 0.5)));
}

function saveProgress() {
  localStorage.setItem("101future.sayItBackMission.index", String(currentIndex));
  localStorage.setItem("101future.sayItBackMission.score", String(score));
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

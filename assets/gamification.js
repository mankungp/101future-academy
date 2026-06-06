(() => {
  const STORAGE_KEY = "101future.gamification.progress.v1";
  const LEARN_PHASE_STORAGE_PREFIX = "101future.learnPhase.";
  const DAILY_GOAL_STARS = 5;
  const DAILY_FREEZE_LIMIT = 2;

  const mascotImages = {
    greeting: "/assets/mascot/futuree-greeting.jpg",
    correct: "/assets/mascot/futuree-correct.jpg",
    encourage: "/assets/mascot/futuree-encourage.jpg",
    celebrate: "/assets/mascot/futuree-celebrate.jpg",
    sleepy: "/assets/mascot/futuree-sleepy.jpg",
  };

  const mascotAudioBase = "/assets/english-p1/audio/";
  const mascotSounds = {
    correct: ["great-job.mp3"],
    encourage: ["try-again.mp3", "almost-try-again.mp3"],
    celebrate: ["you-did-it.mp3", "lesson-complete.mp3"],
  };
  const mascotMessages = {
    greeting: "มาเก็บดาวกัน!",
    correct: "เก่งมาก!",
    encourage: "ลองอีกทีนะ!",
    celebrate: "เย้ จบแล้ว!",
    sleepy: "พักนิดนึง แล้วมาเล่นต่อกันนะ",
  };
  const MASCOT_IDLE_MS = 26000;

  const lessons = [
      {
          "id": "english-p1-unit1-school-bag",
          "subject": "English",
          "grade": "ป.1",
          "unit": "Unit 1",
          "order": 1,
          "title": "Pack My School Bag",
          "route": "/mission/school-bag?reset=1",
          "type": "vocabulary",
          "totalQuestions": 20,
          "locked": false,
          "segments": [
              "Warm-up",
              "Learn",
              "Practice",
              "Game",
              "Review",
              "Celebration"
          ],
          "skillTags": [
              "listening",
              "school objects",
              "picture choice"
          ]
      },
      {
          "id": "english-p1-unit1-what-is-it",
          "subject": "English",
          "grade": "ป.1",
          "unit": "Unit 1",
          "order": 2,
          "title": "What Is It?",
          "route": "/mission/this-is?reset=1",
          "type": "question-answer",
          "totalQuestions": 4,
          "locked": false,
          "segments": [
              "Warm-up",
              "Learn",
              "Practice",
              "Game",
              "Review",
              "Celebration"
          ],
          "skillTags": [
              "what is it",
              "it is",
              "school objects"
          ]
      },
      {
          "id": "english-p1-unit1-say-it-back",
          "subject": "English",
          "grade": "ป.1",
          "unit": "Unit 1",
          "order": 3,
          "title": "Say It Back",
          "route": "/mission/say-it-back?reset=1",
          "type": "speaking",
          "totalQuestions": 4,
          "locked": false,
          "segments": [
              "Warm-up",
              "Learn",
              "Practice",
              "Game",
              "Review",
              "Celebration"
          ],
          "skillTags": [
              "speaking",
              "pronunciation",
              "simple sentence"
          ]
      },
      {
          "id": "english-p1-unit2-abc-phonics",
          "subject": "English",
          "grade": "ป.1",
          "unit": "Unit 2",
          "order": 4,
          "title": "ABC Phonics",
          "route": "/mission/lab?unit=2&reset=1",
          "type": "phonics",
          "totalQuestions": 26,
          "locked": false,
          "segments": [
              "Warm-up",
              "Learn",
              "Practice",
              "Game",
              "Review",
              "Celebration"
          ],
          "skillTags": [
              "phonics",
              "letter sound",
              "chant"
          ]
      },
      {
          "id": "english-p1-unit3-hello",
          "subject": "English",
          "grade": "ป.1",
          "unit": "Unit 3",
          "order": 5,
          "title": "Hello!",
          "route": "/mission/lab?unit=3&reset=1",
          "type": "conversation",
          "totalQuestions": 8,
          "locked": false,
          "segments": [
              "Warm-up",
              "Learn",
              "Practice",
              "Game",
              "Review",
              "Celebration"
          ],
          "skillTags": [
              "greeting",
              "name",
              "polite words"
          ]
      },
      {
          "id": "english-p1-unit4-classroom-commands",
          "subject": "English",
          "grade": "ป.1",
          "unit": "Unit 4",
          "order": 6,
          "title": "Classroom Commands",
          "route": "/mission/lab?unit=4&reset=1",
          "type": "tpr",
          "totalQuestions": 10,
          "locked": false,
          "segments": [
              "Warm-up",
              "Learn",
              "Practice",
              "Game",
              "Review",
              "Celebration"
          ],
          "skillTags": [
              "listen and do",
              "classroom language",
              "TPR"
          ]
      },
      {
          "id": "english-p1-unit5-numbers-1-20",
          "subject": "English",
          "grade": "ป.1",
          "unit": "Unit 5",
          "order": 7,
          "title": "Numbers 1-20",
          "route": "/mission/lab?unit=5&reset=1",
          "type": "numbers",
          "totalQuestions": 20,
          "locked": false,
          "segments": [
              "Warm-up",
              "Learn",
              "Practice",
              "Game",
              "Review",
              "Celebration"
          ],
          "skillTags": [
              "counting",
              "numbers 1-20",
              "how many"
          ]
      },
      {
          "id": "english-p1-unit6-colors",
          "subject": "English",
          "grade": "ป.1",
          "unit": "Unit 6",
          "order": 8,
          "title": "Colors",
          "route": "/mission/lab?unit=6&reset=1",
          "type": "colors",
          "totalQuestions": 10,
          "locked": false,
          "segments": [
              "Warm-up",
              "Learn",
              "Practice",
              "Game",
              "Review",
              "Celebration"
          ],
          "skillTags": [
              "colors",
              "what color",
              "objects"
          ]
      },
      {
          "id": "english-p1-unit7-my-family",
          "subject": "English",
          "grade": "ป.1",
          "unit": "Unit 7",
          "order": 9,
          "title": "My Family",
          "route": "/mission/lab?unit=7&reset=1",
          "type": "family",
          "totalQuestions": 10,
          "locked": false,
          "segments": [
              "Warm-up",
              "Learn",
              "Practice",
              "Game",
              "Review",
              "Celebration"
          ],
          "skillTags": [
              "family members",
              "who is it",
              "my"
          ]
      },
      {
          "id": "english-p1-unit8-my-body",
          "subject": "English",
          "grade": "ป.1",
          "unit": "Unit 8",
          "order": 10,
          "title": "My Body",
          "route": "/mission/lab?unit=8&reset=1",
          "type": "body",
          "totalQuestions": 12,
          "locked": false,
          "segments": [
              "Warm-up",
              "Learn",
              "Practice",
              "Game",
              "Review",
              "Celebration"
          ],
          "skillTags": [
              "body parts",
              "touch",
              "TPR"
          ]
      },
      {
          "id": "english-p1-unit9-animals",
          "subject": "English",
          "grade": "ป.1",
          "unit": "Unit 9",
          "order": 11,
          "title": "Animals",
          "route": "/mission/lab?unit=9&reset=1",
          "type": "animals",
          "totalQuestions": 14,
          "locked": false,
          "segments": [
              "Warm-up",
              "Learn",
              "Practice",
              "Game",
              "Review",
              "Celebration"
          ],
          "skillTags": [
              "pets",
              "farm animals",
              "what is it"
          ]
      },
      {
          "id": "english-p1-unit10-fruits-food",
          "subject": "English",
          "grade": "ป.1",
          "unit": "Unit 10",
          "order": 12,
          "title": "Fruits & Food",
          "route": "/mission/lab?unit=10&reset=1",
          "type": "food",
          "totalQuestions": 14,
          "locked": false,
          "segments": [
              "Warm-up",
              "Learn",
              "Practice",
              "Game",
              "Review",
              "Celebration"
          ],
          "skillTags": [
              "food",
              "fruit",
              "I like"
          ]
      },
      {
          "id": "english-p1-unit11-feelings",
          "subject": "English",
          "grade": "ป.1",
          "unit": "Unit 11",
          "order": 13,
          "title": "Feelings",
          "route": "/mission/lab?unit=11&reset=1",
          "type": "feelings",
          "totalQuestions": 10,
          "locked": false,
          "segments": [
              "Warm-up",
              "Learn",
              "Practice",
              "Game",
              "Review",
              "Celebration"
          ],
          "skillTags": [
              "feelings",
              "how are you",
              "I am"
          ]
      },
      {
          "id": "english-p1-unit12-culture-festivals",
          "subject": "English",
          "grade": "ป.1",
          "unit": "Unit 12",
          "order": 14,
          "title": "Culture & Festivals",
          "route": "/mission/lab?unit=12&reset=1",
          "type": "culture",
          "totalQuestions": 10,
          "locked": false,
          "segments": [
              "Warm-up",
              "Learn",
              "Practice",
              "Game",
              "Review",
              "Celebration"
          ],
          "skillTags": [
              "ต2.1",
              "polite words",
              "festivals"
          ]
      }
  ];

  let missionSession = null;
  let mascotIdleTimer = 0;
  let mascotSoundToken = 0;
  let mascotAudio = null;
  let lastMascotSoundAt = 0;
  let lastDisplayedXp = null;
  let lastDisplayedDailyStars = null;

  function defaultState() {
    return {
      version: 1,
      xp: 0,
      lessons: {},
      streak: {
        current: 0,
        freezesLeft: DAILY_FREEZE_LIMIT,
        lastActive: "",
        freezeUsedDates: [],
      },
      daily: {
        date: todayKey(),
        stars: 0,
        xp: 0,
        stickerUnlocked: false,
      },
      rewards: {
        stickers: [],
      },
      sessions: [],
      updatedAt: new Date().toISOString(),
    };
  }

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!parsed || typeof parsed !== "object") return defaultState();
      return normalizeState(parsed);
    } catch {
      return defaultState();
    }
  }

  function writeState(state) {
    const normalized = normalizeState(state);
    normalized.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function normalizeState(state) {
    const base = defaultState();
    const merged = {
      ...base,
      ...state,
      lessons: { ...(state.lessons || {}) },
      streak: { ...base.streak, ...(state.streak || {}) },
      daily: { ...base.daily, ...(state.daily || {}) },
      rewards: { ...base.rewards, ...(state.rewards || {}) },
      sessions: Array.isArray(state.sessions) ? state.sessions.slice(-80) : [],
    };
    if (!Array.isArray(merged.rewards.stickers)) merged.rewards.stickers = [];
    if (!Array.isArray(merged.streak.freezeUsedDates)) merged.streak.freezeUsedDates = [];
    if (merged.daily.date !== todayKey()) {
      merged.daily = { ...base.daily, date: todayKey() };
    }
    return merged;
  }

  function getLessonProgress(state, lessonId) {
    const lesson = lessons.find((entry) => entry.id === lessonId) || {};
    if (!state.lessons[lessonId]) {
      state.lessons[lessonId] = {
        lessonId,
        title: lesson.title || lessonId,
        attempts: 0,
        correct: 0,
        wrong: 0,
        stars: 0,
        xp: 0,
        completions: 0,
        wrongSkillTags: {},
        completedAt: "",
        bestScore: 0,
        totalQuestions: lesson.totalQuestions || 0,
      };
    }
    return state.lessons[lessonId];
  }

  function recordQuestion(event) {
    const payload = event || {};
    const lessonId = payload.lessonId || missionSession?.lessonId;
    if (!lessonId) return null;

    const state = readState();
    touchDaily(state);
    const progress = getLessonProgress(state, lessonId);
    const correct = Boolean(payload.correct);
    progress.attempts += 1;
    progress.totalQuestions = Number(payload.totalQuestions || progress.totalQuestions || 0);

    if (correct) {
      progress.correct += 1;
      progress.xp += 10;
      state.xp += 10;
      state.daily.xp += 10;
      state.daily.stars += 1;
      maybeUnlockDailySticker(state);
    } else {
      const tag = payload.skillTag || payload.target || payload.questionId || "review";
      progress.wrong += 1;
      progress.xp += 2;
      state.xp += 2;
      state.daily.xp += 2;
      progress.wrongSkillTags[tag] = (progress.wrongSkillTags[tag] || 0) + 1;
    }

    const updated = writeState(state);
    updateMissionHud(updated, {
      correct,
      word: payload.target || payload.questionId || "",
      xpDelta: correct ? 10 : 2,
      starDelta: correct ? 1 : 0,
    });
    setMascot(correct ? "correct" : "encourage", correct ? "เก่งมาก! ได้ดาวเพิ่มแล้ว" : "ลองอีกทีนะ น้องฟิวช่วยอยู่", { sound: true });
    renderLearnWidgets();
    return updated.lessons[lessonId];
  }

  function completeLesson(event) {
    const payload = event || {};
    const lessonId = payload.lessonId || missionSession?.lessonId;
    if (!lessonId) return null;

    const state = readState();
    touchDaily(state);
    const progress = getLessonProgress(state, lessonId);
    const total = Number(payload.totalQuestions || progress.totalQuestions || progress.correct || 1);
    const score = Number(payload.score ?? progress.correct);
    const accuracy = total ? Math.max(0, Math.min(100, Math.round((score / total) * 100))) : 0;
    const earnedStars = starsForAccuracy(accuracy);
    const lessonXp = earnedStars * 25;

    progress.title = payload.title || progress.title;
    progress.totalQuestions = total;
    progress.bestScore = Math.max(Number(progress.bestScore || 0), score);
    progress.stars = Math.max(Number(progress.stars || 0), earnedStars);
    progress.xp += lessonXp;
    progress.completions += 1;
    progress.completedAt = new Date().toISOString();
    progress.accuracy = accuracy;
    state.xp += lessonXp;
    state.daily.xp += lessonXp;

    if (missionSession?.startedAt) {
      state.sessions.push({
        lessonId,
        startedAt: new Date(missionSession.startedAt).toISOString(),
        endedAt: new Date().toISOString(),
        durationMs: Math.max(0, Date.now() - missionSession.startedAt),
      });
      state.sessions = state.sessions.slice(-80);
    }

    const updated = writeState(state);
    const summary = {
      lessonId,
      title: progress.title,
      score,
      total,
      accuracy,
      stars: earnedStars,
      xp: lessonXp,
      dailyStars: updated.daily.stars,
      dailyGoal: DAILY_GOAL_STARS,
      stickerUnlocked: updated.daily.stickerUnlocked,
      streak: updated.streak.current,
      freezesLeft: updated.streak.freezesLeft,
    };
    updateMissionHud(updated, { complete: true, xpDelta: lessonXp, starDelta: 0 });
    setMascot("celebrate", "เย้ จบบทแล้ว! ได้ XP เพิ่ม", { sound: true });
    renderLearnWidgets();
    return summary;
  }

  function starsForAccuracy(accuracy) {
    if (accuracy >= 90) return 3;
    if (accuracy >= 70) return 2;
    if (accuracy > 0) return 1;
    return 0;
  }

  function touchDaily(state) {
    const today = todayKey();
    if (state.daily.date === today && state.streak.lastActive === today) return;

    const previous = state.streak.lastActive || "";
    const gap = previous ? dayGap(previous, today) : 0;
    if (!previous) {
      state.streak.current = 1;
    } else if (gap === 1) {
      state.streak.current = Math.max(1, Number(state.streak.current || 0) + 1);
    } else if (gap > 1 && Number(state.streak.freezesLeft || 0) > 0) {
      state.streak.freezesLeft -= 1;
      state.streak.freezeUsedDates.push(today);
      state.streak.current = Math.max(1, Number(state.streak.current || 1));
    } else if (gap > 1) {
      state.streak.current = 1;
      state.streak.freezesLeft = DAILY_FREEZE_LIMIT;
      state.streak.freezeUsedDates = [];
    } else {
      state.streak.current = Math.max(1, Number(state.streak.current || 1));
    }

    state.streak.lastActive = today;
    state.daily = {
      date: today,
      stars: state.daily.date === today ? Number(state.daily.stars || 0) : 0,
      xp: state.daily.date === today ? Number(state.daily.xp || 0) : 0,
      stickerUnlocked: state.daily.date === today ? Boolean(state.daily.stickerUnlocked) : false,
    };
  }

  function maybeUnlockDailySticker(state) {
    if (state.daily.stars < DAILY_GOAL_STARS || state.daily.stickerUnlocked) return;
    state.daily.stickerUnlocked = true;
    const stickerId = `future-star-${state.daily.date}`;
    if (!state.rewards.stickers.some((item) => item.id === stickerId)) {
      state.rewards.stickers.push({
        id: stickerId,
        title: "Future Star Sticker",
        date: state.daily.date,
      });
    }
  }

  function initMissionShell(options = {}) {
    const lessonId = options.lessonId;
    if (!lessonId) return null;
    missionSession = {
      lessonId,
      totalQuestions: Number(options.totalQuestions || 0),
      startedAt: Date.now(),
    };
    insertMissionHud(options);
    setMascot(options.mascotEmotion || "greeting", options.mascotText || "มาเก็บดาวกัน!", { sound: false });
    updateMissionHud(readState(), {});
    return missionSession;
  }

  function insertMissionHud(options) {
    const screen = document.querySelector(".mission-screen");
    if (!screen || document.querySelector(".gamification-hud")) return;
    const hud = document.createElement("div");
    hud.className = "gamification-hud";
    hud.innerHTML = `
      <div class="future-mascot-card" data-emotion="greeting" aria-live="polite">
        <img id="futureMascotImage" src="${mascotImages.greeting}" alt="น้องฟิวเจอร์" />
        <div>
          <span>น้องฟิวเจอร์</span>
          <strong id="futureMascotText">${escapeHtml(options.mascotText || "พร้อมเริ่มภารกิจแล้ว")}</strong>
        </div>
      </div>
      <div class="gamification-meters" aria-label="รางวัลวันนี้">
        <span><b id="gameHudDailyStars">0/${DAILY_GOAL_STARS}</b> ดาววันนี้</span>
        <span><b id="gameHudXp">0</b> XP</span>
        <span><b id="gameHudStreak">0</b> วันติด</span>
      </div>
      <div id="instantRewardToast" class="instant-reward-toast" aria-live="assertive"></div>
    `;
    const head = screen.querySelector(".mission-screen-head");
    if (head) head.insertAdjacentElement("afterend", hud);
    else screen.prepend(hud);
  }

  function updateMissionHud(state, event) {
    const dailyStars = document.querySelector("#gameHudDailyStars");
    const xp = document.querySelector("#gameHudXp");
    const streak = document.querySelector("#gameHudStreak");
    const nextStars = Math.min(Number(state.daily.stars || 0), DAILY_GOAL_STARS);
    const nextXp = Number(state.xp || 0);
    if (dailyStars) {
      const previousStars = lastDisplayedDailyStars ?? Number(dailyStars.dataset.value || nextStars);
      dailyStars.dataset.value = String(nextStars);
      if (event?.starDelta) animateStarRatio(dailyStars, previousStars, nextStars);
      else dailyStars.textContent = `${nextStars}/${DAILY_GOAL_STARS}`;
      lastDisplayedDailyStars = nextStars;
    }
    if (xp) {
      const previousXp = lastDisplayedXp ?? Number(xp.dataset.value || nextXp);
      xp.dataset.value = String(nextXp);
      if (event?.xpDelta) animateMeterNumber(xp, previousXp, nextXp);
      else xp.textContent = String(nextXp);
      lastDisplayedXp = nextXp;
    }
    if (streak) streak.textContent = String(Number(state.streak.current || 0));
    if (event && (event.xpDelta || event.starDelta || event.complete)) {
      showInstantReward(event);
    }
  }

  function showInstantReward(event) {
    const toast = document.querySelector("#instantRewardToast");
    if (!toast) return;
    const parts = [];
    if (event.correct) parts.push("+1 ดาว");
    if (event.xpDelta) parts.push(`+${event.xpDelta} XP`);
    if (event.complete) parts.push("จบบท");
    toast.textContent = parts.join(" · ");
    toast.classList.remove("is-visible");
    void toast.offsetWidth;
    toast.classList.add("is-visible");
    triggerJuice(event);
    window.setTimeout(() => toast.classList.remove("is-visible"), 1100);
  }

  function triggerJuice(event) {
    const screen = document.querySelector(".mission-screen");
    if (screen) {
      const className = event.complete ? "juice-complete" : event.correct ? "juice-correct" : "juice-wrong";
      screen.classList.remove("juice-correct", "juice-wrong", "juice-complete");
      void screen.offsetWidth;
      screen.classList.add(className);
      window.setTimeout(() => screen.classList.remove(className), 680);
    }

    if (event.complete) {
      pulseMeter("#gameHudXp");
      return;
    }

    const active = findFeedbackElement(event.correct);
    if (active) {
      const cardClass = event.correct ? "juice-card-correct" : "juice-card-wrong";
      active.classList.remove("juice-card-correct", "juice-card-wrong");
      void active.offsetWidth;
      active.classList.add(cardClass);
      window.setTimeout(() => active.classList.remove(cardClass), event.correct ? 760 : 520);
    }

    if (event.correct) {
      flyStarToMeter(active);
      pulseMeter("#gameHudDailyStars");
      pulseMeter("#gameHudXp");
    }
  }

  function findFeedbackElement(correct) {
    const selector = correct
      ? ".mission-item.correct, .answer-item.correct, .lab-choice.correct"
      : ".mission-item.wrong, .answer-item.wrong, .lab-choice.wrong";
    const nodes = [...document.querySelectorAll(selector)].filter((node) => node.offsetParent !== null);
    return nodes.at(-1) || null;
  }

  function flyStarToMeter(source) {
    const target = document.querySelector("#gameHudDailyStars")?.closest("span");
    if (!target) return;
    const targetRect = target.getBoundingClientRect();
    const sourceRect = source?.getBoundingClientRect() || document.querySelector(".mission-screen")?.getBoundingClientRect();
    if (!sourceRect) return;

    const startX = sourceRect.left + sourceRect.width / 2;
    const startY = sourceRect.top + sourceRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;
    const star = document.createElement("span");
    star.className = "star-flyer";
    star.textContent = "★";
    star.style.left = `${startX}px`;
    star.style.top = `${startY}px`;
    star.style.setProperty("--dx", `${endX - startX}px`);
    star.style.setProperty("--dy", `${endY - startY}px`);
    document.body.append(star);
    window.setTimeout(() => star.remove(), 900);
  }

  function pulseMeter(selector) {
    const meter = document.querySelector(selector)?.closest("span");
    if (!meter) return;
    meter.classList.remove("meter-pop");
    void meter.offsetWidth;
    meter.classList.add("meter-pop");
    window.setTimeout(() => meter.classList.remove("meter-pop"), 520);
  }

  function animateMeterNumber(node, fromValue, toValue) {
    animateNumber(node, Number(fromValue || 0), Number(toValue || 0), (value) => String(value));
  }

  function animateStarRatio(node, fromValue, toValue) {
    animateNumber(node, Number(fromValue || 0), Number(toValue || 0), (value) => `${value}/${DAILY_GOAL_STARS}`);
  }

  function animateNumber(node, fromValue, toValue, format) {
    const from = Number.isFinite(fromValue) ? fromValue : toValue;
    const to = Number.isFinite(toValue) ? toValue : 0;
    if (from === to) {
      node.textContent = format(to);
      return;
    }
    if (node.dataset.raf) window.cancelAnimationFrame(Number(node.dataset.raf));
    const startedAt = performance.now();
    const duration = Math.min(720, Math.max(280, Math.abs(to - from) * 12));
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(from + (to - from) * eased);
      node.textContent = format(value);
      if (progress < 1) {
        node.dataset.raf = String(window.requestAnimationFrame(tick));
      } else {
        delete node.dataset.raf;
        node.textContent = format(to);
      }
    };
    node.dataset.raf = String(window.requestAnimationFrame(tick));
  }

  function setMascot(emotion, text, options = {}) {
    const nextEmotion = mascotImages[emotion] ? emotion : "greeting";
    const message = text || mascotMessages[nextEmotion] || mascotMessages.greeting;
    const card = document.querySelector(".future-mascot-card");
    const image = document.querySelector("#futureMascotImage");
    const label = document.querySelector("#futureMascotText");
    if (card) {
      card.dataset.emotion = nextEmotion;
      card.classList.remove("is-mascot-pop", "is-mascot-sleepy");
      void card.offsetWidth;
      card.classList.add("is-mascot-pop");
      card.classList.toggle("is-mascot-sleepy", nextEmotion === "sleepy");
    }
    if (image) {
      image.src = mascotImages[nextEmotion];
      image.alt = `น้องฟิวเจอร์: ${message}`;
      image.onerror = () => image.classList.add("image-missing");
    }
    if (label) label.textContent = message;
    if (options.sound) playMascotSound(nextEmotion, options);
    if (!options.skipIdleReset) resetMascotIdleTimer();
  }

  function resetMascotIdleTimer() {
    window.clearTimeout(mascotIdleTimer);
    if (!missionSession || !document.querySelector(".future-mascot-card")) return;
    mascotIdleTimer = window.setTimeout(() => {
      setMascot("sleepy", mascotMessages.sleepy, { sound: false, skipIdleReset: true });
    }, MASCOT_IDLE_MS);
  }

  function playMascotSound(emotion, options = {}) {
    const files = mascotSounds[emotion] || [];
    if (!files.length) return;
    const now = Date.now();
    if (now - lastMascotSoundAt < 420) return;
    lastMascotSoundAt = now;
    const token = ++mascotSoundToken;
    const sequence = files.slice(0, emotion === "encourage" ? 1 : files.length);
    if (emotion === "encourage") {
      sequence[0] = files[Math.floor(now / 1000) % files.length];
    }
    const playNext = (index = 0) => {
      if (token !== mascotSoundToken || index >= sequence.length) return;
      try {
        mascotAudio?.pause();
        mascotAudio = new Audio(`${mascotAudioBase}${sequence[index]}`);
        mascotAudio.volume = Number(options.volume || 0.78);
        mascotAudio.onended = () => playNext(index + 1);
        const promise = mascotAudio.play();
        if (promise && typeof promise.catch === "function") promise.catch(() => {});
      } catch {
        /* audio feedback is a bonus; never block the lesson */
      }
    };
    playNext();
  }

  function showCelebration(options = {}) {
    const summary = options.summary || {};
    const lessonXp = Number(summary.xp || 0);
    const stickerHtml = summary.stickerUnlocked
      ? `<span class="sticker-unlocked" aria-label="ปลดล็อกสติกเกอร์">ปลดล็อกสติกเกอร์ ⭐</span>`
      : "";
    const overlay = document.createElement("div");
    overlay.className = "lesson-celebration";
    overlay.setAttribute("role", "status");
    overlay.innerHTML = `
      <div class="celebration-card">
        <span class="celebration-confetti" aria-hidden="true">${"<i></i>".repeat(18)}</span>
        <img src="${mascotImages.celebrate}" alt="น้องฟิวเจอร์ฉลอง" />
        <span class="mini-label">Lesson complete</span>
        <h2>${escapeHtml(options.title || "เยี่ยมมาก!")}</h2>
        <p>${escapeHtml(options.message || "เก็บดาวและ XP เรียบร้อยแล้ว")}</p>
        <div class="mission-result-stats">
          <span>${"★".repeat(Number(summary.stars || 0)) || "0 ดาว"}</span>
          <span>XP +<b class="celebration-count" data-count-to="${lessonXp}">0</b></span>
          <span>Streak ${Number(summary.streak || 0)} วัน</span>
          <span>วันนี้ ${Number(summary.dailyStars || 0)}/${DAILY_GOAL_STARS} ดาว</span>
        </div>
        ${stickerHtml}
      </div>
    `;
    document.body.append(overlay);
    window.setTimeout(() => overlay.classList.add("is-showing"), 20);
    animateCelebrationCounts(overlay);
    window.setTimeout(() => overlay.classList.add("is-leaving"), 2800);
    window.setTimeout(() => overlay.remove(), 3400);
  }

  function animateCelebrationCounts(root) {
    root.querySelectorAll(".celebration-count").forEach((node) => {
      const target = Number(node.dataset.countTo || 0);
      animateNumber(node, 0, target, (value) => String(value));
    });
  }

  function renderLessonReward(summary) {
    if (!summary) return "";
    const sticker = summary.stickerUnlocked ? "<span>ปลดล็อกสติกเกอร์วันนี้แล้ว</span>" : `<span>Daily goal: ${summary.dailyStars}/${summary.dailyGoal} ดาว</span>`;
    return `
      <div class="mission-result-stats reward-stats" aria-label="รางวัลที่ได้">
        <span>${"★".repeat(Number(summary.stars || 0)) || "0 ดาว"} จากบทนี้</span>
        <span>XP +${Number(summary.xp || 0)}</span>
        <span>Streak ${Number(summary.streak || 0)} วัน</span>
        ${sticker}
      </div>
    `;
  }

  function renderLearningMap(target = "#learningMap") {
    const root = typeof target === "string" ? document.querySelector(target) : target;
    if (!root) return;
    const state = readState();
    let firstOpenSeen = false;
    root.innerHTML = lessons.map((lesson) => {
      const progress = state.lessons[lesson.id] || {};
      const done = Boolean(progress.completedAt);
      const locked = Boolean(lesson.locked) || (!done && firstOpenSeen);
      const current = !done && !locked && !firstOpenSeen;
      if (!done && !locked) firstOpenSeen = true;
      const status = done ? "ผ่านแล้ว" : current ? "กำลังเรียน" : "ล็อกไว้ก่อน";
      const stars = Number(progress.stars || 0);
      const canOpen = Boolean(lesson.route) && (done || current || !locked);
      const actionLabel = done ? "เล่นอีกครั้ง" : "เรียนต่อ";
      return `
        <article class="learning-map-node ${done ? "is-done" : ""} ${current ? "is-current" : ""} ${locked ? "is-locked" : ""}">
          <span class="map-step">${done ? "✓" : lesson.order}</span>
          <div>
            <span class="mini-label">${escapeHtml(lesson.grade)} · ${escapeHtml(lesson.unit)} · ${escapeHtml(status)}</span>
            <h3>${escapeHtml(lesson.title)}</h3>
            <p>${escapeHtml(lesson.skillTags.join(" · "))}</p>
            <small>${stars ? "★".repeat(stars) : "ยังไม่ได้ดาว"}</small>
          </div>
          ${canOpen ? `<a class="button ${done ? "secondary" : "primary"}" href="${lesson.route}">${actionLabel}</a>` : ""}
        </article>
      `;
    }).join("");
  }

  function renderParentView(target = "#parentProgressPanel") {
    const root = typeof target === "string" ? document.querySelector(target) : target;
    if (!root) return;
    const state = readState();
    const completed = lessons.filter((lesson) => state.lessons[lesson.id]?.completedAt);
    const weeklyMinutes = Math.round(weeklyLearningMs(state) / 60000);
    const weakPoints = topWeakPoints(state);
    root.innerHTML = `
      <div>
        <p class="eyebrow">Parent view</p>
        <h2>สรุปให้ผู้ปกครอง</h2>
        <p>ดูภาพรวมแบบเร็ว: เรียนจบบทไหนแล้ว กลับมาเรียนต่อเนื่องแค่ไหน และคำไหนควรช่วยทวน</p>
      </div>
      <div class="parent-metrics">
        <article><span>บทที่จบ</span><strong>${completed.length}</strong><small>${completed.map((lesson) => lesson.title).join(", ") || "ยังไม่มีบทที่จบ"}</small></article>
        <article><span>Streak</span><strong>${Number(state.streak.current || 0)} วัน</strong><small>freeze เหลือ ${Number(state.streak.freezesLeft || 0)}</small></article>
        <article><span>เวลาเรียนสัปดาห์นี้</span><strong>${weeklyMinutes} นาที</strong><small>นับจาก mission ที่จบแล้ว</small></article>
        <article><span>จุดที่ผิดบ่อย</span><strong>${weakPoints.length ? weakPoints[0].label : "ยังไม่มี"}</strong><small>${weakPoints.map((item) => `${item.label} (${item.count})`).join(", ") || "ตอบได้ดี ไม่มีคำที่ติดซ้ำ"}</small></article>
      </div>
    `;
  }

  function renderLearnWidgets() {
    renderLearningMap();
    renderParentView();
  }

  function createLearnPhase(options = {}) {
    const screen = options.screen || document.querySelector(".mission-screen");
    const lessonId = options.lessonId || missionSession?.lessonId || "";
    const items = normalizeLearnItems(options.items || []);
    if (!screen || !lessonId) return null;

    screen.querySelectorAll(".learn-phase").forEach((node) => node.remove());

    const phase = document.createElement("section");
    phase.className = "learn-phase hidden";
    phase.dataset.lessonId = lessonId;
    phase.setAttribute("aria-live", "polite");
    phase.innerHTML = `
      <div class="learn-phase-card">
        <div class="learn-visual-card">
          <span class="mini-label">Learn first</span>
          <div class="learn-image-shell">
            <img class="learn-main-image" src="" alt="" />
            <span class="learn-image-placeholder" aria-hidden="true">?</span>
          </div>
        </div>
        <div class="learn-copy">
          <span class="mini-label learn-counter">คำที่ 1/1</span>
          <h2 class="learn-word">Ready?</h2>
          <p class="learn-thai">มาเรียนคำใหม่กัน!</p>
          <p class="learn-helper">พูดตามน้องฟิว!</p>
          <div class="learn-progress-dots" aria-label="ความคืบหน้าการเรียนคำศัพท์"></div>
          <div class="learn-actions">
            <button class="sound-button learn-replay-button" type="button">ฟังอีก</button>
            <button class="button secondary learn-skip-button" type="button">ข้ามไปเล่น</button>
            <button class="button primary learn-next-button" type="button">ถัดไป ▶</button>
          </div>
        </div>
        <aside class="learn-mascot-panel">
          <img class="learn-mascot-image" src="${mascotImages.greeting}" alt="น้องฟิวเจอร์" />
          <strong>มาเรียนคำใหม่กัน!</strong>
          <span>ดูรูป ฟังเสียง แล้วพูดตามเบา ๆ</span>
        </aside>
      </div>
    `;

    const insertAfter = screen.querySelector(".gamification-hud") || screen.querySelector(".mission-screen-head");
    if (insertAfter) insertAfter.insertAdjacentElement("afterend", phase);
    else screen.prepend(phase);

    const image = phase.querySelector(".learn-main-image");
    const placeholder = phase.querySelector(".learn-image-placeholder");
    const mascotImage = phase.querySelector(".learn-mascot-image");
    const mascotText = phase.querySelector(".learn-mascot-panel strong");
    const mascotHint = phase.querySelector(".learn-mascot-panel span");
    const counter = phase.querySelector(".learn-counter");
    const word = phase.querySelector(".learn-word");
    const thai = phase.querySelector(".learn-thai");
    const helper = phase.querySelector(".learn-helper");
    const dots = phase.querySelector(".learn-progress-dots");
    const replayButton = phase.querySelector(".learn-replay-button");
    const skipButton = phase.querySelector(".learn-skip-button");
    const nextButton = phase.querySelector(".learn-next-button");
    const hiddenSelectors = options.hideSelectors || ".mission-prompt, .mission-feedback, .mission-stage, .sentence-stage, .mission-lab-layout, .mission-complete";

    let index = 0;
    let ready = false;
    let active = false;
    let learnAudio = null;
    let learnAudioToken = 0;

    replayButton?.addEventListener("click", () => playCurrentAudio());
    skipButton?.addEventListener("click", () => {
      markLearnPhaseDone(lessonId);
      finish("skip");
    });
    nextButton?.addEventListener("click", () => {
      if (ready) {
        markLearnPhaseDone(lessonId);
        finish("complete");
        return;
      }
      if (index >= items.length - 1) {
        showReadyCard();
        return;
      }
      index += 1;
      renderSlide({ playAudio: true });
    });

    function start(startOptions = {}) {
      options.unlockAudio?.();
      if (!items.length) {
        options.onComplete?.({ skippedLearn: true, empty: true });
        return false;
      }
      if (!startOptions.force && isLearnPhaseDone(lessonId)) {
        options.onComplete?.({ skippedLearn: true, remembered: true });
        return false;
      }
      active = true;
      ready = false;
      index = 0;
      stopLearnAudio();
      phase.classList.remove("hidden", "is-ready");
      screen.classList.add("is-learn-phase");
      setMissionContentHidden(true);
      setMascot("greeting", options.introText || "มาเรียนคำใหม่กัน!", { sound: false });
      renderSlide({ playAudio: true });
      return true;
    }

    function finish(reason) {
      active = false;
      ready = false;
      stopLearnAudio();
      phase.classList.add("hidden");
      phase.classList.remove("is-ready");
      screen.classList.remove("is-learn-phase");
      setMissionContentHidden(false);
      const callback = reason === "skip" ? (options.onSkip || options.onComplete) : options.onComplete;
      callback?.({ reason });
    }

    function renderSlide(renderOptions = {}) {
      if (!active || !items.length) return;
      ready = false;
      phase.classList.remove("is-ready");
      const item = items[index];
      if (counter) counter.textContent = `คำที่ ${index + 1}/${items.length}`;
      if (word) word.textContent = item.english || item.word || "Listen";
      if (thai) thai.textContent = item.thai || item.translation || "พูดตามเสียงครู";
      if (helper) helper.textContent = item.helper || "พูดตามน้องฟิว!";
      if (mascotImage) mascotImage.src = mascotImages.greeting;
      if (mascotText) mascotText.textContent = "มาเรียนคำใหม่กัน!";
      if (mascotHint) mascotHint.textContent = "ดูรูป ฟังเสียง แล้วพูดตามเบา ๆ";
      if (nextButton) nextButton.textContent = index >= items.length - 1 ? "พร้อมเล่น ▶" : "ถัดไป ▶";
      setLearnImage(item);
      renderDots();
      setMascot("greeting", item.mascotText || "พูดตามน้องฟิว!", { sound: false });
      if (renderOptions.playAudio) playCurrentAudio();
    }

    function showReadyCard() {
      ready = true;
      markLearnPhaseDone(lessonId);
      stopLearnAudio();
      phase.classList.add("is-ready");
      if (counter) counter.textContent = "ครบแล้ว";
      if (word) word.textContent = "พร้อมเล่นแล้ว!";
      if (thai) thai.textContent = "คราวนี้ลองแตะรูปให้ตรงกับเสียงนะ";
      if (helper) helper.textContent = "น้องฟิวพร้อมเชียร์แล้ว!";
      if (image) {
        image.src = mascotImages.celebrate;
        image.alt = "น้องฟิวเจอร์พร้อมเล่น";
        image.classList.remove("is-missing");
      }
      if (placeholder) placeholder.textContent = "★";
      if (mascotImage) mascotImage.src = mascotImages.celebrate;
      if (mascotText) mascotText.textContent = "เย้ พร้อมเล่นแล้ว!";
      if (mascotHint) mascotHint.textContent = "กดเริ่มเล่น แล้วไปเก็บดาวกัน";
      if (nextButton) nextButton.textContent = "เริ่มเล่น";
      renderDots();
      setMascot("celebrate", "พร้อมเล่นแล้ว ไปเก็บดาวกัน!", { sound: true });
    }

    function playCurrentAudio() {
      if (!active || ready) return;
      const item = items[index];
      const audioSrc = normalizeLearnAudio(item.audioSrc || item.audio || item.audioFile || "");
      if (!audioSrc) return;
      const token = ++learnAudioToken;
      stopLearnAudio({ keepToken: true });
      try {
        learnAudio = new Audio(audioSrc);
        learnAudio.onended = () => {
          if (token === learnAudioToken) learnAudio = null;
        };
        learnAudio.onerror = () => {
          if (token === learnAudioToken) learnAudio = null;
        };
        const promise = learnAudio.play();
        if (promise && typeof promise.catch === "function") promise.catch(() => {});
      } catch {
        learnAudio = null;
      }
    }

    function stopLearnAudio(stopOptions = {}) {
      if (!stopOptions.keepToken) learnAudioToken += 1;
      if (!learnAudio) return;
      try {
        learnAudio.pause();
        learnAudio.currentTime = 0;
      } catch {
        /* ignore audio cleanup */
      }
      learnAudio = null;
    }

    function setLearnImage(item) {
      const src = item.imageSrc || item.image || "";
      const fallback = item.fallbackImageSrc || item.fallbackImage || "";
      if (!image) return;
      image.classList.remove("is-missing");
      image.dataset.fallbackSrc = fallback;
      image.dataset.fallbackUsed = "0";
      image.alt = item.thai ? `รูป ${item.thai}` : `รูป ${item.english || item.word || "คำศัพท์"}`;
      image.onerror = () => {
        if (image.dataset.fallbackSrc && image.dataset.fallbackUsed !== "1") {
          image.dataset.fallbackUsed = "1";
          image.src = image.dataset.fallbackSrc;
          return;
        }
        image.classList.add("is-missing");
      };
      image.src = src || mascotImages.greeting;
      if (placeholder) placeholder.textContent = String(item.english || item.word || "?").slice(0, 2).toUpperCase();
    }

    function renderDots() {
      if (!dots) return;
      dots.innerHTML = items.map((item, dotIndex) => {
        const status = ready || dotIndex < index ? "done" : dotIndex === index ? "active" : "";
        return `<span class="${status}" aria-label="${escapeHtml(item.english || item.word || `คำที่ ${dotIndex + 1}`)}"></span>`;
      }).join("");
    }

    function setMissionContentHidden(hidden) {
      screen.querySelectorAll(hiddenSelectors).forEach((node) => {
        if (node === phase || phase.contains(node)) return;
        node.classList.toggle("learn-phase-hidden", hidden);
      });
    }

    return {
      start,
      isDone: () => isLearnPhaseDone(lessonId),
      markDone: () => markLearnPhaseDone(lessonId),
      stop: () => finish("stop"),
    };
  }

  function normalizeLearnItems(items) {
    return items
      .filter(Boolean)
      .map((item, index) => ({
        id: item.id || item.key || item.word || `learn-${index + 1}`,
        english: item.english || item.label || item.word || item.phrase || "",
        thai: item.thai || item.translation || item.sentence || "",
        imageSrc: item.imageSrc || item.image || "",
        fallbackImageSrc: item.fallbackImageSrc || item.fallbackImage || "",
        audioSrc: item.audioSrc || item.audio || item.audioFile || "",
        helper: item.helper || "",
        mascotText: item.mascotText || "",
      }))
      .filter((item) => item.english || item.audioSrc || item.imageSrc);
  }

  function learnPhaseKey(lessonId) {
    return `${LEARN_PHASE_STORAGE_PREFIX}${lessonId}`;
  }

  function isLearnPhaseDone(lessonId) {
    if (!lessonId) return false;
    try {
      return Boolean(localStorage.getItem(learnPhaseKey(lessonId)));
    } catch {
      return false;
    }
  }

  function markLearnPhaseDone(lessonId) {
    if (!lessonId) return null;
    const learnedAt = new Date().toISOString();
    try {
      localStorage.setItem(learnPhaseKey(lessonId), learnedAt);
    } catch {
      /* ignore local storage quota */
    }
    const state = readState();
    const progress = getLessonProgress(state, lessonId);
    progress.learnedAt = learnedAt;
    const updated = writeState(state);
    renderLearnWidgets();
    return updated.lessons[lessonId];
  }

  function normalizeLearnAudio(src) {
    const value = String(src || "").trim();
    if (!value) return "";
    if (/^(https?:|data:|blob:|\/)/.test(value)) return value;
    return `${mascotAudioBase}${value}`;
  }

  function weeklyLearningMs(state) {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    return (state.sessions || []).reduce((sum, session) => {
      const endedAt = Date.parse(session.endedAt || session.startedAt || "");
      if (!endedAt || endedAt < weekAgo) return sum;
      return sum + Number(session.durationMs || 0);
    }, 0);
  }

  function topWeakPoints(state) {
    const counts = {};
    Object.values(state.lessons || {}).forEach((progress) => {
      Object.entries(progress.wrongSkillTags || {}).forEach(([tag, count]) => {
        counts[tag] = (counts[tag] || 0) + Number(count || 0);
      });
    });
    try {
      const attempts = JSON.parse(localStorage.getItem("101future.learningAttempts") || "[]");
      if (Array.isArray(attempts)) {
        attempts.forEach((attempt) => {
          if (attempt.correct === false && attempt.target) counts[attempt.target] = (counts[attempt.target] || 0) + 1;
        });
      }
    } catch {
      /* ignore legacy attempt parse */
    }
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }

  function todayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function dayGap(fromKey, toKey) {
    const from = Date.parse(`${fromKey}T00:00:00`);
    const to = Date.parse(`${toKey}T00:00:00`);
    if (!from || !to) return 0;
    return Math.round((to - from) / 86400000);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    })[char]);
  }

  window.FutureGamification = {
    lessons,
    mascotImages,
    dailyGoalStars: DAILY_GOAL_STARS,
    getState: readState,
    writeState,
    recordQuestion,
    completeLesson,
    initMissionShell,
    setMascot,
    showCelebration,
    renderLessonReward,
    renderLearningMap,
    renderParentView,
    renderLearnWidgets,
    createLearnPhase,
    isLearnPhaseDone,
    markLearnPhaseDone,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderLearnWidgets, { once: true });
  } else {
    renderLearnWidgets();
  }
})();

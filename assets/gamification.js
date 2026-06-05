(() => {
  const STORAGE_KEY = "101future.gamification.progress.v1";
  const DAILY_GOAL_STARS = 5;
  const DAILY_FREEZE_LIMIT = 2;

  const mascotImages = {
    greeting: "/assets/mascot/futuree-greeting.jpg",
    correct: "/assets/mascot/futuree-correct.jpg",
    encourage: "/assets/mascot/futuree-encourage.jpg",
    celebrate: "/assets/mascot/futuree-celebrate.jpg",
    sleepy: "/assets/mascot/futuree-sleepy.jpg",
  };

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
    setMascot(correct ? "correct" : "encourage", correct ? "เยี่ยมเลย ได้ดาวเพิ่ม!" : "ไม่เป็นไร ลองอีกครั้งนะ");
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
    setMascot("celebrate", "จบบทแล้ว พลังน้องฟิวเพิ่มขึ้น!");
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
    setMascot(options.mascotEmotion || "greeting", options.mascotText || "วันนี้มาช่วยน้องเก็บดาวกัน!");
    updateMissionHud(readState(), {});
    return missionSession;
  }

  function insertMissionHud(options) {
    const screen = document.querySelector(".mission-screen");
    if (!screen || document.querySelector(".gamification-hud")) return;
    const hud = document.createElement("div");
    hud.className = "gamification-hud";
    hud.innerHTML = `
      <div class="future-mascot-card" aria-live="polite">
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
    if (dailyStars) dailyStars.textContent = `${Math.min(Number(state.daily.stars || 0), DAILY_GOAL_STARS)}/${DAILY_GOAL_STARS}`;
    if (xp) xp.textContent = String(Number(state.xp || 0));
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
    window.setTimeout(() => toast.classList.remove("is-visible"), 1100);
  }

  function setMascot(emotion, text) {
    const image = document.querySelector("#futureMascotImage");
    const label = document.querySelector("#futureMascotText");
    if (image) {
      image.src = mascotImages[emotion] || mascotImages.greeting;
      image.onerror = () => image.classList.add("image-missing");
    }
    if (label && text) label.textContent = text;
  }

  function showCelebration(options = {}) {
    const summary = options.summary || {};
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
          <span>XP +${Number(summary.xp || 0)}</span>
          <span>Streak ${Number(summary.streak || 0)} วัน</span>
          <span>วันนี้ ${Number(summary.dailyStars || 0)}/${DAILY_GOAL_STARS} ดาว</span>
        </div>
      </div>
    `;
    document.body.append(overlay);
    window.setTimeout(() => overlay.classList.add("is-showing"), 20);
    window.setTimeout(() => overlay.classList.add("is-leaving"), 2800);
    window.setTimeout(() => overlay.remove(), 3400);
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
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderLearnWidgets, { once: true });
  } else {
    renderLearnWidgets();
  }
})();

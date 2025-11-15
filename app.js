// ==========================
//   KONSTANTEN & VARIABLEN
// ==========================

let focusSeconds = 45 * 60;
let resetSeconds = 2 * 60;

let timerInterval = null;
let resetInterval = null;

let currentTime = focusSeconds;
let currentReset = resetSeconds;

let isRunning = false;
let isResetRunning = false;

let blockCount = 1;
let endTime = null;
let resetEndTime = null;

let currentScreen = "timer";

const STORAGE_KEY = "fokus-kompass-state";
const STATS_KEY = "fokus-kompass-stats";

// ==========================
//   DOM ELEMENTE
// ==========================

const screenTimer   = document.getElementById("screen-timer");
const screenCheck   = document.getElementById("screen-check");
const screenReset   = document.getElementById("screen-reset");
const screenNext    = document.getElementById("screen-next");
const screenStats   = document.getElementById("screen-stats");

const timerDisplay  = document.getElementById("timer-display");
const resetDisplay  = document.getElementById("reset-timer");
const modeIndicator = document.getElementById("mode-indicator");

const startBtn      = document.getElementById("start-btn");
const pauseBtn      = document.getElementById("pause-btn");
const resetBtn      = document.getElementById("reset-btn");

const energySlider   = document.getElementById("energy-slider");
const focusSlider    = document.getElementById("focus-slider");
const restlessSlider = document.getElementById("restless-slider");

const energyValue    = document.getElementById("energy-value");
const focusValue     = document.getElementById("focus-value");
const restlessValue  = document.getElementById("restless-value");

const selfBtn       = document.getElementById("self-btn");
const lostBtn       = document.getElementById("lost-btn");
const checkFeedback = document.getElementById("check-feedback");

const resetDoneBtn  = document.getElementById("reset-done-btn");
const nextBlockBtn  = document.getElementById("next-block-btn");
const finishBtn     = document.getElementById("finish-btn");

const notifyBtn     = document.getElementById("notify-btn");
const notifyLabel   = document.getElementById("notify-label");

const statsToday     = document.getElementById("stats-today");
const statsYesterday = document.getElementById("stats-yesterday");
const statsWeek      = document.getElementById("stats-week");
const statsTotal     = document.getElementById("stats-total");
const statsChart     = document.getElementById("stats-chart");

const statsBtn      = document.getElementById("stats-btn");
const statsBackBtn  = document.getElementById("stats-back-btn");


// ==========================
//   HILFSFUNKTIONEN
// ==========================

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(currentTime);
}

function updateResetDisplay() {
  resetDisplay.textContent = formatTime(currentReset);
}

function showScreen(name) {
  screenTimer.classList.remove("screen--active");
  screenCheck.classList.remove("screen--active");
  screenReset.classList.remove("screen--active");
  screenNext.classList.remove("screen--active");
  screenStats.classList.remove("screen--active");

  document.getElementById(`screen-${name}`).classList.add("screen--active");
  currentScreen = name;

  persistState();
}


// ==========================
//    BENACHRICHTIGUNGEN
// ==========================

function updateNotifyUI() {
  if (!("Notification" in window)) {
    notifyBtn.classList.add("icon-button--disabled");
    notifyLabel.textContent = "Nicht verfügbar";
    return;
  }

  if (Notification.permission === "granted") {
    notifyBtn.classList.add("icon-button--active");
    notifyLabel.textContent = "An";
  } else if (Notification.permission === "denied") {
    notifyBtn.classList.remove("icon-button--active");
    notifyLabel.textContent = "Blockiert";
  } else {
    notifyBtn.classList.remove("icon-button--active");
    notifyLabel.textContent = "Aus";
  }
}

function showNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification(title, { body, icon: "icon-192.png" });
  } catch (e) {}
}

function requestNotificationPermission() {
  if (!("Notification" in window)) return;

  Notification.requestPermission().then(updateNotifyUI);
}


// ==========================
//   LOCALSTORAGE STATE
// ==========================

function persistState() {
  const state = {
    currentScreen,
    blockCount,
    currentTime,
    currentReset,
    isRunning,
    isResetRunning,
    endTime,
    resetEndTime,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function restoreState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    updateTimerDisplay();
    updateResetDisplay();
    return;
  }

  try {
    const state = JSON.parse(raw);

    currentScreen = state.currentScreen || "timer";
    blockCount = state.blockCount || 1;

    currentTime = state.currentTime ?? focusSeconds;
    currentReset = state.currentReset ?? resetSeconds;

    isRunning = state.isRunning;
    isResetRunning = state.isResetRunning;

    endTime = state.endTime;
    resetEndTime = state.resetEndTime;

    modeIndicator.textContent = `Fokusblock ${blockCount}`;

    const now = Date.now();

    // Fokus wiederherstellen
    if (isRunning && endTime) {
      const remaining = Math.round((endTime - now) / 1000);

      if (remaining <= 0) {
        currentTime = 0;
        handleFocusFinished();
      } else {
        currentTime = remaining;
        updateTimerDisplay();
        startTimer(true);
      }
    } else {
      updateTimerDisplay();
    }

    // Reset wiederherstellen
    if (isResetRunning && resetEndTime) {
      const remaining = Math.round((resetEndTime - now) / 1000);

      if (remaining <= 0) {
        currentReset = 0;
        handleResetFinished();
      } else {
        currentReset = remaining;
        updateResetDisplay();
        startReset(true);
      }
    } else {
      updateResetDisplay();
    }

    showScreen(currentScreen);

  } catch {}
}


// ==========================
//   STATISTIK SYSTEM
// ==========================

function loadStats() {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function addFocusBlockToStats() {
  const today = new Date().toISOString().slice(0, 10);
  const stats = loadStats();

  const entry = stats.find(s => s.date === today);
  if (entry) entry.count++;
  else stats.push({ date: today, count: 1 });

  saveStats(stats);
}

function getDateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function getWeekDates() {
  const now = new Date();
  const day = now.getDay(); // Sonntag=0
  const mondayOffset = day === 0 ? -6 : 1 - day;

  return [...Array(7)].map((_, i) => getDateOffset(mondayOffset + i));
}

function renderStats() {
  const stats = loadStats();

  const today = getDateOffset(0);
  const yesterday = getDateOffset(-1);
  const weekDays = getWeekDates();

  const todayCount = stats.find(s => s.date === today)?.count || 0;
  const yesterdayCount = stats.find(s => s.date === yesterday)?.count || 0;

  const weekCount = weekDays
    .map(d => stats.find(s => s.date === d)?.count || 0)
    .reduce((a, b) => a + b, 0);

  const totalCount = stats.reduce((a, b) => a + b.count, 0);

  statsToday.textContent     = `Heute: ${todayCount} Blöcke`;
  statsYesterday.textContent = `Gestern: ${yesterdayCount} Blöcke`;
  statsWeek.textContent      = `Woche: ${weekCount} Blöcke`;
  statsTotal.textContent     = `Insgesamt: ${totalCount} Blöcke`;

  // Chart
  statsChart.innerHTML = "";

  const weekValues = weekDays.map(d => stats.find(s => s.date === d)?.count || 0);
  const maxVal = Math.max(1, ...weekValues);

  weekValues.forEach(value => {
    const bar = document.createElement("div");
    bar.className = "stats-chart-bar";

    const fill = document.createElement("div");
    fill.className = "stats-chart-bar-fill";
    fill.style.height = (value / maxVal) * 100 + "%";

    bar.appendChild(fill);
    statsChart.appendChild(bar);
  });
}


// ==========================
//   TIMER LOGIK
// ==========================

function startTimer(fromRestore = false) {
  if (isRunning) return;
  isRunning = true;

  const now = Date.now();
  if (!fromRestore || !endTime) {
    endTime = now + currentTime * 1000;
  }

  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    const remaining = Math.round((endTime - Date.now()) / 1000);
    currentTime = remaining;

    if (remaining <= 0) {
      currentTime = 0;
      updateTimerDisplay();
      clearInterval(timerInterval);
      isRunning = false;
      endTime = null;
      handleFocusFinished();
    } else {
      updateTimerDisplay();
    }

    persistState();
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;

  clearInterval(timerInterval);
  isRunning = false;

  currentTime = Math.max(
    0,
    Math.round((endTime - Date.now()) / 1000)
  );

  endTime = null;

  updateTimerDisplay();
  persistState();
}

function resetTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  endTime = null;
  currentTime = focusSeconds;

  updateTimerDisplay();
  showScreen("timer");
  persistState();
}


// ==========================
//   FOKUSBLOCK BEENDET
// ==========================

function handleFocusFinished() {
  addFocusBlockToStats();

  showNotification(
    "Fokusblock beendet",
    "Zeit für den Check-in."
  );

  showScreen("check");
  prepareCheck();
}


// ==========================
//   CHECK SCREEN
// ==========================

function prepareCheck() {
  energySlider.value = 3;
  focusSlider.value = 3;
  restlessSlider.value = 2;

  energyValue.textContent = "3/5";
  focusValue.textContent = "3/5";
  restlessValue.textContent = "2/5";

  checkFeedback.textContent = "";
}


// ==========================
//   RESET TIMER
// ==========================

function startReset(fromRestore = false) {
  clearInterval(resetInterval);

  if (!fromRestore) {
    currentReset = resetSeconds;
    resetEndTime = Date.now() + currentReset * 1000;
  }

  isResetRunning = true;
  showScreen("reset");
  updateResetDisplay();
  persistState();

  resetInterval = setInterval(() => {
    const remaining = Math.round((resetEndTime - Date.now()) / 1000);
    currentReset = remaining;

    if (remaining <= 0) {
      currentReset = 0;
      updateResetDisplay();
      clearInterval(resetInterval);
      handleResetFinished();
    } else {
      updateResetDisplay();
    }

    persistState();
  }, 1000);
}

function handleResetFinished() {
  isResetRunning = false;
  resetEndTime = null;

  showNotification(
    "Reset abgeschlossen",
    "Wie geht es weiter?"
  );

  showScreen("next");
}


// ==========================
//   EVENT LISTENER
// ==========================

// Timer Controls
startBtn.addEventListener("click", () => {
  if (Notification.permission === "default") {
    requestNotificationPermission();
  }
  startTimer();
});
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

// Check-In Buttons
selfBtn.addEventListener("click", () => {
  checkFeedback.textContent = "Gut. Du bist bei dir.";
  setTimeout(() => showScreen("next"), 700);
});

lostBtn.addEventListener("click", () => {
  checkFeedback.textContent = "Gut, dass du ehrlich bist. Jetzt Reset.";
  setTimeout(() => startReset(), 700);
});

// Reset
resetDoneBtn.addEventListener("click", () => {
  isResetRunning = false;
  showScreen("next");
});

// Weiter nach Reset
nextBlockBtn.addEventListener("click", () => {
  blockCount++;
  modeIndicator.textContent = `Fokusblock ${blockCount}`;

  currentTime = focusSeconds;
  endTime = null;

  updateTimerDisplay();
  showScreen("timer");
});
finishBtn.addEventListener("click", () => {
  blockCount = 1;
  modeIndicator.textContent = "Fokusblock 1";

  currentTime = focusSeconds;
  updateTimerDisplay();

  showScreen("timer");
});

// Notifications
notifyBtn.addEventListener("click", requestNotificationPermission);

// Statistik
statsBtn.addEventListener("click", () => {
  renderStats();
  showScreen("stats");
});
statsBackBtn.addEventListener("click", () => {
  showScreen("timer");
});

// Live Slider Text
energySlider.oninput   = () => energyValue.textContent   = energySlider.value + "/5";
focusSlider.oninput    = () => focusValue.textContent    = focusSlider.value + "/5";
restlessSlider.oninput = () => restlessValue.textContent = restlessSlider.value + "/5";


// ==========================
//   INIT
// ==========================

updateNotifyUI();
restoreState();
updateTimerDisplay();
updateResetDisplay();

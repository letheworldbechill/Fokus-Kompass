// State
let focusSeconds = 45 * 60; // 45 Minuten
let resetSeconds = 2 * 60;  // 2 Minuten Reset
let timerInterval = null;
let resetInterval = null;
let isRunning = false;
let blockCount = 1;

const screenTimer = document.getElementById("screen-timer");
const screenCheck = document.getElementById("screen-check");
const screenReset = document.getElementById("screen-reset");
const screenNext = document.getElementById("screen-next");

const timerDisplay = document.getElementById("timer-display");
const modeIndicator = document.getElementById("mode-indicator");

const resetDisplay = document.getElementById("reset-timer");

const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");

const energySlider = document.getElementById("energy-slider");
const focusSlider = document.getElementById("focus-slider");
const restlessSlider = document.getElementById("restless-slider");

const energyValue = document.getElementById("energy-value");
const focusValue = document.getElementById("focus-value");
const restlessValue = document.getElementById("restless-value");

const selfBtn = document.getElementById("self-btn");
const lostBtn = document.getElementById("lost-btn");
const checkFeedback = document.getElementById("check-feedback");

const resetDoneBtn = document.getElementById("reset-done-btn");
const nextBlockBtn = document.getElementById("next-block-btn");
const finishBtn = document.getElementById("finish-btn");

// Utility: format time
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

// Utility: show screen
function showScreen(name) {
  [screenTimer, screenCheck, screenReset, screenNext].forEach((s) =>
    s.classList.remove("screen--active")
  );
  if (name === "timer") screenTimer.classList.add("screen--active");
  if (name === "check") screenCheck.classList.add("screen--active");
  if (name === "reset") screenReset.classList.add("screen--active");
  if (name === "next") screenNext.classList.add("screen--active");
}

// Timer controls
let currentTime = focusSeconds;

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(currentTime);
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  timerInterval = setInterval(() => {
    currentTime--;
    updateTimerDisplay();
    if (currentTime <= 0) {
      clearInterval(timerInterval);
      isRunning = false;
      // Fokusblock beendet -> Check-Screen
      showScreen("check");
      prepareCheck();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  isRunning = false;
}

function resetTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  currentTime = focusSeconds;
  updateTimerDisplay();
}

// Prepare check sliders & text
function prepareCheck() {
  energySlider.value = 3;
  focusSlider.value = 3;
  restlessSlider.value = 2;
  energyValue.textContent = "3/5";
  focusValue.textContent = "3/5";
  restlessValue.textContent = "2/5";
  checkFeedback.textContent = "";
}

// Slider updates
energySlider.addEventListener("input", () => {
  energyValue.textContent = `${energySlider.value}/5`;
});
focusSlider.addEventListener("input", () => {
  focusValue.textContent = `${focusSlider.value}/5`;
});
restlessSlider.addEventListener("input", () => {
  restlessValue.textContent = `${restlessSlider.value}/5`;
});

// Self-check: "Ich merke mich"
selfBtn.addEventListener("click", () => {
  checkFeedback.textContent = "Gut. Du bist bei dir. Du darfst weitergehen – ohne dich zu überziehen.";
  // Kleines Delay, dann Screen Next
  setTimeout(() => {
    showScreen("next");
  }, 700);
});

// Self-check: "Ich verliere mich"
lostBtn.addEventListener("click", () => {
  checkFeedback.textContent =
    "Ehrlich. Sehr gut. Jetzt kommt erst ein Reset, keine neue Anstrengung.";
  setTimeout(() => {
    startReset();
  }, 700);
});

// Reset timer
let currentReset = resetSeconds;

function updateResetDisplay() {
  resetDisplay.textContent = formatTime(currentReset);
}

function startReset() {
  showScreen("reset");
  clearInterval(resetInterval);
  currentReset = resetSeconds;
  updateResetDisplay();
  resetInterval = setInterval(() => {
    currentReset--;
    updateResetDisplay();
    if (currentReset <= 0) {
      clearInterval(resetInterval);
      // Reset fertig, weiter Screen next
      showScreen("next");
    }
  }, 1000);
}

// After reset or self-check: decisions
resetDoneBtn.addEventListener("click", () => {
  clearInterval(resetInterval);
  showScreen("next");
});

nextBlockBtn.addEventListener("click", () => {
  blockCount++;
  modeIndicator.textContent = `Fokusblock ${blockCount}`;
  modeIndicator.classList.add("mode-indicator--focus");
  // neuer Fokusblock, Timer zurück, Screen Timer
  currentTime = focusSeconds;
  updateTimerDisplay();
  showScreen("timer");
});

finishBtn.addEventListener("click", () => {
  // Zurück zu Timer, aber nichts läuft
  blockCount = 1;
  modeIndicator.textContent = "Fokusblock 1";
  modeIndicator.classList.remove("mode-indicator--focus");
  currentTime = focusSeconds;
  updateTimerDisplay();
  showScreen("timer");
});

// Buttons Timer
startBtn.addEventListener("click", () => {
  startTimer();
});

pauseBtn.addEventListener("click", () => {
  pauseTimer();
});

resetBtn.addEventListener("click", () => {
  resetTimer();
});

// Init
currentTime = focusSeconds;
updateTimerDisplay();

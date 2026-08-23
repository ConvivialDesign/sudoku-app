import {
  submitDailyLeaderboardScore
} from "./leaderboardService.js";

const DAILY_KEY = "sudoku_daily_challenge_v1";
const DAILY_MODE_KEY = "sudoku_daily_mode";
const DAILY_DATE_KEY = "sudoku_daily_date";

/*export function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}*/

export function getTodayKey() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getDailyChallengeState() {
  const raw = localStorage.getItem(DAILY_KEY);
  return raw ? JSON.parse(raw) : {};
}

export function saveDailyChallengeState(state) {
  localStorage.setItem(DAILY_KEY, JSON.stringify(state));
}

export function startDailyChallenge() {
  const today = getTodayKey();
  const state = getDailyChallengeState();
if (state[today]?.completed) {
  alert("You have already completed today's Daily Challenge. Come back tomorrow!");
  return;
}

  if (!state[today]) {
    state[today] = {
      date: today,
      started: true,
      completed: false,
      solveTime: null,
      mistakes: 0,
      streakCounted: false
    };

    saveDailyChallengeState(state);
  }

  localStorage.setItem(DAILY_MODE_KEY, "true");
  localStorage.setItem(DAILY_DATE_KEY, today);

  const newPuzzleButton = document.getElementById("newPuzzle");

  if (!newPuzzleButton) {
    console.error("New Puzzle button not found.");
    return;
  }

  newPuzzleButton.dataset.dailyStart = "true";
  newPuzzleButton.click();
  newPuzzleButton.dataset.dailyStart = "false";
  //delete newPuzzleButton.dataset.dailyStart;
}

export function isDailyMode() {
  return localStorage.getItem(DAILY_MODE_KEY) === "true";
}

export function completeDailyChallenge(solveTime, mistakes) {
  const today = getTodayKey();
  const state = getDailyChallengeState();

  const existingEntry = state[today];

  const wasAlreadyCompleted =
    existingEntry?.completed === true;

  const todayEntry = existingEntry || {
    date: today,
    started: true,
    completed: false,
    solveTime: null,
    mistakes: 0,
    streakCounted: false
  };

  todayEntry.completed = true;
  todayEntry.solveTime = solveTime;
  todayEntry.mistakes = mistakes;

  state[today] = todayEntry;

  updateDailyStreak(state, today);
  saveDailyChallengeState(state);

  renderDailyScreen();

  // Submit to leaderboard only the first time
  // today's challenge is completed.
  if (!wasAlreadyCompleted) {
    submitDailyLeaderboardScore({
      challengeDate: today,
      solveTimeSeconds: solveTime,
      mistakes: mistakes
    })
      .then(result => {
        if (result.success) {
          console.log(
            "Daily Challenge added to leaderboard."
          );

          window.dispatchEvent(
            new CustomEvent(
              "sudoku:leaderboardSubmitted",
              {
                detail: result
              }
            )
          );
        }
      })
      .catch(error => {
        console.error(
          "Leaderboard submission failed:",
          error
        );
      });
  }

  window.dispatchEvent(
    new CustomEvent(
      "sudoku:dailyCompleted",
      {
        detail: {
          challengeDate: today,
          solveTime,
          mistakes
        }
      }
    )
  );

  // localStorage.setItem(DAILY_MODE_KEY, "false");
}

function updateDailyStreak(state, today) {
  const todayEntry = state[today];

  if (todayEntry.streakCounted) return;

  const streakKey = "sudoku_daily_streak_v1";
  const raw = localStorage.getItem(streakKey);

  const streak = raw
    ? JSON.parse(raw)
    : {
        currentStreak: 0,
        bestStreak: 0,
        lastCompletedDate: null
      };

  const yesterday = getPreviousDate(today);

  if (streak.lastCompletedDate === yesterday) {
    streak.currentStreak += 1;
  } else if (streak.lastCompletedDate === today) {
    // Do nothing
  } else {
    streak.currentStreak = 1;
  }

  streak.bestStreak = Math.max(streak.bestStreak, streak.currentStreak);
  streak.lastCompletedDate = today;

  todayEntry.streakCounted = true;

  localStorage.setItem(streakKey, JSON.stringify(streak));
}

/*function getPreviousDate(dateString) {
  const date = new Date(dateString);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}*/

function getPreviousDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  date.setDate(date.getDate() - 1);

  const prevYear = date.getFullYear();
  const prevMonth = String(date.getMonth() + 1).padStart(2, "0");
  const prevDay = String(date.getDate()).padStart(2, "0");

  return `${prevYear}-${prevMonth}-${prevDay}`;
}

// Improved Product Flow
const STREAK_KEY = "sudoku_daily_streak_v1";

export function openDailyScreen() {
  console.log("Opening Daily Screen");

  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.add("hidden");
  });

  const dailyScreen = document.getElementById("dailyScreen");

  if (!dailyScreen) {
    console.error("dailyScreen not found");
    return;
  }

  dailyScreen.classList.remove("hidden");

  console.log("Daily screen classes after open:", dailyScreen.className);

  renderDailyScreen();
}

export function renderDailyScreen() {
  const today = getTodayKey();
  const state = getDailyChallengeState();
  const todayEntry = state[today];
  const streak = getDailyStreak();

  const title = document.getElementById("dailyTodayTitle");

  if (title) {
    const [year, month, day] = today
      .split("-")
      .map(Number);

    title.textContent = new Date(
      year,
      month - 1,
      day
    ).toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  const status = document.getElementById("dailyStatus");

  if (status) {
    status.textContent = todayEntry?.completed
      ? "✅ Completed today"
      : "🟡 Not completed yet";
  }

  const startButton = document.getElementById(
    "startTodayDaily"
  );

  if (startButton) {
    startButton.textContent = todayEntry?.completed
      ? "Completed for today"
      : "Start Today’s Puzzle";

    startButton.disabled =
      todayEntry?.completed === true;
  }

  const currentStreak = document.getElementById(
    "dailyCurrentStreak"
  );

  if (currentStreak) {
    currentStreak.textContent =
      streak.currentStreak || 0;
  }

  const bestStreak = document.getElementById(
    "dailyBestStreak"
  );

  if (bestStreak) {
    bestStreak.textContent =
      streak.bestStreak || 0;
  }

  renderDailyCalendar(state);
}

export function getDailyStreak() {
  const raw = localStorage.getItem(STREAK_KEY);

  return raw
    ? JSON.parse(raw)
    : {
        currentStreak: 0,
        bestStreak: 0,
        lastCompletedDate: null
      };
}

function renderDailyCalendar(state) {
  const calendar = document.getElementById("dailyCalendar");
  if (!calendar) return;

  calendar.innerHTML = "";

  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    //const key = date.toISOString().slice(0, 10);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const dayNum = String(date.getDate()).padStart(2, "0");
    const key = `${year}-${month}-${dayNum}`;
    const entry = state[key];

    const day = document.createElement("div");
    day.className = "daily-day";

    if (entry?.completed) {
      day.classList.add("completed");
      day.textContent = "✓";
    } else if (key === getTodayKey()) {
      day.classList.add("today");
      day.textContent = "Today";
    } else {
      day.classList.add("missed");
      day.textContent = date.getDate();
    }

    day.title = key;
    calendar.appendChild(day);
  }
}

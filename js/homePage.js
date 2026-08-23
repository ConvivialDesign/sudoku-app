import { initLegacyGame } from "./legacyGame.js";
import { initSettingsUI } from "./settings.js";
import { shareDailyResult } from "./shareResult.js";
import {
  getTodayKey,
  getDailyChallengeState,
  getDailyStreak,
  startDailyChallenge
} from "./dailyChallenge.js";
import {
  submitDailyLeaderboardScore,
  getSavedPlayerName,
  savePlayerName
} from "./leaderboardService.js";



const DEFAULT_DAILY_DIFFICULTY = "medium";

document.addEventListener("DOMContentLoaded", () => {
  initSettingsUI();
  initialiseHomepageGame();

  window.addEventListener(
    "sudoku:dailyCompleted",
    handleHomepageDailyCompletion
  );
});

function handleHomepageDailyCompletion(event) {
  const {
    solveTime,
    mistakes
  } = event.detail || {};

  const today = getTodayKey();
  const dailyState = getDailyChallengeState();

  const todayEntry =
    dailyState[today] || {
      solveTime: solveTime || 0,
      mistakes: mistakes || 0,
      completed: true
    };

  const streak =
    getDailyStreak();

  celebrateCompletedBoard();

  /*
    Give the success animation a moment
    before changing the screen.
  */
  setTimeout(() => {
    showCompletedState(
      todayEntry,
      streak
    );

    document
      .getElementById(
        "home-smart-game"
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

  }, 800);
}

function initialiseHomepageGame() {
  const today = getTodayKey();
  const dailyState = getDailyChallengeState();
  const todayEntry = dailyState[today];
  const streak = getDailyStreak();

  updateHomepageChallengeInformation({
    today,
    streak,
    difficulty: DEFAULT_DAILY_DIFFICULTY
  });

  initLegacyGame();

  if (todayEntry?.completed) {
    showCompletedState(todayEntry, streak);
    return;
  }

  showActiveState();

  const startButton = document.getElementById("home-start-daily");
  const finalStartButton = document.getElementById(
    "home-final-daily-button"
  );

  startButton?.addEventListener("click", startHomepageDailyChallenge);
  finalStartButton?.addEventListener(
    "click",
    startHomepageDailyChallenge
  );

  // Start immediately so the homepage already contains a playable board.
  startHomepageDailyChallenge();
}

function startHomepageDailyChallenge() {
  const activeState = document.getElementById("home-daily-active");
  const completedState = document.getElementById(
    "home-daily-complete"
  );

  activeState?.classList.remove("hidden");
  completedState?.classList.add("hidden");

  const difficulty = document.getElementById("difficulty");

  if (difficulty) {
    difficulty.value = DEFAULT_DAILY_DIFFICULTY;
  }

  window.currentMode = "daily";

  startDailyChallenge();

  document
    .getElementById("home-smart-game")
    ?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
}

function showActiveState() {
  document
    .getElementById("home-daily-active")
    ?.classList.remove("hidden");

  document
    .getElementById("home-daily-complete")
    ?.classList.add("hidden");
}

function showCompletedState(todayEntry, streak) {
  document
    .getElementById("home-daily-active")
    ?.classList.add("hidden");

  document
    .getElementById("home-daily-complete")
    ?.classList.remove("hidden");


  // =====================================
  // RESULT INFORMATION
  // =====================================

  setText(
    "home-completion-time",
    formatTime(todayEntry.solveTime || 0)
  );

  setText(
    "home-result-time",
    formatTime(todayEntry.solveTime || 0)
  );

  setText(
    "home-result-mistakes",
    todayEntry.mistakes || 0
  );

  setText(
    "home-completed-streak",
    streak.currentStreak || 0
  );

  setText(
    "home-best-streak",
    streak.bestStreak || 0
  );


  // =====================================
  // TOP DAILY BUTTON
  // =====================================

  const startButton =
    document.getElementById("home-start-daily");

  if (startButton) {
    startButton.textContent =
      "Today’s Puzzle Complete";

    startButton.disabled = true;
  }


  // =====================================
  // FINAL CTA BUTTON
  // =====================================

  const finalButton =
    document.getElementById(
      "home-final-daily-button"
    );

  if (finalButton) {
    finalButton.textContent =
      "Play Another Puzzle";

    finalButton.onclick = () => {
      window.location.href =
        "/play.html";
    };
  }


  // =====================================
  // LEADERBOARD NAME SETUP
  // =====================================

  const nameSetup =
    document.getElementById(
      "leaderboard-name-setup"
    );

  const nameInput =
    document.getElementById(
      "leaderboard-player-name"
    );

  const saveNameButton =
    document.getElementById(
      "save-leaderboard-name"
    );

  const shareMessage =
    document.getElementById(
      "share-result-message"
    );

  const existingPlayerName =
    getSavedPlayerName();


  /*
    Returning player:
    the leaderboard name is already saved.
    Keep the name form hidden.
  */
  if (existingPlayerName) {
    nameSetup?.classList.add("hidden");
  }


  /*
    First-time leaderboard player:
    show the name form.
  */
  else {
    nameSetup?.classList.remove("hidden");

    if (nameInput) {
      nameInput.value = "";
    }

    if (saveNameButton) {
      saveNameButton.onclick =
        async () => {

          const enteredName =
            nameInput?.value || "";

          const saved =
            savePlayerName(
              enteredName
            );


          // Invalid name
          if (!saved.success) {
            if (shareMessage) {
              shareMessage.textContent =
                saved.error;
            }

            nameInput?.focus();

            return;
          }


          // Prevent multiple taps while submitting
          saveNameButton.disabled = true;
          saveNameButton.textContent =
            "Joining...";

          if (shareMessage) {
            shareMessage.textContent = "";
          }


          const result =
            await submitDailyLeaderboardScore({
              challengeDate:
                getTodayKey(),

              solveTimeSeconds:
                todayEntry.solveTime || 0,

              mistakes:
                todayEntry.mistakes || 0,

              playerName:
                saved.playerName
            });


          if (result.success) {
            nameSetup?.classList.add(
              "hidden"
            );

            if (shareMessage) {
              shareMessage.textContent =
                result.alreadySubmitted
                  ? "Your result is already on today's leaderboard."
                  : "Your result has been added to today's leaderboard! 🏆";
            }

            window.dispatchEvent(
              new CustomEvent(
                "sudoku:leaderboardSubmitted",
                {
                  detail: result
                }
              )
            );
          }

          else {
            if (shareMessage) {
              shareMessage.textContent =
                "We couldn't add your result to the leaderboard. Please try again.";
            }

            saveNameButton.disabled = false;
            saveNameButton.textContent =
              "Join Leaderboard";
          }
        };
    }
  }


  // =====================================
  // SHARE DAILY RESULT
  // =====================================

  const shareButton =
    document.getElementById(
      "share-daily-result"
    );

  if (shareButton) {
    shareButton.onclick =
      async () => {

        if (shareMessage) {
          shareMessage.textContent = "";
        }

        const result =
          await shareDailyResult({
            solveTimeSeconds:
              todayEntry.solveTime || 0,

            streak:
              streak.currentStreak || 0
          });


        if (!shareMessage) {
          return;
        }


        if (
          result.success &&
          result.method === "clipboard"
        ) {
          shareMessage.textContent =
            "Result copied! Paste it anywhere you like.";
        }


        if (
          result.success &&
          result.method === "native_share"
        ) {
          shareMessage.textContent = "";
        }


        if (
          result.success &&
          result.method === "whatsapp"
        ) {
          shareMessage.textContent = "";
        }


        if (
          !result.success &&
          !result.cancelled
        ) {
          shareMessage.textContent =
            "We couldn't share your result. Please try again.";
        }
      };
  }
}

function updateHomepageChallengeInformation({
  today,
  streak,
  difficulty
}) {
  const displayDate = parseLocalDate(today).toLocaleDateString(
    "en-ZA",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );

  setText("home-game-date", displayDate);
  setText("home-current-streak", streak.currentStreak || 0);

  setText(
    "home-information-current-streak",
    streak.currentStreak || 0
  );

  setText(
    "home-information-best-streak",
    streak.bestStreak || 0
  );

  setText(
    "home-game-difficulty",
    capitalise(difficulty)
  );

  setText(
    "home-information-difficulty",
    capitalise(difficulty)
  );

  setText(
    "home-estimated-time",
    getEstimatedTime(difficulty)
  );
}

function getEstimatedTime(difficulty) {
  const estimates = {
    easy: "3–7 minutes",
    medium: "5–10 minutes",
    hard: "10–20 minutes",
    expert: "15–30 minutes"
  };

  return estimates[difficulty] || estimates.medium;
}

function parseLocalDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatTime(seconds) {
  const safeSeconds = Number.isFinite(seconds)
    ? Math.max(0, seconds)
    : 0;

  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

function capitalise(value) {
  if (!value) return "";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = String(value);
  }
}

function celebrateCompletedBoard() {
  const board =
    document.getElementById("board");

  if (!board) return;

  board.classList.add(
    "board-completed"
  );

  window.setTimeout(() => {
    board.classList.remove(
      "board-completed"
    );
  }, 900);
}
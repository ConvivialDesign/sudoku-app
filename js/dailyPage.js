import {
  getDailyChallengeState,
  getTodayKey,
  renderDailyScreen
} from "./dailyChallenge.js";

import { initSettingsUI } from "./settings.js";

document.addEventListener("DOMContentLoaded", () => {
  initSettingsUI();

  // Populate:
  // - today's date
  // - completion status
  // - current streak
  // - best streak
  // - 14-day challenge calendar
  renderDailyScreen();

  updateDailyPageState();

  const startButton = document.getElementById("startTodayDaily");

  startButton?.addEventListener("click", () => {
    const today = getTodayKey();
    const state = getDailyChallengeState();

    const completed =
      state[today]?.completed === true;

    if (completed) {
      // If today's Daily Challenge is already done,
      // send the player to Practice Mode.
      window.location.href = "/play.html";
      return;
    }

    // The playable Daily Challenge lives on the homepage.
    window.location.href = "/#home-smart-game";
  });
});

function updateDailyPageState() {
  const today = getTodayKey();
  const state = getDailyChallengeState();

  const todayEntry = state[today];

  const startButton =
    document.getElementById("startTodayDaily");

  const practiceLink =
    document.getElementById("dailyPracticeLink");

  if (!startButton) return;

  // Challenge already completed
  if (todayEntry?.completed) {
    startButton.textContent =
      "Play Another Puzzle";

    practiceLink?.classList.remove("hidden");

    return;
  }

  // Challenge previously started but not completed
  if (todayEntry?.started) {
    startButton.textContent =
      "Continue Today’s Puzzle";

    practiceLink?.classList.add("hidden");

    return;
  }

  // Challenge not started yet
  startButton.textContent =
    "Play Today’s Puzzle";

  practiceLink?.classList.add("hidden");
}
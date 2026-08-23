import { initLegacyGame } from "./legacyGame.js";
import { initSettingsUI } from "./settings.js";
import { showSetupMode } from "./gameUI.js";

document.addEventListener("DOMContentLoaded", () => {
  localStorage.setItem("sudoku_daily_mode", "false");
  localStorage.removeItem("sudoku_daily_date");

  window.currentMode = "justplay";

  initSettingsUI();
  initialiseMenu();
  initLegacyGame();
  showSetupMode();

  const requestedDifficulty = getRequestedDifficulty();

  if (requestedDifficulty) {
    const difficulty = document.getElementById("difficulty");

    if (difficulty) {
      difficulty.value = requestedDifficulty;
    }

    document.getElementById("newPuzzle")?.click();
  }
});

function initialiseMenu() {
  const menuButton = document.getElementById("menu-btn");
  const closeButton = document.getElementById("close-pane");
  const overlay = document.getElementById("side-overlay");
  const pane = document.getElementById("side-pane");

  const open = () => {
    pane?.classList.remove("hidden");
    overlay?.classList.remove("hidden");
  };

  const close = () => {
    pane?.classList.add("hidden");
    overlay?.classList.add("hidden");
  };

  menuButton?.addEventListener("click", open);
  closeButton?.addEventListener("click", close);
  overlay?.addEventListener("click", close);
}

function getRequestedDifficulty() {
  const params = new URLSearchParams(window.location.search);
  const difficulty = params.get("difficulty");

  const valid = [
    "easy",
    "medium",
    "hard",
    "expert"
  ];

  return valid.includes(difficulty)
    ? difficulty
    : null;
}
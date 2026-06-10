//console.log("✅ app.js is running");

import { initNavigation } from "./navigation.js";
import { initSettingsUI } from "./settings.js";
import { initLegacyGame } from "./legacyGame.js";
import { initHomePanels } from "./homePanels.js";
import { renderStatsIntoHome } from "./stats.js";
import { startDailyChallenge, renderDailyScreen } from "./dailyChallenge.js";
import { showSetupMode, showPlayingMode, resetGameScreenUI } from "./gameUI.js";
import { recordGameStarted, recordGameCompleted } from "./stats.js";

// Screen Switching Function 
function showOnlyScreen(screenId) {
  console.trace("Showing:", screenId, "screen"); 
  
  const screens = ["screen-home", "dailyScreen", "screen-game"];

  screens.forEach(id => {
    const screen = document.getElementById(id);
    if (!screen) return;

    screen.classList.add("hidden");
    screen.style.display = "none";
  });

  const activeScreen = document.getElementById(screenId);

  if (!activeScreen) {
    console.error("Screen not found:", screenId);
    return;
  }

  activeScreen.classList.remove("hidden");
  activeScreen.style.display = "block";

  // Analytics tracking
  const pageData = {
    "screen-home": {
      title: "Home",
      path: "/"
    },
    "dailyScreen": {
      title: "Daily Challenge",
      path: "/daily"
    },
    "screen-game": {
      title: "Game",
      path: "/game"
    }
  };

  const page = pageData[screenId];

  if (page && typeof gtag === "function") {
    gtag("event", "page_view", {
      page_title: page.title,
      page_location: window.location.origin + page.path,
      page_path: page.path
    });
  }

  // Custom event
  window.trackEvent?.("screen_view", {
    screen_name: page?.title || screenId
  });

  console.log("Showing:", screenId, activeScreen.className);
}

document.addEventListener("DOMContentLoaded", () => {
  // Initiate scripts
  initSettingsUI();
  const nav = initNavigation();
  initLegacyGame();
  initHomePanels();

  // Start on Home
  nav.showScreen("home");

  // Just Play
  document.getElementById("mode-justplay")?.addEventListener("click", () => {
    console.log("JUST PLAY clicked");

    // Exit daily mode
    localStorage.setItem("sudoku_daily_mode", "false");
    localStorage.removeItem("sudoku_daily_date");

    window.currentMode = "justplay";

    showOnlyScreen("screen-game");

    // Important: undo anything Daily Challenge may have hidden
    resetGameScreenUI();

      // Resume only if the existing game is a Just Play game
    if (window.gameInProgress === true && window.currentMode === "justplay") {
      showPlayingMode();
      return;
    }

    // Otherwise show setup screen
    window.currentMode = "justplay";
    showSetupMode();

    const msg = document.getElementById("message");
    if (msg) msg.textContent = "Choose a difficulty, then click Start Puzzle.";

    const newPuzzleBtn = document.getElementById("newPuzzle");
    if (newPuzzleBtn) {
      newPuzzleBtn.textContent = "Start Puzzle";
    }

    document.getElementById("difficulty")?.focus();
  });

  // Daily Challenge landing screen
  document.getElementById("mode-daily")?.addEventListener("click", () => {
    console.log("DAILY clicked");

    window.currentMode = "daily";

    showOnlyScreen("dailyScreen");

    renderDailyScreen();
  });

  // Start today's daily challenge
  document.getElementById("startTodayDaily")?.addEventListener("click", () => {
    console.log("START DAILY clicked");

    window.currentMode = "daily";

    showOnlyScreen("screen-game");

    // Reset everything first
    resetGameScreenUI();

    // Then hide Just Play setup controls for Daily Challenge
    document.getElementById("difficulty")?.classList.add("hidden");
    document.getElementById("newPuzzle")?.classList.add("hidden");

    startDailyChallenge();
  });

  // Back from Daily screen
  document.getElementById("backFromDaily")?.addEventListener("click", () => {
    showOnlyScreen("screen-home");
  });

  // Home button
  document.getElementById("home-btn")?.addEventListener("click", () => {
    showOnlyScreen("screen-home");
  });

  // Stats tab wiring
  document.getElementById("tab-stats")?.addEventListener("click", () => {
    renderStatsIntoHome();
  });
});

// Listen and update stats
window.addEventListener("sudoku:gameStarted", () => {
  recordGameStarted();
});

window.addEventListener("sudoku:gameCompleted", (e) => {
  recordGameCompleted(e.detail.difficulty, e.detail.elapsedSeconds);
});
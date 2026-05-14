console.log("✅ app.js is running");
import { initNavigation } from "./navigation.js";
import { initSettingsUI } from "./settings.js";
import { initLegacyGame } from "./legacyGame.js";

document.addEventListener("DOMContentLoaded", () => {
  initSettingsUI();
  const nav = initNavigation();

  // Build the game UI immediately so it looks like it used to
  initLegacyGame();

  // Start on Home (or "game" if you prefer)
  nav.showScreen("home");
});

const KEYS = {
  game: "sudoku_game_state",
  stats: "sudoku_stats",
  settings: "sudoku_settings",
};

const STATS_KEY = "sudoku_stats"; // or your existing key

export function clearStats() {
  localStorage.removeItem(STATS_KEY);
}

function safeParse(raw, fallback) {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}

export function saveGame(gameState) {
  localStorage.setItem(KEYS.game, JSON.stringify(gameState));
}

export function loadGame() {
  return safeParse(localStorage.getItem(KEYS.game), null);
}

export function saveStats(statsObj) {
  localStorage.setItem(KEYS.stats, JSON.stringify(statsObj));
}

export function loadStats() {
  return safeParse(localStorage.getItem(KEYS.stats), null);
}

export function saveSettings(settingsObj) {
  localStorage.setItem(KEYS.settings, JSON.stringify(settingsObj));
}

export function loadSettings() {
  return safeParse(localStorage.getItem(KEYS.settings), null);
}

import { loadStats, saveStats, clearStats } from "./storage.js";

const DIFFS = ["easy", "medium", "hard", "expert"];
const STATS_KEY = "sudoku_stats";

function makeDiffCounters() {
  return { easy: 0, medium: 0, hard: 0, expert: 0 };
}

function sumByDiff(obj) {
  if (!obj || typeof obj !== "object") return 0;
  return DIFFS.reduce((acc, d) => acc + (Number(obj[d]) || 0), 0);
}

const DEFAULT_STATS = {
  started: makeDiffCounters(),   // started.easy etc
  solved: makeDiffCounters(),    // solved.easy etc
  bestTime: { easy: null, medium: null, hard: null, expert: null },
  totalSolveTimeSeconds: makeDiffCounters(),
};

let stats = null;

function normaliseStats(raw) {
  const r = raw || {};
  return {
    ...DEFAULT_STATS,

    // ensure nested objects exist and have all keys
    started: { ...DEFAULT_STATS.started, ...(r.started || {}) },
    solved: { ...DEFAULT_STATS.solved, ...(r.solved || {}) },
    totalSolveTimeSeconds: { ...DEFAULT_STATS.totalSolveTimeSeconds, ...(r.totalSolveTimeSeconds || {}) },
    bestTime: { ...DEFAULT_STATS.bestTime, ...(r.bestTime || {}) },
  };
}


export function initStats() {
  stats = normaliseStats(loadStats());
  saveStats(stats); // ensures storage has the correct shape
  return stats;
}

export function getStats() {
  if (!stats) initStats();
  return stats;
}

export function recordGameStarted(difficulty = "easy") {
  console.trace("✅ recordGameStarted called with", difficulty);
  
  const s = getStats();
  const d = DIFFS.includes(difficulty) ? difficulty : "easy";
 
  s.started[d] += 1;
  saveStats(s);
 
  console.log("✅ after started++", s.started);
}


export function recordGameSolved(elapsedSeconds, difficulty = "easy") {
  console.log("✅ recordGameSolved called with", { elapsedSeconds, difficulty });

  const s = getStats();
  const d = DIFFS.includes(difficulty) ? difficulty : "easy";

  s.solved[d] += 1;

  if (Number.isFinite(elapsedSeconds)) {
    s.totalSolveTimeSeconds[d] += elapsedSeconds;

    const best = s.bestTime[d];
    if (best === null || elapsedSeconds < best) {
      s.bestTime[d] = elapsedSeconds;
    }
  }

  saveStats(s);
  console.log("✅ after solved++", s.solved);
}


export function recordGameCompleted(difficulty, elapsedSeconds) {
  const stats = loadStats();
  stats.solved += 1;

  stats.lastSolvedAt = Date.now();

  const prev = stats.bestTime?.[difficulty];
  if (prev === null || elapsedSeconds < prev) {
    stats.bestTime[difficulty] = elapsedSeconds;
  }
  saveStats(stats);
}

function fmtTime(sec) {
  if (sec === null || sec === undefined) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

export function renderStatsIntoHome() {
  const panel = document.getElementById("home-panel-area");
  if (!panel) return;


   //const stats = getStats();
   const currentStats = getStats();
  
   panel.innerHTML = `
    <div style="padding: 12px 16px;">
      <h3 style="margin: 0 0 10px;">Stats</h3>

      <div style="display:grid; gap:10px;">
        <div style="display:flex; justify-content:space-between;">
          <span>Games started</span><strong>${sumByDiff(currentStats.started)}</strong>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span>Games completed</span><strong>${sumByDiff(currentStats.solved)}</strong>
        </div>

      </div>

      <h4 style="margin: 16px 0 8px;">Best times</h4>
      <div style="display:grid; gap:8px;">
        <div style="display:flex; justify-content:space-between;"><span>Easy</span><strong>${fmtTime(currentStats.bestTime.easy)}</strong></div>
        <div style="display:flex; justify-content:space-between;"><span>Medium</span><strong>${fmtTime(currentStats.bestTime.medium)}</strong></div>
        <div style="display:flex; justify-content:space-between;"><span>Hard</span><strong>${fmtTime(currentStats.bestTime.hard)}</strong></div>
        <div style="display:flex; justify-content:space-between;"><span>Expert</span><strong>${fmtTime(currentStats.bestTime.expert)}</strong></div>
      </div>

      <div style="margin-top:16px; display:flex; gap:8px;">
        <button id="stats-reset" style="padding:10px 12px; border-radius:12px; border:1px solid rgba(0,0,0,0.12); background:#fff; cursor:pointer;">
          Reset stats
        </button>
      </div>
    </div>
  `;

  document.getElementById("stats-reset")?.addEventListener("click", () => {
    //localStorage.removeItem(STATS_KEY);
    clearStats();        // use your imported function
    stats = null;
    renderStatsIntoHome();
  });
}

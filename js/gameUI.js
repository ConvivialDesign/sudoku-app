export function setMessage(text, type = "info") {
  const el = document.getElementById("message");
  if (!el) return;
  el.className = `message ${type}`;
  el.textContent = text || "";
}

export function renderLives(lives) {
  const el = document.getElementById("lives");
  //if (!el) return;
  if (el) el.textContent = `Lives: ${lives}`;

  // Enforce default:
  const safeLives = Number.isFinite(lives) ? lives : 3;
  el.textContent = `Lives: ${safeLives}`;
}

export function renderTimer(elapsedSeconds) {
  const el = document.getElementById("timer");
  if (!el) return;
  const m = Math.floor(elapsedSeconds / 60);
  const s = elapsedSeconds % 60;
  el.textContent = `Time: ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function showSetupMode() {
  [
    "lives",
    "timer",
    "hint",
    "board",
    "number-pad",
    "clear",
    "pauseResume",
    "eraseCell",
    "pencilToggle"
  
    /*
  ].forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });

  document.getElementById("difficulty")?.classList.remove("hidden");
  document.getElementById("newPuzzle")?.classList.remove("hidden");
  */
 ].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.classList.add("hidden");
    el.style.display = "";
  });

  const difficulty = document.getElementById("difficulty");
  const newPuzzle = document.getElementById("newPuzzle");

  if (difficulty) {
    difficulty.classList.remove("hidden");
    difficulty.style.display = "";
  }

  if (newPuzzle) {
    newPuzzle.classList.remove("hidden");
    newPuzzle.style.display = "";
    newPuzzle.textContent = "Start Puzzle";
  }

  const message = document.getElementById("message");
  if (message) {
    message.textContent = "Choose a difficulty, then click Start Puzzle.";
  }

}

export function showPlayingMode() {
  [
    "lives",
    "timer",
    "hint",
    "board",
    "number-pad",
    "clear",
    "pauseResume",
    "eraseCell",
    "pencilToggle"
  ].forEach(id => {
    document.getElementById(id)?.classList.remove("hidden");
  });

  document.getElementById("difficulty")?.classList.remove("hidden");
  document.getElementById("newPuzzle")?.classList.remove("hidden");
}

export function resetGameScreenUI() {
  console.log("Resetting game screen UI");

  // Main containers
  document.getElementById("board")?.classList.remove("hidden");
  document.getElementById("board-wrapper")?.classList.remove("hidden");
  document.getElementById("numberPad")?.classList.remove("hidden");

  // Status items
  document.getElementById("lives")?.classList.remove("hidden");
  document.getElementById("timer")?.classList.remove("hidden");
  document.getElementById("hint")?.classList.remove("hidden");

  // Game controls
  document.getElementById("pause")?.classList.remove("hidden");
  document.getElementById("erase")?.classList.remove("hidden");
  document.getElementById("pencil")?.classList.remove("hidden");

  // Setup controls
  document.getElementById("difficulty")?.classList.remove("hidden");
  document.getElementById("newPuzzle")?.classList.remove("hidden");

  // Optional: reset button text back to normal
  const newPuzzleBtn = document.getElementById("newPuzzle");
  if (newPuzzleBtn) newPuzzleBtn.textContent = "Start Puzzle";
}
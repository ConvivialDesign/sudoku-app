import { setMessage, renderLives, renderTimer, showSetupMode, showPlayingMode } from "./gameUI.js";
import { saveGame, loadGame } from "./storage.js";
import { setSettings as updateSettings} from "./settings.js";
import { recordGameStarted, recordGameSolved } from "./stats.js";
import { isDailyMode, completeDailyChallenge } from "./dailyChallenge.js";
import { createSeededRandom } from "./seededRandom.js";

// ---------- State Variables ----------
let lives = 3;
let hintsLeft = 3;
let elapsedSeconds = 0;
let timerInterval = null;
let isPaused = false;
let currentDifficulty = "easy";
const settings = updateSettings();
let activeRandom = Math.random;

// ---------- Temporary Functions ----------
function checkAndHandleSolved() {
  if (!isBoardFull(currentBoard)) return false;

  const solved = equalsSolution(currentBoard);
  console.log("🧪 solved check", { full: true, solved });

  if (solved) {
    setMessage("Well done! You solved the puzzle 🎉", "success");
    stopTimer();

   if (
      localStorage.getItem("sudoku_daily_mode") === "true" ||
      localStorage.getItem("sudoku_daily_date")
    ) {
      console.log("Calling completeDailyChallenge from solved check...");
      completeDailyChallenge(elapsedSeconds || 0, 0);
    }

    recordGameSolved(elapsedSeconds, currentDifficulty);
    window.gameInProgress = false;
    return true;
  }
  return false;
}

// ---------- SEED HELPERS ----------
function setupRandomSource() {

  //Added for debugging
  console.log("setupRandomSource running");
  console.log("daily mode:", localStorage.getItem("sudoku_daily_mode"));
  console.log("daily date:", localStorage.getItem("sudoku_daily_date"));
  console.log("activeRandom before:", activeRandom);

  const isDaily = localStorage.getItem("sudoku_daily_mode") === "true";
  const dailyDate = localStorage.getItem("sudoku_daily_date");

  if (isDaily && dailyDate) {
    activeRandom = createSeededRandom(dailyDate);
    console.log("Using seeded daily puzzle:", dailyDate);
  } else {
    activeRandom = Math.random;
    console.log("Using normal random puzzle");
  }
}

// ---------- UTILITIES & VALIDATORS ----------
function deepCopy(board) {
  return board.map(row => row.slice());
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(activeRandom() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function findEmpty(board) {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (board[r][c] === 0) return [r, c];
  return null;
}

function isSafe(board, r, c, n) {
  // row/col
  for (let i = 0; i < 9; i++) {
    if (board[r][i] === n) return false;
    if (board[i][c] === n) return false;
  }
  // box
  const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
  for (let rr = br; rr < br + 3; rr++)
    for (let cc = bc; cc < bc + 3; cc++)
      if (board[rr][cc] === n) return false;
  return true;
}


// ---------- RANDOMIZED SOLVER ----------
function solveRandom(board) {
  const empty = findEmpty(board);
  if (!empty) return true; // solved
  const [r, c] = empty;

  const nums = shuffle([1,2,3,4,5,6,7,8,9]);
  for (const n of nums) {
    if (isSafe(board, r, c, n)) {
      board[r][c] = n;
      if (solveRandom(board)) return true;
      board[r][c] = 0;
    }
  }
  return false;
}

function generateFullSolution() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  solveRandom(board);
  return board;
}

// ---------- COUNT SOLUTIONS ----------

function countSolutions(board, cap = 2) {
  // Backtracking that counts up to "cap" solutions
  const b = deepCopy(board);
  let solutions = 0;

  function backtrack() {
    if (solutions >= cap) return; // early stop
    const empty = findEmpty(b);
    if (!empty) { solutions++; return; }
    const [r, c] = empty;
    for (let n = 1; n <= 9; n++) {
      if (isSafe(b, r, c, n)) {
        b[r][c] = n;
        backtrack();
        if (solutions >= cap) return;
        b[r][c] = 0;
      }
    }
  }
  backtrack();
  return solutions;
}

// ---------- CREATE PUZZLE BY REMOVING CLUES WHILE KEEPING UNIQUE SOLUTION ----------
const DIFFICULTY_CLUES = {
  easy:   [38, 40],
  medium: [30, 34],
  hard:   [24, 28],
  expert: [22, 24],
};

function generatePuzzle(difficulty = "medium") {
  const [minClues, maxClues] = DIFFICULTY_CLUES[difficulty] || DIFFICULTY_CLUES.medium;

  // 1) Start from a full, valid solution
  const solution = generateFullSolution();

  // 2) Begin with all clues present; we'll remove them safely
  const puzzle = deepCopy(solution);

  // 3) Positions 0..80 shuffled
  const positions = shuffle(Array.from({ length: 81 }, (_, i) => i));

  // 4) Try removing while preserving uniqueness and not going below minClues
  let clues = 81;
  for (const pos of positions) {
    if (clues <= minClues) break; // keep at least minClues
    const r = Math.floor(pos / 9), c = pos % 9;
    const saved = puzzle[r][c];
    if (saved === 0) continue;
    puzzle[r][c] = 0;

    // Check uniqueness — if more than 1 solution, revert the removal
    const solutions = countSolutions(puzzle, 2);
    if (solutions !== 1) {
      puzzle[r][c] = saved; // revert
    } else {
      clues--;
      // Optional: stop early if we've reached the top of the range
      if (clues <= maxClues) {
        // You can continue to try more removals for harder shapes, or stop here
      }
    }
  }

  return { puzzle, solution };
}


// ---------- PUZZLE & SOLUTION ----------
let initialBoard = [
  [5,3,0,0,7,0,0,0,0],
  [6,0,0,1,9,5,0,0,0],
  [0,9,8,0,0,0,0,6,0],
  [8,0,0,0,6,0,0,0,3],
  [4,0,0,8,0,3,0,0,1],
  [7,0,0,0,2,0,0,0,6],
  [0,6,0,0,0,0,2,8,0],
  [0,0,0,4,1,9,0,0,5],
  [0,0,0,0,8,0,0,7,9]
];

// IMPORTANT: must match the initialBoard's intended solution
let solutionBoard = [
  [5,3,4,6,7,8,9,1,2],
  [6,7,2,1,9,5,3,4,8],
  [1,9,8,3,4,2,5,6,7],
  [8,5,9,7,6,1,4,2,3],
  [4,2,6,8,5,3,7,9,1],
  [7,1,3,9,2,4,8,5,6],
  [9,6,1,5,3,7,2,8,4],
  [2,8,7,4,1,9,6,3,5],
  [3,4,5,2,8,6,1,7,9]
];


// ---------- NEW PUZZLE HANDLER ----------
function loadGeneratedPuzzle(difficulty, shouldRecordStart = false) {

  setMessage("Generating puzzle…", "info");

  lives = 3;
  hintsLeft = 3;
  elapsedSeconds = 0;
  isPaused = false;
  
  renderLives(lives);
  renderTimer(elapsedSeconds);

  // In case generation takes a moment, allow the UI to update:
  setTimeout(() => {
    const { puzzle, solution } = generatePuzzle(difficulty);
    
    initialBoard  = puzzle;
    solutionBoard = solution;
    currentBoard  = deepCopy(puzzle);

    window.gameInProgress = true;
    
    showPlayingMode();   
    createBoard();
    startTimer();

    //Record Stats
    currentDifficulty = difficulty || "easy"; 

    if (shouldRecordStart) {
      recordGameStarted(currentDifficulty);
    }
    
    setMessage(`New ${difficulty} puzzle ready. Good luck!`, "success");
  }, 10);
}

document.getElementById("newPuzzle")?.addEventListener("click", (event) => {

  const isDailyStart = event.currentTarget.dataset.dailyStart === "true";

  if (!isDailyStart) {
    localStorage.setItem("sudoku_daily_mode", "false");
    localStorage.removeItem("sudoku_daily_date");
  }
  
  setupRandomSource();
  updateDailyControls();
  
  const diff = document.getElementById("difficulty")?.value || "medium";
  loadGeneratedPuzzle(diff,true);

  elapsedSeconds = 0;
  renderTimer();
  startTimer();

  // reset pause state
  isPaused = false;
  setBoardPaused(false);                    // ensure no blur and cells enabled
  if (pauseResumeBtn) pauseResumeBtn.textContent = "Pause";

 // reset pencil marks
  pencilMarks = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set())
  );


});


// ---------- STATE ----------
let currentBoard = JSON.parse(JSON.stringify(initialBoard));

// ---------- HINTS ---------
const hintBtn = document.getElementById("hint");

// ---------- GLOBALS FOR NOTES ---------

let pencilMode = false;

// pencilMarks[r][c] = Set of candidate numbers
let pencilMarks = Array.from({ length: 9 }, () =>
  Array.from({ length: 9 }, () => new Set())
);


// ---------- DOM ----------
const boardEl   = document.getElementById("board");
const messageEl = document.getElementById("message");
const livesEl   = document.getElementById("lives");
const timerEl = document.getElementById("timer");
const pauseResumeBtn = document.getElementById("pauseResume");


// ---------- PENCIL NOTES ----------
const pencilToggleBtn = document.getElementById("pencilToggle");

if (pencilToggleBtn) {
  pencilToggleBtn.addEventListener("click", () => {
    pencilMode = !pencilMode;
    pencilToggleBtn.textContent = pencilMode ? "Pencil: On" : "Pencil: Off";
    pencilToggleBtn.classList.toggle("active", pencilMode);
    setMessage(
      pencilMode ? "Pencil mode ON – notes only." : "Pencil mode OFF – placing real numbers.",
      "info"
    );
  });
}

// ---------- MESSAGES ----------
function resetMessage() {
  messageEl.textContent = "";
  messageEl.className = "message";
}


// ---------- TIMER HELPERS ----------
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const mm = m < 10 ? "0" + m : String(m);
  const ss = s < 10 ? "0" + s : String(s);
  return mm + ":" + ss;
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (isPaused) return;
    elapsedSeconds += 1;
    renderTimer(elapsedSeconds);
  }, 1000);
}


function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
}

// ---------- PAUSE HELPERS ----------

function setBoardEnabled(enabled) {
  // Enable/disable all non-prefilled, non-"game over" cells
  const cells = boardEl.querySelectorAll(".cell");
  cells.forEach(cell => {
    if (cell.classList.contains("prefilled")) return;
    if (cell.classList.contains("disabled")) return;  // game-over cells stay locked
    cell.readOnly = !enabled;
  });
}

function setBoardPaused(paused) {
  if (paused) {
    boardEl.classList.add("paused");  // triggers CSS blur + pointer-events
    setBoardEnabled(false);           // extra safety against typing
  } else {
    boardEl.classList.remove("paused");
    setBoardEnabled(true);
  }
}

// ---------- PAUSE AND RESUME ----------

if (pauseResumeBtn) {
  pauseResumeBtn.addEventListener("click", () => {
    if (!isPaused) {
      // PAUSE
      isPaused = true;
      stopTimer();
      setBoardPaused(true);                 // 🔹 lock + blur grid
      pauseResumeBtn.textContent = "Resume";
      setMessage("Game paused.", "info");
    } else {
      // RESUME
      isPaused = false;
      startTimer();
      setBoardPaused(false);                // 🔹 unlock + unblur grid
      pauseResumeBtn.textContent = "Pause";
      resetMessage();
    }
  });
}

// ---------- HELPERS to READ/WRITE the current grid from the DOM  ----------

function readGridFromDOM() {
  const cells = Array.from(document.querySelectorAll("#board .cell"));
  if (cells.length !== 81) return null;

  // store as 81-length array of strings ("", "1"..."9")
  return cells.map(c => (c.value || "").trim());
}

function writeGridToDOM(values) {
  const cells = Array.from(document.querySelectorAll("#board .cell"));
  if (cells.length !== 81 || !Array.isArray(values) || values.length !== 81) return;

  cells.forEach((c, i) => {
    c.value = values[i] || "";
  });
}

function readPrefilledFromDOM() {
  const cells = Array.from(document.querySelectorAll("#board .cell"));
  if (cells.length !== 81) return null;
  return cells.map(c => c.classList.contains("prefilled"));
}

function applyPrefilledToDOM(prefilledFlags) {
  const cells = Array.from(document.querySelectorAll("#board .cell"));
  if (cells.length !== 81 || !Array.isArray(prefilledFlags) || prefilledFlags.length !== 81) return;

  cells.forEach((c, i) => {
    c.classList.toggle("prefilled", !!prefilledFlags[i]);
    // If you disable prefilled cells in your game, keep that behavior:
    if (prefilledFlags[i]) {
      c.setAttribute("readonly", "true");
    } else {
      c.removeAttribute("readonly");
    }
  });
}

function updateHintButton() {
  const el = document.getElementById("hint");
  if (!el) return;
  el.textContent = `Hint (${hintsLeft})`;
  //el.textContent = `Hint (${n})`
}


function getDifficultyValue() {
  return document.getElementById("difficulty")?.value || "medium";
}

function setDifficultyValue(v) {
  const sel = document.getElementById("difficulty");
  if (sel) sel.value = v;
}

function captureGameState() {
  const grid = readGridFromDOM();
  const prefilled = readPrefilledFromDOM();
  if (!grid || !prefilled) return null;

  const state = {
    grid,
    prefilled,
    difficulty: getDifficultyValue(),
    lives: lives,
    //hints: getHintValue(),
    hints: updateHintButton(),

    // You need to supply these 2 from your timer logic:
    elapsedSeconds: window.__elapsedSeconds ?? 0,
    isPaused: window.__isPaused ?? false
  };

  return state;
}

function restoreGameState(state) {
  if (!state) return false;

  // Ensure your board exists already
  if (!document.querySelector("#board")) return false;

  // If your app normally generates a new puzzle before board exists,
  // make sure the board is already rendered when you call restore.

  setDifficultyValue(state.difficulty);
  renderLives(lives);
  setHintValue(state.hints);

  applyPrefilledToDOM(state.prefilled);
  writeGridToDOM(state.grid);

  // Restore timer variables (connect to your timer)
  window.__elapsedSeconds = state.elapsedSeconds || 0;
  window.__isPaused = !!state.isPaused;

  // Update timer display if you have a function for it:
  if (typeof window.updateTimerDisplay === "function") {
    window.updateTimerDisplay(window.__elapsedSeconds);
  }

  // Pause UI if needed
  const board = document.getElementById("board");
  if (board) board.classList.toggle("paused", window.__isPaused);

  return true;
}

function wireAutoSave() {
  // Save when any cell changes
  document.getElementById("board")?.addEventListener("input", () => {
    const state = captureGameState();
    if (state) saveGame(state);
    checkCompletion();
  });

  // Save on key actions
  ["newPuzzle", "clear", "pauseResume", "eraseCell", "hint", "difficulty"].forEach(id => {
    document.getElementById(id)?.addEventListener("click", () => {
      const state = captureGameState();
      if (state) saveGame(state);
    });
    document.getElementById(id)?.addEventListener("change", () => {
      const state = captureGameState();
      if (state) saveGame(state);
    });
  });

  // Save when user closes/refreshes
  window.addEventListener("beforeunload", () => {
    const state = captureGameState();
    if (state) saveGame(state);
  });
}

wireAutoSave();

// ---------- HINTS HELPERS ----------

function getHintCandidates() {
  const candidates = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const isPrefilled = initialBoard[r][c] !== 0;
      if (isPrefilled) continue;

      const currentVal = currentBoard[r][c];
      const correctVal = solutionBoard[r][c];

      // Candidate if empty or wrong
      if (currentVal === 0 || currentVal !== correctVal) {
        candidates.push({ r, c });
      }
    }
  }
  return candidates;
}

// ---------- HINTS CLICK HANDLER ----------

hintBtn?.addEventListener("click", () => {
  if (hintsLeft <= 0) {
    setMessage("No hints left for this game.", "info");
    return;
  }

  const candidates = getHintCandidates();
  if (candidates.length === 0) {
    setMessage("No cells available for a hint. The board already matches the solution.", "info");
    return;
  }

  // Pick random candidate
  const choice = candidates[Math.floor(activeRandom() * candidates.length)];
  const { r, c } = choice;

  const correctVal = solutionBoard[r][c];
  currentBoard[r][c] = correctVal;

  // Update the DOM cell
  const cellEl = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
  if (cellEl) {
    cellEl.value = String(correctVal);
    cellEl.classList.remove("wrong");  // in case it was red before
    cellEl.classList.add("hint");      // mark as hint cell

  }

  updateNumberPadCounts();

  // Decrement hints and update button
  hintsLeft = Math.max(0, hintsLeft - 1);
  updateHintButton();

  // Optional: clear any previous message and show hint info
  setMessage(`Hint used. ${hintsLeft} ${hintsLeft === 1 ? "hint" : "hints"} left.`, "info");

  // Check if puzzle solved after hint
  if (isBoardFull(currentBoard) && equalsSolution(currentBoard)) {
    setMessage("Well done! You solved the puzzle 🎉", "success");
    stopTimer();
    recordGameSolved(elapsedSeconds, currentDifficulty);
    window.gameInProgress = false;
  }
});

function registerMistake(reason = "") {
  //console.log("✅ registerMistake fired", { livesBefore: lives, reason });
  if (isPaused) return;


  lives = Number.isFinite(lives) ? lives : 3;
  lives = Math.max(0, lives - 1);


  renderLives(lives);
  setMessage(reason ? `Mistake: ${reason}` : "Mistake!", "error");


  // persist if you save game
  if (typeof saveGame === "function") saveGame({ lives, hintsLeft, elapsedSeconds });
 
  if (lives === 0) {
    setMessage("Game over!", "error");
    // optionally pause/disable inputs
    isPaused = true;
  }
}

// ---------- SHARED HANDLER FOR ALL CELL CHANGES ----------
function handleCellValueChange(cell, r, c, rawVal) {
  // normalise to one digit 1–9 or empty
  let val = String(rawVal).replace(/[^1-9]/g, "");
  if (val.length > 1) val = val[0];

  cell.value = val;

  if (val === "") {
    currentBoard[r][c] = 0;
    cell.classList.remove("wrong");
    resetMessage();
    updateNumberPadCounts();
    return;
  }

  const num = parseInt(val, 10);
  currentBoard[r][c] = num;

  if (num === solutionBoard[r][c]) {
    // correct
    cell.classList.remove("wrong");
    resetMessage();
    updateNumberPadCounts();

    checkAndHandleSolved(); //Temporary

    if (isBoardFull(currentBoard) && equalsSolution(currentBoard)) {
      setMessage("Well done! You solved the puzzle 🎉", "success");
      stopTimer();
    }
  } else {
    // wrong – mark red + deduct a life
    cell.classList.add("wrong");
    registerMistake(`Row ${r + 1}, Col ${c + 1}`);

    updateNumberPadCounts();

    if (lives === 0) {
      setMessage("Wrong number. Lives: 0", "error");
      gameOver();
    } else {
      setMessage(
        `Wrong number. ${lives} ${lives === 1 ? "life" : "lives"} left.`,
        "error"
      );
    }
  }
}


// ---------- VALIDATION HELPERS ----------
function isBoardFull(board) {
  return board.every(row => row.every(v => v !== 0));
}
function equalsSolution(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (Number(board[r][c]) !== Number(solutionBoard[r][c])) return false;
    }
  }
  return true;
}

// OPTIONAL: basic row/col/box “no duplicates” check
function isValidUnit(values) {
  const seen = new Set();
  for (const v of values) {
    if (v === 0) continue;
    if (seen.has(v)) return false;
    seen.add(v);
  }
  return true;
}
function isValidBoard(board) {
  // rows
  for (let r = 0; r < 9; r++) if (!isValidUnit(board[r])) return false;
  // cols
  for (let c = 0; c < 9; c++) {
    const col = [];
    for (let r = 0; r < 9; r++) col.push(board[r][c]);
    if (!isValidUnit(col)) return false;
  }
  // boxes
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const box = [];
      for (let r = br*3; r < br*3+3; r++)
        for (let c = bc*3; c < bc*3+3; c++)
          box.push(board[r][c]);
      if (!isValidUnit(box)) return false;
    }
  }
  return true;
}

// ---------- DAILY MODE REMOVE CERTAIN OPTIONS HELPER ----------
function updateDailyControls() {
  const isDaily = localStorage.getItem("sudoku_daily_mode") === "true";

  const difficulty = document.getElementById("difficulty");
  const newPuzzle = document.getElementById("newPuzzle");

  //if (difficulty) difficulty.disabled = isDaily;
  if (difficulty) {
  difficulty.style.display = isDaily ? "none" : "";
}

  if (newPuzzle) {
    newPuzzle.style.display = isDaily ? "none" : "";
  }
}

// ---------- HIGHLIGHT HELPERS ----------
function clearHighlights() {
  document.querySelectorAll('.cell').forEach(el => {
    el.classList.remove('highlight', 'focused', 'same-number');
  });
}

function highlightCross(row, col, cellEl) {
  clearHighlights();
  // highlight all cells in the same row and column
  document.querySelectorAll(`.cell[data-row="${row}"], .cell[data-col="${col}"]`)
    .forEach(el => el.classList.add('highlight'));
  // emphasize the focused cell
  if (cellEl) cellEl.classList.add('focused');
 // Highlight same correct numbers
  highlightSameNumbers(row, col, cellEl);

}
// ---------- HIGHLIGHT SAME NUMBER HELPER ----------

function highlightSameNumbers(row, col, cellEl) {
  if (!cellEl) return;

  const valStr = cellEl.value || cellEl.dataset.value;
  if (!valStr || !/^[1-9]$/.test(valStr)) {
    // empty or not a 1–9 digit: nothing to highlight
    return;
  }

  const val = parseInt(valStr, 10);

  // Loop over all cells and highlight those with the same (correct) value
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const otherCell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
      if (!otherCell) continue;

      const cellValueStr = otherCell.value || otherCell.dataset.value;
      if (!cellValueStr) continue;

      const cellValue = parseInt(cellValueStr, 10);

      // Only highlight numbers that:
      //  1) equal the selected number, AND
      //  2) are correct according to solutionBoard
      if (cellValue === val && cellValue === solutionBoard[r][c]) {
        otherCell.classList.add("same-number");
      }
    }
  }
}

// ---------- PENCIL NOTES HELPERS  ----------
function renderPencilMarksForCell(r, c, cell) {
  const notesEl = cell.parentElement.querySelector(".pencil-notes");
  if (!notesEl) return;
  const set = pencilMarks[r][c];
  const arr = Array.from(set).sort((a, b) => a - b);
  notesEl.textContent = arr.join(" ");
}

function togglePencilMark(r, c, num, cell) {
  const set = pencilMarks[r][c];
  if (set.has(num)) {
    set.delete(num);
  } else {
    set.add(num);
  }
  renderPencilMarksForCell(r, c, cell);
}

function clearPencilMarks(r, c, cell) {
  pencilMarks[r][c].clear();
  const notesEl = cell.parentElement.querySelector(".pencil-notes");
  if (notesEl) notesEl.textContent = "";
}

// ---------- Completion Detection ----------

// reads 81 values from DOM as strings "1".."9" or ""
function readGrid81() {
  const cells = Array.from(document.querySelectorAll("#board .cell"));
  if (cells.length !== 81) return null;
  return cells.map(c => (c.value || "").trim());
}

function isAllFilled(grid81) {
  return grid81.every(v => /^[1-9]$/.test(v));
}

// Check duplicates in a list of 9 strings (ignoring blanks)
function hasDupes(values9) {
  const seen = new Set();
  for (const v of values9) {
    if (!v) continue;
    if (seen.has(v)) return true;
    seen.add(v);
  }
  return false;
}

// Validity check (no duplicates in rows/cols/boxes)
function isValidGrid(grid81) {
  const get = (r, c) => grid81[r * 9 + c];

  // rows
  for (let r = 0; r < 9; r++) {
    const row = [];
    for (let c = 0; c < 9; c++) row.push(get(r, c));
    if (hasDupes(row)) return false;
  }

  // cols
  for (let c = 0; c < 9; c++) {
    const col = [];
    for (let r = 0; r < 9; r++) col.push(get(r, c));
    if (hasDupes(col)) return false;
  }

  // boxes
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const box = [];
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) {
          box.push(get(r, c));
        }
      }
      if (hasDupes(box)) return false;
    }
  }

  return true;
}

// BEST: compare against your solutionBoard (9x9 numbers)
function matchesSolution(grid81, solutionBoard) {
  if (!solutionBoard) return false;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = grid81[r * 9 + c];
      if (Number(v) !== solutionBoard[r][c]) return false;
    }
  }
  return true;
}

// ---------- Finish Ham ----------

let gameCompleted = false;

function finishGame() {

  console.log("finishGame running");
  console.log("daily mode?", localStorage.getItem("sudoku_daily_mode"));

  if (gameCompleted) return;
  gameCompleted = true;

  setMessage("✅ Puzzle solved! Great job.", "success"); // use your existing setMessage
  setBoardPaused(true); // optional: lock the board

   // 🔥 Daily Challenge hook
  if (isDailyMode()) {
    console.log("Calling completeDailyChallenge...");
    completeDailyChallenge(elapsedSeconds || 0, 0);
  } else {
    console.log("Not daily mode, so daily completion not saved.");
  }

  window.dispatchEvent(new CustomEvent("sudoku:gameCompleted", {
    detail: {
      difficulty: document.getElementById("difficulty")?.value || "medium",
      elapsedSeconds: elapsedSeconds || 0
    }
  }))
  
}

function checkCompletion() {
  if (gameCompleted) return;

  const grid = readGrid81();
  if (!grid) return;

  // 1) must be full
  if (!isAllFilled(grid)) return;

  // 2) must be valid (no duplicates)
  if (!isValidGrid(grid)) {
    setMessage("⚠️ There’s a mistake somewhere. Fix conflicts to finish.", "error");
    return;
  }

  // 3) must match solution (recommended if you have solutionBoard)
  if (typeof solutionBoard !== "undefined" && solutionBoard) {
    if (!matchesSolution(grid, solutionBoard)) {
      setMessage("⚠️ Not quite right yet. Keep going.", "error");
      return;
    }
  }

  // ✅ solved
  finishGame();
}



// ---------- NUMBER PAD ----------

let selectedNumber = null;
let activeCell = null;

function createNumberPad() {
  const pad = document.getElementById('number-pad');
  pad.innerHTML = "";

  for (let n = 1; n <= 9; n++) {
    const btn = document.createElement('button');
    btn.textContent = n;
    btn.classList.add('num-btn');
    btn.dataset.value = n;

    btn.addEventListener('click', () => {
      if (btn.classList.contains('used-up')) return;

      // Select this number in the pad
      selectedNumber = n;
      document.querySelectorAll('.num-btn').forEach(b => {
        b.classList.toggle('selected', b === btn);
        
        checkCompletion();
      });


//--------- New Part for Pencil Marks ----------


  // Need an active cell to do something
      if (!activeCell || activeCell.classList.contains("prefilled")) return;

      const r = parseInt(activeCell.dataset.row, 10);
      const c = parseInt(activeCell.dataset.col, 10);

      if (pencilMode) {
        // NOTE MODE: just toggle a pencil mark, do not change currentBoard or lives
        togglePencilMark(r, c, n, activeCell);
        resetMessage();
      } else {
        // NORMAL MODE: place a real number & validate
        if (typeof handleCellValueChange === "function") {
          handleCellValueChange(activeCell, r, c, String(n));
        } else {
          // Fallback: simple set if you don't have handleCellValueChange
          activeCell.value = String(n);
          activeCell.dataset.value = String(n);
          currentBoard[r][c] = n;
          checkAndHandleSolved(); //Temporary - make sure

        }
        clearPencilMarks(r, c, activeCell);
      }

      // click-once behaviour: deselect number after use
      selectedNumber = null;
      document.querySelectorAll('.num-btn').forEach(b => b.classList.remove('selected'));

      if (typeof updateNumberPadCounts === "function") {
        updateNumberPadCounts();
      }
    });


    pad.appendChild(btn);
  }
}

function updateNumberPadCounts() {
  const counts = new Array(10).fill(0); // 1–9

  document.querySelectorAll('.cell').forEach(cell => {
    const v = cell.dataset.value || cell.value;
    if (v && v >= '1' && v <= '9') {
      counts[Number(v)]++;
    }
  });

  document.querySelectorAll('.num-btn').forEach(btn => {
    const val = Number(btn.dataset.value);

    if (counts[val] >= 9) {
      btn.classList.add('used-up');
      btn.disabled = true;

      if (selectedNumber === val) {
        selectedNumber = null;
        document.querySelectorAll('.num-btn').forEach(b => b.classList.remove('selected'));
      }
    } else {
      btn.classList.remove('used-up');
      btn.disabled = false;
    }
  });
}


// ---------- ERASER ----------

function eraseCell(cell) {
  if (!cell) return;
  if (cell.classList.contains("prefilled")) {
    setMessage("You cannot erase a prefilled cell.", "info");
    return;
  }

  const r = parseInt(cell.dataset.row, 10);
  const c = parseInt(cell.dataset.col, 10);

  // Clear the value in the UI
  cell.value = "";
  cell.classList.remove("wrong");
  delete cell.dataset.value;

  // Clear the value in the logical board
  currentBoard[r][c] = 0;

  resetMessage();
  updateNumberPadCounts();
}


// ---------- GAME OVER ----------
function gameOver() {
  setMessage("Game over — out of lives.", "error");
  stopTimer();
  const inputs = boardEl.querySelectorAll("input.cell:not(.prefilled)");
  inputs.forEach(inp => {
    inp.readOnly = true;
    inp.classList.add("disabled");
  });
}

// ---------- BOARD CREATION ----------
function createBoard() {
  boardEl.innerHTML = "";
  resetMessage();

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {

      const cellContainer = document.createElement("div");
      cellContainer.classList.add("cell-container");

      const cell = document.createElement("input");
      cell.type = "text";
      cell.maxLength = 1;
      cell.classList.add("cell");


// ---------- ADDITIONAL HIGHLIGHT FUNCTIONALITY ----------
	cell.dataset.row = String(r);
	cell.dataset.col = String(c);

// On focus/click, highlight its row & column
	cell.addEventListener('focus', () => {
  	   	highlightCross(r, c, cell);
    	});


cell.addEventListener('click', () => {
  highlightCross(r, c, cell);
  activeCell = cell;

  // If a number is already selected in the pad, apply it on click
  if (!cell.classList.contains("prefilled") && selectedNumber) {
    handleCellValueChange(cell, r, c, String(selectedNumber));

    // After use, clear the pad selection (click-once behaviour)
    selectedNumber = null;
    document.querySelectorAll('.num-btn').forEach(b => b.classList.remove('selected'));
  }
});


// Clear highlight when leaving the grid (optional)
	cell.addEventListener('blur', (e) => {
  		// If focus moved outside the board, clear; otherwise next focused cell will repaint anyway
  		const next = document.activeElement;
  	if (!next || !next.classList || !next.classList.contains('cell')) {
    	clearHighlights();
  	}
	});

// --------------------------------------------------------------------------------
// Clear highlights when you click outside the board

cell.addEventListener('blur', () => {
  const next = document.activeElement;
  if (!next || !next.classList || !next.classList.contains('cell')) {
    clearHighlights();
  }
});

// --------------------------------------------------------------------------------
// Settings Pane

const navSettings = document.getElementById("nav-settings");
const sideContent = document.getElementById("side-content");

function renderSettings() {
  if (!sideContent) return;

  const isDark = (settings.theme || "light") === "dark";

  sideContent.innerHTML = `
    <div class="settings">
      <h3 style="margin: 8px 0 12px;">Settings</h3>

      <label class="setting-row">
        <span>Dark mode</span>
        <input id="toggle-dark" type="checkbox" ${isDark ? "checked" : ""}/>
      </label>
    </div>
  `;

  document.getElementById("toggle-dark")?.addEventListener("change", (e) => {
    settings.theme = e.target.checked ? "dark" : "light";
    updateSettings(settings);
    //applyTheme();
  });
}

navSettings?.addEventListener("click", renderSettings);

// --------------------------------------------------------------------------------

      // Bold 3×3 borders (keep if you already had these)
      if (r % 3 === 0) cell.classList.add("top-border");
      if (c % 3 === 0) cell.classList.add("left-border");
      if (r === 8)    cell.classList.add("bottom-border");
      if (c === 8)    cell.classList.add("right-border");

      const value = initialBoard[r][c];

      if (value !== 0) {
        cell.value = String(value);
        cell.readOnly = true;
        cell.classList.add("prefilled");
      } else {

           // INPUT HANDLER: checks against solution and deducts lives
             cell.addEventListener("input", e => {
          // normalize value to single digit 1-9
             let val = e.target.value.replace(/[^1-9]/g, "");

          if (val.length > 1) val = val[0];
          e.target.value = val;

          // cleared
          if (val === "") {
            currentBoard[r][c] = 0;
            e.target.classList.remove("wrong");
            return;
          }

          const num = parseInt(val, 10);
          currentBoard[r][c] = num;

          if (num === solutionBoard[r][c]) {
            // correct
            e.target.classList.remove("wrong");
            // optional: auto-win check
           if (isBoardFull(currentBoard) && equalsSolution(currentBoard)) {
  		setMessage("Well done! You solved the puzzle 🎉", "success");
  		stopTimer();
	   } else {
              resetMessage(); // don’t spam messages on every correct keystroke
            }
          } else {
            // WRONG: mark red & deduct a life
            e.target.classList.add("wrong");
            lives = Math.max(0, lives - 1);
            renderLives();

            if (lives === 0) {
              setMessage("Wrong number. Lives: 0", "error");
              gameOver();
            } else {
              setMessage(`Wrong number. ${lives} ${lives === 1 ? "life" : "lives"} left.`, "error");
            }
          }
          checkCompletion();
        });
      }
  	// ----- Pencil notes element -----
    		const notesEl = document.createElement("div");
    		notesEl.classList.add("pencil-notes");
    		const existingNotes = Array.from(pencilMarks[r][c]).sort().join(" ");
    		notesEl.textContent = existingNotes;

    		cellContainer.appendChild(cell);
    		cellContainer.appendChild(notesEl);
    		boardEl.appendChild(cellContainer);
    }
  }
updateNumberPadCounts();
}

// ---------- BUTTONS ----------
document.getElementById("clear")?.addEventListener("click", () => {
  currentBoard = JSON.parse(JSON.stringify(initialBoard));
  lives = 3;
  renderLives();

  hintsLeft = 3;
  elapsedSeconds = 0;
  renderTimer();
  startTimer();

  // reset pencil marks
  pencilMarks = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set())
  );

  createBoard();
  setMessage("Board reset.", "info");

  // reset pause state
  isPaused = false;
  setBoardPaused(false);
  if (pauseResumeBtn) pauseResumeBtn.textContent = "Pause";

});

// ---------- ERASE BUTTON LISTENER ----------

const eraseBtn = document.getElementById("eraseCell");

eraseBtn?.addEventListener("click", () => {
  if (!activeCell) {
    setMessage("Click on a cell first, then press Erase.", "info");
    return;
  }

  eraseCell(activeCell);
});

export function initLegacyGame() {
  //console.log("🔥 initLegacyGame ran");
  // Grab current difficulty
  const diff = document.getElementById("difficulty")?.value || "medium";

  // IMPORTANT: load/generate a puzzle first so currentBoard is populated
  if (typeof loadGeneratedPuzzle === "function") {
   //loadGeneratedPuzzle(diff,false);
  } else if (typeof createBoard === "function") {
    createBoard();
  }

  // UI + number pad
  if (typeof renderLives === "function") renderLives();
  if (typeof createNumberPad === "function") createNumberPad();
  if (typeof updateNumberPadCounts === "function") updateNumberPadCounts();

  // Timer
  elapsedSeconds = 0;
  if (typeof renderTimer === "function") renderTimer();
  if (typeof startTimer === "function") startTimer();

  // Pause state
  isPaused = false;
  if (typeof setBoardPaused === "function") setBoardPaused(false);
}


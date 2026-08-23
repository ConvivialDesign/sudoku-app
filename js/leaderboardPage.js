import { getSupabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", async () => {
  setLeaderboardDate();

  try {
    const supabase = await getSupabase();
    const today = getTodayKey();

    const { data, error } = await supabase
      .from("daily_leaderboard")
      .select(`
        player_id,
        player_name,
        solve_time_seconds,
        mistakes,
        challenge_date
      `)
      .eq("challenge_date", today)
      .order("solve_time_seconds", {
        ascending: true
      })
      .order("mistakes", {
        ascending: true
      });

    if (error) {
      console.error("Leaderboard load failed:", error);
      showLeaderboardError();
      return;
    }

    renderLeaderboard(data || []);
    renderCurrentPlayerResult(data || []);
  } catch (error) {
    console.error("Leaderboard error:", error);
    showLeaderboardError();
  }
});


function renderLeaderboard(rows) {
  const results =
    document.getElementById("leaderboard-results");

  if (!results) return;

  if (rows.length === 0) {
    results.innerHTML = `
      <div class="leaderboard-empty">
        <span class="leaderboard-empty-icon">
          🏆
        </span>

        <strong>
          Be the first on today's leaderboard.
        </strong>

        <p>
          Complete today's Daily Challenge and
          your result can appear here.
        </p>
      </div>
    `;

    return;
  }

  results.innerHTML = rows
    .map((row, index) => {
      const rank = index + 1;

      return `
        <div class="leaderboard-row">

          <span class="leaderboard-rank">
            ${getRankDisplay(rank)}
          </span>

          <span class="leaderboard-player">
            ${escapeHtml(row.player_name)}
          </span>

          <span class="leaderboard-time">
            ${formatTime(row.solve_time_seconds)}
          </span>

          <span class="leaderboard-mistakes">
            ${row.mistakes}
          </span>

        </div>
      `;
    })
    .join("");
}


function renderCurrentPlayerResult(rows) {
  const playerId =
    localStorage.getItem("sudoku_player_id");

  if (!playerId) return;

  const playerIndex = rows.findIndex(
    row => row.player_id === playerId
  );

  if (playerIndex === -1) return;

  const playerRow = rows[playerIndex];

  const resultBox =
    document.getElementById(
      "your-leaderboard-result"
    );

  resultBox?.classList.remove("hidden");

  setText(
    "your-leaderboard-rank",
    `#${playerIndex + 1}`
  );

  setText(
    "your-leaderboard-time",
    formatTime(
      playerRow.solve_time_seconds
    )
  );

  setText(
    "your-leaderboard-mistakes",
    playerRow.mistakes
  );
}


function setLeaderboardDate() {
  const element =
    document.getElementById("leaderboard-date");

  if (!element) return;

  const date = new Date();

  element.textContent =
    date.toLocaleDateString(
      "en-ZA",
      {
        day: "numeric",
        month: "short"
      }
    );
}


function getTodayKey() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function formatTime(seconds) {
  const safeSeconds =
    Number(seconds) || 0;

  const minutes =
    Math.floor(safeSeconds / 60);

  const remainingSeconds =
    safeSeconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}


function getRankDisplay(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";

  return `#${rank}`;
}


function showLeaderboardError() {
  const results =
    document.getElementById(
      "leaderboard-results"
    );

  if (!results) return;

  results.innerHTML = `
    <div class="leaderboard-empty">
      <strong>
        We couldn't load the leaderboard.
      </strong>

      <p>
        Please refresh the page and try again.
      </p>
    </div>
  `;
}


function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function setText(id, value) {
  const element =
    document.getElementById(id);

  if (element) {
    element.textContent =
      String(value);
  }
}
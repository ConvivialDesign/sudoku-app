import { getSupabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const supabase = await getSupabase();

    const playerId = crypto.randomUUID();

    const testEntry = {
      player_id: playerId,
      player_name: "Test Player",
      challenge_date: getTodayKey(),
      solve_time_seconds: 330,
      mistakes: 1
    };

    console.log("Submitting test leaderboard entry:", testEntry);

    const { data: insertData, error: insertError } =
      await supabase
        .from("daily_leaderboard")
        .insert(testEntry)
        .select();

    if (insertError) {
      console.error("Leaderboard insert failed:", insertError);
      return;
    }

    console.log("Leaderboard insert succeeded:", insertData);

    const { data: leaderboard, error: readError } =
      await supabase
        .from("daily_leaderboard")
        .select("*")
        .eq("challenge_date", getTodayKey())
        .order("solve_time_seconds", {
          ascending: true
        });

    if (readError) {
      console.error("Leaderboard read failed:", readError);
      return;
    }

    console.log("Today's leaderboard:", leaderboard);

  } catch (error) {
    console.error("Supabase test failed:", error);
  }
});

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
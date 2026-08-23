import { getSupabase } from "./supabaseClient.js";

const PLAYER_ID_KEY = "sudoku_player_id";
const PLAYER_NAME_KEY = "sudoku_player_name";


/* =========================================================
   SUBMIT DAILY LEADERBOARD SCORE
   ========================================================= */

export async function submitDailyLeaderboardScore({
  challengeDate,
  solveTimeSeconds,
  mistakes = 0,
  playerName = null
}) {
  try {
    const supabase = await getSupabase();

    const playerId = getOrCreatePlayerId();

    /*
      A player/browser may only submit one score
      for a particular Daily Challenge.
    */
    const { data: existing, error: existingError } =
      await supabase
        .from("daily_leaderboard")
        .select(`
          id,
          player_id,
          player_name,
          challenge_date,
          solve_time_seconds,
          mistakes
        `)
        .eq("player_id", playerId)
        .eq("challenge_date", challengeDate)
        .maybeSingle();

    if (existingError) {
      console.error(
        "Could not check existing leaderboard result:",
        existingError
      );

      return {
        success: false,
        error: existingError
      };
    }


    /*
      Do not create another score if today's
      result has already been submitted.
    */
    if (existing) {
      console.log(
        "Leaderboard result already submitted for today."
      );

      return {
        success: true,
        alreadySubmitted: true,
        data: existing
      };
    }


    /* =====================================================
       PLAYER NAME
       ===================================================== */

    /*
      Priority:
      1. Name explicitly supplied by the result form.
      2. Name already stored in this browser.
    */
    const resolvedPlayerName =
      normalisePlayerName(
        playerName ||
        getSavedPlayerName()
      );


    /*
      First-time player:
      don't use prompt() and don't invent a name.

      Tell the caller that we need the player
      to choose a leaderboard name.
    */
    if (!resolvedPlayerName) {
      console.log(
        "Leaderboard submission waiting for player name."
      );

      return {
        success: false,
        needsPlayerName: true
      };
    }


    /*
      If a name was supplied from the form,
      remember it for future Daily Challenges.
    */
    savePlayerName(resolvedPlayerName);


    /* =====================================================
       SCORE
       ===================================================== */

    const score = {
      player_id: playerId,

      player_name:
        resolvedPlayerName,

      challenge_date:
        challengeDate,

      solve_time_seconds:
        Math.max(
          1,
          Math.round(
            Number(solveTimeSeconds) || 1
          )
        ),

      mistakes:
        Math.max(
          0,
          Math.min(
            3,
            Number(mistakes) || 0
          )
        )
    };


    console.log(
      "Submitting Daily Challenge leaderboard score:",
      score
    );


    const { data, error } =
      await supabase
        .from("daily_leaderboard")
        .insert(score)
        .select()
        .single();


    if (error) {
      console.error(
        "Leaderboard submission failed:",
        error
      );

      return {
        success: false,
        error
      };
    }


    console.log(
      "Leaderboard score submitted:",
      data
    );


    return {
      success: true,
      data
    };

  } catch (error) {
    console.error(
      "Unexpected leaderboard submission error:",
      error
    );

    return {
      success: false,
      error
    };
  }
}


/* =========================================================
   PLAYER ID
   ========================================================= */

export function getOrCreatePlayerId() {
  let playerId =
    localStorage.getItem(
      PLAYER_ID_KEY
    );

  if (playerId) {
    return playerId;
  }

  /*
    crypto.randomUUID() works on HTTPS and localhost,
    but may be unavailable when testing on a phone
    through a local HTTP IP address.
  */
  if (
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
  ) {
    playerId =
      window.crypto.randomUUID();
  } else {
    /*
      Fallback UUID for local/mobile HTTP testing.
    */
    playerId =
      "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
        .replace(
          /[xy]/g,
          character => {
            const random =
              Math.floor(
                Math.random() * 16
              );

            const value =
              character === "x"
                ? random
                : (random & 0x3) | 0x8;

            return value.toString(16);
          }
        );
  }

  localStorage.setItem(
    PLAYER_ID_KEY,
    playerId
  );

  console.log(
    "Created Sudoku player ID:",
    playerId
  );

  return playerId;
}

/* =========================================================
   PLAYER NAME
   ========================================================= */

export function getSavedPlayerName() {
  return normalisePlayerName(
    localStorage.getItem(
      PLAYER_NAME_KEY
    )
  );
}


export function savePlayerName(value) {
  const playerName =
    normalisePlayerName(value);

  if (!playerName) {
    return {
      success: false,
      error:
        "Please enter a name between 2 and 24 characters."
    };
  }

  localStorage.setItem(
    PLAYER_NAME_KEY,
    playerName
  );

  return {
    success: true,
    playerName
  };
}


function normalisePlayerName(value) {
  if (!value) {
    return null;
  }

  let name =
    String(value)
      .trim()
      .replace(/\s+/g, " ");

  if (name.length < 2) {
    return null;
  }

  if (name.length > 24) {
    name =
      name.slice(0, 24);
  }

  return name;
}
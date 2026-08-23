import { getSupabase } from "./supabaseClient.js";

import { stringToBoard } from "./puzzleFormat.js";


const CACHE_PREFIX =
  "sudoku_daily_puzzle_";


export async function getDailyPuzzle(
  challengeDate
) {
  /*
    1. Local cache first.
    Returning visitors get effectively
    instant loading.
  */

  const cached =
    getCachedPuzzle(
      challengeDate
    );

  if (cached) {
    console.log(
      "Daily puzzle loaded from cache:",
      challengeDate
    );

    return {
      success: true,
      source: "cache",
      ...cached
    };
  }


  /*
    2. Supabase.
  */

  try {
    const supabase =
      await getSupabase();

    const {
      data,
      error
    } =
      await supabase
        .from("daily_puzzles")
        .select(
          `
          challenge_date,
          difficulty,
          puzzle,
          solution
          `
        )
        .eq(
          "challenge_date",
          challengeDate
        )
        .maybeSingle();


    if (error) {
      console.error(
        "Daily puzzle fetch failed:",
        error
      );

      return {
        success: false,
        error
      };
    }


    if (!data) {
      return {
        success: false,
        missing: true
      };
    }


    const puzzleData = {
      challengeDate:
        data.challenge_date,

      difficulty:
        data.difficulty,

      puzzle:
        stringToBoard(
          data.puzzle
        ),

      solution:
        stringToBoard(
          data.solution
        )
    };


    saveCachedPuzzle(
      challengeDate,
      puzzleData
    );


    return {
      success: true,
      source: "supabase",
      ...puzzleData
    };

  } catch (error) {
    console.error(
      "Unexpected Daily Puzzle fetch error:",
      error
    );

    return {
      success: false,
      error
    };
  }
}


function getCachedPuzzle(
  challengeDate
) {
  try {
    const raw =
      localStorage.getItem(
        CACHE_PREFIX +
        challengeDate
      );

    if (!raw) return null;

    return JSON.parse(raw);

  } catch {
    return null;
  }
}


function saveCachedPuzzle(
  challengeDate,
  data
) {
  try {
    localStorage.setItem(
      CACHE_PREFIX +
      challengeDate,
      JSON.stringify(data)
    );
  } catch {
    /*
      Cache failure should never
      stop the game.
    */
  }
}
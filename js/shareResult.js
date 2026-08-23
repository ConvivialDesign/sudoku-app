export async function shareDailyResult({
  solveTimeSeconds,
  streak = 0,
  rank = null
}) {
  const shareText = buildShareText({
    solveTimeSeconds,
    streak,
    rank
  });

  const url = "https://sudokudailyplay.com/";

  const fullText =
    `${shareText}\n${url}`;

  try {
    // Best option on the live HTTPS website
    if (
      window.isSecureContext &&
      typeof navigator.share === "function"
    ) {
      await navigator.share({
        title: "Sudoku Daily Play",
        text: shareText,
        url
      });

      window.trackEvent?.(
        "share_result",
        {
          method: "native_share"
        }
      );

      return {
        success: true,
        method: "native_share"
      };
    }

    // Clipboard fallback
    if (
      window.isSecureContext &&
      navigator.clipboard
    ) {
      await navigator.clipboard.writeText(
        fullText
      );

      return {
        success: true,
        method: "clipboard"
      };
    }

    /*
      Local-IP HTTP fallback.

      This lets us test the feature on a real
      phone before deploying.
    */
    const whatsappUrl =
      "https://wa.me/?text=" +
      encodeURIComponent(fullText);

    window.location.href =
      whatsappUrl;

    return {
      success: true,
      method: "whatsapp"
    };

  } catch (error) {
    if (error?.name === "AbortError") {
      return {
        success: false,
        cancelled: true
      };
    }

    console.error(
      "Could not share result:",
      error
    );

    return {
      success: false,
      error
    };
  }
}


function buildShareText({
  solveTimeSeconds,
  streak,
  rank
}) {
  const time = formatTime(
    solveTimeSeconds
  );

  const lines = [
    "🧩 Sudoku Daily Play",
    "",
    "Today's Challenge ✅",
    `⏱️ ${time}`,
    `🔥 ${streak} day${streak === 1 ? "" : "s"} streak`
  ];

  if (rank) {
    lines.push(`🏆 Rank #${rank}`);
  }

  lines.push(
    "",
    "Can you beat my time?"
  );

  return lines.join("\n");
}


function formatTime(seconds) {
  const safeSeconds =
    Math.max(0, Number(seconds) || 0);

  const minutes =
    Math.floor(safeSeconds / 60);

  const remainingSeconds =
    safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}
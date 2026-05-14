import { renderStatsIntoHome } from "./stats.js";

let activeTab = null;
let homePanelsInitialized = false;

export function initHomePanels() {
  if (homePanelsInitialized) return;
  homePanelsInitialized = true;

  const tabStats = document.getElementById("tab-stats");
  const tabLeaderboard = document.getElementById("tab-leaderboard");
  const tabNotifications = document.getElementById("tab-notifications");
  const panel = document.getElementById("home-panel-area");

  function clearPanel(title = "") {
    const panel = document.getElementById("home-panel-area");
    if (!panel) return;

    panel.innerHTML = title
      ? `<div style="padding:12px 16px;"><h3 style="margin:0;">${title}</h3></div>`
      : "";

    panel.style.display = title ? "block" : "none";
  }

  tabStats?.addEventListener("click", () => {
  
  if (activeTab === "stats") {
    clearPanel();
    activeTab = null;
    return;
  }
  
  clearPanel();
  document.getElementById("home-panel-area").style.display = "block";
  renderStatsIntoHome();
  activeTab = "stats";

});


  tabLeaderboard?.addEventListener("click", () => {
  if (activeTab === "leaderboard") {
    clearPanel();
    activeTab = null;
    return;
  }

  clearPanel("Leaderboard (coming soon)");
  activeTab = "leaderboard";
});

tabNotifications?.addEventListener("click", () => {
  if (activeTab === "notifications") {
    clearPanel();
    activeTab = null;
    return;
  }

  clearPanel("Notifications (coming soon)");
  activeTab = "notifications";
});

}

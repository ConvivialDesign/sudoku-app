export function initNavigation() {
  const screenHome = document.getElementById("screen-home");
  const screenGame = document.getElementById("screen-game");

  const menuBtn = document.getElementById("menu-btn");
  const homeBtn = document.getElementById("home-btn");

  const sidePane = document.getElementById("side-pane");
  const sideOverlay = document.getElementById("side-overlay");
  const closePaneBtn = document.getElementById("close-pane");

  const btnJustPlay = document.getElementById("mode-justplay");
  const btnSmartPlay = document.getElementById("mode-smartplay");
  const btnDaily = document.getElementById("mode-daily");

  function openPane() {
    sidePane?.classList.remove("hidden");
    sideOverlay?.classList.remove("hidden");
  }
  
  function closePane() {
    sidePane?.classList.add("hidden");
    sideOverlay?.classList.add("hidden");
  }

  function showScreen(which) {
    const showHome = which === "home";
    screenHome?.classList.toggle("hidden", !showHome);
    screenGame?.classList.toggle("hidden", showHome);
    homeBtn?.classList.toggle("hidden", showHome);
    closePane();
  }

  menuBtn?.addEventListener("click", openPane);
  closePaneBtn?.addEventListener("click", closePane);
  sideOverlay?.addEventListener("click", closePane);

  homeBtn?.addEventListener("click", () => showScreen("home"));

  btnJustPlay?.addEventListener("click", () => showScreen("game"));
  btnSmartPlay?.addEventListener("click", () => showScreen("game"));
  btnDaily?.addEventListener("click", () => showScreen("game"));

  return { showScreen, openPane, closePane };
}

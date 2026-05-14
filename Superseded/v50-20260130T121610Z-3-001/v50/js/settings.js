const SETTINGS_KEY = "sudoku_settings_v1";

export function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
  catch { return {}; }
}

export function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme || "light");
}

export function initSettingsUI() {
  const navSettings = document.getElementById("nav-settings");
  const sideContent = document.getElementById("side-content");

  const settings = loadSettings();
  applyTheme(settings.theme || "light");

  navSettings?.addEventListener("click", () => {
    if (!sideContent) return;
    const isDark = (settings.theme || "light") === "dark";

    sideContent.innerHTML = `
      <div class="settings">
        <h3 style="margin:8px 0 12px;">Settings</h3>
        <label class="setting-row">
          <span>Dark mode</span>
          <input id="toggle-dark" type="checkbox" ${isDark ? "checked" : ""}/>
        </label>
      </div>
    `;

    document.getElementById("toggle-dark")?.addEventListener("change", (e) => {
      settings.theme = e.target.checked ? "dark" : "light";
      saveSettings(settings);
      applyTheme(settings.theme);
    });
  });
}


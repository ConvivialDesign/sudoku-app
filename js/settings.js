import { loadSettings, saveSettings } from "./storage.js";

const DEFAULT_SETTINGS = {
  theme: "light",
};

// module-level state so all imports share the same settings
let settings = { ...DEFAULT_SETTINGS, ...(loadSettings() || {}) };

export function getSettings() {
  return settings;
}

export function setSettings(patch) {
  settings = { ...settings, ...patch };
  saveSettings(settings);
  applyTheme(settings.theme);
  return settings;
}

export function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme || "light");
}

export function initSettingsUI() {
  const navSettings = document.getElementById("nav-settings");
  const sideContent = document.getElementById("side-content");

  // apply on load
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

    const toggle = document.getElementById("toggle-dark");
    toggle?.addEventListener("change", (e) => {
      const checked = e.target.checked;
      setSettings({ theme: checked ? "dark" : "light" });
    });
  });
}

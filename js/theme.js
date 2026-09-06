/* ===========================================================
   theme.js
   Light / Dark / Blue / Pink. Values live in css/style.css
   under :root and :root[data-theme="..."] — this file only
   ever toggles the data-theme attribute and persists the
   choice. Add a new theme later by adding a CSS block plus
   one entry in THEMES — no other code changes needed.
   =========================================================== */

const Theme = (() => {
  const THEMES = ['light', 'dark', 'blue', 'pink'];

  function getTheme() {
    const settings = Storage.getSettings();
    return THEMES.includes(settings.appearance.theme) ? settings.appearance.theme : 'light';
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', THEMES.includes(theme) ? theme : 'light');
  }

  function setTheme(theme) {
    const normalized = THEMES.includes(theme) ? theme : 'light';
    Storage.updateSettings({ appearance: { theme: normalized } });
    apply(normalized);
    updateToggleButtons(normalized);
  }

  function toggle() {
    const current = getTheme();
    const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
    setTheme(next);
  }

  function updateToggleButtons(theme) {
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.setAttribute('aria-pressed', theme !== 'light' ? 'true' : 'false');
      btn.setAttribute('aria-label', 'Theme: ' + theme);
      btn.title = theme.charAt(0).toUpperCase() + theme.slice(1);
    });
  }

  function init() {
    apply(getTheme());
    updateToggleButtons(getTheme());
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.addEventListener('click', toggle);
    });
  }

  return { THEMES, getTheme, setTheme, toggle, init };
})();

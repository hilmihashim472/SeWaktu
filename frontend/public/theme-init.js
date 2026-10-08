// Runs before first paint so the page doesn't flash the wrong theme. Kept as
// an external file (not inline) so the Content-Security-Policy can block
// inline scripts.
(function () {
  var theme = null;
  try {
    theme = localStorage.getItem("sewaktu.theme");
  } catch (e) {}
  var isDark =
    theme === "dark" ||
    (theme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
})();

// DEFAULT THEME
const theme = localStorage.getItem("theme");
document.documentElement.classList.toggle("dark", theme === "dark");

document.addEventListener("DOMContentLoaded", () => {
  // THEME TOGGLE
  const themeToggle = document.getElementById("theme-toggle");
  themeToggle?.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem(
      "theme",
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  });
  // END THEME TOGGLE
});

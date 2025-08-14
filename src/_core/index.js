// THEME TOGGLE
const themeToggle = document.getElementById("theme-toggle");

const theme = localStorage.getItem("theme");
if (theme === "dark") {
  document.documentElement.classList.toggle("dark", true);
} else {
  document.documentElement.classList.toggle("dark", false);
}

themeToggle?.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );
});

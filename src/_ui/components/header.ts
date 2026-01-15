const themes = {
  light: {
    "--color-primary": "var(--color-neutral-950)",
    "--color-primary-contrast": "var(--color-neutral-50)",
    "--color-primary-hover": "var(--color-neutral-700)",
    "--color-accent": "var(--color-neutral-300)",
    "--color-accent-contrast": "var(--color-neutral-950)",
    "--color-accent-hover": "var(--color-neutral-400)",
    "--color-border": "var(--color-neutral-300)",
    "--color-background": "var(--color-neutral-50)",
    "--color-foreground": "var(--color-neutral-100)",
    "--color-text": "var(--color-neutral-950)",
    "--color-text-secondary": "var(--color-neutral-700)",
  },
  dark: {
    "--color-primary": "var(--color-neutral-50)",
    "--color-primary-contrast": "var(--color-neutral-950)",
    "--color-primary-hover": "var(--color-neutral-300)",
    "--color-accent": "var(--color-neutral-300)",
    "--color-accent-contrast": "var(--color-neutral-950)",
    "--color-accent-hover": "var(--color-neutral-400)",
    "--color-border": "var(--color-neutral-600)",
    "--color-background": "var(--color-neutral-900)",
    "--color-foreground": "var(--color-neutral-800)",
    "--color-text": "var(--color-neutral-50)",
    "--color-text-secondary": "var(--color-neutral-200)",
  },
};

const setTheme = (theme: "dark" | "light") => {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("theme", theme);

  const t = themes[theme];

  (Object.keys(t) as Array<keyof typeof t>).forEach((k) => {
    document.documentElement.style.setProperty(k, t[k]);
  });
};

export class Header extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute("title") || "GameHub";
    const backBtn = this.hasAttribute("backBtn");

    const theme =
      (localStorage.getItem("theme") as "dark" | "light") ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");

    setTheme(theme);

    this.innerHTML = `
      <header
        class="flex w-full justify-center p-4 border-b-2 border-border"
      >
        <div class="flex max-w-7xl w-full justify-between">
          <h2 class="font-contrast">${backBtn ? `<a href="/" class="mr-6"><</a>` : ""}${title}</h2>
          <button id="theme-toggle" class="flex items-center">
            <img
              class="dark:hidden size-6 object-contain text-text"
              src="/assets/icons/sun.webp"
              alt="Sun icon"
            >
            <img
              class="hidden dark:flex size-6 object-contain text-text"
              src="/assets/icons/moon.webp"
              alt="Moon icon"
            >
          </button>
        </div>
      </header>
    `;

    document.getElementById("theme-toggle")?.addEventListener("click", () => {
      if (document.documentElement.classList.contains("dark"))
        return setTheme("light");
      setTheme("dark");
    });
  }
}

customElements.define("gh-header", Header);

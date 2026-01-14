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
            <div class="flex dark:hidden size-6 object-contain text-text">
              <svg fill="currentColor" viewBox="0 0 800 800">
                <path fill-rule="evenodd" d="m400 600.1c-110.6 0-200-89.4-200-200 0-110.6 89.4-200 200-200 110.6 0 200.1 89.4 200.1 200 0 110.6-89.5 200-200.1 200z"/>
                <path fill-rule="evenodd" d="m150 400c0-27.7-22.4-50-50-50h-50c-27.6 0-50 22.3-50 50 0 27.6 22.4 50 50 50h50c27.6 0 50-22.4 50-50z"/>
                <path fill-rule="evenodd" d="m152.6 576.7l-35.4 35.4c-19.6 19.6-19.6 51.2 0 70.7 19.5 19.6 51.1 19.6 70.7 0l35.4-35.4c19.5-19.5 19.5-51.1 0-70.7-19.6-19.5-51.2-19.5-70.7 0z"/>
                <path fill-rule="evenodd" d="m400 650c-27.6 0-50 22.4-50 50v50c0 27.6 22.4 50 50 50 27.7 0 50-22.4 50-50v-50c0-27.7-22.4-50-50-50z"/>
                <path fill-rule="evenodd" d="m647.5 576.8c-19.5-19.6-51.2-19.6-70.7-0.1-19.5 19.6-19.5 51.2 0 70.8l35.4 35.3c19.5 19.6 51.2 19.5 70.7 0 19.5-19.5 19.6-51.1 0-70.7z"/>
                <path fill-rule="evenodd" d="m750.1 350l-50.1 0.1c-27.6-0.1-49.9 22.2-49.9 49.9-0.1 27.6 22.3 50 49.9 50h50c27.7 0.1 50-22.4 50-50 0-27.6-22.3-50-49.9-50z"/>
                <path fill-rule="evenodd" d="m647.5 223.2l35.3-35.3c19.7-19.6 19.6-51.2 0-70.7-19.5-19.6-51.1-19.6-70.6-0.1l-35.4 35.5c-19.5 19.4-19.5 51 0 70.6 19.4 19.6 51.2 19.5 70.7 0z"/>
                <path fill-rule="evenodd" d="m400 149.9c27.6 0.2 50-22.3 50-49.9v-50c0-27.7-22.3-50-50-50-27.6-0.1-50 22.3-50 49.9l0.1 50.1c-0.1 27.6 22.3 49.9 49.9 49.9z"/>
                <path fill-rule="evenodd" d="m152.7 223.2c19.4 19.5 50.9 19.5 70.5-0.1 19.7-19.3 19.6-51.1 0.1-70.6l-35.3-35.3c-19.7-19.7-51.2-19.5-70.8 0-19.6 19.5-19.6 51.1-0.1 70.6z"/>
              </svg>
            </div>
            <div class="hidden dark:flex size-6 object-contain text-text">
              <svg fill="currentColor" viewBox="0 0 800 800">
                <path d="m717.6 531c-5.3-9-20.3-23-57.6-16.4-20.7 3.7-41.7 5.4-62.7 4.4-77.7-3.4-148-39-197-94-43.3-48.4-70-111.4-70.3-179.4 0-38 7.3-74.6 22.3-109.3 14.7-33.7 4.3-51.3-3-58.7-7.7-7.6-25.7-18.3-61-3.6-136.3 57.3-220.7 194-210.7 340.3 10 137.7 106.7 255.3 234.7 299.7 30.7 10.6 63 17 96.3 18.3 5.4 0.3 10.7 0.7 16 0.7 111.7 0 216.4-52.7 282.4-142.4 22.3-31 16.3-50.6 10.6-59.6z"/>
              </svg>
            </div>
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

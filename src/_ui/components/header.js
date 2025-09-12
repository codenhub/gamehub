export class Header extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute("title") || "GameHub";
    this.outerHTML = `
      <header
        class="flex w-full justify-center p-4 border-b-2 border-neutral-300 dark:border-neutral-700"
      >
        <div class="flex max-w-7xl w-full justify-between">
          <div class="flex items-center">
            <a href="/">
              <svg viewBox="0 0 800 800" class="size-12" fill="currentColor">
                <path d="m796.9 484.1l-0.1-0.5-0.1-0.5-41.5-176.1-0.1-0.7-0.2-0.6c-26-97.3-114.5-165.1-215.2-165.1h-279.4c-100.7 0-189.2 67.8-215.2 165.1l-0.2 0.6-0.1 0.7-41.4 176.1-0.2 0.5-0.1 0.5c-15.2 72.6 26.5 144.5 97 167.5l2.4 0.7c14.5 4.8 29.6 7.1 44.8 7.1 51 0 98.6-27.1 124.6-71l35.2-52.1 0.9-1.3 0.8-1.4c1.2-2.2 3.6-3.5 6-3.5h170.4c2.5 0 4.8 1.3 6 3.5l0.8 1.4 0.9 1.3 35.2 52.1c26 43.9 73.6 71 124.7 71 15.2 0 30.2-2.3 44.8-7.1l2.4-0.7c70.4-23 112.1-94.9 96.9-167.5zm-110.5 125.9l-2.4 0.8c-10.3 3.3-20.8 5-31.2 5-35.4 0-69.2-18.7-87.7-50.7l-36-53.3c-9.1-15.7-25.8-25.4-43.9-25.4h-170.4c-18.1 0-34.8 9.7-43.9 25.4l-36 53.3c-18.5 32-52.3 50.7-87.6 50.7-10.4 0-21-1.7-31.3-5l-2.4-0.8c-49.1-16-78.3-66.4-67.7-116.9l41.4-176.1c21-78.3 91.9-132.8 173-132.8h279.4c81.1 0 152 54.5 173 132.8l41.4 176.1c10.6 50.5-18.6 100.9-67.7 116.9z"/>
                <path fill-rule="evenodd" d="m246 268.8h-52.4v60.2h-60.2v52.4h60.2v60.2h52.4v-60.2h60.2v-52.4h-60.2z"/>
                <path d="m571.4 322.3c18.3 0 33-14.8 33-33 0-18.2-14.7-33-33-33-18.2 0-32.9 14.8-32.9 33 0 18.2 14.7 33 32.9 33z"/>
                <path d="m505.5 322.3c-18.2 0-33 14.7-33 32.9 0 18.3 14.8 33 33 33 18.2 0 33-14.7 33-33 0-18.2-14.8-32.9-33-32.9z"/>
                <path d="m571.4 388.2c-18.2 0-32.9 14.8-32.9 33 0 18.2 14.7 33 32.9 33 18.3 0 33-14.8 33-33 0-18.2-14.7-33-33-33z"/>
                <path d="m637.4 322.3c-18.2 0-33 14.7-33 32.9 0 18.3 14.8 33 33 33 18.2 0 33-14.7 33-33 0-18.2-14.8-32.9-33-32.9z"/>
              </svg>
            </a>
            <h2 class="pl-4 ml-4 border-l-2 border-neutral-800 dark:border-neutral-100">${title}</h2>
          </div>
          <button id="theme-toggle" class="flex items-center">
            <img
              class="hidden dark:flex w-6 h-6 object-contain invert"
              src="/assets/icons/sun.svg"
              alt="Sun"
            />
            <img
              class="flex dark:hidden w-6 h-6 object-contain"
              src="/assets/icons/moon.svg"
              alt="Moon"
            />
          </button>
        </div>
      </header>
    `;
  }
}

customElements.define("gamehub-header", Header);

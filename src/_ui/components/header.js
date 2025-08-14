export class Header extends HTMLElement {
  connectedCallback() {
    this.outerHTML = `
      <header
        class="flex w-full justify-center p-4 border-b-2 border-neutral-300 dark:border-neutral-700"
      >
        <div class="flex max-w-7xl w-full justify-between">
          <h2>GameHub</h2>
          <button id="theme-toggle" class="flex items-center">
            <img
              class="hidden dark:flex w-6 h-6 object-contain invert"
              src="/assets/sun.svg"
              alt="Sun"
            />
            <img
              class="flex dark:hidden w-6 h-6 object-contain"
              src="/assets/moon.svg"
              alt="Moon"
            />
          </button>
        </div>
      </header>
    `;
  }
}

customElements.define("gamehub-header", Header);

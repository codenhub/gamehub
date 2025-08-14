export class Watermark extends HTMLElement {
  connectedCallback() {
    this.outerHTML = `
      <a
        href="https://coden.agency/"
        target="_blank"
        class="fixed bottom-4 right-4 p-2 flex items-center gap-2 bg-neutral-950 text-neutral-50 rounded-md text-xs font-semibold"
      >
        <p class="text-neutral-50">Built by</p>
        <img src="/logotipo.svg" alt="Coden logo" class="h-5" />
      </a>
    `;
  }
}

customElements.define("gamehub-watermark", Watermark);

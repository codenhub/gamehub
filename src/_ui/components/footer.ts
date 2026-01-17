class Footer extends HTMLElement {
  connectedCallback() {
    this.style.marginTop = "auto";
    this.innerHTML = `
      <footer class="flex w-full justify-center bg-foreground mt-auto border-t-4 border-border">
        <div class="flex flex-col gap-4 max-w-7xl w-full py-6 mx-4">
          <div class="flex items-center justify-between">
            <p>© ${new Date().getFullYear()} Fisk. Todos os direitos reservados.</p>
            <p class="flex gap-1 items-center">Feito com <img src="/assets/icons/heart.webp" alt="Heart icon" class="size-6"> por <a href="https://coden.agency/">Coden</a></p>
          </div>
        </div>
      </footer>
    `;
  }
}

customElements.define("gh-footer", Footer);

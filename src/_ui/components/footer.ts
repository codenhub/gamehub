class Footer extends HTMLElement {
  connectedCallback() {
    this.style.marginTop = "auto";
    this.innerHTML = `
      <footer class="flex w-full justify-center bg-foreground mt-auto border-t-4 border-border">
        <div class="flex max-sm:flex-col items-center justify-between gap-4 max-w-7xl w-full py-6 mx-4">
          <p>© ${new Date().getFullYear()} GameHub. All rights reserved.</p>
          <p class="flex gap-1 items-center">Made with <img src="/assets/icons/heart.webp" alt="Heart icon" class="size-6"> by <a href="https://coden.agency/"><img src="https://coden.agency/logo.svg" alt="Coden Agency logo" class="h-5 not-dark:brightness-0"></a></p>
        </div>
      </footer>
    `;
  }
}

customElements.define("gh-footer", Footer);

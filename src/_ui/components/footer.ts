import I18n from "../scripts/i18n";

const FOOTER_RIGHTS_RESERVED_TOKEN = "footer.rightsReserved=© {{year}} GameHub. All rights reserved.";
const FOOTER_MADE_WITH_TOKEN = "footer.madeWith=Made with";
const FOOTER_BY_TOKEN = "footer.by=by";

/**
 * Custom element for the application footer.
 * Displays copyright information and credits.
 */
class Footer extends HTMLElement {
  private unsubscribeLocaleChange: (() => void) | null = null;
  private rightsReservedEl: HTMLParagraphElement | null = null;
  private madeWithEl: HTMLSpanElement | null = null;
  private byEl: HTMLSpanElement | null = null;

  connectedCallback() {
    this.unsubscribeLocaleChange?.();
    this.unsubscribeLocaleChange = null;

    this.style.marginTop = "auto";
    this.innerHTML = `
      <footer class="flex w-full justify-center bg-foreground mt-auto border-t-4 border-border">
        <div class="flex max-sm:flex-col items-center justify-between gap-4 max-w-7xl w-full py-6 mx-4">
          <p id="footer-rights-reserved"></p>
          <p class="flex gap-1 items-center">
            <span id="footer-made-with"></span> 
            <img src="/assets/icons/heart.webp" alt="Heart icon" class="size-6"> 
            <span id="footer-by"></span> 
            <a href="https://coden.agency/"><img src="https://coden.agency/logo.svg" alt="Coden Agency logo" class="h-5 logo-img"></a>
          </p>
        </div>
      </footer>
    `;

    this.rightsReservedEl = this.querySelector("#footer-rights-reserved") as HTMLParagraphElement | null;
    this.madeWithEl = this.querySelector("#footer-made-with") as HTMLSpanElement | null;
    this.byEl = this.querySelector("#footer-by") as HTMLSpanElement | null;

    this.updateTranslations();
    this.unsubscribeLocaleChange = I18n.onLocaleChange(() => {
      this.updateTranslations();
    });
  }

  disconnectedCallback() {
    this.unsubscribeLocaleChange?.();
    this.unsubscribeLocaleChange = null;
    this.rightsReservedEl = null;
    this.madeWithEl = null;
    this.byEl = null;
  }

  private updateTranslations() {
    if (this.rightsReservedEl) {
      this.rightsReservedEl.textContent = I18n.resolve(FOOTER_RIGHTS_RESERVED_TOKEN);
    }

    if (this.madeWithEl) {
      this.madeWithEl.textContent = I18n.resolve(FOOTER_MADE_WITH_TOKEN);
    }

    if (this.byEl) {
      this.byEl.textContent = I18n.resolve(FOOTER_BY_TOKEN);
    }
  }
}

customElements.define("gh-footer", Footer);

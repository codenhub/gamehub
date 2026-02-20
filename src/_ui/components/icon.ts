class Icon extends HTMLElement {
  private div: HTMLDivElement | null = null;

  private handleThemeChange = () => {
    if (!this.div) return;
    const color = this.getAttribute("color");
    const parentColor = this.parentElement
      ? window.getComputedStyle(this.parentElement).color
      : "currentColor";
    this.div.style.backgroundColor = color || parentColor;
  };

  connectedCallback() {
    const src = this.getAttribute("src");
    const color = this.getAttribute("color");
    const width = this.getAttribute("width");
    const height = this.getAttribute("height");

    const div = document.createElement("div");
    this.div = div;
    div.classList.add(...this.classList);

    const parentColor = this.parentElement
      ? window.getComputedStyle(this.parentElement).color
      : "currentColor";

    div.style.backgroundColor = color || parentColor;
    div.style.display = "inline-block";

    if (src) {
      const maskUrl = `url("${src}")`;
      div.style.maskImage = maskUrl;
      div.style.webkitMaskImage = maskUrl;
      div.style.maskSize = "contain";
      div.style.webkitMaskSize = "contain";
      div.style.maskRepeat = "no-repeat";
      div.style.webkitMaskRepeat = "no-repeat";
      div.style.maskPosition = "center";
      div.style.webkitMaskPosition = "center";
    }

    if (!width && !height) {
      div.style.width = "1rem";
      div.style.height = "1rem";
    } else {
      if (width) div.style.width = width;
      if (height) div.style.height = height;
      if (!width || !height) {
        div.style.aspectRatio = "1 / 1";
      }
    }

    this.style.display = "inline-flex";
    this.style.alignItems = "center";
    this.style.justifyContent = "center";
    this.replaceChildren(div);

    window.addEventListener("theme-changed", this.handleThemeChange);
  }

  disconnectedCallback() {
    window.removeEventListener("theme-changed", this.handleThemeChange);
  }
}

customElements.define("gh-icon", Icon);

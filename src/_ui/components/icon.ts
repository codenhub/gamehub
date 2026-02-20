class Icon extends HTMLElement {
  connectedCallback() {
    const src = this.getAttribute("src");
    const color = this.getAttribute("color");
    const width = this.getAttribute("width");
    const height = this.getAttribute("height");

    const div = document.createElement("div");
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
  }
}

customElements.define("gh-icon", Icon);

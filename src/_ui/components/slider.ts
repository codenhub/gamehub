const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const snapToStep = (value: number, step: number): number =>
  Math.round(value / step) * step;

export class Slider extends HTMLElement {
  private fillEl!: HTMLElement;
  private thumbEl!: HTMLElement;
  private isDragging = false;
  private currentValue = 50;
  private min = 0;
  private max = 100;
  private step = 1;

  static get observedAttributes(): string[] {
    return ["value", "min", "max", "step"];
  }

  get value(): string {
    return this.currentValue.toString();
  }

  set value(val: string) {
    this.currentValue = snapToStep(
      clamp(Number(val), this.min, this.max),
      this.step,
    );
    this.updateVisuals();
  }

  get valueAsNumber(): number {
    return this.currentValue;
  }

  connectedCallback(): void {
    this.min = Number(this.getAttribute("min") ?? 0);
    this.max = Number(this.getAttribute("max") ?? 100);
    this.step = Number(this.getAttribute("step") ?? 1);
    this.currentValue = clamp(
      Number(this.getAttribute("value") ?? 50),
      this.min,
      this.max,
    );

    this.classList.add(
      "relative",
      "block",
      "w-full",
      "h-4",
      "cur-pointer",
      "select-none",
      "touch-none",
    );
    this.setAttribute("role", "slider");
    this.setAttribute("tabindex", "0");

    this.innerHTML = `
      <div class="absolute top-1/2 inset-x-0 h-2 -translate-y-1/2 bg-border pixel-corner-2"></div>
      <div class="absolute top-1/2 left-0 h-2 -translate-y-1/2 bg-primary pixel-corner-2" data-fill></div>
      <div class="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 bg-primary pixel-corner-lg-2" data-thumb></div>
    `;

    this.fillEl = this.querySelector("[data-fill]")!;
    this.thumbEl = this.querySelector("[data-thumb]")!;

    this.updateVisuals();
    this.bindEvents();
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (oldValue === newValue || !this.fillEl) return;

    switch (name) {
      case "value":
        this.currentValue = clamp(Number(newValue ?? 50), this.min, this.max);
        break;
      case "min":
        this.min = Number(newValue ?? 0);
        break;
      case "max":
        this.max = Number(newValue ?? 100);
        break;
      case "step":
        this.step = Number(newValue ?? 1);
        break;
    }
    this.updateVisuals();
  }

  private updateVisuals(): void {
    if (!this.fillEl || !this.thumbEl) return;
    const pct = ((this.currentValue - this.min) / (this.max - this.min)) * 100;
    this.fillEl.style.width = `${pct}%`;
    this.thumbEl.style.left = `${pct}%`;
    this.setAttribute("aria-valuenow", this.currentValue.toString());
  }

  private updateValueFromPointer(clientX: number): void {
    const rect = this.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    const rawValue = this.min + ratio * (this.max - this.min);
    this.currentValue = snapToStep(rawValue, this.step);
    this.updateVisuals();
    this.dispatchEvent(new Event("input", { bubbles: true }));
  }

  private handlePointerDown = (event: PointerEvent): void => {
    event.preventDefault();
    this.isDragging = true;
    this.setPointerCapture(event.pointerId);
    this.updateValueFromPointer(event.clientX);
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (!this.isDragging) return;
    this.updateValueFromPointer(event.clientX);
  };

  private handlePointerUp = (event: PointerEvent): void => {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.releasePointerCapture(event.pointerId);
    this.dispatchEvent(new Event("change", { bubbles: true }));
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    const stepSize = event.shiftKey ? this.step * 10 : this.step;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        event.preventDefault();
        this.currentValue = clamp(
          this.currentValue + stepSize,
          this.min,
          this.max,
        );
        break;
      case "ArrowLeft":
      case "ArrowDown":
        event.preventDefault();
        this.currentValue = clamp(
          this.currentValue - stepSize,
          this.min,
          this.max,
        );
        break;
      case "Home":
        event.preventDefault();
        this.currentValue = this.min;
        break;
      case "End":
        event.preventDefault();
        this.currentValue = this.max;
        break;
      default:
        return;
    }

    this.updateVisuals();
    this.dispatchEvent(new Event("input", { bubbles: true }));
    this.dispatchEvent(new Event("change", { bubbles: true }));
  };

  private bindEvents(): void {
    this.addEventListener("pointerdown", this.handlePointerDown);
    this.addEventListener("pointermove", this.handlePointerMove);
    this.addEventListener("pointerup", this.handlePointerUp);
    this.addEventListener("pointercancel", this.handlePointerUp);
    this.addEventListener("keydown", this.handleKeyDown);
    this.addEventListener("click", (e) => e.preventDefault());
  }
}

customElements.define("gh-slider", Slider);

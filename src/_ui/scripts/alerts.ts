import { gsap } from "gsap";

type AlertType = "success" | "error" | "warning" | "info";

interface AlertOptions {
  message: string;
  type: AlertType;
  duration?: number;
}

function getOrCreateContainer(): HTMLDivElement {
  let container = document.getElementById("global-alert-container") as HTMLDivElement | null;
  if (!container) {
    container = document.createElement("div");
    container.id = "global-alert-container";
    container.className = "fixed top-4 right-4 z-50 flex flex-col-reverse gap-2 pointer-events-none";

    const target = document.body ?? document.documentElement;
    target.appendChild(container);
  }
  return container;
}

function createAlertElement(options: AlertOptions): HTMLDivElement {
  const { type } = options;
  const container = document.createElement("div");
  const div = document.createElement("div");

  container.classList = `bg-${type} p-1 pixel-corner-lg-4`;
  div.classList = `bg-${type}-light text-${type}-dark px-4 py-2 pixel-corner-lg-4 text-xl font-medium font-default pointer-events-auto min-w-40`;

  div.textContent = options.message;
  container.appendChild(div);

  return container;
}

function removeAlert(alertElement: HTMLDivElement) {
  const container = getOrCreateContainer();
  if (!container.contains(alertElement)) return;

  gsap.to(alertElement, {
    xPercent: 100,
    opacity: 0,
    duration: 0.4,
    ease: "power1.inOut",
  });
  setTimeout(() => {
    if (container.contains(alertElement)) {
      container.removeChild(alertElement);
    }
  }, 400);
}

export function showAlert(options: AlertOptions) {
  const container = getOrCreateContainer();
  const alertElement = createAlertElement(options);

  if (container.children.length >= 5) {
    if (container.firstElementChild) {
      removeAlert(container.firstElementChild as HTMLDivElement);
    }
  }

  container.appendChild(alertElement);

  gsap.from(alertElement, {
    xPercent: 100,
    opacity: 0,
    duration: 0.4,
    ease: "power1.inOut",
  });

  setTimeout(() => {
    removeAlert(alertElement);
  }, options.duration || 4000);
}

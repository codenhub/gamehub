import { gsap } from "gsap";

type AlertType = "success" | "error" | "warning" | "info";

interface AlertOptions {
  message: string;
  type: AlertType;
  duration?: number;
}

const alertColors = {
  success: "bg-success text-success-contrast",
  error: "bg-error text-error-contrast",
  warning: "bg-warning text-warning-contrast",
  info: "bg-info text-info-contrast",
};

function getOrCreateContainer(): HTMLDivElement {
  let container = document.getElementById(
    "global-alert-container",
  ) as HTMLDivElement;
  if (!container) {
    container = document.createElement("div");
    container.id = "global-alert-container";
    container.className =
      "fixed top-4 right-4 z-50 flex flex-col-reverse gap-2 pointer-events-none";
    document.body.appendChild(container);
  }
  return container;
}

function createAlertElement(options: AlertOptions): HTMLDivElement {
  const div = document.createElement("div");

  let classes =
    "px-4 py-2 pixel-corner-lg-4 shadow-lg text-lg font-medium font-default pointer-events-auto min-w-40 ";

  classes += alertColors[options.type];

  div.className = classes;
  div.textContent = options.message;

  return div;
}

function removeAlert(alertElement: HTMLDivElement) {
  const container = getOrCreateContainer();
  if (container.contains(alertElement)) {
    gsap.to(alertElement, {
      xPercent: 100,
      opacity: 0,
      duration: 0.4,
      ease: "power1.inOut",
    });
    setTimeout(() => {
      container.removeChild(alertElement);
    }, 400);
  }
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

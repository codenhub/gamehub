import type { AlertOptions } from "./index";
import {
  ALERT_COLORS,
  ALERT_CONTAINER_COLORS,
  ALERT_ICONS,
  CLOSE_ICON_SRC,
  DEFAULT_TYPE,
  INNER_BASE_CLASSES,
} from "./constants";

function createIconElement(src: string): HTMLImageElement {
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  img.className = "w-5 h-5 shrink-0";
  img.draggable = false;
  return img;
}

function createDismissButton(onDismiss: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ml-auto inline-flex items-center justify-center cur-pointer shrink-0";

  const icon = document.createElement("gh-icon") as HTMLElement;
  icon.setAttribute("src", CLOSE_ICON_SRC);
  icon.setAttribute("width", "0.75rem");
  icon.setAttribute("height", "0.75rem");
  button.appendChild(icon);

  button.setAttribute("aria-label", "Dismiss alert");
  button.addEventListener("click", onDismiss);
  return button;
}

export function createAlertElement(options: AlertOptions, onDismiss: () => void): HTMLDivElement {
  const type = options.type ?? DEFAULT_TYPE;

  const container = document.createElement("div");
  container.className = `${ALERT_CONTAINER_COLORS[type]} p-1 pixel-corner-lg-4`;

  const inner = document.createElement("div");
  inner.className = `${ALERT_COLORS[type]} ${INNER_BASE_CLASSES}`;
  inner.setAttribute("role", "alert");
  inner.setAttribute("aria-atomic", "true");

  if (options.hasIcon) {
    inner.appendChild(createIconElement(ALERT_ICONS[type]));
  }

  const messageSpan = document.createElement("span");
  messageSpan.textContent = options.message;
  inner.appendChild(messageSpan);

  if (options.isDismissable) {
    inner.appendChild(createDismissButton(onDismiss));
  }

  container.appendChild(inner);

  return container;
}

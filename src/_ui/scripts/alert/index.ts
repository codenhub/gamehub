import { ALERT_ICONS, CLOSE_ICON_SRC, DEFAULT_DURATION, MAX_ALERTS } from "./constants";
import { getOrCreateContainer } from "./container";
import { createAlertElement } from "./element";
import { animateIn, animateOut } from "./animations";

type AlertType = "success" | "error" | "warning" | "info";
interface AlertOptions {
  message: string;
  type?: AlertType;
  duration?: number;
  isDismissable?: boolean;
  /** Only takes effect when `isDismissable` is true. Defaults to true. */
  autoDismiss?: boolean;
  hasIcon?: boolean;
}

// Tracks elements mid-dismiss to prevent double-animation (e.g. overflow
// removal racing with an in-flight dismiss animation).
const dismissing = new WeakSet<HTMLDivElement>();

function preloadIcons(): void {
  if (typeof window === "undefined") return;

  const loadImages = () => {
    Object.values(ALERT_ICONS).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    const closeImg = new Image();
    closeImg.src = CLOSE_ICON_SRC;
  };

  const win = window as unknown as { requestIdleCallback?: (cb: () => void) => void };
  if (win.requestIdleCallback) {
    win.requestIdleCallback(loadImages);
  } else {
    setTimeout(loadImages, 2000);
  }
}

preloadIcons();

function removeAlert(alertElement: HTMLDivElement): void {
  const container = getOrCreateContainer();

  if (!container.contains(alertElement) || dismissing.has(alertElement)) return;

  dismissing.add(alertElement);

  animateOut(alertElement, () => {
    if (container.contains(alertElement)) {
      container.removeChild(alertElement);
    }
  });
}

export function showAlert(options: AlertOptions): void {
  const container = getOrCreateContainer();

  if (container.children.length >= MAX_ALERTS) {
    if (container.firstElementChild) {
      removeAlert(container.firstElementChild as HTMLDivElement);
    }
  }

  const alertElement = createAlertElement(options, () => removeAlert(alertElement));

  container.appendChild(alertElement);
  animateIn(alertElement);

  // Non-dismissable alerts always auto-dismiss. Dismissable alerts respect
  // the `autoDismiss` flag, which defaults to true.
  const shouldAutoDismiss = !options.isDismissable || (options.autoDismiss ?? true);

  if (shouldAutoDismiss) {
    const duration = options.duration ?? DEFAULT_DURATION;
    setTimeout(() => removeAlert(alertElement), duration);
  }
}

export type { AlertType, AlertOptions };
export { DEFAULT_TYPE, DEFAULT_DURATION, MAX_ALERTS } from "./constants";

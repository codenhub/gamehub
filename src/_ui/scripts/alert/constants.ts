import type { AlertType } from "./index";

export const MAX_ALERTS = 5;
export const DEFAULT_DURATION = 4000;
export const DEFAULT_TYPE: AlertType = "success";

export const ALERT_CONTAINER_COLORS: Record<AlertType, string> = {
  success: "bg-success",
  error: "bg-error",
  warning: "bg-warning",
  info: "bg-info",
};

export const ALERT_COLORS: Record<AlertType, string> = {
  success: "bg-success-light text-success-dark",
  error: "bg-error-light text-error-dark",
  warning: "bg-warning-light text-warning-dark",
  info: "bg-info-light text-info-dark",
};

export const ALERT_ICONS: Record<AlertType, string> = {
  success: "/assets/icons/sucess.webp",
  error: "/assets/icons/error.webp",
  warning: "/assets/icons/warning.webp",
  info: "/assets/icons/info.webp",
};

export const CLOSE_ICON_SRC = "/assets/icons/close.webp";

export const INNER_BASE_CLASSES =
  "px-3 py-2 pixel-corner-lg-4 text-xl font-medium font-default pointer-events-auto min-w-40 flex items-center gap-2";

export const ANIMATION_DURATION = 0.4;
export const ANIMATION_EASE = "power1.inOut";

export const BASE_ANIMATION_VARS = {
  xPercent: 100,
  opacity: 0,
  duration: ANIMATION_DURATION,
  ease: ANIMATION_EASE,
};

export const CONTAINER_ID = "global-alert-container";
export const CONTAINER_CLASSES = "fixed top-4 right-4 z-50 flex flex-col-reverse gap-2 pointer-events-none";

import { CONTAINER_ID, CONTAINER_CLASSES } from "./constants";

export function getOrCreateContainer(): HTMLDivElement {
  let container = document.getElementById(CONTAINER_ID) as HTMLDivElement | null;

  if (!container) {
    container = document.createElement("div");
    container.id = CONTAINER_ID;
    container.className = CONTAINER_CLASSES;

    const target = document.body ?? document.documentElement;
    target.appendChild(container);
  }

  return container;
}

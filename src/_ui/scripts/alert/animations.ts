import { gsap } from "gsap";
import { BASE_ANIMATION_VARS } from "./constants";

export function animateIn(element: HTMLDivElement): void {
  gsap.from(element, { ...BASE_ANIMATION_VARS });
}

export function animateOut(element: HTMLDivElement, onComplete: () => void): void {
  gsap.to(element, { ...BASE_ANIMATION_VARS, onComplete });
}

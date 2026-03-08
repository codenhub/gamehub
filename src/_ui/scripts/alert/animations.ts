import { BASE_ANIMATION_KEYFRAMES, BASE_ANIMATION_OPTIONS } from "./constants";

export function animateIn(element: HTMLDivElement): void {
  element.animate(BASE_ANIMATION_KEYFRAMES, BASE_ANIMATION_OPTIONS);
}

export function animateOut(element: HTMLDivElement, onComplete: () => void): void {
  const keyframes = [...BASE_ANIMATION_KEYFRAMES].reverse();
  const animation = element.animate(keyframes, BASE_ANIMATION_OPTIONS);

  animation.onfinish = () => {
    onComplete();
  };
}

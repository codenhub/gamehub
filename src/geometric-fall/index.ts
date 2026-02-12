import {
  moveDown,
  moveLeft,
  moveRight,
  rotateLeft,
  rotateRight,
  dropPiece,
  playGame,
  pauseGame,
  stopGame,
} from "./game";

type GameState = "stopped" | "playing" | "paused";

function getRequiredElement<T extends HTMLElement>(
  id: string,
  elementType: string,
): T | null {
  const el = document.getElementById(id) as T | null;
  if (!el) {
    console.warn(`[GeometricFall] Required ${elementType} #${id} not found`);
  }
  return el;
}

document.addEventListener("DOMContentLoaded", () => {
  // GAME STATE MANAGEMENT
  let state: GameState = "stopped";
  const playBtn = getRequiredElement<HTMLButtonElement>("play", "button");
  const pauseBtn = getRequiredElement<HTMLButtonElement>("pause", "button");
  const stopBtn = getRequiredElement<HTMLButtonElement>("stop", "button");

  if (!playBtn || !pauseBtn || !stopBtn) {
    console.error("[GeometricFall] Missing required game control buttons");
    return;
  }

  playBtn.addEventListener("click", () => {
    state = "playing";
    playBtn.classList.add("hidden");
    pauseBtn.classList.remove("hidden");
    stopBtn.classList.remove("hidden");

    playGame();
  });

  pauseBtn.addEventListener("click", () => {
    state = "paused";
    playBtn.classList.remove("hidden");
    pauseBtn.classList.add("hidden");

    pauseGame();
  });

  stopBtn.addEventListener("click", () => {
    state = "stopped";
    playBtn.classList.remove("hidden");
    pauseBtn.classList.add("hidden");
    stopBtn.classList.add("hidden");

    stopGame();
  });

  // GAME CONTROLS
  type Control = {
    selector: string;
    action: () => void;
  };

  const controls: Control[] = [
    { selector: ".downBtn", action: moveDown },
    { selector: ".leftBtn", action: moveLeft },
    { selector: ".rightBtn", action: moveRight },
    { selector: ".rotateLeftBtn", action: rotateLeft },
    { selector: ".rotateRightBtn", action: rotateRight },
    { selector: ".dropBtn", action: dropPiece },
  ];

  controls.forEach(({ selector, action }) => {
    document.querySelectorAll(selector).forEach((btn) => {
      btn.addEventListener("click", () => {
        if (state === "playing") action();
      });
    });
  });

  // KEYBOARD CONTROLS
  const keyMap: Record<string, () => void> = {
    ArrowUp: rotateRight,
    ArrowDown: moveDown,
    ArrowLeft: moveLeft,
    ArrowRight: moveRight,
    KeyZ: rotateLeft,
    KeyX: rotateRight,
    Space: dropPiece,
  };

  document.addEventListener("keydown", (e: KeyboardEvent) => {
    const action = keyMap[e.code];
    if (action) {
      e.preventDefault();
      if (state === "playing") action();
    }
  });
});

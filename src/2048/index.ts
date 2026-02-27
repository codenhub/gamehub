import { Game2048 } from "./game";
import type { Direction } from "./logic";

/**
 * Helper to retrieve a typed DOM element by ID.
 * @param id Element ID.
 * @returns The element or null if not found.
 */
function getElement<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

document.addEventListener("DOMContentLoaded", () => {
  const startScreen = getElement<HTMLDivElement>("start-screen");
  const gameOverScreen = getElement<HTMLDivElement>("game-over-screen");
  const winScreen = getElement<HTMLDivElement>("win-screen");

  const restartBtn = getElement<HTMLButtonElement>("restart-btn");
  const winRestartBtn = getElement<HTMLButtonElement>("win-restart-btn");
  const startBtn = getElement<HTMLButtonElement>("start-btn");

  const scoreEl = getElement<HTMLSpanElement>("score");
  const highScoreEl = getElement<HTMLSpanElement>("high-score");
  const finalScoreEl = getElement<HTMLSpanElement>("final-score");
  const winScoreEl = getElement<HTMLSpanElement>("win-score");

  const gridContainer = getElement<HTMLDivElement>("grid");

  if (!gridContainer) {
    console.error("[2048] Grid container #grid not found, cannot start game");
    return;
  }

  let game: Game2048;
  try {
    game = new Game2048(gridContainer, {
      onScoreUpdate: (score, highScore) => {
        if (scoreEl) scoreEl.innerText = score.toString();
        if (highScoreEl) highScoreEl.innerText = highScore.toString();
      },
      onGameOver: (finalScore) => {
        if (finalScoreEl) finalScoreEl.innerText = finalScore.toString();
        setGameOverState();
      },
      onGameWin: (finalScore) => {
        if (winScoreEl) winScoreEl.innerText = finalScore.toString();
        setWinState();
      },
    });
  } catch (error) {
    console.error("[2048] Failed to initialize game:", error);
    return;
  }

  type GameAppState = "stopped" | "playing" | "gameover" | "win";
  let appState: GameAppState = "stopped";

  const setPlayingState = () => {
    game.start();
    appState = "playing";

    startScreen?.classList.add("hidden");
    gameOverScreen?.classList.add("hidden");
    gameOverScreen?.classList.remove("flex");
    winScreen?.classList.add("hidden");
    winScreen?.classList.remove("flex");
  };

  const setGameOverState = () => {
    appState = "gameover";

    gameOverScreen?.classList.remove("hidden");
    gameOverScreen?.classList.add("flex");
  };

  const setWinState = () => {
    appState = "win";

    winScreen?.classList.remove("hidden");
    winScreen?.classList.add("flex");
  };

  startBtn?.addEventListener("click", setPlayingState);
  restartBtn?.addEventListener("click", setPlayingState);
  winRestartBtn?.addEventListener("click", setPlayingState);

  // Mobile D-Pad Buttons
  const controls = [
    { selector: ".upBtn", direction: "up" as const },
    { selector: ".downBtn", direction: "down" as const },
    { selector: ".leftBtn", direction: "left" as const },
    { selector: ".rightBtn", direction: "right" as const },
  ];

  controls.forEach(({ selector, direction }) => {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.addEventListener("click", () => {
        if (appState === "playing") game.move(direction);
      });
    }
  });

  const keyDirectionMap: Record<string, Direction> = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    W: "up",
    s: "down",
    S: "down",
    a: "left",
    A: "left",
    d: "right",
    D: "right",
  };

  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      if (appState !== "playing") setPlayingState();
      return;
    }

    if (appState !== "playing") return;

    const direction = keyDirectionMap[e.key];
    if (direction) {
      e.preventDefault();
      game.move(direction);
    }
  });

  const MIN_SWIPE_DISTANCE = 30;
  let touchStartX = 0;
  let touchStartY = 0;

  gridContainer.addEventListener(
    "touchstart",
    (e: TouchEvent) => {
      // Prevent default to stop scrolling/refresh behavior
      if (e.cancelable) e.preventDefault();

      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    },
    { passive: false },
  );

  gridContainer.addEventListener(
    "touchmove",
    (e: TouchEvent) => {
      // Critical for preventing scrolling while swiping
      if (e.cancelable) e.preventDefault();
    },
    { passive: false },
  );

  gridContainer.addEventListener(
    "touchend",
    (e: TouchEvent) => {
      if (appState !== "playing") return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) < MIN_SWIPE_DISTANCE) return;

      let direction: Direction;
      if (absDx > absDy) {
        direction = dx > 0 ? "right" : "left";
      } else {
        direction = dy > 0 ? "down" : "up";
      }

      game.move(direction);
    },
    { passive: false },
  );
});

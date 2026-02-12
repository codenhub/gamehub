import { SnakeGame } from "./game";

function getElement<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements — validated before use
  const playBtn = getElement<HTMLButtonElement>("play");
  const pauseBtn = getElement<HTMLButtonElement>("pause");
  const stopBtn = getElement<HTMLButtonElement>("stop");

  const restartBtn = getElement<HTMLButtonElement>("restart-btn");
  const winRestartBtn = getElement<HTMLButtonElement>("win-restart-btn");

  const startScreen = getElement<HTMLDivElement>("start-screen");
  const gameOverScreen = getElement<HTMLDivElement>("game-over-screen");
  const winScreen = getElement<HTMLDivElement>("win-screen");

  const scoreEl = getElement<HTMLSpanElement>("score");
  const highScoreEl = getElement<HTMLSpanElement>("high-score");
  const finalScoreEl = getElement<HTMLSpanElement>("final-score");
  const winScoreEl = getElement<HTMLSpanElement>("win-score");

  const canvas = getElement<HTMLCanvasElement>("game");

  if (!canvas) {
    console.error("[Snake] Canvas element #game not found, cannot start game");
    return;
  }

  if (!playBtn || !pauseBtn || !stopBtn) {
    console.error("[Snake] Missing required game control buttons");
    return;
  }

  // Game Instance
  let game: SnakeGame;
  try {
    game = new SnakeGame(canvas, {
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
    console.error("[Snake] Failed to initialize game:", error);
    return;
  }

  // State Management
  type GameAppState = "stopped" | "playing" | "paused" | "gameover" | "win";
  let appState: GameAppState = "stopped";

  const setPlayingState = () => {
    if (appState === "paused") {
      game.resume();
    } else {
      game.start();
    }
    appState = "playing";

    playBtn.classList.add("hidden");
    pauseBtn.classList.remove("hidden");
    stopBtn.classList.remove("hidden");

    startScreen?.classList.add("hidden");
    gameOverScreen?.classList.add("hidden");
    winScreen?.classList.add("hidden");
  };

  const setPausedState = () => {
    appState = "paused";
    game.pause();

    playBtn.classList.remove("hidden");
    pauseBtn.classList.add("hidden");
  };

  const setStoppedState = () => {
    appState = "stopped";
    game.stop();

    playBtn.classList.remove("hidden");
    pauseBtn.classList.add("hidden");
    stopBtn.classList.add("hidden");

    startScreen?.classList.remove("hidden");
    gameOverScreen?.classList.add("hidden");
    winScreen?.classList.add("hidden");
  };

  const setGameOverState = () => {
    appState = "gameover";

    playBtn.classList.remove("hidden");
    pauseBtn.classList.add("hidden");
    stopBtn.classList.add("hidden");

    gameOverScreen?.classList.remove("hidden");
    gameOverScreen?.classList.add("flex");
  };

  const setWinState = () => {
    appState = "win";

    playBtn.classList.remove("hidden");
    pauseBtn.classList.add("hidden");
    stopBtn.classList.add("hidden");

    winScreen?.classList.remove("hidden");
    winScreen?.classList.add("flex");
  };

  // Event Listeners
  playBtn.addEventListener("click", setPlayingState);
  pauseBtn.addEventListener("click", setPausedState);
  stopBtn.addEventListener("click", setStoppedState);

  restartBtn?.addEventListener("click", setPlayingState);
  winRestartBtn?.addEventListener("click", setPlayingState);

  // Controls
  type Control = {
    keys: string[];
    selector: string;
    action: () => void;
  };

  const controls: Control[] = [
    {
      keys: ["ArrowUp", "w", "W"],
      selector: ".upBtn",
      action: () => game.moveUp(),
    },
    {
      keys: ["ArrowDown", "s", "S"],
      selector: ".downBtn",
      action: () => game.moveDown(),
    },
    {
      keys: ["ArrowLeft", "a", "A"],
      selector: ".leftBtn",
      action: () => game.moveLeft(),
    },
    {
      keys: ["ArrowRight", "d", "D"],
      selector: ".rightBtn",
      action: () => game.moveRight(),
    },
  ];

  // Mobile Buttons
  controls.forEach(({ selector, action }) => {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.addEventListener("click", () => {
        if (appState === "playing") action();
      });
    }
  });

  // Keyboard
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      if (appState === "playing") setPausedState();
      else setPlayingState();
      return;
    }

    if (appState !== "playing") return;

    controls.forEach(({ keys, action }) => {
      if (keys.includes(e.key)) action();
    });
  });
});

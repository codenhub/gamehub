import { GeometricFallGame } from "./game";

type GameAppState = "stopped" | "playing" | "paused" | "gameover";

function getElement<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const playBtn = getElement<HTMLButtonElement>("play");
  const pauseBtn = getElement<HTMLButtonElement>("pause");
  const stopBtn = getElement<HTMLButtonElement>("stop");

  const startBtn = getElement<HTMLButtonElement>("start-btn");
  const restartBtn = getElement<HTMLButtonElement>("restart-btn");


  const startScreen = getElement<HTMLDivElement>("start-screen");
  const gameOverScreen = getElement<HTMLDivElement>("game-over-screen");


  const scoreEl = getElement<HTMLSpanElement>("score");
  const highScoreEl = getElement<HTMLSpanElement>("high-score");
  const finalScoreEl = getElement<HTMLSpanElement>("final-score");


  const canvas = getElement<HTMLCanvasElement>("game");

  if (!canvas) {
    console.error("[GeometricFall] Canvas element #game not found");
    return;
  }

  if (!playBtn || !pauseBtn || !stopBtn) {
    console.error("[GeometricFall] Missing required game control buttons");
    return;
  }

  // Game Instance
  let game: GeometricFallGame;
  try {
    game = new GeometricFallGame(canvas, {
      onScoreUpdate: (score, highScore) => {
        if (scoreEl) scoreEl.innerText = score.toString();
        if (highScoreEl) highScoreEl.innerText = highScore.toString();
      },
      onGameOver: (finalScore) => {
        if (finalScoreEl) finalScoreEl.innerText = finalScore.toString();
        setGameOverState();
      },

    });
  } catch (error) {
    console.error("[GeometricFall] Failed to initialize game:", error);
    return;
  }

  // State Management
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
  };

  const setGameOverState = () => {
    appState = "gameover";

    playBtn.classList.remove("hidden");
    pauseBtn.classList.add("hidden");
    stopBtn.classList.add("hidden");

    gameOverScreen?.classList.remove("hidden");
    gameOverScreen?.classList.add("flex");
  };



  // Event Listeners
  playBtn.addEventListener("click", setPlayingState);
  pauseBtn.addEventListener("click", setPausedState);
  stopBtn.addEventListener("click", setStoppedState);

  startBtn?.addEventListener("click", setPlayingState);
  restartBtn?.addEventListener("click", setPlayingState);


  // GAME CONTROLS
  type Control = {
    selector: string;
    action: () => void;
  };

  const controls: Control[] = [
    { selector: ".downBtn", action: () => game.moveDown() },
    { selector: ".leftBtn", action: () => game.moveLeft() },
    { selector: ".rightBtn", action: () => game.moveRight() },
    { selector: ".rotateLeftBtn", action: () => game.rotateLeft() },
    { selector: ".rotateRightBtn", action: () => game.rotateRight() },
    { selector: ".dropBtn", action: () => game.dropPiece() },
  ];

  controls.forEach(({ selector, action }) => {
    document.querySelectorAll(selector).forEach((btn) => {
      btn.addEventListener("click", () => {
        if (appState === "playing") action();
      });
    });
  });

  // KEYBOARD CONTROLS
  const keyMap: Record<string, () => void> = {
    ArrowUp: () => game.rotateRight(),
    ArrowDown: () => game.moveDown(),
    ArrowLeft: () => game.moveLeft(),
    ArrowRight: () => game.moveRight(),
    KeyZ: () => game.rotateLeft(),
    KeyX: () => game.rotateRight(),
    Space: () => game.dropPiece(),
  };

  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") {
        if (appState === "playing") setPausedState();
        else setPlayingState();
        return;
    }

    const action = keyMap[e.code];
    if (action) {
      e.preventDefault();
      if (appState === "playing") action();
    }
  });
});

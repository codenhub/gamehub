import { SnakeGame } from "./game";

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const playBtn = document.getElementById("play") as HTMLButtonElement;
  const pauseBtn = document.getElementById("pause") as HTMLButtonElement;
  const stopBtn = document.getElementById("stop") as HTMLButtonElement;

  const restartBtn = document.getElementById(
    "restart-btn",
  ) as HTMLButtonElement;
  const winRestartBtn = document.getElementById(
    "win-restart-btn",
  ) as HTMLButtonElement;

  const startScreen = document.getElementById("start-screen") as HTMLDivElement;

  const gameOverScreen = document.getElementById(
    "game-over-screen",
  ) as HTMLDivElement;
  const winScreen = document.getElementById("win-screen") as HTMLDivElement;

  const scoreEl = document.getElementById("score") as HTMLSpanElement;
  const highScoreEl = document.getElementById("high-score") as HTMLSpanElement;

  const finalScoreEl = document.getElementById(
    "final-score",
  ) as HTMLSpanElement;
  const winScoreEl = document.getElementById("win-score") as HTMLSpanElement;

  const canvas = document.getElementById("game") as HTMLCanvasElement;

  // Game Instance
  const game = new SnakeGame(canvas, {
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

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    winScreen.classList.add("hidden");
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

    startScreen.classList.remove("hidden");
    gameOverScreen.classList.add("hidden");
    winScreen.classList.add("hidden");
  };

  const setGameOverState = () => {
    appState = "gameover";

    playBtn.classList.remove("hidden");
    pauseBtn.classList.add("hidden");
    stopBtn.classList.add("hidden");

    gameOverScreen.classList.remove("hidden");
    gameOverScreen.classList.add("flex");
  };

  const setWinState = () => {
    appState = "win";

    playBtn.classList.remove("hidden");
    pauseBtn.classList.add("hidden");
    stopBtn.classList.add("hidden");

    winScreen.classList.remove("hidden");
    winScreen.classList.add("flex");
  };

  // Event Listeners
  if (playBtn) playBtn.addEventListener("click", setPlayingState);
  if (pauseBtn) pauseBtn.addEventListener("click", setPausedState);
  if (stopBtn) stopBtn.addEventListener("click", setStoppedState);

  if (restartBtn) restartBtn.addEventListener("click", setPlayingState);
  if (winRestartBtn) winRestartBtn.addEventListener("click", setPlayingState);

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

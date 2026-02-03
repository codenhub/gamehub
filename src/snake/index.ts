import {
  startGame,
  pauseGame,
  stopGame,
  moveUp,
  moveDown,
  moveLeft,
  moveRight,
} from "./game.js"; // Importing .js is still valid in TS if allowJs/moduleResoltion supports it, but usually standard in Vite/TS is often just import from './game' or matching extension if using specific config. Sticking to extensions or no extensions.  Vite handles .ts imports. I'll use ./game.

document.addEventListener("DOMContentLoaded", () => {
  // UI REFERENCES
  const playBtn = document.getElementById("play") as HTMLButtonElement;
  const pauseBtn = document.getElementById("pause") as HTMLButtonElement;
  const stopBtn = document.getElementById("stop") as HTMLButtonElement;
  const restartBtn = document.getElementById(
    "restart-btn",
  ) as HTMLButtonElement;

  const startScreen = document.getElementById("start-screen") as HTMLDivElement;
  const gameOverScreen = document.getElementById(
    "game-over-screen",
  ) as HTMLDivElement;

  // STATE
  type GameState = "stopped" | "playing" | "paused" | "gameover";
  let state: GameState = "stopped";

  // FUNCTIONS
  const setPlayingState = () => {
    state = "playing";
    playBtn.classList.add("hidden");
    pauseBtn.classList.remove("hidden");
    stopBtn.classList.remove("hidden");
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    startGame();
  };

  const setPausedState = () => {
    state = "paused";
    playBtn.classList.remove("hidden");
    pauseBtn.classList.add("hidden");
    pauseGame();
  };

  const setStoppedState = () => {
    state = "stopped";
    playBtn.classList.remove("hidden");
    pauseBtn.classList.add("hidden");
    stopBtn.classList.add("hidden");
    startScreen.classList.remove("hidden");
    gameOverScreen.classList.add("hidden");
    stopGame();
  };

  // EVENT LISTENERS
  if (playBtn) playBtn.addEventListener("click", setPlayingState);
  if (pauseBtn) pauseBtn.addEventListener("click", setPausedState);
  if (stopBtn) stopBtn.addEventListener("click", setStoppedState);
  if (restartBtn) restartBtn.addEventListener("click", setPlayingState);

  // CONTROLS
  const btnMap = [
    { selector: ".upBtn", action: moveUp },
    { selector: ".downBtn", action: moveDown },
    { selector: ".leftBtn", action: moveLeft },
    { selector: ".rightBtn", action: moveRight },
  ];

  btnMap.forEach(({ selector, action }) => {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.addEventListener("click", () => {
        if (state === "playing") action();
      });
    }
  });

  // KEYBOARD
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (state !== "playing") return;

    switch (e.key) {
      case "ArrowUp":
      case "w":
      case "W":
        moveUp();
        break;
      case "ArrowDown":
      case "s":
      case "S":
        moveDown();
        break;
      case "ArrowLeft":
      case "a":
      case "A":
        moveLeft();
        break;
      case "ArrowRight":
      case "d":
      case "D":
        moveRight();
        break;
    }
  });
});

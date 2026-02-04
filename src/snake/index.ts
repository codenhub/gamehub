import {
  startGame,
  pauseGame,
  stopGame,
  moveUp,
  moveDown,
  moveLeft,
  moveRight,
} from "./game";

document.addEventListener("DOMContentLoaded", () => {
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
  type Control = {
    keys: string[];
    selector: string;
    action: () => void;
  };

  const controls: Control[] = [
    { keys: ["ArrowUp", "w", "W"], selector: ".upBtn", action: moveUp },
    { keys: ["ArrowDown", "s", "S"], selector: ".downBtn", action: moveDown },
    { keys: ["ArrowLeft", "a", "A"], selector: ".leftBtn", action: moveLeft },
    {
      keys: ["ArrowRight", "d", "D"],
      selector: ".rightBtn",
      action: moveRight,
    },
  ];

  controls.forEach(({ selector, action }) => {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.addEventListener("click", () => {
        if (state === "playing") action();
      });
    }
  });

  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter")
      state === "playing" ? setPausedState() : setPlayingState();

    if (state !== "playing") return;

    controls.forEach(({ keys, action }) => {
      if (keys.includes(e.key)) action();
    });
  });
});

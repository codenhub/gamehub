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
} from "./game.js";

document.addEventListener("DOMContentLoaded", () => {
  // GAME STATE MANAGEMENT
  let state = "stopped";
  const playBtn = document.getElementById("play");
  const pauseBtn = document.getElementById("pause");
  const stopBtn = document.getElementById("stop");

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
  const moveDownBtns = document.querySelectorAll(".downBtn");
  const moveLeftBtns = document.querySelectorAll(".leftBtn");
  const moveRightBtns = document.querySelectorAll(".rightBtn");
  const rotateLeftBtns = document.querySelectorAll(".rotateLeftBtn");
  const rotateRightBtns = document.querySelectorAll(".rotateRightBtn");
  const dropPieceBtns = document.querySelectorAll(".dropBtn");

  moveDownBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state === "playing") moveDown();
    });
  });
  moveLeftBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state === "playing") moveLeft();
    });
  });
  moveRightBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state === "playing") moveRight();
    });
  });
  rotateLeftBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state === "playing") rotateLeft();
    });
  });
  rotateRightBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state === "playing") rotateRight();
    });
  });
  dropPieceBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state === "playing") dropPiece();
    });
  });

  // KEYBOARD CONTROLS
  document.addEventListener("keydown", (e) => {
    const keyMap = {
      ArrowUp: rotateRight,
      ArrowDown: moveDown,
      ArrowLeft: moveLeft,
      ArrowRight: moveRight,
      KeyZ: rotateLeft,
      KeyX: rotateRight,
      Space: dropPiece,
    };
    const action = keyMap[e.code];
    if (action) {
      e.preventDefault();
      if (state === "playing") action();
    }
  });
});

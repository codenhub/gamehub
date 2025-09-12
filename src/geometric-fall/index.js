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
  const moveDownBtn = document.querySelector(".downBtn");
  const moveLeftBtn = document.querySelector(".leftBtn");
  const moveRightBtn = document.querySelector(".rightBtn");
  const rotateLeftBtn = document.querySelector(".rotateLeftBtn");
  const rotateRightBtn = document.querySelector(".rotateRightBtn");
  const dropPieceBtn = document.querySelector(".dropBtn");

  moveDownBtn.addEventListener("click", () => {
    if (state === "playing") moveDown();
  });

  moveLeftBtn.addEventListener("click", () => {
    if (state === "playing") moveLeft();
  });

  moveRightBtn.addEventListener("click", () => {
    if (state === "playing") moveRight();
  });

  rotateLeftBtn.addEventListener("click", () => {
    if (state === "playing") rotateLeft();
  });

  rotateRightBtn.addEventListener("click", () => {
    if (state === "playing") rotateRight();
  });

  dropPieceBtn.addEventListener("click", () => {
    if (state === "playing") dropPiece();
  });
});

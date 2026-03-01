import { createGameShell } from "../common/game-shell";
import type { SwipeHandlerDeps, SwipeHandlers } from "../common/game-shell";
import { SnakeGame } from "./game";

const MIN_SWIPE_DISTANCE = 30;

function createSnakeSwipeHandlers(deps: SwipeHandlerDeps): SwipeHandlers {
  let touchStartX = 0;
  let touchStartY = 0;

  return {
    touchstart: (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    },
    touchmove: (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
    },
    touchend: (e: TouchEvent) => {
      if (deps.getState() !== "playing") return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) < MIN_SWIPE_DISTANCE) return;

      if (absDx > absDy) {
        if (dx > 0) snakeGame.moveRight();
        else snakeGame.moveLeft();
      } else {
        if (dy > 0) snakeGame.moveDown();
        else snakeGame.moveUp();
      }
    },
  };
}

/** Captures the game instance so swipe handlers can call methods on it. */
let snakeGame: SnakeGame;

createGameShell<SnakeGame>({
  elements: {
    gameElementId: "game",
    scoreId: "score",
    highScoreId: "high-score",
    finalScoreId: "final-score",
    winScoreId: "win-score",
    startScreenId: "start-screen",
    gameOverScreenId: "game-over-screen",
    winScreenId: "win-screen",
    playBtnId: "play",
    pauseBtnId: "pause",
    stopBtnId: "stop",
    restartBtnId: "restart-btn",
    winRestartBtnId: "win-restart-btn",
  },
  createGame: (element, callbacks) => {
    snakeGame = new SnakeGame(element as HTMLCanvasElement, callbacks);
    return snakeGame;
  },
  canPause: true,
  controls: [
    {
      keys: ["ArrowUp", "w", "W"],
      selector: ".upBtn",
      action: () => snakeGame.moveUp(),
    },
    {
      keys: ["ArrowDown", "s", "S"],
      selector: ".downBtn",
      action: () => snakeGame.moveDown(),
    },
    {
      keys: ["ArrowLeft", "a", "A"],
      selector: ".leftBtn",
      action: () => snakeGame.moveLeft(),
    },
    {
      keys: ["ArrowRight", "d", "D"],
      selector: ".rightBtn",
      action: () => snakeGame.moveRight(),
    },
  ],
  createSwipeHandlers: createSnakeSwipeHandlers,
});

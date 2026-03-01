import { createGameShell } from "../common/game-shell";
import type { SwipeHandlerDeps, SwipeHandlers } from "../common/game-shell";
import { GeometricFallGame } from "./game";

const SWIPE_THRESHOLD = 30;

function createFallSwipeHandlers(deps: SwipeHandlerDeps): SwipeHandlers {
  let touchStartX = 0;
  let touchStartY = 0;
  let lastTouchX = 0;
  let lastTouchY = 0;
  let isSwipe = false;

  return {
    touchstart: (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      lastTouchX = touchStartX;
      lastTouchY = touchStartY;
      isSwipe = false;
    },
    touchmove: (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      if (deps.getState() !== "playing") return;

      const touch = e.touches[0];
      const currentX = touch.clientX;
      const currentY = touch.clientY;

      if (Math.abs(currentX - touchStartX) > 10 || Math.abs(currentY - touchStartY) > 10) {
        isSwipe = true;
      }

      const dx = currentX - lastTouchX;
      const dy = currentY - lastTouchY;

      if (Math.abs(dx) >= SWIPE_THRESHOLD) {
        const moves = Math.floor(Math.abs(dx) / SWIPE_THRESHOLD);
        for (let i = 0; i < moves; i++) {
          if (dx > 0) fallGame.moveRight();
          else fallGame.moveLeft();
        }
        lastTouchX += Math.sign(dx) * moves * SWIPE_THRESHOLD;
      }

      if (dy >= SWIPE_THRESHOLD) {
        const moves = Math.floor(dy / SWIPE_THRESHOLD);
        for (let i = 0; i < moves; i++) {
          fallGame.moveDown();
        }
        lastTouchY += moves * SWIPE_THRESHOLD;
      }
    },
    touchend: (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      if (deps.getState() !== "playing") return;

      if (!isSwipe) {
        fallGame.rotateRight();
      }
    },
  };
}

let fallGame: GeometricFallGame;

createGameShell<GeometricFallGame>({
  elements: {
    gameElementId: "game",
    scoreId: "score",
    highScoreId: "high-score",
    finalScoreId: "final-score",
    startScreenId: "start-screen",
    gameOverScreenId: "game-over-screen",
    playBtnId: "play",
    pauseBtnId: "pause",
    stopBtnId: "stop",
    startBtnId: "start-btn",
    restartBtnId: "restart-btn",
  },
  createGame: (element, callbacks) => {
    fallGame = new GeometricFallGame(element as HTMLCanvasElement, callbacks);
    return fallGame;
  },
  canPause: true,
  keyMatchMode: "code",
  controls: [
    {
      keys: ["ArrowDown"],
      selector: ".downBtn",
      action: () => fallGame.moveDown(),
    },
    {
      keys: ["ArrowLeft"],
      selector: ".leftBtn",
      action: () => fallGame.moveLeft(),
    },
    {
      keys: ["ArrowRight"],
      selector: ".rightBtn",
      action: () => fallGame.moveRight(),
    },
    {
      keys: ["ArrowUp", "KeyX"],
      selector: ".rotateRightBtn",
      action: () => fallGame.rotateRight(),
    },
    {
      keys: ["KeyZ"],
      selector: ".rotateLeftBtn",
      action: () => fallGame.rotateLeft(),
    },
    {
      keys: ["Space"],
      selector: ".dropBtn",
      action: () => fallGame.dropPiece(),
    },
  ],
  createSwipeHandlers: createFallSwipeHandlers,
});

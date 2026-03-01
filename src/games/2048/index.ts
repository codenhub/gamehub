import { createGameShell } from "../common/game-shell";
import type { SwipeHandlerDeps, SwipeHandlers } from "../common/game-shell";
import { Game2048 } from "./game";
import type { Direction } from "./logic";

const MIN_SWIPE_DISTANCE = 30;

function create2048SwipeHandlers(deps: SwipeHandlerDeps): SwipeHandlers {
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

      let direction: Direction;
      if (absDx > absDy) {
        direction = dx > 0 ? "right" : "left";
      } else {
        direction = dy > 0 ? "down" : "up";
      }

      game2048.move(direction);
    },
  };
}

let game2048: Game2048;

createGameShell<Game2048>({
  elements: {
    gameElementId: "grid",
    scoreId: "score",
    highScoreId: "high-score",
    finalScoreId: "final-score",
    winScoreId: "win-score",
    startScreenId: "start-screen",
    gameOverScreenId: "game-over-screen",
    winScreenId: "win-screen",
    startBtnId: "start-btn",
    restartBtnId: "restart-btn",
    winRestartBtnId: "win-restart-btn",
  },
  createGame: (element, callbacks) => {
    game2048 = new Game2048(element, callbacks);
    return game2048;
  },
  canPause: false,
  controls: [
    {
      keys: ["ArrowUp", "w", "W"],
      selector: ".upBtn",
      action: () => game2048.move("up"),
    },
    {
      keys: ["ArrowDown", "s", "S"],
      selector: ".downBtn",
      action: () => game2048.move("down"),
    },
    {
      keys: ["ArrowLeft", "a", "A"],
      selector: ".leftBtn",
      action: () => game2048.move("left"),
    },
    {
      keys: ["ArrowRight", "d", "D"],
      selector: ".rightBtn",
      action: () => game2048.move("right"),
    },
  ],
  createSwipeHandlers: create2048SwipeHandlers,
});

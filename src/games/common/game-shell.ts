import type { GameCallbacks } from "./game-types";

/** States the app-level state machine can be in. */
export type GameAppState = "stopped" | "playing" | "paused" | "gameover" | "win";

/** A single keyboard / mobile-button mapping to a game action. */
export interface ControlMapping {
  /** Keyboard event `key` or `code` values that trigger this action. */
  keys?: string[];
  /** CSS selector for the mobile/on-screen button(s). */
  selector?: string;
  /** The game method to call. */
  action: () => void;
}

/**
 * Whether keyboard matching uses `e.key` (character-based, default)
 * or `e.code` (physical key position — needed by geometric-fall).
 */
export type KeyMatchMode = "key" | "code";

/** Describes which DOM element IDs / selectors the shell should look for. */
export interface ShellElements {
  /** ID of the main game canvas or container. */
  gameElementId: string;

  /** Score display element IDs (all optional). */
  scoreId?: string;
  highScoreId?: string;
  finalScoreId?: string;
  winScoreId?: string;

  /** Screen overlay IDs. */
  startScreenId?: string;
  gameOverScreenId?: string;
  winScreenId?: string;

  /** Buttons. */
  playBtnId?: string;
  pauseBtnId?: string;
  stopBtnId?: string;
  startBtnId?: string;
  restartBtnId?: string;
  winRestartBtnId?: string;
}

/** Configuration that a specific game passes to `createGameShell`. */
export interface GameShellConfig<TGame> {
  /** DOM element IDs used by this game. */
  elements: ShellElements;

  /**
   * Factory that produces a game instance.
   * Receives the main game element and `GameCallbacks`.
   */
  createGame: (element: HTMLElement, callbacks: GameCallbacks) => TGame;

  /** Control mappings (keyboard, mobile, etc.). */
  controls?: ControlMapping[];

  /** How keyboard keys are matched — `"key"` (default) or `"code"`. */
  keyMatchMode?: KeyMatchMode;

  /**
   * If `true`, Enter toggles pause/resume while playing.
   * If `false`, Enter always starts/restarts.
   * Defaults to `true`.
   */
  canPause?: boolean;

  /**
   * Optional swipe handler factory. Return an object with `touchstart`,
   * `touchmove`, and `touchend` listeners bound to the game element.
   * The shell handles attaching them.
   */
  createSwipeHandlers?: (deps: SwipeHandlerDeps) => SwipeHandlers;
}

/** Dependencies passed to the swipe handler factory. */
export interface SwipeHandlerDeps {
  getState: () => GameAppState;
}

/** Touch event listeners returned by the swipe handler factory. */
export interface SwipeHandlers {
  touchstart: (e: TouchEvent) => void;
  touchmove: (e: TouchEvent) => void;
  touchend: (e: TouchEvent) => void;
}

function getElement<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function show(el: HTMLElement | null) {
  if (!el) return;
  el.classList.remove("hidden");
  el.classList.add("flex");
}

function hide(el: HTMLElement | null) {
  if (!el) return;
  el.classList.add("hidden");
  el.classList.remove("flex");
}

/**
 * Creates a fully wired game shell.
 *
 * Handles DOM resolution, state machine (stopped → playing ⇌ paused → gameover / win),
 * screen visibility toggling, keyboard/mobile/swipe input, and game lifecycle.
 */
export function createGameShell<TGame>(config: GameShellConfig<TGame>): void {
  document.addEventListener("DOMContentLoaded", () => {
    const { elements: ids, keyMatchMode = "key", canPause = true } = config;

    const gameElement = getElement(ids.gameElementId);
    if (!gameElement) {
      console.error(`[GameShell] Game element #${ids.gameElementId} not found`);
      return;
    }

    const playBtn = ids.playBtnId ? getElement<HTMLButtonElement>(ids.playBtnId) : null;
    const pauseBtn = ids.pauseBtnId ? getElement<HTMLButtonElement>(ids.pauseBtnId) : null;
    const stopBtn = ids.stopBtnId ? getElement<HTMLButtonElement>(ids.stopBtnId) : null;
    const startBtn = ids.startBtnId ? getElement<HTMLButtonElement>(ids.startBtnId) : null;
    const restartBtn = ids.restartBtnId ? getElement<HTMLButtonElement>(ids.restartBtnId) : null;
    const winRestartBtn = ids.winRestartBtnId ? getElement<HTMLButtonElement>(ids.winRestartBtnId) : null;

    const scoreEl = ids.scoreId ? getElement<HTMLSpanElement>(ids.scoreId) : null;
    const highScoreEl = ids.highScoreId ? getElement<HTMLSpanElement>(ids.highScoreId) : null;
    const finalScoreEl = ids.finalScoreId ? getElement<HTMLSpanElement>(ids.finalScoreId) : null;
    const winScoreEl = ids.winScoreId ? getElement<HTMLSpanElement>(ids.winScoreId) : null;

    const startScreen = ids.startScreenId ? getElement(ids.startScreenId) : null;
    const gameOverScreen = ids.gameOverScreenId ? getElement(ids.gameOverScreenId) : null;
    const winScreen = ids.winScreenId ? getElement(ids.winScreenId) : null;

    const callbacks: GameCallbacks = {
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
    };

    let game: TGame;
    try {
      game = config.createGame(gameElement, callbacks);
    } catch (error) {
      console.error("[GameShell] Failed to create game:", error);
      return;
    }

    let appState: GameAppState = "stopped";

    const setPlayingState = () => {
      if (appState === "paused" && canPause) {
        (game as unknown as { resume?: () => void }).resume?.();
      } else {
        (game as unknown as { start: () => void }).start();
      }
      appState = "playing";

      hide(playBtn);
      show(pauseBtn);
      show(stopBtn);

      hide(startScreen);
      hide(gameOverScreen);
      hide(winScreen);
    };

    const setPausedState = () => {
      if (!canPause) return;
      appState = "paused";
      (game as unknown as { pause?: () => void }).pause?.();

      if (playBtn) playBtn.classList.remove("hidden");
      if (pauseBtn) pauseBtn.classList.add("hidden");
    };

    const setStoppedState = () => {
      appState = "stopped";
      (game as unknown as { stop: () => void }).stop();

      if (playBtn) playBtn.classList.remove("hidden");
      if (pauseBtn) pauseBtn.classList.add("hidden");
      if (stopBtn) stopBtn.classList.add("hidden");

      show(startScreen);
      hide(gameOverScreen);
      hide(winScreen);
    };

    const setGameOverState = () => {
      appState = "gameover";

      if (playBtn) playBtn.classList.remove("hidden");
      if (pauseBtn) pauseBtn.classList.add("hidden");
      if (stopBtn) stopBtn.classList.add("hidden");

      show(gameOverScreen);
    };

    const setWinState = () => {
      appState = "win";

      if (playBtn) playBtn.classList.remove("hidden");
      if (pauseBtn) pauseBtn.classList.add("hidden");
      if (stopBtn) stopBtn.classList.add("hidden");

      show(winScreen);
    };

    playBtn?.addEventListener("click", setPlayingState);
    pauseBtn?.addEventListener("click", setPausedState);
    stopBtn?.addEventListener("click", setStoppedState);
    startBtn?.addEventListener("click", setPlayingState);
    restartBtn?.addEventListener("click", setPlayingState);
    winRestartBtn?.addEventListener("click", setPlayingState);

    const controls = config.controls ?? [];
    controls.forEach(({ selector, action }) => {
      if (!selector) return;
      document.querySelectorAll(selector).forEach((btn) => {
        btn.addEventListener("click", () => {
          if (appState === "playing") action();
        });
      });
    });

    document.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (appState === "playing" && canPause) setPausedState();
        else setPlayingState();
        return;
      }

      if (appState !== "playing") return;

      const matchValue = keyMatchMode === "code" ? e.code : e.key;

      for (const control of controls) {
        if (control.keys?.includes(matchValue)) {
          e.preventDefault();
          control.action();
          return;
        }
      }
    });

    if (config.createSwipeHandlers) {
      const handlers = config.createSwipeHandlers({
        getState: () => appState,
      });

      gameElement.addEventListener("touchstart", handlers.touchstart, { passive: false });
      gameElement.addEventListener("touchmove", handlers.touchmove, { passive: false });
      gameElement.addEventListener("touchend", handlers.touchend, { passive: false });
    }
  });
}

// Simple Tetris-like implementation
const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");

// grid size in pixels
const COLS = 10;
const ROWS = 20;
const BLOCK = 30; // matches CSS .block

canvas.width = COLS * BLOCK;
canvas.height = ROWS * BLOCK;

context.scale(1, 1);

const colors = [
  null,
  "#ef4444",
  "#f97316",
  "#eab308",
  "#10b981",
  "#0ea5e9",
  "#8b5cf6",
  "#ec4899",
];

function createMatrix(w, h) {
  const m = [];
  while (h--) m.push(new Array(w).fill(0));
  return m;
}

const arena = createMatrix(COLS, ROWS);

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; y++) {
    for (let x = 0; x < m[y].length; x++) {
      if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val !== 0) arena[y + player.pos.y][x + player.pos.x] = val;
    });
  });
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < y; x++) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) matrix.forEach((row) => row.reverse());
  else matrix.reverse();
}

function playerReset() {
  const pieces = "TJLOSZI";
  player.matrix = createPiece(pieces[(pieces.length * Math.random()) | 0]);
  player.pos.y = 0;
  player.pos.x = ((COLS / 2) | 0) - ((player.matrix[0].length / 2) | 0);
  if (collide(arena, player)) {
    arena.forEach((row) => row.fill(0));
    score = 0;
    lines = 0;
    level = 0;
    updateUI();
  }
}

function createPiece(type) {
  if (type === "T")
    return [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ];
  if (type === "J")
    return [
      [2, 0, 0],
      [2, 2, 2],
      [0, 0, 0],
    ];
  if (type === "L")
    return [
      [0, 0, 3],
      [3, 3, 3],
      [0, 0, 0],
    ];
  if (type === "O")
    return [
      [4, 4],
      [4, 4],
    ];
  if (type === "S")
    return [
      [0, 5, 5],
      [5, 5, 0],
      [0, 0, 0],
    ];
  if (type === "Z")
    return [
      [6, 6, 0],
      [0, 6, 6],
      [0, 0, 0],
    ];
  if (type === "I")
    return [
      [0, 0, 0, 0],
      [7, 7, 7, 7],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

let score = 0;
let lines = 0;
let level = 0;

function arenaSweep() {
  let rowCount = 1;
  outer: for (let y = arena.length - 1; y >= 0; y--) {
    for (let x = 0; x < arena[y].length; x++) {
      if (arena[y][x] === 0) continue outer;
    }
    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    y++;
    score += 10 * rowCount;
    lines += 1;
    rowCount *= 2;
  }
  level = Math.floor(lines / 10);
  dropInterval = Math.max(100, 1000 - level * 100);
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val !== 0) {
        context.fillStyle = colors[val];
        context.fillRect(
          (x + offset.x) * BLOCK,
          (y + offset.y) * BLOCK,
          BLOCK - 2,
          BLOCK - 2,
        );
      }
    });
  });
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawMatrix(arena, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
}

function updateUI() {
  document.getElementById("score").textContent = score;
  document.getElementById("lines").textContent = lines;
  document.getElementById("level").textContent = level;
}

function playerDrop() {
  player.pos.y++;
  dropCounter = 0;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateUI();
  }
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) player.pos.x -= dir;
}

function playerRotate(dir) {
  const pos = player.pos.x;
  rotate(player.matrix, dir);
  let offset = 1;
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

const player = { pos: { x: 0, y: 0 }, matrix: null };
playerReset();

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }
  draw();
  requestId = requestAnimationFrame(update);
}

let requestId = null;
let paused = false;

function start() {
  if (requestId) cancelAnimationFrame(requestId);
  lastTime = 0;
  dropCounter = 0;
  dropInterval = 1000;
  paused = false;
  requestId = requestAnimationFrame(update);
}

function restart() {
  for (let y = 0; y < arena.length; y++) arena[y].fill(0);
  score = 0;
  lines = 0;
  level = 0;
  updateUI();
  playerReset();
  start();
}

document.addEventListener("keydown", (event) => {
  if (event.code === "ArrowLeft") playerMove(-1);
  else if (event.code === "ArrowRight") playerMove(1);
  else if (event.code === "ArrowDown") playerDrop();
  else if (event.code === "ArrowUp") playerRotate(1);
  else if (event.code === "Space") {
    while (!collide(arena, player)) player.pos.y++;
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateUI();
  } else if (event.key.toLowerCase() === "p") {
    if (paused) {
      start();
    } else {
      paused = true;
      cancelAnimationFrame(requestId);
      requestId = null;
    }
  }
});

document.getElementById("startBtn").addEventListener("click", start);
document.getElementById("restartBtn").addEventListener("click", restart);

updateUI();

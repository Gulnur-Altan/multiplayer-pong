const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = {};
let ball = { x: 300, y: 350, vx: 3, vy: -5 };
let blocks = [];
let canvas = { width: 600, height: 400 };
let level = 1;
let gameOver = false;

// 🔹 create blocks
function createBlocks(level) {
  blocks = [];

  // 🔹 Level'e göre satır/sütun ayarı
  const rows = level === 1 ? 5 : 3; // 1. level: 5 satır, 2. level: 3 satır
  const cols = level === 1 ? 8 : 6; // 1. level: 8 sütun, 2. level: 6 sütun

  const blockWidth = 70;
  const blockHeight = 20;
  const padding = 10;

  // 🔹 Level'e göre renk seçimi
  const color = level === 1 ? "red" : "blue";

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      blocks.push({
        x: c * (blockWidth + padding) + 35,
        y: r * (blockHeight + padding) + 30,
        width: blockWidth,
        height: blockHeight,
        alive: true,
        color,
      });
    }
  }
}

createBlocks(level);

io.on("connection", (socket) => {
  console.log("Yeni oyuncu:", socket.id);
  players[socket.id] = { x: canvas.width / 2 - 50, score: 0 };

  socket.on("move", (x) => {
    if (players[socket.id]) players[socket.id].x = x;
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
  });
});

setInterval(() => {
  if (gameOver) {
    io.sockets.emit("state", { players, ball, blocks, level, gameOver });
    return;
  }

  ball.x += ball.vx;
  ball.y += ball.vy;

  // side wall hit
  if (ball.x <= 0 || ball.x >= canvas.width) ball.vx *= -1;
  if (ball.y <= 0) ball.vy *= -1;

  // Paddle hit
  for (let id in players) {
    const p = players[id];
    if (
      ball.y + 10 >= canvas.height - 20 &&
      ball.x >= p.x &&
      ball.x <= p.x + 100
    ) {
      ball.vy *= -1;
      ball.y = canvas.height - 30;
    }
  }

  // Block get hit
  for (let b of blocks) {
    if (
      b.alive &&
      ball.x >= b.x &&
      ball.x <= b.x + b.width &&
      ball.y - 10 <= b.y + b.height &&
      ball.y + 10 >= b.y
    ) {
      ball.vy *= -1;
      b.alive = false;
      for (let id in players) players[id].score += 10;
      break;
    }
  }

  // 🔹 if blocks run out upgrade levet
  if (blocks.every((b) => !b.alive)) {
    level++;
    createBlocks(level);
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 50;
    ball.vx = 3 + level; // speed up
    ball.vy = -5 - level;
  }

  //   if (ball.y >= canvas.height) {
  //     gameOver = true;
  //   }

  io.sockets.emit("state", { players, ball, blocks, level, gameOver });
}, 30);

server.listen(3000, () => console.log("DX-Ball server http://localhost:3000"));

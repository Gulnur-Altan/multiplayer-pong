const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = {};
let ball = { x: 300, y: 200, vx: 3, vy: 3 };

io.on("connection", (socket) => {
    console.log("Yeni oyuncu:", socket.id);
    players[socket.id] = { y: 200 };

    socket.on("move", (y) => {
        players[socket.id].y = y;
    });

    socket.on("disconnect", () => {
        console.log("Oyuncu ayrıldı:", socket.id);
        delete players[socket.id];
    });
});

setInterval(() => {
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.y <= 0 || ball.y >= 400) ball.vy *= -1;

    for (let id in players) {
        let p = players[id];
        if (ball.x <= 20 && ball.y >= p.y && ball.y <= p.y + 80) ball.vx *= -1;
        if (ball.x >= 580 && ball.y >= p.y && ball.y <= p.y + 80) ball.vx *= -1;
    }

    io.sockets.emit("state", { players, ball });
}, 50);

server.listen(3000, () => {
    console.log("Pong server http://localhost:3000");
});

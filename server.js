import { Server } from "socket.io";

const io = new Server(3000, {
    cors: true,
});

io.sockets.on("connection", (socket) => {
    console.log("Client has connected!");
});

console.log("Server started.");
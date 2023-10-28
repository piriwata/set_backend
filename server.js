import { Server } from "socket.io";

const io = new Server(3000, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true
    }
});

io.on("connection", (socket) => {
    socket.on("reply", (message) => {
        console.log(message);
    });
});

import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import { registerGameHandlers } from "./sockets/gameSocket";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Replace with client URL in production
        methods: ["GET", "POST"],
    },
});

app.use(cors());
app.use(express.json());

connectDB();

io.on("connection", (socket) => {
    registerGameHandlers(io, socket);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
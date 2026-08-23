import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { unoDB } from "./config/db";
import "./db"; // Initialize all models
import { registerGameHandlers } from "./sockets/gameSocket";
import createAuthRouter from "./routes/auth";
import { UserModel, GameHistoryModel } from "./db";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

app.use(cors());
app.use(express.json());

// DB connection is initialized by importing ./db (models are registered on unoDB)

// Auth routes
app.use("/api/auth", createAuthRouter(UserModel, GameHistoryModel));

app.get("/api/status", (_req, res) => {
    res.json({ success: true, service: "uno-multiplayer-server" });
});

io.on("connection", (socket) => {
    registerGameHandlers(io, socket);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
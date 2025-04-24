import express, { Request, Response } from "express";
import cors from "cors";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.use(cors());
app.use(express.json());

mongoose
    .connect(process.env.MONGO_URI || "", { dbName: "uno" })
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

// Example route
app.get("/", (req: Request, res: Response) => {
    res.send("UNO Multiplayer Server is running.");
});

server.listen(5000, () => {
    console.log("Server running on port 5000");
});
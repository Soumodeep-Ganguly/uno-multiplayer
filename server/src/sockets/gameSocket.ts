import { Server, Socket } from "socket.io";
import { createGame, playCard, drawCard, joinGameRoom, callUno, removePlayer } from "../game/gameLogic";
import { getGameState } from "../utils/game";

export const registerGameHandlers = (io: Server, socket: Socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on("join-room", async ({ roomId, playerName, maxPlayers }) => {
    try {
      if (!roomId || !playerName) {
        socket.emit("error-joining", { message: "Room ID and player name are required" });
        return;
      }

      const room = await getGameState(roomId);
      if (!room && !maxPlayers) {
        socket.emit("error-joining", { message: "Invalid Room ID" });
        return;
      }

      socket.join(roomId);
      const gameState = await joinGameRoom(roomId, { id: socket.id, name: playerName }, maxPlayers);

      // Send room state to all players in the room
      io.to(roomId).emit("room-state", gameState);

      // Notify about new player
      io.to(roomId).emit("player-joined", gameState);

      if (gameState.started) {
        const newGameState = await createGame(roomId);
        io.to(roomId).emit("game-started", newGameState);
      }
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("error-joining", { message: "Failed to join room" });
    }
  });

  socket.on("get-room-state", async ({ roomId }) => {
    const gameState = await getGameState(roomId);
    if (gameState) {
      io.to(roomId).emit("room-state", gameState);
    }
  });

  socket.on("start-game", async ({ roomId }) => {
    try {
      const gameState = await createGame(roomId);
      io.to(roomId).emit("game-started", gameState);
      io.to(roomId).emit("game-updated", gameState);
    } catch (error) {
      console.error("Error starting game:", error);
      socket.emit("error-joining", { message: "Failed to start game" });
    }
  });

  socket.on("play-card", async ({ roomId, card, color }) => {
    const gameState = await playCard(roomId, socket.id, card, color);
    if (gameState) {
      io.to(roomId).emit("game-updated", gameState);
      if (gameState.winner) io.to(roomId).emit("game-over", { winner: gameState.winner });
    } else {
      socket.emit("invalid-move", { message: "Invalid card played." });
    }
  });

  socket.on("draw-card", async ({ roomId }) => {
    const gameState = await drawCard(roomId, socket.id);
    if (gameState) io.to(roomId).emit("game-updated", gameState);
  });

  socket.on("penalty-draw", async ({ roomId }) => {
    const gameState = await drawCard(roomId, socket.id);
    if (gameState) io.to(roomId).emit("game-updated", gameState);
  });

  socket.on("call-uno", async ({ roomId }) => {
    const gameState = await callUno(roomId, socket.id);
    if (gameState) io.to(roomId).emit("game-updated", gameState);
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach(async (roomId) => {
      await removePlayer(roomId, socket.id);
      socket.to(roomId).emit("player-left", socket.id);
      const gameState = await getGameState(roomId);
      if (gameState) io.to(roomId).emit("game-updated", gameState);
    });
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
  });
};
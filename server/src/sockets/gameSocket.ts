import { Server, Socket } from "socket.io";
import { GameState, createGame, playCard, drawCard, joinGameRoom, callUno, removePlayer, getGameState } from "../game/gameLogic";
import { getOrCreateRoom } from "../models/room";

export const registerGameHandlers = (io: Server, socket: Socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on("join-room", async ({ roomId, playerName, maxPlayers }) => {
    try {
      if (!roomId || !playerName) {
        socket.emit("error-joining", { message: "Room ID and player name are required" });
        return;
      }

      const room = await getOrCreateRoom(roomId);
      if (!room) {
        socket.emit("error-joining", { message: "Failed to create room" });
        return;
      }

      socket.join(roomId);
      const gameState = joinGameRoom(roomId, { id: socket.id, name: playerName }, maxPlayers);

      // Send room state to all players in the room
      io.to(roomId).emit("room-state", gameState);

      // Notify about new player
      io.to(roomId).emit("player-joined", gameState);

      if (gameState.started) {
        const newGameState = createGame(roomId);
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

  socket.on("start-game", ({ roomId }) => {
    try {
      const gameState = createGame(roomId);
      // console.log("GAME STATE START GAME", gameState)
      // io.to(roomId).emit("room-state", gameState)
      io.to(roomId).emit("game-started", gameState);
      io.to(roomId).emit("game-updated", gameState);
    } catch (error) {
      console.error("Error starting game:", error);
      socket.emit("error-joining", { message: "Failed to start game" });
    }
  });

  socket.on("play-card", ({ roomId, card, color }) => {
    const gameState = playCard(roomId, socket.id, card, color);
    if (gameState) {
      // console.log("GAME STATE PLAY CARD", gameState)
      io.to(roomId).emit("game-updated", gameState);

      if (gameState.winner) {
        // console.log("PLAY CARD WINNER")
        io.to(roomId).emit("game-over", { winner: gameState.winner });
      }
    } else {
      socket.emit("invalid-move", { message: "Invalid card played." });
    }
  });

  socket.on("draw-card", ({ roomId }) => {
    const gameState = drawCard(roomId, socket.id);
    // console.log("GAME STATE DRAW CARD", gameState)
    if (gameState) {
      io.to(roomId).emit("game-updated", gameState);
    }
  });

  socket.on("penalty-draw", ({ roomId }) => {
    const gameState = drawCard(roomId, socket.id);
    // console.log("GAME STATE PENALTY DRAW", gameState)
    if (gameState) {
      io.to(roomId).emit("game-updated", gameState);
    }
  });

  socket.on("call-uno", ({ roomId }) => {
    const gameState = callUno(roomId, socket.id);
    // console.log("GAME STATE CALL UNO", gameState)
    if (gameState) {
      io.to(roomId).emit("game-updated", gameState);
    }
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach((roomId) => {
      removePlayer(roomId, socket.id);
      socket.to(roomId).emit("player-left", socket.id);
      const gameState = getGameState(roomId);
      if (gameState) {
        io.to(roomId).emit("game-updated", gameState);
      }
    });
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
  });
};
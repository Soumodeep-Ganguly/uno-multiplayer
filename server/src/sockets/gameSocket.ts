import { Server, Socket } from "socket.io";
import { createGame, playCard, drawCard, joinGameRoom, callUno, removePlayer, replay } from "../game/gameLogic";
import { getGameState } from "../utils/game";
import { GameHistoryModel, UserModel } from "../db";

const lastActionAt = new Map<string, number>();
function isRateLimited(socketId: string, roomId: string, ms = 350) {
  const key = `${socketId}:${roomId}`;
  const now = Date.now();
  const last = lastActionAt.get(key) || 0;
  if (now - last < ms) return true;
  lastActionAt.set(key, now);
  return false;
}

export const registerGameHandlers = (io: Server, socket: Socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on("join-room", async ({ roomId, playerName, maxPlayers, uuid }) => {
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
      const gameState = await joinGameRoom(roomId, { id: socket.id, uuid, name: playerName }, maxPlayers);

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
      io.to(roomId).emit("room-state", gameState);
      io.to(roomId).emit("game-started", gameState);
      io.to(roomId).emit("game-updated", gameState);
    } catch (error) {
      console.error("Error starting game:", error);
      socket.emit("error-joining", { message: "Failed to start game" });
    }
  });

  socket.on("play-card", async ({ roomId, card, color }) => {
    if (isRateLimited(socket.id, roomId, 250)) {
      socket.emit("invalid-move", { message: "Too fast. Slow down." });
      return;
    }
    const gameState = await playCard(roomId, socket.id, card, color);      if (gameState) {
      io.to(roomId).emit("game-updated", gameState);
      if (gameState.winner) {
        io.to(roomId).emit("game-over", { winner: gameState.winner });
        // Save game history
        saveGameHistory(roomId, gameState).catch((err) =>
          console.error("Failed to save game history:", err)
        );
      }
    } else {
      socket.emit("invalid-move", { message: "Invalid card played." });
    }
  });

  socket.on("draw-card", async ({ roomId }) => {
    if (isRateLimited(socket.id, roomId, 350)) {
      socket.emit("invalid-move", { message: "Draw on cooldown." });
      return;
    }
    const gameState = await drawCard(roomId, socket.id);
    if (gameState) io.to(roomId).emit("game-updated", gameState);
    else {
      const cur = await getGameState(roomId);
      if (cur) socket.emit("invalid-move", { message: "Cannot draw now." });
    }
  });

  socket.on("penalty-draw", async ({ roomId }) => {
    if (isRateLimited(socket.id, roomId, 350)) {
      socket.emit("invalid-move", { message: "Draw on cooldown." });
      return;
    }
    const gameState = await drawCard(roomId, socket.id);
    if (gameState) io.to(roomId).emit("game-updated", gameState);
    else {
      const cur = await getGameState(roomId);
      if (cur) socket.emit("invalid-move", { message: "Cannot draw now." });
    }
  });

  socket.on("call-uno", async ({ roomId }) => {
    const gameState = await callUno(roomId, socket.id);
    if (gameState) io.to(roomId).emit("game-updated", gameState);
  });

  socket.on("play-again", async ({ roomId }) => {
    const gameState = await replay(roomId);
    if (gameState) {
      io.to(roomId).emit("room-state", gameState);
      io.to(roomId).emit("game-updated", gameState);
      io.to(roomId).emit("game-started", gameState);
    }
  });

  socket.on("leave-room", async ({ roomId }) => {
    await removePlayer(roomId, socket.id);
    socket.to(roomId).emit("player-left", socket.id);
    const gameState = await getGameState(roomId);
    if (gameState) {
      io.to(roomId).emit("room-state", gameState);
      io.to(roomId).emit("game-updated", gameState);
      if (gameState.winner) io.to(roomId).emit("game-over", { winner: gameState.winner });
    } else {
      socket.leave(roomId);
    }
  });

  socket.on("destroy-room", async ({ roomId: targetRoom }) => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;
      await removePlayer(roomId, socket.id);
      socket.to(roomId).emit("player-left", socket.id);
      const gameState = await getGameState(roomId);
      if (gameState) {
        io.to(roomId).emit("room-state", gameState);
        io.to(roomId).emit("game-updated", gameState);
        if (gameState.winner) io.to(roomId).emit("game-over", { winner: gameState.winner });
      }
    }
    socket.leave(targetRoom);
  });

  socket.on("disconnecting", async () => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;
      await removePlayer(roomId, socket.id);
      socket.to(roomId).emit("player-left", socket.id);
      const gameState = await getGameState(roomId);
      if (gameState) {
        io.to(roomId).emit("room-state", gameState);
        io.to(roomId).emit("game-updated", gameState);
        if (gameState.winner) io.to(roomId).emit("game-over", { winner: gameState.winner });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    for (const k of lastActionAt.keys()) if (k.startsWith(socket.id + ":")) lastActionAt.delete(k);
  });
};

// Save game history when a game ends
async function saveGameHistory(
  roomId: string,
  gameState: any
) {
  try {
    const winner = gameState.winner;
    if (!winner) return;

    // Find or create user records for all players using their auth UUID
    const playerRecords = await Promise.all(
      gameState.players.map(async (p: any) => {
        const playerUuid = p.uuid || p.id;
        let user = await UserModel.findOne({ uuid: playerUuid });
        if (!user) {
          // Create a temporary guest record for players without an account
          user = new UserModel({
            uuid: playerUuid,
            name: p.name,
            gameName: p.name,
            email: `${playerUuid}@guest.local`,
            password: "not-used",
            isGuest: true,
          });
          await user.save();
        }
        return {
          userId: user._id,
          uuid: user.uuid,
          gameName: user.gameName || user.name,
          cardsRemaining: p.hand?.length || 0,
          calledUno: p.calledUno || false,
        };
      })
    );

    const winnerRecord = playerRecords.find(
      (p) => p.uuid === winner.id
    );

    await GameHistoryModel.create({
      roomId,
      players: playerRecords,
      winnerId: winnerRecord?.userId || playerRecords[0].userId,
      winnerUuid: winner.id,
      winnerGameName: winner.name || winnerRecord?.gameName || "Unknown",
      totalRounds: gameState.roundNumber || 1,
    });
  } catch (error) {
    console.error("Error saving game history:", error);
  }
}
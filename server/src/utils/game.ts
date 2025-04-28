import { GameStateModel } from "../models/game_state";
import { GameState } from "../types/gameType";

const rooms: { [key: string]: GameState } = {};
const saveTimers: { [key: string]: NodeJS.Timeout } = {};

export async function getGameState(roomId: string): Promise<GameState | undefined> {
  if (rooms[roomId]) return rooms[roomId];

  const dbGame = await GameStateModel.findOne({ roomId }).lean<GameState>();
  if (dbGame) {
    rooms[roomId] = dbGame;
    return dbGame;
  }
  return undefined;
}

export async function setGameState(roomId: string, gameState: GameState): Promise<void> {
  rooms[roomId] = gameState;

  if (saveTimers[roomId]) clearTimeout(saveTimers[roomId]); // Clear old timer if running

  saveTimers[roomId] = setTimeout(async () => {
    await GameStateModel.findOneAndUpdate({ roomId }, gameState, { upsert: true, new: true });
    delete saveTimers[roomId]; // Clean up after save
  }, 5000); // Save after 5 seconds of no activity
}

export async function deleteGameRoom(roomId: string): Promise<void> {
  delete rooms[roomId];
  clearTimeout(saveTimers[roomId]);
  await GameStateModel.deleteOne({ roomId });
}
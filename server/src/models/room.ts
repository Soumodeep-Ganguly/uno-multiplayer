import mongoose, { Document, Schema } from "mongoose";

export interface Player {
  id: string;
  name: string;
}

export interface GameRoom extends Document {
  roomId: string;
  players: Player[];
  gameState: any;
  createdAt: Date; // for optional auto-expiry
}

const playerSchema = new Schema<Player>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
  },
  { _id: false }
);

const gameRoomSchema = new Schema<GameRoom>(
  {
    roomId: { type: String, required: true, unique: true },
    players: { type: [playerSchema], default: [] },
    gameState: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now }, // useful for TTL
  },
  { timestamps: true }
);

export const RoomModel = mongoose.models.Room || mongoose.model<GameRoom>("Room", gameRoomSchema);

// Utility functions

// Get or create a room
export async function getOrCreateRoom(roomId: string): Promise<GameRoom> {
  let room = await RoomModel.findOne({ roomId });
  if (!room) {
    room = new RoomModel({ roomId, players: [], gameState: {} });
    await room.save();
  }
  return room;
}

// Get existing room
export async function getRoom(roomId: string): Promise<GameRoom | null> {
  return RoomModel.findOne({ roomId });
}

// Update (upsert) a room's gameState
export async function setRoomGameState(roomId: string, gameState: any): Promise<void> {
  await RoomModel.findOneAndUpdate(
    { roomId },
    { gameState },
    { upsert: true, new: true }
  );
}

// Delete a room
export async function deleteRoom(roomId: string): Promise<void> {
  await RoomModel.findOneAndDelete({ roomId });
}
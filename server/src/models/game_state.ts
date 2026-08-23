import { Schema, Document, Connection } from "mongoose";
import { Card, GameState, Player } from "../types/gameType";

export interface GameStateDocument extends GameState, Document {}

const CardSchema = new Schema<Card>(
  {
    color: { type: String, required: true },
    type: { type: String, required: true },
    value: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const PlayerSchema = new Schema<Player>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    hand: { type: [CardSchema], default: [] },
    calledUno: { type: Boolean, default: false },
  },
  { _id: false }
);

const GameStateSchema = new Schema<GameStateDocument>(
  {
    roomId: { type: String, required: true },
    players: { type: [PlayerSchema], required: true },
    currentPlayerIndex: { type: Number, required: true },
    currentPlayer: { type: String, required: true },
    direction: { type: Number, required: true },
    discardPile: { type: [CardSchema], required: true },
    deck: { type: [CardSchema], required: true },
    winner: { type: String, default: null },
    started: { type: Boolean, default: false },
    currentColor: { type: String, default: "red" },
    drawStack: { type: Number, default: 0 },
    maxPlayers: { type: Number, default: 4 },
    roundNumber: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Factory function — matches universal-backend pattern
export default (connection: Connection) =>
  connection.model<GameStateDocument>("GameState", GameStateSchema);

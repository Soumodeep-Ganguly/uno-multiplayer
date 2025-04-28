export type Color = "red" | "green" | "blue" | "yellow" | "wild";
export type CardType = "number" | "skip" | "reverse" | "+2" | "wild" | "+4";

export interface Card {
  color: Color;
  type: CardType;
  value?: number | string;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  calledUno: boolean;
}

export interface GameState {
  roomId: string;
  players: Player[];
  currentPlayerIndex: number;
  currentPlayer: string;
  direction: number;
  deck: Card[];
  discardPile: Card[];
  currentColor: Color;
  drawStack: number;
  maxPlayers: number;
  winner?: Player;
  started: boolean;
}

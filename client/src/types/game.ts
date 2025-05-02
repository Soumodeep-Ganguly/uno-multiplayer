export type CardColor = "red" | "blue" | "green" | "yellow" | "wild";

export type CardValue =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "skip"
  | "reverse"
  | "+2"
  | "wild"
  | "+4";

export interface Card {
  id: string;
  color: CardColor;
  value: CardValue;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  calledUno: boolean
}

export interface GameState {
  players: Player[];
  currentCard: Card;
  currentColor: CardColor;
  currentPlayerIndex: number;
  started: boolean;
  maxPlayers: number;
  drawStack: number;
  discardPile: Card[]
  winner?: Player;
}
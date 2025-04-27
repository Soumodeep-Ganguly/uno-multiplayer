import { GameStateModel } from "../models/game_state";

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

export const createDeck = (): Card[] => {
  const colors: Color[] = ["red", "green", "blue", "yellow"];
  const deck: Card[] = [];

  colors.forEach((color) => {
    for (let i = 0; i <= 9; i++) {
      deck.push({ color, type: "number", value: i });
      deck.push({ color, type: "number", value: i });
    }
    deck.push({ color, type: "skip", value: "skip" });
    deck.push({ color, type: "skip", value: "skip" });
    deck.push({ color, type: "reverse", value: "reverse" });
    deck.push({ color, type: "reverse", value: "reverse" });
    deck.push({ color, type: "+2", value: "+2" });
    deck.push({ color, type: "+2", value: "+2" });
  });

  for (let i = 0; i < 4; i++) {
    deck.push({ color: "wild", type: "wild", value: "wild" });
    deck.push({ color: "wild", type: "+4", value: "+4" });
  }

  return shuffleDeck(deck);
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

export const drawCards = (game: GameState, count = 1): Card[] => {
  const cards: Card[] = [];
  for (let i = 0; i < count; i++) {
    if (game.deck.length === 0) {
      const topCard = game.discardPile.pop(); 
      game.deck = shuffleDeck(game.discardPile.splice(0));
      if (topCard) game.discardPile.push(topCard);
    }
    if (game.deck.length) {
      cards.push(game.deck.pop()!);
    }
  }
  return cards;
};

export const advanceTurn = (game: GameState) => {
  if (game.players.length === 0) return;
  game.currentPlayerIndex = (game.currentPlayerIndex + game.direction + game.players.length) % game.players.length;
  game.currentPlayer = game.players[game.currentPlayerIndex].id;
};

export const joinGameRoom = (roomId: string, player: { id: string; name: string }, maxPlayers?: number) => {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      roomId,
      players: [],
      currentPlayerIndex: 0,
      currentPlayer: player.id,
      maxPlayers: maxPlayers ?? 4,
      direction: 1,
      deck: [],
      discardPile: [],
      currentColor: "red",
      drawStack: 0,
      started: false
    };
  }

  // Check if player already exists
  const existingPlayer = rooms[roomId].players.find(p => p.id === player.id);
  if (existingPlayer) {
    return { players: rooms[roomId].players, started: rooms[roomId].started };
  }

  rooms[roomId].players.push({
    id: player.id,
    name: player.name,
    hand: [],
    calledUno: false,
  });

  return { ...rooms[roomId], started: rooms[roomId].started || rooms[roomId].players.length === rooms[roomId].maxPlayers };
};

export const createGame = (roomId: string) => {
  const game = rooms[roomId];
  if (!game) throw new Error("Room not found");
  if (game.players.length < 2) throw new Error("Need at least 2 players to start");
  if (game.deck.length > 0) return game

  const deck = createDeck();

  const tempGame: GameState = { ...game, deck: deck, discardPile: [], players: [], started: false, currentColor: "red", drawStack: 0, direction: 1, currentPlayerIndex: 0, maxPlayers: game.maxPlayers, roomId: roomId };

  const players = game.players.map((player) => ({
    ...player,
    hand: drawCards(tempGame, 7),
    calledUno: false,
  }));

  let firstCard = tempGame.deck.pop()!;
  while (firstCard.color === "wild") {
    tempGame.deck.unshift(firstCard);
    firstCard = tempGame.deck.pop()!;
  }
  const discardPile = [firstCard];

  rooms[roomId] = {
    ...game,
    players,
    currentPlayerIndex: 0,
    direction: 1,
    deck: tempGame.deck,
    discardPile,
    currentColor: discardPile[0].color,
    drawStack: 0,
    started: true
  };

  return rooms[roomId];
};

export const playCard = (roomId: string, playerId: string, card: Card, color?: Color) => {
  const game = rooms[roomId];
  if (!game) return null;
  if (!game.started) return null;

  const player = game.players.find((p) => p.id === playerId);
  if (!player) return null;
  if (game.players[game.currentPlayerIndex].id !== playerId) return null;

  const handCardIndex = player.hand.findIndex((c) =>
    c.color === card.color && c.type === card.type && (c.value === card.value || c.value === undefined)
  );

  if (handCardIndex === -1) return null;

  // Validate move
  const topCard = game.discardPile[game.discardPile.length - 1];
  const isPlayable = !!topCard &&
      (card.color === "wild" ||
        card.color === game.currentColor ||
        card.value === topCard.value);

  // Add logic for +2 and +4 cards
  if (card.type === "+2" || card.type === "+4") {
    if (topCard.type !== card.type && topCard.type !== "+2" && topCard.type !== "+4" && game.drawStack > 1) {
      // If the top card is not a +2 or +4, the player must draw according to drawStack
      return drawCard(roomId, playerId);
    }
  }
  
  if (!isPlayable) return null;

  if (game.drawStack > 1 && card.type !== "+2" && card.type !== "+4") return null;

  const playedCard = player.hand.splice(handCardIndex, 1)[0];
  game.discardPile.push(playedCard);

  // Handle wild card color choice
  if (playedCard.color === "wild" && color) {
    game.currentColor = color;
  } else {
    game.currentColor = playedCard.color;
  }

  switch (playedCard.type) {
    case "skip":
      advanceTurn(game);
      break;
    case "reverse":
      game.direction *= -1;
      if (game.players.length === 2) advanceTurn(game); // In 2 players, reverse = skip
      break;
    case "+2":
      game.drawStack += 2;
      break;
    case "+4":
      game.drawStack += 4;
      break;
    default:
      break;
  }

  // Check UNO Penalty
  if (player.hand.length === 1 && !player.calledUno) player.hand.push(...drawCards(game, 2)); // Forgot to call UNO, draw 2

  // Check for win
  if (player.hand.length === 0) game.winner = player;

  player.calledUno = false; // Reset after turn
  advanceTurn(game);

  return game;
};

export const drawCard = (roomId: string, playerId: string) => {
  const game = rooms[roomId];
  if (!game) return null;
  if (!game.started) return null;

  const player = game.players.find((p) => p.id === playerId);
  if (!player) return null;
  if (game.players[game.currentPlayerIndex].id !== playerId) return null;

  let cardDraw = 1
  if(game.drawStack > 0) cardDraw = game.drawStack

  const drawnCards = drawCards(game, cardDraw);
  player.hand.push(...drawnCards);

  // After drawing, check if they can play any card
  const topCard = game.discardPile[game.discardPile.length - 1];
  const hasPlayableCard = player.hand.some(c =>
    c.color === "wild" ||
    c.color === game.currentColor ||
    c.value === topCard.value
  );

  if (game.drawStack > 0) {
    // If drawing because of drawStack (+2/+4), we *always* advance turn
    advanceTurn(game);
    game.drawStack = 0;
  } else if (!hasPlayableCard) {
    // If no playable card even after drawing, advance turn
    advanceTurn(game);
  }

  return game;
};

export const callUno = (roomId: string, playerId: string) => {
  const game = rooms[roomId];
  if (!game) return null;
  if (!game.started) return null;

  const player = game.players.find((p) => p.id === playerId);
  if (!player) return null;

  player.calledUno = true;
  return game;
};

export const removePlayer = (roomId: string, playerId: string) => {
  const game = rooms[roomId];
  if (!game) return;

  const playerIndex = game.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return;

  const wasCurrentPlayer = game.currentPlayerIndex === playerIndex;

  game.players.splice(playerIndex, 1);

  if (game.players.length === 0) {
    delete rooms[roomId];
    return;
  }

  // Adjust current player index if needed
  if (wasCurrentPlayer) {
    game.currentPlayerIndex = (game.currentPlayerIndex + game.players.length) % game.players.length;
  } else if (game.currentPlayerIndex > playerIndex) {
    game.currentPlayerIndex--;
  }

  game.currentPlayer = game.players[game.currentPlayerIndex].id;

  // If game was in progress, check if we need to end it
  if (game.started && game.players.length < 2) {
    game.started = false;
    game.winner = game.players[0];
  }
};
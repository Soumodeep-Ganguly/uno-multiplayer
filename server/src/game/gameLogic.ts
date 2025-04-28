import { Card, Color, GameState } from "../types/gameType";
import { deleteGameRoom, getGameState, setGameState } from "../utils/game";

// Create and shuffle a clean deck
export const createDeck = (): Card[] => {
  const colors: Color[] = ["red", "green", "blue", "yellow"];
  const deck: Card[] = [];

  colors.forEach((color) => {
    for (let i = 0; i <= 9; i++) {
      deck.push(
        { color, type: "number", value: i },
        { color, type: "number", value: i }
      );
    }
    deck.push(
      { color, type: "skip", value: "skip" },
      { color, type: "skip", value: "skip" },
      { color, type: "reverse", value: "reverse" },
      { color, type: "reverse", value: "reverse" },
      { color, type: "+2", value: "+2" },
      { color, type: "+2", value: "+2" }
    );
  });

  for (let i = 0; i < 4; i++) {
    deck.push(
      { color: "wild", type: "wild", value: "wild" },
      { color: "wild", type: "+4", value: "+4" }
    );
  }

  return shuffleDeck(deck);
};

// Using Fisher-Yates Shuffle
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
    // Put discarded pile into deck if deck is empty
    if (game.deck.length === 0) {
      const topCard = game.discardPile.pop(); 
      game.deck = shuffleDeck(game.discardPile.splice(0));
      if (topCard) game.discardPile.push(topCard);
    }
    if (game.deck.length) cards.push(game.deck.pop()!);
  }
  return cards;
};

export const advanceTurn = (game: GameState) => {
  if (game.players.length === 0) return;
  game.currentPlayerIndex = (game.currentPlayerIndex + game.direction + game.players.length) % game.players.length;
  game.currentPlayer = game.players[game.currentPlayerIndex].id;
};

export const joinGameRoom = async (roomId: string, player: { id: string; name: string }, maxPlayers?: number) => {
  let room = await getGameState(roomId)
  if (!room) {
    room = {
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
    }
    await setGameState(roomId, room)
  }

  // Check if player already exists
  const existingPlayer = room.players.find(p => p.id === player.id);
  if (existingPlayer) return { ...room, started: room.started || room.players.length === room.maxPlayers };

  room.players.push({
    id: player.id,
    name: player.name,
    hand: [],
    calledUno: false,
  });

  if(!maxPlayers) setGameState(roomId, room)

  return { ...room, started: room.started || room.players.length === room.maxPlayers };
};

export const createGame = async (roomId: string) => {
  const game = await getGameState(roomId)
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

  const newGame = {
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

  setGameState(roomId, newGame)

  return newGame;
};

export const playCard = async (roomId: string, playerId: string, card: Card, color?: Color) => {
  const game = await getGameState(roomId);
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
  const isPlayable = !!topCard && (card.color === "wild" || card.color === game.currentColor || card.value === topCard.value);

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
  if (playedCard.color === "wild" && color) game.currentColor = color;
  else game.currentColor = playedCard.color;

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

  player.calledUno = false; // Reset uno call after turn
  advanceTurn(game);
  setGameState(roomId, game)

  return game;
};

export const drawCard = async (roomId: string, playerId: string) => {
  const game = await getGameState(roomId);
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
    // If drawing because of drawStack (+2/+4), we always advance turn
    advanceTurn(game);
    game.drawStack = 0;
  } else if (!hasPlayableCard) {
    // If no playable card even after drawing, advance turn
    advanceTurn(game);
  }

  setGameState(roomId, game)
  return game;
};

export const callUno = async (roomId: string, playerId: string) => {
  const game = await getGameState(roomId);
  if (!game) return null;
  if (!game.started) return null;

  const player = game.players.find((p) => p.id === playerId);
  if (!player) return null;

  player.calledUno = true;
  setGameState(roomId, game)
  return game;
};

export const removePlayer = async (roomId: string, playerId: string) => {
  const game = await getGameState(roomId)
  if (!game) return;

  const playerIndex = game.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return;

  const wasCurrentPlayer = game.currentPlayerIndex === playerIndex;

  game.players.splice(playerIndex, 1);

  if (game.players.length === 0) {
    await deleteGameRoom(roomId);
    return;
  }

  // Adjust current player index if needed
  if (wasCurrentPlayer)  game.currentPlayerIndex = (game.currentPlayerIndex + game.players.length) % game.players.length;
  else if (game.currentPlayerIndex > playerIndex) game.currentPlayerIndex--;

  game.currentPlayer = game.players[game.currentPlayerIndex].id;

  // If game was in progress, check if we need to end it
  if (game.started && game.players.length < 2) {
    game.started = false;
    game.winner = game.players[0];
  }
  await setGameState(roomId, game)
};
import { useState, useEffect } from "react";
import { UnoCard } from "@/components/uno-card";
import { PlayerIndicator } from "@/components/player-indicator";
import { GameControls } from "@/components/game-controls";
import { ColorSelector } from "@/components/color-selector";
import { toast } from "sonner";
import socket from "@/lib/socket";
import { Card, CardColor, GameState, Player } from "@/types/game";

interface GameViewProps {
  onNavigate: (view: "home" | "create-room" | "join-room" | "game") => void;
  roomId: string;
  playerName: string;
}

export function GameView({ onNavigate, roomId, playerName }: GameViewProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isCurrentPlayer, setIsCurrentPlayer] = useState<boolean>(false);
  const [showColorSelector, setShowColorSelector] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState<Card | null>(null);
  const [hasCalledUno, setHasCalledUno] = useState(false);

  useEffect(() => {
    // Join the game room
    socket.emit("join-room", { roomId, playerName });

    socket.on("game-started", (state: GameState) => {
      setGameState(state);
      toast.success("Game started!");
    });

    socket.on("game-updated", (state: GameState) => {
      setGameState(state);
      const me = state.players.find((p) => p.id === socket.id);
      if (me) setHasCalledUno(me.calledUno);
    });

    socket.on("player-joined", (state: GameState) => {
      setGameState((prev) =>
        prev ? { ...prev, players: state.players } : null
      );
      if (!state.started) {
        toast.info("Waiting for more players to join...");
      }
    });

    socket.on("player-left", (playerId: string) => {
      const player = gameState?.players.find((p) => p.id === playerId);
      if (player) {
        toast.info(`${player.name} left the game`);
      }
    });

    socket.on("invalid-move", ({ message }: { message: string }) => {
      toast.error(message);
    });

    socket.on("game-over", ({ winner }: { winner: Player }) => {
      toast.success(
        `${winner.id === socket.id ? "You" : winner.name} won the game!`
      );
      setTimeout(() => {
        onNavigate("home");
      }, 6000);
    });

    return () => {
      socket.off("game-started");
      socket.off("game-updated");
      socket.off("player-joined");
      socket.off("player-left");
      socket.off("invalid-move");
      socket.off("game-over");
    };
  }, [roomId, playerName, onNavigate]);

  useEffect(() => {
    if (gameState) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      setIsCurrentPlayer(currentPlayer?.id === socket.id);
    }
  }, [gameState]);

  const drawCard = () => {
    if (!isCurrentPlayer) return;
    socket.emit("draw-card", { roomId });
  };

  const handleColorSelection = (color: CardColor) => {
    if (pendingWildCard) {
      socket.emit("play-card", {
        roomId,
        card: pendingWildCard,
        color,
      });
      setPendingWildCard(null);
      setShowColorSelector(false);
    }
  };

  const playCard = (card: Card) => {
    if (!isCurrentPlayer || !gameState) return;

    console.log("Trying to play card:", card, "Current player:", socket.id);

    const isPlayable =
      !!topCard &&
      (card.color === "wild" ||
        card.color === gameState.currentColor ||
        card.value === topCard.value);

    if (isPlayable) {
      if (card.color === "wild") {
        setPendingWildCard(card);
        setShowColorSelector(true);
      } else {
        socket.emit("play-card", {
          roomId,
          card,
          color: card.color,
        });

        const playerHand =
          gameState.players.find((p) => p.id === socket.id)?.hand || [];
        if (playerHand.length === 2 && !hasCalledUno) {
          toast.error("Forgot to call UNO!", {
            description: "You'll draw 2 cards as penalty",
          });
          socket.emit("penalty-draw", { roomId });
        }
      }
    } else {
      toast.error("Invalid move!", {
        description: "Card must match color or value",
      });
    }
  };

  const callUno = () => {
    socket.emit("call-uno", { roomId });
    toast.info("You have called UNO!");
    setHasCalledUno(true);
  };

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500">
        <div className="text-white text-2xl">Loading game...</div>
      </div>
    );
  }

  const myHand = gameState.players.find((p) => p.id === socket.id)?.hand || [];

  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500">
      {/* Top section - other players */}
      <div className="flex justify-center p-4 gap-4 flex-wrap">
        {gameState.players
          .filter((p) => p.id !== socket.id)
          .map((player) => (
            <PlayerIndicator
              key={player.id}
              name={player.name}
              cardCount={player.hand.length}
              isActive={
                player.id ===
                gameState.players[gameState.currentPlayerIndex]?.id
              }
            />
          ))}
      </div>

      {/* Middle section - play area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="mb-4 text-white text-xl font-bold">
          Current Color:
          <span
            className={`ml-2 px-3 py-1 rounded-full ${
              gameState.currentColor === "red"
                ? "bg-red-500"
                : gameState.currentColor === "blue"
                ? "bg-blue-500"
                : gameState.currentColor === "green"
                ? "bg-green-500"
                : gameState.currentColor === "yellow"
                ? "bg-yellow-500"
                : "bg-gray-500"
            }`}
          >
            {gameState?.currentColor?.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center justify-center gap-8 mb-8">
          {/* Draw pile */}
          <div
            className="h-32 w-20 bg-gray-700 rounded-xl border-2 border-white shadow-lg cursor-pointer hover:scale-105 transition-transform"
            onClick={isCurrentPlayer ? drawCard : undefined}
          >
            <div className="h-full w-full flex items-center justify-center text-white font-bold">
              DRAW
            </div>
          </div>

          {/* Current card */}
          {topCard && (
            <div className="transform hover:scale-105 transition-transform">
              <UnoCard card={topCard} />
            </div>
          )}
        </div>

        {/* Color selector for wild cards */}
        {showColorSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <ColorSelector onSelectColor={handleColorSelection} />
          </div>
        )}

        {/* Game controls */}
        <div className="w-full max-w-md mx-auto">
          <GameControls
            onCallUno={callUno}
            canCallUno={myHand.length === 2 && !hasCalledUno}
            isPlayerTurn={isCurrentPlayer}
            onExitGame={() => onNavigate("home")}
            onDrawCard={isCurrentPlayer ? drawCard : undefined}
          />
        </div>
      </div>

      {/* Bottom section - player's hand */}
      <div className="p-4 bg-black/20 backdrop-blur-sm">
        <div className="flex justify-center items-center gap-2 flex-wrap">
          {myHand.map((card) => (
            <div
              key={card.id}
              className={`transform transition-transform duration-200 ${
                isCurrentPlayer ? "hover:-translate-y-4" : ""
              }`}
            >
              <UnoCard
                card={card}
                onClick={() => isCurrentPlayer && playCard(card)}
                isPlayable={
                  !!topCard &&
                  (card.color === "wild" ||
                    card.color === gameState.currentColor ||
                    card.value === topCard.value)
                }
                disabled={!isCurrentPlayer}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

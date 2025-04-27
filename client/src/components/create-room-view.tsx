import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlayerList } from "@/components/player-list";
import { ArrowLeft, Copy } from "lucide-react";
import { UnoLogo } from "@/components/uno-logo";
import { toast } from "sonner";
import socket from "@/lib/socket";
import { GameState } from "@/types/game";

interface CreateRoomViewProps {
  onNavigate: (view: "home" | "create-room" | "join-room" | "game") => void;
  playerName: string;
  setPlayerName: (name: string) => void;
  maxPlayers: string;
  setMaxPlayers: (max: string) => void;
  roomId: string;
  setRoomId: (id: string) => void;
  players: string[];
  setPlayers: (players: string[]) => void;
}

export function CreateRoomView({
  onNavigate,
  playerName,
  setPlayerName,
  maxPlayers,
  setMaxPlayers,
  roomId,
  setRoomId,
  players,
  setPlayers,
}: CreateRoomViewProps) {
  const [roomCreated, setRoomCreated] = useState(false);
  const [canStartGame, setCanStartGame] = useState(false);

  // Generate a random room ID when the component mounts
  useEffect(() => {
    if (!roomId) {
      const generatedId = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      setRoomId(generatedId);
    }
  }, [roomId, setRoomId]);

  useEffect(() => {
    if (roomCreated) {
      socket.on("player-joined", (state: GameState) => {
        setPlayers(state.players.map((p) => p.name));
        if (state.players.length >= 2) {
          setCanStartGame(true);
        }
      });
      socket.on("player-left", (playerId: string) => {
        console.log("PLAYER LEFT ", playerId);
        // The server will send an updated player list to room-state
        socket.emit("get-room-state", { roomId });
      });
      socket.on("room-state", (state: GameState) => {
        setPlayers(state.players.map((p) => p.name));
        setCanStartGame(state.players.length >= 2 && !state.started);
      });

      // The server will send an updated player list to room-state
      socket.emit("get-room-state", { roomId });
    }

    return () => {
      socket.off("player-joined");
      socket.off("player-left");
      socket.off("room-state");
    };
  }, [roomCreated, roomId, setPlayers]);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast("Room ID copied!", {
      description: "Share this with your friends to join the game.",
    });
  };

  const createNewRoom = () => {
    if (!playerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setPlayers([playerName]);
    setRoomCreated(true);
    socket.emit("join-room", { roomId, playerName, maxPlayers });
  };

  const startGame = () => {
    if (players.length < 2) {
      toast.error("Need at least 2 players to start");
      return;
    }
    socket.emit("start-game", { roomId });
    onNavigate("game");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-4 border-yellow-400 shadow-2xl">
          <CardHeader className="flex flex-col items-center">
            <UnoLogo className="w-32 h-auto mb-2" />
            <CardTitle className="text-2xl font-extrabold">
              Create Room
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!roomCreated && (
              <div className="space-y-2">
                <Label htmlFor="playerName">Your Name</Label>
                <Input
                  id="playerName"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.trim() || value === "") setPlayerName(value);
                  }}
                  className="border-2"
                  maxLength={20}
                />
              </div>
            )}

            {!roomCreated && (
              <div className="space-y-2">
                <Label htmlFor="maxPlayers">Number of Players</Label>
                <Select value={maxPlayers} onValueChange={setMaxPlayers}>
                  <SelectTrigger
                    id="maxPlayers"
                    className="border-2 w-full bg-gray-700 text-white"
                  >
                    <SelectValue placeholder="Select max players" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Players</SelectItem>
                    <SelectItem value="3">3 Players</SelectItem>
                    <SelectItem value="4">4 Players</SelectItem>
                    <SelectItem value="5">5 Players</SelectItem>
                    <SelectItem value="6">6 Players</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Room ID</Label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-3 bg-gray-100 rounded-md font-mono text-center text-lg font-bold">
                  {roomId}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyRoomId}
                  className="border-2 bg-gray-700 text-white hover:text-white"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {!roomCreated && (
              <div className="space-y-2">
                <Button
                  variant="default"
                  size="lg"
                  className="w-full text-lg bg-gray-700 text-white font-bold transition-all transform hover:scale-105"
                  onClick={createNewRoom}
                  disabled={!playerName.trim()}
                >
                  Create Room
                </Button>
              </div>
            )}

            {roomCreated && (
              <div className="space-y-2">
                <Label>
                  Players ({players.length}/{maxPlayers})
                </Label>
                <PlayerList players={players} host={playerName} />
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                className="border-2 text-white hover:text-white"
                onClick={() => onNavigate("home")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {roomCreated && (
                <Button
                  disabled={!canStartGame}
                  className={`bg-green-500 hover:bg-green-600 ${
                    !canStartGame
                      ? "opacity-50 cursor-not-allowed"
                      : "transform hover:scale-105"
                  }`}
                  onClick={startGame}
                >
                  Start Game
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

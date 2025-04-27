import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { UnoLogo } from "@/components/uno-logo";
import { toast } from "sonner";
import socket from "@/lib/socket";
import { GameState } from "@/types/game";

interface JoinRoomViewProps {
  onNavigate: (view: "home" | "create-room" | "join-room" | "game") => void;
  playerName: string;
  setPlayerName: (name: string) => void;
  roomId: string;
  setRoomId: (id: string) => void;
}

export function JoinRoomView({
  onNavigate,
  playerName,
  setPlayerName,
  roomId,
  setRoomId,
}: JoinRoomViewProps) {
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    socket.on("room-state", (state: GameState) => {
      if (state.started) {
        onNavigate("game");
      }
    });
    socket.on("error-joining", ({ message }: { message: string }) => {
      setIsJoining(false);
      toast.error("Error joining room", {
        description: message,
      });
    });

    return () => {
      socket.off("room-state");
      socket.off("error-joining");
    };
  }, [onNavigate]);

  const handleJoin = () => {
    if (!roomId || !playerName.trim()) {
      toast.error("Error", {
        description: "Please enter both room ID and your name",
      });
      return;
    }

    setIsJoining(true);
    socket.emit("join-room", { roomId, playerName });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-4 border-blue-400 shadow-2xl">
          <CardHeader className="flex flex-col items-center">
            <UnoLogo className="w-32 h-auto mb-2" />
            <CardTitle className="text-2xl font-extrabold">Join Room</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="roomId">Room ID</Label>
              <Input
                id="roomId"
                placeholder="Enter 6-character room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                maxLength={6}
                className="border-2 font-mono text-center text-lg uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="playerName">Your Name</Label>
              <Input
                id="playerName"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.trim() || value === "") {
                    setPlayerName(value);
                  }
                }}
                className="border-2"
                maxLength={20}
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                className="border-2 text-white hover:text-white"
                onClick={() => onNavigate("home")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              <Button
                onClick={handleJoin}
                disabled={isJoining || !playerName.trim() || !roomId}
                className="transform hover:scale-105"
              >
                {isJoining ? "Joining..." : "Join Game"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

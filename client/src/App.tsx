import { useState } from "react";
import { HomeView } from "./components/home-view";
import { CreateRoomView } from "./components/create-room-view";
import { JoinRoomView } from "./components/join-room-view";
import { GameView } from "./components/game-view";
import { Toaster } from "./components/ui/sonner";

// Define the possible views/states of application
type AppView = "home" | "create-room" | "join-room" | "game";

export default function UnoGame() {
  const [currentView, setCurrentView] = useState<AppView>("home");
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [players, setPlayers] = useState<string[]>([]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 w-[100vw]">
      {currentView === "home" && <HomeView onNavigate={setCurrentView} />}

      {currentView === "create-room" && (
        <CreateRoomView
          onNavigate={setCurrentView}
          playerName={playerName}
          setPlayerName={setPlayerName}
          maxPlayers={maxPlayers}
          setMaxPlayers={setMaxPlayers}
          roomId={roomId}
          setRoomId={setRoomId}
          players={players}
          setPlayers={setPlayers}
        />
      )}

      {currentView === "join-room" && (
        <JoinRoomView
          onNavigate={setCurrentView}
          playerName={playerName}
          setPlayerName={setPlayerName}
          roomId={roomId}
          setRoomId={setRoomId}
        />
      )}

      {currentView === "game" && (
        <GameView
          onNavigate={setCurrentView}
          playerName={playerName}
          roomId={roomId}
        />
      )}

      <Toaster position="top-center" expand={false} richColors closeButton />
    </div>
  );
}

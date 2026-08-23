import { VolumeX, Volume2, Home } from "lucide-react";
import { useEffect } from "react";

interface GameControlsProps {
  onCallUno: () => void;
  canCallUno: boolean;
  isPlayerTurn: boolean;
  onExitGame: () => void;
  onDrawCard?: () => void;
  muteContol: () => void;
  isMuted: boolean;
}

export function GameControls({
  onCallUno,
  canCallUno,
  isPlayerTurn,
  onExitGame,
  onDrawCard,
  muteContol,
  isMuted,
}: GameControlsProps) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "u" && canCallUno) {
        onCallUno();
      }
      if (e.key.toLowerCase() === "m" && muteContol) {
        muteContol();
      }
      if (e.key.toLowerCase() === "d" && isPlayerTurn && onDrawCard) {
        onDrawCard();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [canCallUno, onCallUno, isPlayerTurn, onDrawCard, muteContol]);

  return (
    <div className="flex justify-between items-center gap-4 p-4 bg-black/20 backdrop-blur-sm rounded-lg">
      <div className="flex gap-2">
        <button
          className="h-8 px-3 rounded-md inline-flex items-center justify-center gap-2 text-sm font-medium border border-white/40 bg-transparent text-white hover:bg-white/20 transition-all"
          onClick={onExitGame}
        >
          <Home className="h-4 w-4" />
          Exit
        </button>

        <button
          className="h-8 px-3 rounded-md inline-flex items-center justify-center gap-2 text-sm font-medium border border-white/40 bg-transparent text-white hover:bg-white/20 transition-all"
          onClick={() => muteContol()}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCallUno}
          disabled={!canCallUno}
          className={`h-10 px-6 rounded-md inline-flex items-center justify-center gap-2 font-extrabold text-xl bg-red-600 hover:bg-red-700 text-white transition-all ${
            canCallUno ? "animate-pulse shadow-lg" : "opacity-50"
          }`}
        >
          UNO!
        </button>
      </div>
    </div>
  );
}

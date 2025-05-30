import { Button } from "@/components/ui/button";
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
        <Button
          variant="outline"
          size="sm"
          className="text-white border-white hover:bg-white/20 hover:text-white"
          onClick={onExitGame}
        >
          <Home className="mr-2 h-4 w-4" />
          Exit
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-white border-white hover:bg-white/20 hover:text-white"
          onClick={() => muteContol()}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={onCallUno}
          disabled={!canCallUno}
          className={`bg-red-600 hover:bg-red-700 text-white font-extrabold hover:text-white text-xl px-6 py-2 ${
            canCallUno ? "animate-pulse shadow-lg" : "opacity-50"
          }`}
        >
          UNO!
        </Button>
      </div>
    </div>
  );
}

import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

type CardColor = "red" | "blue" | "green" | "yellow";

interface ColorSelectorProps {
  onSelectColor: (color: CardColor) => void;
  onClose: () => void;
}

// Tailwind can't generate classes built dynamically (e.g. `bg-${color}-500`),
// so map each color to its full literal class names.
const colorClasses: Record<CardColor, string> = {
  red: "bg-red-500 hover:bg-red-600",
  blue: "bg-blue-500 hover:bg-blue-600",
  green: "bg-green-500 hover:bg-green-600",
  yellow: "bg-yellow-500 hover:bg-yellow-600",
};

export function ColorSelector({ onSelectColor, onClose }: ColorSelectorProps) {
  return (
    <Card className="relative p-4 bg-black/20 backdrop-blur-sm">
      {onClose && (
        <X
          className="absolute top-4 right-3 cursor-pointer text-white hover:text-red-400 transition"
          onClick={onClose}
        />
      )}

      <div className="text-white text-center mb-4 font-bold">
        Choose a color
      </div>
      <div className="grid grid-cols-2 gap-4">
        {(["red", "blue", "green", "yellow"] as const).map((color) => (
          <div
            key={color}
            className={`${colorClasses[color]} h-16 w-20 font-bold text-white border rounded flex items-center justify-center cursor-pointer transition-transform hover:scale-105`}
            onClick={() => onSelectColor(color)}
          >
            {color.charAt(0).toUpperCase() + color.slice(1)}
          </div>
        ))}
      </div>
    </Card>
  );
}

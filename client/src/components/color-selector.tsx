import { Card } from "@/components/ui/card";

type CardColor = "red" | "blue" | "green" | "yellow";

interface ColorSelectorProps {
  onSelectColor: (color: CardColor) => void;
}

export function ColorSelector({ onSelectColor }: ColorSelectorProps) {
  return (
    <Card className="p-4 bg-black/20 backdrop-blur-sm">
      <div className="text-white text-center mb-4 font-bold">
        Choose a color
      </div>
      <div className="grid grid-cols-2 gap-4">
        {(["red", "blue", "green", "yellow"] as const).map((color) => (
          <div
            key={color}
            className={`bg-${color}-500 hover:bg-${color}-600 h-16 w-20 font-bold text-white border rounded flex items-center justify-center cursor-pointer transition-transform hover:scale-105`}
            onClick={() => onSelectColor(color)}
          >
            {color.charAt(0).toUpperCase() + color.slice(1)}
          </div>
        ))}
      </div>
    </Card>
  );
}

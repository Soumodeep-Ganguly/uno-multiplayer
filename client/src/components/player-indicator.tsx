import { Card } from "@/components/ui/card";

interface PlayerIndicatorProps {
  name: string;
  cardCount: number;
  isActive: boolean;
}

export function PlayerIndicator({
  name,
  cardCount,
  isActive,
}: PlayerIndicatorProps) {
  return (
    <div
      className={`transition-all duration-300 ease-in-out ${
        isActive ? "scale-110" : ""
      }`}
    >
      <Card
        className={`w-24 p-2 text-center ${
          isActive
            ? "border-2 border-yellow-400 shadow-yellow-400/20 shadow-lg"
            : ""
        }`}
      >
        <div className="font-bold truncate">{name}</div>
        <div className="text-sm text-gray-500">{cardCount} cards</div>
        <div className="mt-1 flex justify-center">
          {Array.from({ length: Math.min(cardCount, 5) }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-4 bg-gray-800 border border-white rounded-sm -ml-1 first:ml-0"
            />
          ))}
          {cardCount > 5 && (
            <div className="text-xs ml-1">+{cardCount - 5}</div>
          )}
        </div>
      </Card>
    </div>
  );
}

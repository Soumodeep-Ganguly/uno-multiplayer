interface CardProps {
  card: {
    color: "red" | "blue" | "green" | "yellow" | "wild";
    value: string;
  };
  onClick?: () => void;
  isPlayable?: boolean;
  disabled?: boolean;
  className?: string;
}

export function UnoCard({
  card,
  onClick,
  isPlayable = false,
  disabled = false,
  className,
}: CardProps) {
  const { color, value } = card;

  // Determine background color
  const bgColor =
    color === "red"
      ? "bg-red-500"
      : color === "blue"
      ? "bg-blue-500"
      : color === "green"
      ? "bg-green-500"
      : color === "yellow"
      ? "bg-yellow-500"
      : "bg-black";

  // Determine text color
  const textColor = color === "yellow" ? "text-black" : "text-white";

  // Determine symbol/number
  let displayValue = value;
  if (value === "skip") displayValue = "⊘";
  if (value === "reverse") displayValue = "↺";
  if (value === "+2") displayValue = "+2";
  if (value === "wild") displayValue = "W";
  if (value === "+4") displayValue = "+4";

  return (
    <div
      className={`relative h-32 w-20 rounded-xl ${bgColor} ${textColor} flex flex-col items-center justify-center border-2 border-white shadow-lg overflow-hidden transition-all duration-200 ${
        isPlayable && !disabled
          ? "cursor-pointer scale-110 hover:scale-110 hover:shadow-xl"
          : ""
      } ${disabled ? "opacity-50" : ""} ${className ?? ""}`}
      onClick={isPlayable && !disabled ? onClick : undefined}
    >
      {/* Top-left corner */}
      <div className="absolute top-2 left-2 font-bold text-lg">
        {displayValue}
      </div>

      {/* Bottom-right corner */}
      <div className="absolute bottom-2 right-2 font-bold text-lg transform rotate-180">
        {displayValue}
      </div>

      {/* Center design */}
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
        <div
          className={`w-14 h-14 ${bgColor} rounded-full flex items-center justify-center transform -rotate-12`}
        >
          {value === "wild" || value === "wild4" ? (
            <div className="grid grid-cols-2 gap-1">
              <div className="w-5 h-5 bg-red-500 rounded-full"></div>
              <div className="w-5 h-5 bg-blue-500 rounded-full"></div>
              <div className="w-5 h-5 bg-yellow-500 rounded-full"></div>
              <div className="w-5 h-5 bg-green-500 rounded-full"></div>
            </div>
          ) : (
            <span className="text-3xl font-bold">{displayValue}</span>
          )}
        </div>
      </div>

      {/* Playable indicator */}
      {isPlayable && !disabled && (
        <div className="absolute inset-0 border-4 border-green-400 rounded-xl animate-pulse"></div>
      )}
    </div>
  );
}

import { UnoCard } from "@/components/uno-card";

interface CardPileProps {
  card: {
    color: "red" | "blue" | "green" | "yellow" | "wild";
    value: string;
  };
}

export function CardPile({ card }: CardPileProps) {
  return (
    <div className="relative">
      {/* Shadow cards to create pile effect */}
      <div className="absolute -bottom-1 -right-1 opacity-30">
        <UnoCard card={card} />
      </div>
      <div className="absolute -bottom-0.5 -right-0.5 opacity-60">
        <UnoCard card={card} />
      </div>

      {/* Top card */}
      <UnoCard card={card} />
    </div>
  );
}

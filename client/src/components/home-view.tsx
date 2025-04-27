import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnoLogo } from "@/components/uno-logo";

interface HomeViewProps {
  onNavigate: (view: "home" | "create-room" | "join-room" | "game") => void;
}

export function HomeView({ onNavigate }: HomeViewProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-4 border-yellow-400 shadow-2xl">
          <CardHeader className="flex flex-col items-center">
            <UnoLogo className="w-48 h-auto mb-4" />
            <CardTitle className="text-3xl font-extrabold text-center">
              Multiplayer UNO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              variant="default"
              size="lg"
              className="w-full text-lg font-bold transition-all bg-gray-700 transform hover:scale-105"
              onClick={() => onNavigate("create-room")}
            >
              Create Room
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="w-full text-lg font-bold bg-gray-700 transition-all transform hover:scale-105 text-white hover:text-white"
              onClick={() => onNavigate("join-room")}
            >
              Join Room
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

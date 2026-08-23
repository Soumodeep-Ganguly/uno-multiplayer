import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnoLogo } from "@/components/uno-logo";
import { useAuth } from "@/lib/auth-context";
import { User, LogIn } from "lucide-react";

interface HomeViewProps {
  onNavigate: (view: "home" | "create-room" | "join-room" | "game" | "profile" | "auth") => void;
}

export function HomeView({ onNavigate }: HomeViewProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-4 border-yellow-400 shadow-2xl">
          <CardHeader className="flex flex-col items-center">
            <UnoLogo className="w-48 h-auto mb-4" />
            <CardTitle className="text-3xl font-extrabold text-center">
              Multiplayer UNO
            </CardTitle>
            {!isLoading && user && (
              <p className="text-sm text-gray-500 mt-1">
                Playing as <span className="font-bold">{user.gameName}</span>
                {user.isGuest && " (Guest)"}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <button
              className="w-full h-10 px-6 rounded-md inline-flex items-center justify-center gap-2 text-lg font-bold transition-all bg-gray-700 text-white hover:bg-gray-600 transform hover:scale-105"
              onClick={() => onNavigate("create-room")}
            >
              Create Room
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <button
              className="w-full h-10 px-6 rounded-md inline-flex items-center justify-center gap-2 text-lg font-bold transition-all bg-gray-700 text-white hover:bg-gray-600 transform hover:scale-105"
              onClick={() => onNavigate("join-room")}
            >
              Join Room
            </button>

            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 h-10 px-4 rounded-md inline-flex items-center justify-center gap-2 font-bold border-2 border-gray-300 bg-white text-gray-900 hover:bg-gray-100 transition-all"
                onClick={() => onNavigate("profile")}
              >
                <User className="h-4 w-4" />
                Profile
              </button>
              {!isAuthenticated && !isLoading && (
                <button
                  className="flex-1 h-10 px-4 rounded-md inline-flex items-center justify-center gap-2 font-bold border-2 border-green-500 bg-white text-green-700 hover:bg-green-50 transition-all"
                  onClick={() => onNavigate("auth")}
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

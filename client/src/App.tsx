import { useEffect } from "react";
import socket from "./socket";

function App() {
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div>
      <h1>UNO Multiplayer</h1>
    </div>
  );
}

export default App;

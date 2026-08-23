import { io } from "socket.io-client";

// VITE_SOCKET_URL should point to the base server URL.
// The /uno namespace is appended automatically.
//   Standalone server: VITE_SOCKET_URL=http://localhost:8080
//   Universal-backend: VITE_SOCKET_URL=http://localhost:8080
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8080";

const socket = io(`${SOCKET_URL}/uno`, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected from server:", reason);
});

export default socket; 
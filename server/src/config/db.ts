import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn(
    "[db] MONGODB_URI is not set. Falling back to local MongoDB."
  );
}

// Create a named connection for the UNO game database
// Matches the universal-backend pattern: mongoose.createConnection()
const unoDB = mongoose.createConnection(
  `${MONGODB_URI || "mongodb://127.0.0.1:27017/"}uno-game?retryWrites=true&w=majority`,
  { serverSelectionTimeoutMS: 10000 }
);

unoDB.on("error", (err) => {
  console.error("[db] MongoDB connection error:", err.message);
});

unoDB.once("open", () => {
  console.log("[db] MongoDB connected (uno-game)");
});

export { unoDB };
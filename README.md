# 🎉 UNO Multiplayer

A real-time UNO card game built with React + Node.js + Socket.IO.

Play with friends, shout UNO!, and enjoy a chaotic card-flinging experience. Supports stacking +2/+4, reverse, skip, and wild cards. Built with 💜 TailwindCSS, TypeScript, and some WebSocket magic.

[![Play Demo](https://soumodeep.web.app/images/projects/uno.png)](https://uno-card-game.web.app)

---

🎮 How to Play

1. Create or join a room with a unique room ID.

2. Wait for other players to join.

3. Play your cards according to UNO rules:

   - Match color or value.
   - Use wild cards to change color.
   - Call "UNO" when you have one card left!

4. First player to discard all cards wins!

---

## 🚀 Tech Stack

| Frontend     | Backend        |
| ------------ | -------------- |
| Vite + React | Node + Express |
| TailwindCSS  | Socket.IO      |
| shadcn/ui    | MongoDB        |
| TypeScript   | Mongoose       |

---

## 🎮 Features

- **Real-time Multiplayer** (Socket.IO)
- Supports **Skip**, **Reverse**, **+2**, **Wild**, **+4**
- Stackable Draw Cards
- **UNO Call** penalty (don't forget to press the button 👀)
- Auto-shuffle deck when empty
- Responsive design (mobile-friendly)

---

## 🛠️ Setup

### System I Used

- Node.js v20.18.1
- MongoDB (local or Atlas)

### ENV in server

- MONGO_URI
- PORT

### Clone & Install

```bash
git clone https://github.com/Soumodeep-Ganguly/uno-multiplayer.git
cd uno-multiplayer
cd client
npm install
cd ../server
npm install
npm run dev # Will start both the client and server concurrently
```

---

❤️ Contributing
PRs welcome! Open an issue first to discuss changes.

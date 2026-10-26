import 'dotenv/config';
import { createServer } from 'node:http';
import path from 'node:path';
import express from 'express';
import { Server } from 'socket.io';

const PORT = Number(process.env.PORT ?? 3000);
const PUBLIC_DIR = path.resolve(process.cwd(), 'dist/public');

const app = express();
app.use(express.static(PUBLIC_DIR));
// SPA fallback: toute URL (ex. /room/player) renvoie index.html
app.use((_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

const httpServer = createServer(app);
const io = new Server(httpServer);

io.on('connection', (socket) => {
  console.log(`socket connected: ${socket.id}`);
});

httpServer.listen(PORT, () => console.log(`Red Tetris listening on http://localhost:${PORT}`));

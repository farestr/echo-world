import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const rooms = new Map();

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

function code() { return crypto.randomBytes(3).toString('hex').toUpperCase(); }
function send(ws, msg) { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); }
function broadcast(room, msg) { for (const p of room.players.values()) send(p.ws, msg); }

wss.on('connection', ws => {
  let playerId = crypto.randomUUID();
  let room = null;

  ws.on('message', raw => {
    let msg; try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type === 'create') {
      if (room) return;
      const roomCode = code();
      room = { code: roomCode, started: false, players: new Map(), created: Date.now() };
      rooms.set(roomCode, room);
      room.players.set(playerId, { ws, role: 'force', name: String(msg.name || 'FORCE').slice(0, 16), x: 0, y: 1, z: 3, ry: 0 });
      send(ws, { type: 'joined', room: roomCode, id: playerId, role: 'force' });
      send(ws, { type: 'state', players: [...room.players.values()].map(({ws, ...p}, i) => ({ id: [...room.players.keys()][i], ...p })) });
      return;
    }
    if (msg.type === 'join') {
      if (room) return;
      const target = rooms.get(String(msg.room || '').toUpperCase());
      if (!target || target.players.size >= 2) return send(ws, { type: 'error', message: 'Room unavailable.' });
      room = target;
      room.players.set(playerId, { ws, role: 'flow', name: String(msg.name || 'FLOW').slice(0, 16), x: 3, y: 1, z: 3, ry: 0 });
      send(ws, { type: 'joined', room: room.code, id: playerId, role: 'flow' });
      broadcast(room, { type: 'state', players: [...room.players.entries()].map(([id, p]) => ({ id, role: p.role, name: p.name, x:p.x,y:p.y,z:p.z,ry:p.ry })) });
      return;
    }
    if (!room) return;
    if (msg.type === 'start' && room.players.size === 2) {
      room.started = true; broadcast(room, { type: 'started' }); return;
    }
    if (msg.type === 'move') {
      const p = room.players.get(playerId); if (!p) return;
      p.x = Number(msg.x)||0; p.y=Number(msg.y)||1; p.z=Number(msg.z)||0; p.ry=Number(msg.ry)||0;
      for (const [id, other] of room.players) if (id !== playerId) send(other.ws, { type:'peer', id:playerId, role:p.role, name:p.name, x:p.x,y:p.y,z:p.z,ry:p.ry });
      return;
    }
    if (msg.type === 'event') { broadcast(room, { type:'event', event: msg.event, id: playerId }); return; }
    if (msg.type === 'ping') send(ws, {type:'pong'});
  });

  ws.on('close', () => {
    if (!room) return;
    room.players.delete(playerId);
    broadcast(room, { type:'left', id:playerId });
    if (room.players.size === 0) rooms.delete(room.code);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', () => console.log(`Echo World listening on ${port}`));

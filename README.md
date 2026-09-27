# Echo World — Co-op Adventure Vertical Slice

A browser-based real-time co-op 3D adventure prototype with an original visual direction.

## Deploy

1. Push this repository to GitHub.
2. On Render create a **Web Service**.
3. Environment: Node.
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Root Directory: blank.
7. No environment variables are required.

The server binds to `0.0.0.0` and uses Render's `PORT` automatically. WebSocket connections use the same origin.

## Local

```bash
npm install
npm run dev
```

For production:

```bash
npm install
npm run build
npm start
```

## Controls

WASD move, Space jump, Shift dash, Q ability, E interact near the Ancient Gate.

## Concept

Chapter I: The Wilds. Two roles: FORCE and FLOW. The vertical slice focuses on cinematic presentation, movement, real-time player sync, and cooperative abilities rather than traditional puzzle solving.

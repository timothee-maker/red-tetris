# Plan — Red Tetris

## Context

42 project "Red Tetris": an online multiplayer Tetris, written entirely in JavaScript/TypeScript (browser client + Node.js server connected through socket.io). The project folder started empty. Node v23.11 is installed.

Constraints from the subject that drive the whole design:

- **Client**: no `this`, board/piece logic as **pure functions**, modern framework (React), SPA, no `<table>`, no canvas or SVG, no jQuery. Layout is done with grid or flexbox.
- **Server**: object-oriented. At minimum, `Player`, `Piece` and `Game` classes.
- The server serves `index.html` + `bundle.js` over HTTP. Game URL: `/<room>/<player_name>`.
- All players in a game receive **the same sequence of pieces, at the same positions**.
- Tests: ≥ 70% statements/functions/lines, ≥ 50% branches.
- No secrets in the repo (`.env` is gitignored).

Validated choices: **TypeScript**, with a **modern stack**: Vite + React 19 + Redux Toolkit + React Router on the client, Express + socket.io on the server, Vitest for tests.

---

## Architecture

### Repo structure (a single `package.json`, easy to evaluate)

```
red_tetris/
├── src/
│   ├── shared/        # shared types + constants (protocol, tetromino shapes, dimensions)
│   ├── client/        # React SPA (functional, no `this`)
│   │   ├── logic/     # pure functions: board, piece, collisions, lines, spectrum
│   │   ├── store/     # Redux Toolkit (game, room slices) + socket middleware
│   │   ├── components/# Board, Cell, Spectrum, Lobby, NextPiece, GameOver
│   │   ├── hooks/     # useKeyboard, useGameLoop (gravity)
│   │   └── main.tsx, App.tsx (routes)
│   └── server/        # Game, Player, Piece, GameManager classes + socket handlers
│       ├── models/
│       ├── socket/
│       └── index.ts   # Express (static + SPA fallback) + socket.io
├── tests/ (or *.test.ts next to the files)
├── index.html, vite.config.ts, vitest.config.ts, tsconfig*.json
├── .env.example, .gitignore (.env, node_modules, dist, coverage)
└── README.md            # network protocol + client/server responsibilities
```

### Responsibilities

We use the classic Red Tetris approach: **the client simulates its own board, the server referees the game**.

| Client                                                      | Server                                                                |
| ----------------------------------------------------------- | --------------------------------------------------------------------- |
| Gravity, moves, rotations, collisions, locking              | Rooms, players, host, game state (lobby / playing / ended)            |
| Line clearing, applying received penalties                  | Generating the piece sequence (identical for everyone)                |
| Computing the spectrum, then sending it                     | Relaying spectrums to opponents                                       |
| Detecting its own game over                                 | Distributing penalties (n − 1 lines) and detecting the winner         |

### Same sequence for everyone

`Game` holds a `pieces[]` array that grows on demand (7-bag or random). Each `Player` keeps its own `pieceIndex`. When a client asks for pieces, it receives the pieces starting at its index, no matter when it asks. The spawn position and initial rotation are constants in `shared/`, which guarantees the same coordinates for everyone. The client keeps a buffer of about 3 pieces ahead and asks for more when the buffer runs low.

### socket.io protocol (typed in `shared/protocol.ts`)

Client → server:

- `room:join {room, name}`: rejected if the name is already taken or the game has started.
- `game:start`: host only. Also used to restart.
- `piece:request {count}`
- `board:spectrum {spectrum: number[10]}`
- `lines:cleared {count}`
- `player:lost`

Server → client:

- `room:state {players[], host, status}`
- `room:error {code, message}`
- `game:started`
- `piece:batch {pieces[]}`
- `spectrum:update {playerId, spectrum}`
- `penalty {lines}`
- `game:over {winner}`

Disconnection (`disconnect`): the player is eliminated. If they were the host, the role passes to the next player. An empty room is deleted.

---

## Implementation steps

### Phase 0 — Setup (½ day)

- `npm init`, TypeScript, ESLint + Prettier.
- ESLint rule `no-restricted-syntax: ThisExpression` on `src/client/**`, except for `Error` subclasses. A concrete proof to show during evaluation.
- Vite: build to `dist/public` with the output named **`bundle.js`** (`build.rollupOptions.output.entryFileNames`). socket.io proxy in dev.
- npm scripts: `dev` (vite + tsx watch server), `build`, `start`, `test`, `coverage`.
- Vitest with coverage thresholds (`statements/functions/lines: 70, branches: 50`) so CI fails below them.
- `git init`, `.gitignore`, `.env.example` (PORT).

### Phase 1 — Pure game logic (`src/client/logic` + `src/shared`) (2–3 days)

This is the core of the project. It is written **test-first (TDD)**, which yields a lot of coverage.

- `shared/tetrominoes.ts`: the 7 shapes (I, J, L, O, S, T, Z) × 4 rotations, as shown in the subject's diagram (basic SRS rotation).
- `board.ts`: `createBoard()` (20×10), `isValidPosition(board, piece)`, `mergePiece`, `clearLines → {board, cleared}`, `addPenaltyLines(board, n)` (indestructible lines, typed differently so `clearLines` ignores them), `computeSpectrum(board)`.
- `piece.ts`: `move(dir)`, `rotate` (with simple wall kicks), `hardDropPosition`, `spawn`.
- `game.ts`: a pure reducer `tick(state)` and `applyInput(state, input)` handling the **lock delay**: a piece touching the stack only locks on the next tick, if it still touches. It also handles game over when the spawn is impossible.
- All these functions are immutable (spread / `map`) and have no side effects.

### Phase 2 — Server (2 days)

- `models/Piece.ts` (type, rotation, spawn position), `models/Player.ts` (socket id, name, pieceIndex, alive, spectrum), `models/Game.ts` (room, players, host, status, pieces[], `addPlayer`, `removePlayer`, `start`, `getPieces(player, n)`, `eliminate`, `checkWinner`, `distributePenalty`).
- `GameManager`: a `Map<room, Game>` to run several games in parallel.
- `socket/handlers.ts`: wires events to the model methods and validates payloads.
- `index.ts`: Express serves `dist/public` and returns `index.html` for any route (SPA fallback), then attaches socket.io.
- Business rules to cover:
  - Solo: the game ends when the player loses.
  - Multiplayer: the game ends when only one player remains, who is declared the winner.
  - Nobody can join during a game.
  - Restart: reset the pieces, the indexes and the `alive` status.

### Phase 3 — React client (3 days)

- Routing with `BrowserRouter`:
  - `/`: a "room + nickname" form that redirects to the game URL.
  - `/:room/:player`: the game page.
  - Any other route: an error page.
- Redux Toolkit:
  - `roomSlice`: players, host, status, errors.
  - `gameSlice`: local game state, delegating to the pure functions from phase 1.
  - A **socket middleware** isolates network effects: emitting on some actions, dispatching on receive.
- Hooks:
  - `useGameLoop`: a `setInterval` dispatching `tick` at a constant speed.
  - `useKeyboard`: ←/→ to move, ↑ to rotate, ↓ for soft drop, Space for hard drop.
- Components:
  - `Board`: 10×20 CSS grid of colored `div`s, with an optional ghost piece.
  - `Spectrum`: a mini grid per opponent, with their name.
  - `Lobby`: player list and a Start/Restart button visible only to the host.
  - `GameOver` / `Winner`.
- Effects after an action:
  - When a piece locks, the client sends the spectrum, then `lines:cleared` if it cleared n ≥ 2 lines. It asks for more pieces if its buffer is low.
  - On receiving a `penalty`, it calls `addPenaltyLines`, which may cause its game over.

### Phase 4 — Tests and coverage (continuous, then 1 day of consolidation)

- **Pure logic**: aim close to 100%. Cover collisions, rotations at the edges, clearing 1 to 4 lines, penalties and the lock delay.
- **Server**:
  - Unit tests for the `Game` and `Player` classes.
  - Integration tests with a real socket.io server and `socket.io-client`: join, duplicate name, host-only start, host change, identical piece sequence for 2 players, penalties, winner.
- **Client**:
  - Reducers and middleware with a mocked socket.
  - Components tested with Testing Library + jsdom.
- Exclude `main.tsx` and `server/index.ts` (bootstrap) from coverage via the config.

### Phase 5 — Polish (1 day)

- Style: colors from the subject, greyed-out penalty lines, simple responsive layout.
- README: installation, scripts, **network protocol** and **responsibilities table**. The subject explicitly asks to define them.
- Check the evaluation checklist: no `this` in the client, no `<table>`, canvas or SVG, no `.env` in the repo.

### Bonus (only if the mandatory part is perfect)

Scoring system, persisted scores (JSON file or SQLite), game modes (increasing gravity, invisible pieces).

---

## Verification

1. `npm test -- --coverage`: all tests pass and the thresholds (70/70/70/50) are met.
2. `npm run lint`: no violations, in particular of the client-side `ThisExpression` rule.
3. `npm run build && npm start`, then open `http://localhost:3000/room1/alice` and `http://localhost:3000/room1/bob` in two tabs:
   - alice is the host and starts the game;
   - both receive the same pieces;
   - spectrums update in real time;
   - clearing 3 lines sends 2 penalty lines to the opponent;
   - the last player alive wins;
   - closing alice's tab makes bob the host;
   - a 3rd player is refused during the game.
4. Check that a solo game works and that two rooms run in parallel without interfering.
5. `grep -rn "this" src/client`, `grep -rni "<table\|<canvas\|<svg" src/client`: no results.

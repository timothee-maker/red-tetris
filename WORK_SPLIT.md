# Work split — Red Tetris (70 / 30)

Companion to [PLAN.en.md](PLAN.en.md). Phase 0 (tooling) is already done and pushed.

Estimates come from the plan (≈ 9.5 days of work in total, phase 0 included).

| Owner           | Scope                                                                | Share | Estimate  |
| --------------- | -------------------------------------------------------------------- | ----- | --------- |
| **Dev A** (70%) | Shared contract, pure game logic, React client, client tests, polish | ~70%  | ~6.5 days |
| **Dev B** (30%) | **Server**: OO models, game manager, socket handlers, server tests   | ~30%  | ~2.8 days |

The server is a self-contained slice: it never imports client code and the only thing it shares
with the client is `src/shared/protocol.ts`.

---

## Step 0 — The contract (Dev A, first, before anything else)

Dev B cannot start before this exists, so Dev A writes and pushes it first (≈ half a day):

- `src/shared/protocol.ts`: typed socket.io events (`ClientToServerEvents`, `ServerToClientEvents`)
  exactly as listed in the plan.
- `src/shared/tetrominoes.ts`: at least the `PieceType` union (`'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z'`)
  and the spawn constants.
- `src/shared/constants.ts`: board size (already there), plus the spectrum length.

After this is merged, **the protocol is frozen**. Any change goes through both developers.

---

## Dev B — Server (~30%)

Everything under `src/server/**` and its tests. Must be object-oriented (subject requirement).

1. **Models** (`src/server/models/`)
   - `Piece`: type, rotation, spawn position (uses the shared constants).
   - `Player`: socket id, name, `pieceIndex`, `alive`, `spectrum`.
   - `Game`: room, players, host, status (`lobby | playing | ended`), `pieces[]`, and the methods
     `addPlayer`, `removePlayer`, `start`, `getPieces(player, n)`, `eliminate`, `checkWinner`,
     `distributePenalty`.
2. **`GameManager`**: a `Map<room, Game>`; creates rooms on demand, deletes empty ones.
3. **Socket handlers** (`src/server/socket/handlers.ts`): wire every event of the protocol to the models
   and validate payloads (never trust the client).
4. **`src/server/index.ts`**: already serves `dist/public` with the SPA fallback; plug the handlers in.
5. **Game rules to implement** (from the subject):
   - Everyone gets the **same piece sequence**; each player has its own index, the list grows on demand
     (7-bag or random).
   - First player to join is the host; if the host leaves, another player takes over.
   - Nobody can join once the game has started; a name already taken in the room is refused.
   - A game can be played solo. It ends when one player remains (solo: when they lose).
   - Clearing `n` lines sends `n − 1` penalty lines to every opponent.
   - Disconnect = elimination; an empty room is deleted.
   - Restart resets pieces, indexes and `alive`.
6. **Server tests** (target ≥ 85% on `src/server`):
   - Unit tests for `Game` and `Player`.
   - Integration tests with a real socket.io server and `socket.io-client`: join, duplicate name,
     host-only start, host handover, identical sequence for two players, penalties, winner, disconnect.
7. **README section**: the network protocol and the client/server responsibilities table
   (the subject asks for them explicitly).

**Definition of done for Dev B:** `npm run lint`, `npm run typecheck` and `npm run coverage` pass,
and two raw `socket.io-client` scripts can play a full game against the server without any UI.

---

## Dev A — Everything else (~70%)

1. **Step 0 contract** (above).
2. **Pure game logic** (`src/client/logic`, `src/shared`), test-first: board, collisions, rotations,
   line clearing, penalty lines, spectrum, lock delay, game-over detection.
3. **React client**: routing (`/`, `/:room/:player`), Redux Toolkit slices, socket middleware,
   `useGameLoop` and `useKeyboard`, `Board`, `Spectrum`, `Lobby`, `GameOver`.
4. **Client tests**: reducers, middleware with a mocked socket, components (Testing Library + jsdom).
5. **Polish**: styling, final evaluation checklist (no `this` on the client, no `<table>` / canvas / SVG,
   no secrets), global coverage check (≥ 70/70/70/50).
6. **Integration**: once the server is merged, play real games between two browser tabs.

---

## Working rules

- **Ownership avoids conflicts**: Dev B only edits `src/server/**` (and its tests); Dev A only edits
  `src/client/**`. `src/shared/**` is Dev A's, changes need Dev B's review.
- **Branches**: one branch per developer (`feat/server`, `feat/client`), merged into `main` through
  pull requests. Do not push directly to `main` once both are working.
- **Shared files** that both may touch (`package.json`, `package-lock.json`, `README.md`): keep changes small
  and pull before editing. Announce new dependencies to the other developer.
- Run `npm run lint && npm run typecheck && npm test` before each push.
- **Milestones**
  1. Step 0 contract merged → Dev B starts.
  2. Server merged and green → Dev A connects the client to the real server.
  3. Both parts merged → joint end-to-end test (see "Verification" in the plan).

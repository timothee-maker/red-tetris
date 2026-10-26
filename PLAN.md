# Plan — Red Tetris

## Contexte

Projet 42 « Red Tetris » : un Tetris multijoueur en ligne, entièrement en JavaScript/TypeScript (client navigateur + serveur Node.js reliés par socket.io). Le dossier `/Users/timothee/project/red_tetris` est vide, on part de zéro. Node v23.11 est installé.

Contraintes du sujet qui orientent tout le design :

- **Client** : pas de `this`, logique plateau/pièces en **fonctions pures**, framework moderne (React), SPA, pas de `<table>`, pas de canvas ni de SVG, pas de jQuery. La mise en page se fait en grid ou flexbox.
- **Serveur** : orienté objet. Au minimum des classes `Player`, `Piece` et `Game`.
- Le serveur sert `index.html` + `bundle.js` en HTTP. URL de jeu : `/<room>/<player_name>`.
- Tous les joueurs d'une partie reçoivent **la même séquence de pièces, aux mêmes positions**.
- Tests : ≥ 70 % statements/functions/lines, ≥ 50 % branches.
- Aucun secret dans le repo (`.env` gitignoré).

Choix validés : **TypeScript**, avec une **stack moderne** : Vite + React 19 + Redux Toolkit + React Router côté client, Express + socket.io côté serveur, Vitest pour les tests.

---

## Architecture

### Structure du repo (un seul `package.json`, simple à évaluer)

```
red_tetris/
├── src/
│   ├── shared/        # types + constantes partagés (protocole, formes des tétriminos, dimensions)
│   ├── client/        # React SPA (fonctionnel, pas de `this`)
│   │   ├── logic/     # fonctions pures : board, piece, collisions, lignes, spectre
│   │   ├── store/     # Redux Toolkit (slices game, room) + middleware socket
│   │   ├── components/# Board, Cell, Spectrum, Lobby, NextPiece, GameOver
│   │   ├── hooks/     # useKeyboard, useGameLoop (gravité)
│   │   └── main.tsx, App.tsx (routes)
│   └── server/        # classes Game, Player, Piece, GameManager + socket handlers
│       ├── models/
│       ├── socket/
│       └── index.ts   # Express (statique + fallback SPA) + socket.io
├── tests/ (ou *.test.ts à côté des fichiers)
├── index.html, vite.config.ts, vitest.config.ts, tsconfig*.json
├── .env.example, .gitignore (.env, node_modules, dist, coverage)
└── README.md            # protocole réseau + responsabilités client/serveur
```

### Partage des responsabilités

On retient l'approche classique de Red Tetris : **le client simule son propre plateau, le serveur arbitre la partie**.

| Client                                                     | Serveur                                                             |
| ---------------------------------------------------------- | ------------------------------------------------------------------- |
| Gravité, déplacements, rotations, collisions, verrouillage | Rooms, joueurs, hôte, état de la partie (lobby / playing / ended)   |
| Suppression des lignes, application des pénalités reçues   | Génération de la séquence de pièces (identique pour tous)           |
| Calcul du spectre, puis envoi                              | Relais des spectres aux adversaires                                 |
| Détection de son propre game over                          | Distribution des pénalités (n − 1 lignes) et détection du vainqueur |

### Même séquence pour tous

`Game` contient un tableau `pieces[]` qui grandit à la demande (7-bag ou aléatoire). Chaque `Player` garde son propre `pieceIndex`. Quand un client demande des pièces, il reçoit les pièces de son index, quel que soit le moment où il les demande. La position de spawn et la rotation initiale sont des constantes dans `shared/`, ce qui garantit les mêmes coordonnées pour tous. Le client garde un buffer d'environ 3 pièces d'avance et en redemande quand ce buffer baisse.

### Protocole socket.io (typé dans `shared/protocol.ts`)

Client → serveur :

- `room:join {room, name}` : refusé si le nom est déjà pris ou si la partie a commencé.
- `game:start` : réservé à l'hôte. Sert aussi au restart.
- `piece:request {count}`
- `board:spectrum {spectrum: number[10]}`
- `lines:cleared {count}`
- `player:lost`

Serveur → client :

- `room:state {players[], host, status}`
- `room:error {code, message}`
- `game:started`
- `piece:batch {pieces[]}`
- `spectrum:update {playerId, spectrum}`
- `penalty {lines}`
- `game:over {winner}`

Déconnexion (`disconnect`) : le joueur est éliminé. Si c'était l'hôte, le rôle passe au joueur suivant. Une room vide est supprimée.

---

## Étapes de réalisation

### Phase 0 — Setup (½ jour)

- `npm init`, TypeScript, ESLint + Prettier.
- Règle ESLint `no-restricted-syntax: ThisExpression` sur `src/client/**`, sauf pour les sous-classes d'`Error`. C'est une preuve concrète à montrer en évaluation.
- Vite : build vers `dist/public` avec la sortie nommée **`bundle.js`** (`build.rollupOptions.output.entryFileNames`). Proxy socket.io en dev.
- Scripts npm : `dev` (vite + tsx watch serveur), `build`, `start`, `test`, `coverage`.
- Vitest avec seuils de couverture (`statements/functions/lines: 70, branches: 50`) pour que le CI échoue en dessous.
- `git init`, `.gitignore`, `.env.example` (PORT).

### Phase 1 — Logique de jeu pure (`src/client/logic` + `src/shared`) (2–3 jours)

C'est le cœur du projet. On l'écrit **en TDD**, ce qui rapporte beaucoup de couverture.

- `shared/tetrominoes.ts` : les 7 formes (I, J, L, O, S, T, Z) × 4 rotations, telles qu'elles figurent dans le schéma du sujet (rotation SRS de base).
- `board.ts` : `createBoard()` (20×10), `isValidPosition(board, piece)`, `mergePiece`, `clearLines → {board, cleared}`, `addPenaltyLines(board, n)` (lignes indestructibles, typées différemment pour que `clearLines` les ignore), `computeSpectrum(board)`.
- `piece.ts` : `move(dir)`, `rotate` (avec wall-kicks simples), `hardDropPosition`, `spawn`.
- `game.ts` : un reducer pur `tick(state)` et `applyInput(state, input)` qui gère le **lock delay** : une pièce qui touche la pile ne se fige qu'au tick suivant, si elle touche toujours. Il gère aussi le game over quand le spawn est impossible.
- Toutes ces fonctions sont immuables (spread / `map`) et ne contiennent aucun effet de bord.

### Phase 2 — Serveur (2 jours)

- `models/Piece.ts` (type, rotation, position de spawn), `models/Player.ts` (socket id, name, pieceIndex, alive, spectrum), `models/Game.ts` (room, players, host, status, pieces[], `addPlayer`, `removePlayer`, `start`, `getPieces(player, n)`, `eliminate`, `checkWinner`, `distributePenalty`).
- `GameManager` : une `Map<room, Game>` pour gérer plusieurs parties en parallèle.
- `socket/handlers.ts` : relie les événements aux méthodes des modèles et valide les payloads.
- `index.ts` : Express sert `dist/public` et renvoie `index.html` pour toute route (fallback SPA), puis attache socket.io.
- Règles métier à couvrir :
  - Solo : la partie se termine quand le joueur perd.
  - Multi : la partie se termine quand il reste un seul joueur, qui est déclaré vainqueur.
  - Personne ne peut rejoindre pendant une partie.
  - Restart : on remet à zéro les pièces, les index et le statut `alive`.

### Phase 3 — Client React (3 jours)

- Routing avec `BrowserRouter` :
  - `/` : formulaire « room + pseudo » qui redirige vers l'URL de jeu.
  - `/:room/:player` : la page de jeu.
  - Toute autre route : une page d'erreur.
- Redux Toolkit :
  - `roomSlice` : joueurs, hôte, statut, erreurs.
  - `gameSlice` : état local du jeu, qui délègue aux fonctions pures de la phase 1.
  - Un **middleware socket** isole les effets réseau : émission sur certaines actions, dispatch à la réception.
- Hooks :
  - `useGameLoop` : `setInterval` qui dispatch `tick` avec une vitesse constante.
  - `useKeyboard` : ←/→ pour déplacer, ↑ pour tourner, ↓ pour la soft drop, Espace pour la hard drop.
- Composants :
  - `Board` : CSS grid 10×20 de `div` colorées, avec la pièce fantôme en option.
  - `Spectrum` : mini-grille par adversaire, avec son nom.
  - `Lobby` : liste des joueurs et bouton Start/Restart visible seulement par l'hôte.
  - `GameOver` / `Winner`.
- Effets à la suite d'une action :
  - Au verrouillage d'une pièce, le client envoie le spectre, puis `lines:cleared` s'il a effacé n ≥ 2 lignes. Il redemande des pièces si son buffer est trop bas.
  - À la réception d'un `penalty`, il appelle `addPenaltyLines`, ce qui peut entraîner son game over.

### Phase 4 — Tests et couverture (en continu, puis 1 jour de consolidation)

- **Logique pure** : objectif proche de 100 %. Couvre les collisions, les rotations aux bords, le clear de 1 à 4 lignes, les pénalités et le lock delay.
- **Serveur** :
  - Tests unitaires des classes `Game` et `Player`.
  - Tests d'intégration avec un vrai serveur socket.io et `socket.io-client` : join, nom en double, start réservé à l'hôte, changement d'hôte, séquence de pièces identique pour 2 joueurs, pénalités, vainqueur.
- **Client** :
  - Reducers et middleware avec un socket mocké.
  - Composants testés avec Testing Library + jsdom.
- Exclure de la couverture `main.tsx` et `server/index.ts` (bootstrap) via la config.

### Phase 5 — Finition (1 jour)

- Style : couleurs du sujet, lignes de pénalité grisées, responsive simple.
- README : installation, scripts, **protocole réseau** et **tableau des responsabilités**. Le sujet demande explicitement de les définir.
- Vérifier la checklist d'évaluation : pas de `this` dans le client, pas de `<table>`, de canvas ni de SVG, `.env` absent du repo.

### Bonus (seulement si le mandatory est parfait)

Système de score, persistance des scores (fichier JSON ou SQLite), modes de jeu (gravité croissante, pièces invisibles).

---

## Vérification

1. `npm test -- --coverage` : tous les tests passent et les seuils (70/70/70/50) sont respectés.
2. `npm run lint` : aucune violation, en particulier de la règle `ThisExpression` côté client.
3. `npm run build && npm start`, puis ouvrir `http://localhost:3000/room1/alice` et `http://localhost:3000/room1/bob` dans deux onglets :
   - alice est l'hôte et lance la partie ;
   - les deux reçoivent les mêmes pièces ;
   - les spectres se mettent à jour en temps réel ;
   - effacer 3 lignes envoie 2 lignes de pénalité à l'adversaire ;
   - le dernier joueur en vie gagne ;
   - fermer l'onglet d'alice fait passer bob hôte ;
   - un 3e joueur est refusé pendant la partie.
4. Vérifier qu'une partie solo fonctionne et que deux rooms tournent en parallèle sans interférence.
5. `grep -rn "this" src/client`, `grep -rni "<table\|<canvas\|<svg" src/client` : aucun résultat.

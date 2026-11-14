import type { PieceType } from '@shared/tetrominoes';
import { addPenaltyLines, clearLines, createBoard, isValidPosition, mergePiece } from './board';
import { canMoveDown, hardDropRow, rotatePiece, tryMove } from './movement';
import { spawnPiece } from './piece';
import type { GameState, Input, Piece } from './types';

export const createGame = (queue: PieceType[] = []): GameState => ({
  board: createBoard(),
  piece: null,
  queue,
  grounded: false,
  status: 'playing',
  lastCleared: 0,
});

/** Appends pieces received from the server. */
export const enqueuePieces = (state: GameState, pieces: PieceType[]): GameState => ({
  ...state,
  queue: [...state.queue, ...pieces],
});

/**
 * Takes the next piece of the queue. Waits (unchanged state) if the queue is empty,
 * and loses the game if the piece cannot enter the board.
 */
const spawnNext = (state: GameState): GameState => {
  const [next, ...rest] = state.queue;
  if (next === undefined) return state;
  const piece = spawnPiece(next);
  if (!isValidPosition(state.board, piece)) return { ...state, queue: rest, status: 'lost' };
  return { ...state, piece, queue: rest, grounded: false };
};

const lockPiece = (state: GameState, piece: Piece): GameState => {
  const { board, cleared } = clearLines(mergePiece(state.board, piece));
  return spawnNext({ ...state, board, piece: null, grounded: false, lastCleared: cleared });
};

/**
 * One step of gravity. A piece that touches the stack is only locked on the
 * following tick, which leaves the player time for last-moment adjustments.
 */
export const tick = (state: GameState): GameState => {
  if (state.status !== 'playing') return state;
  const current = { ...state, lastCleared: 0 };
  const { piece } = current;
  if (piece === null) return spawnNext(current);
  if (canMoveDown(current.board, piece)) {
    return { ...current, piece: { ...piece, row: piece.row + 1 }, grounded: false };
  }
  return current.grounded ? lockPiece(current, piece) : { ...current, grounded: true };
};

export const applyInput = (state: GameState, input: Input): GameState => {
  const { piece } = state;
  if (state.status !== 'playing' || piece === null) return state;
  const current = { ...state, lastCleared: 0 };
  switch (input) {
    case 'left':
      return { ...current, piece: tryMove(current.board, piece, 0, -1) };
    case 'right':
      return { ...current, piece: tryMove(current.board, piece, 0, 1) };
    case 'rotate':
      return { ...current, piece: rotatePiece(current.board, piece) };
    case 'softDrop':
      return { ...current, piece: tryMove(current.board, piece, 1, 0) };
    case 'hardDrop':
      return lockPiece(current, { ...piece, row: hardDropRow(current.board, piece) });
  }
};

/** Lifts the falling piece out of the stack that just rose, `null` if it cannot fit anymore. */
const liftPiece = (state: GameState, piece: Piece, maxRows: number): Piece | null =>
  Array.from({ length: maxRows + 1 }, (_, k) => ({ ...piece, row: piece.row - k })).find(
    (candidate) => isValidPosition(state.board, candidate),
  ) ?? null;

/** Applies the indestructible lines sent by an opponent. */
export const receivePenalty = (state: GameState, lines: number): GameState => {
  if (state.status !== 'playing' || lines <= 0) return state;
  const { board, overflow } = addPenaltyLines(state.board, lines);
  const raised = { ...state, board };
  if (overflow) return { ...raised, status: 'lost' };
  if (state.piece === null) return raised;
  const piece = liftPiece(raised, state.piece, lines);
  return piece === null ? { ...raised, piece: null, status: 'lost' } : { ...raised, piece };
};

import { ROTATION_COUNT } from '@shared/tetrominoes';
import { isValidPosition } from './board';
import type { Board, Piece } from './types';

/** Column offsets tried, in order, when a rotation is blocked. */
const WALL_KICKS = [0, -1, 1, -2, 2];

/** Moves the piece if the destination is free, otherwise returns it unchanged. */
export const tryMove = (board: Board, piece: Piece, dRow: number, dCol: number): Piece => {
  const moved = { ...piece, row: piece.row + dRow, col: piece.col + dCol };
  return isValidPosition(board, moved) ? moved : piece;
};

export const canMoveDown = (board: Board, piece: Piece): boolean =>
  isValidPosition(board, { ...piece, row: piece.row + 1 });

/** Rotates clockwise, shifting sideways if needed. Returns the piece unchanged if impossible. */
export const rotatePiece = (board: Board, piece: Piece): Piece => {
  const rotated = { ...piece, rotation: (piece.rotation + 1) % ROTATION_COUNT };
  const kicked = WALL_KICKS.map((kick) => ({ ...rotated, col: rotated.col + kick }));
  return kicked.find((candidate) => isValidPosition(board, candidate)) ?? piece;
};

/** Row the piece reaches if it falls straight down. */
export const hardDropRow = (board: Board, piece: Piece): number =>
  canMoveDown(board, piece) ? hardDropRow(board, { ...piece, row: piece.row + 1 }) : piece.row;

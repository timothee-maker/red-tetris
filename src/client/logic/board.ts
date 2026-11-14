import { BOARD_HEIGHT, BOARD_WIDTH } from '@shared/constants';
import { getCells } from './piece';
import type { Board, Cell, Piece } from './types';

const emptyRow = (): Cell[] => Array<Cell>(BOARD_WIDTH).fill(null);
const penaltyRow = (): Cell[] => Array<Cell>(BOARD_WIDTH).fill('P');

export const createBoard = (): Board => Array.from({ length: BOARD_HEIGHT }, emptyRow);

/** True if every block of the piece is inside the board and on an empty cell. */
export const isValidPosition = (board: Board, piece: Piece): boolean =>
  getCells(piece).every(
    ([r, c]) => r >= 0 && r < BOARD_HEIGHT && c >= 0 && c < BOARD_WIDTH && board[r][c] === null,
  );

export const mergePiece = (board: Board, piece: Piece): Board => {
  const cells = getCells(piece);
  return board.map((row, r) =>
    row.map((cell, c) => (cells.some(([pr, pc]) => pr === r && pc === c) ? piece.type : cell)),
  );
};

/** A full row is cleared, unless it contains penalty blocks. */
const isClearable = (row: Cell[]): boolean => row.every((cell) => cell !== null && cell !== 'P');

export const clearLines = (board: Board): { board: Board; cleared: number } => {
  const kept = board.filter((row) => !isClearable(row));
  const cleared = board.length - kept.length;
  return { board: [...Array.from({ length: cleared }, emptyRow), ...kept], cleared };
};

/**
 * Pushes the stack up by `lines` and adds indestructible lines at the bottom.
 * `overflow` is true when blocks were pushed out of the top of the board.
 */
export const addPenaltyLines = (
  board: Board,
  lines: number,
): { board: Board; overflow: boolean } => {
  const count = Math.max(0, Math.min(lines, BOARD_HEIGHT));
  const overflow = board.slice(0, count).some((row) => row.some((cell) => cell !== null));
  return {
    board: [...board.slice(count), ...Array.from({ length: count }, penaltyRow)],
    overflow,
  };
};

/** Height of the highest block of each column (0 for an empty column). */
export const computeSpectrum = (board: Board): number[] =>
  Array.from({ length: BOARD_WIDTH }, (_, c) => {
    const top = board.findIndex((row) => row[c] !== null);
    return top === -1 ? 0 : BOARD_HEIGHT - top;
  });

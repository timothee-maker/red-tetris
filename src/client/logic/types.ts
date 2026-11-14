import type { PieceType } from '@shared/tetrominoes';

/** `'P'` is an indestructible penalty block. */
export type Cell = PieceType | 'P' | null;

/** BOARD_HEIGHT rows of BOARD_WIDTH cells, row 0 is the top. */
export type Board = Cell[][];

export interface Piece {
  type: PieceType;
  /** Clockwise rotation index, 0-3. */
  rotation: number;
  /** Position of the top-left corner of the piece's 4x4 box. */
  row: number;
  col: number;
}

export type Input = 'left' | 'right' | 'rotate' | 'softDrop' | 'hardDrop';

export type GameStatus = 'playing' | 'lost';

export interface GameState {
  board: Board;
  /** The falling piece, `null` while waiting for the next one. */
  piece: Piece | null;
  /** Upcoming pieces, received from the server. */
  queue: PieceType[];
  /** The piece touches the stack: it locks on the next tick unless it can move again. */
  grounded: boolean;
  status: GameStatus;
  /** Lines cleared by the last action (reset by every action). */
  lastCleared: number;
}

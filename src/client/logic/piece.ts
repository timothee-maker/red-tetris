import { getShape, INITIAL_ROTATION, SPAWN_COLUMN, SPAWN_ROW } from '@shared/tetrominoes';
import type { PieceType } from '@shared/tetrominoes';
import type { Piece } from './types';

export const spawnPiece = (type: PieceType): Piece => ({
  type,
  rotation: INITIAL_ROTATION,
  row: SPAWN_ROW,
  col: SPAWN_COLUMN,
});

/** Board coordinates `[row, col]` of the 4 blocks of a piece. */
export const getCells = (piece: Piece): [number, number][] =>
  getShape(piece.type, piece.rotation).flatMap((cells, r) =>
    cells.flatMap((filled, c): [number, number][] =>
      filled ? [[piece.row + r, piece.col + c]] : [],
    ),
  );

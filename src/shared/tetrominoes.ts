import { BOARD_WIDTH } from './constants';

export const PIECE_TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'] as const;

export type PieceType = (typeof PIECE_TYPES)[number];

/**
 * Spawn point, identical for every player and every piece so that everybody
 * gets the same coordinates. Pieces are described in a 4x4 box: this is the
 * position of the box's top-left corner on the board (centered, at the top).
 */
export const PIECE_BOX_SIZE = 4;
export const SPAWN_ROW = 0;
export const SPAWN_COLUMN = Math.floor((BOARD_WIDTH - PIECE_BOX_SIZE) / 2);

/** Rotation index (0-3) every piece starts with. */
export const INITIAL_ROTATION = 0;

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
export const ROTATION_COUNT = 4;

/** A shape in its 4x4 box: 1 = filled, 0 = empty. */
export type Shape = number[][];

const BASE_SHAPES: Record<PieceType, { rows: string[]; rotates: boolean }> = {
  I: { rows: ['....', 'XXXX', '....', '....'], rotates: true },
  J: { rows: ['X..', 'XXX', '...'], rotates: true },
  L: { rows: ['..X', 'XXX', '...'], rotates: true },
  O: { rows: ['.XX.', '.XX.'], rotates: false },
  S: { rows: ['.XX', 'XX.', '...'], rotates: true },
  T: { rows: ['.X.', 'XXX', '...'], rotates: true },
  Z: { rows: ['XX.', '.XX', '...'], rotates: true },
};

const parse = (rows: string[]): Shape =>
  rows.map((row) => [...row].map((ch) => (ch === 'X' ? 1 : 0)));

const rotateClockwise = (m: Shape): Shape =>
  m.map((_, r) => m.map((_, c) => m[m.length - 1 - c][r]));

const rotateTimes = (m: Shape, times: number): Shape =>
  times === 0 ? m : rotateTimes(rotateClockwise(m), times - 1);

const padToBox = (m: Shape): Shape =>
  Array.from({ length: PIECE_BOX_SIZE }, (_, r) =>
    Array.from({ length: PIECE_BOX_SIZE }, (_, c) => m[r]?.[c] ?? 0),
  );

const buildRotations = ({ rows, rotates }: { rows: string[]; rotates: boolean }): Shape[] =>
  Array.from({ length: ROTATION_COUNT }, (_, k) =>
    padToBox(rotateTimes(parse(rows), rotates ? k : 0)),
  );

/** SHAPES[type][rotation]: the 4 clockwise rotations of every piece, in their 4x4 box. */
export const SHAPES = Object.fromEntries(
  PIECE_TYPES.map((type) => [type, buildRotations(BASE_SHAPES[type])]),
) as Record<PieceType, Shape[]>;

export const getShape = (type: PieceType, rotation: number): Shape =>
  SHAPES[type][((rotation % ROTATION_COUNT) + ROTATION_COUNT) % ROTATION_COUNT];

import { BOARD_HEIGHT, BOARD_WIDTH } from '@shared/constants';
import { createBoard } from './board';
import { canMoveDown, hardDropRow, rotatePiece, tryMove } from './movement';
import { spawnPiece } from './piece';
import type { Board, Cell, Piece } from './types';

const T = spawnPiece('T');

const withBlock = (r: number, c: number): Board =>
  createBoard().map((row, i) =>
    i === r ? row.map((cell, j): Cell => (j === c ? 'J' : cell)) : row,
  );

describe('tryMove', () => {
  it('moves a piece into free space', () => {
    expect(tryMove(createBoard(), T, 0, -1).col).toBe(T.col - 1);
    expect(tryMove(createBoard(), T, 1, 0).row).toBe(T.row + 1);
  });

  it('returns the same piece against the walls', () => {
    const left = { ...T, col: 0 };
    const right = { ...T, col: BOARD_WIDTH - 3 };
    expect(tryMove(createBoard(), left, 0, -1)).toBe(left);
    expect(tryMove(createBoard(), right, 0, 1)).toBe(right);
  });

  it('returns the same piece against a block', () => {
    expect(tryMove(withBlock(1, 2), T, 0, -1)).toBe(T);
  });
});

describe('canMoveDown', () => {
  it('is true in the air and false on the floor', () => {
    expect(canMoveDown(createBoard(), T)).toBe(true);
    expect(canMoveDown(createBoard(), { ...T, row: BOARD_HEIGHT - 2 })).toBe(false);
  });

  it('is false on top of a block', () => {
    expect(canMoveDown(withBlock(2, 4), T)).toBe(false);
  });
});

describe('rotatePiece', () => {
  it('rotates clockwise in free space', () => {
    expect(rotatePiece(createBoard(), T).rotation).toBe(1);
    expect(rotatePiece(createBoard(), { ...T, rotation: 3 }).rotation).toBe(0);
  });

  it('kicks the piece away from the left wall', () => {
    const vertical: Piece = { type: 'I', rotation: 1, row: 5, col: -2 };
    const result = rotatePiece(createBoard(), vertical);
    expect(result.rotation).toBe(2);
    expect(result.col).toBeGreaterThanOrEqual(0);
  });

  it('kicks the piece away from the right wall', () => {
    const vertical: Piece = { type: 'I', rotation: 1, row: 5, col: BOARD_WIDTH - 3 };
    const result = rotatePiece(createBoard(), vertical);
    expect(result.rotation).toBe(2);
    expect(result.col + 3).toBeLessThanOrEqual(BOARD_WIDTH - 1);
  });

  it('does not rotate when there is no room', () => {
    const board = createBoard().map((row) => row.map((): Cell => 'J'));
    board[0][4] = null;
    board[1][3] = null;
    board[1][4] = null;
    board[1][5] = null;
    expect(rotatePiece(board, T)).toBe(T);
  });
});

describe('hardDropRow', () => {
  it('drops to the floor on an empty board', () => {
    expect(hardDropRow(createBoard(), spawnPiece('I'))).toBe(BOARD_HEIGHT - 2);
    expect(hardDropRow(createBoard(), spawnPiece('O'))).toBe(BOARD_HEIGHT - 2);
  });

  it('stops on top of a block', () => {
    expect(hardDropRow(withBlock(10, 4), spawnPiece('O'))).toBe(8);
  });
});

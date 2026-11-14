import { BOARD_HEIGHT, BOARD_WIDTH } from '@shared/constants';
import {
  addPenaltyLines,
  clearLines,
  computeSpectrum,
  createBoard,
  isValidPosition,
  mergePiece,
} from './board';
import type { Board, Cell, Piece } from './types';

const I: Piece = { type: 'I', rotation: 0, row: 0, col: 3 };

const withRows = (rows: Record<number, Cell[]>): Board =>
  createBoard().map((row, r) => rows[r] ?? row);

const fullExcept = (...holes: number[]): Cell[] =>
  Array.from({ length: BOARD_WIDTH }, (_, c) => (holes.includes(c) ? null : 'J'));

describe('createBoard', () => {
  it('creates an empty 20x10 board', () => {
    const board = createBoard();
    expect(board).toHaveLength(BOARD_HEIGHT);
    board.forEach((row) => {
      expect(row).toHaveLength(BOARD_WIDTH);
      expect(row.every((cell) => cell === null)).toBe(true);
    });
  });

  it('does not share rows between lines', () => {
    const board = createBoard();
    expect(board[0]).not.toBe(board[1]);
  });
});

describe('isValidPosition', () => {
  it('accepts a piece inside an empty board', () => {
    expect(isValidPosition(createBoard(), I)).toBe(true);
  });

  it('rejects a piece outside the left, right and bottom borders', () => {
    expect(isValidPosition(createBoard(), { ...I, col: -1 })).toBe(false);
    expect(isValidPosition(createBoard(), { ...I, col: 7 })).toBe(false);
    expect(isValidPosition(createBoard(), { ...I, row: BOARD_HEIGHT - 1 })).toBe(false);
  });

  it('rejects a piece above the board', () => {
    expect(isValidPosition(createBoard(), { ...I, row: -2 })).toBe(false);
  });

  it('accepts a piece touching the borders', () => {
    expect(isValidPosition(createBoard(), { ...I, col: 0 })).toBe(true);
    expect(isValidPosition(createBoard(), { ...I, col: 6 })).toBe(true);
    expect(isValidPosition(createBoard(), { ...I, row: BOARD_HEIGHT - 2 })).toBe(true);
  });

  it('rejects a piece overlapping a block', () => {
    const board = withRows({ 1: fullExcept(0, 1, 2, 3, 5, 6, 7, 8, 9) });
    expect(isValidPosition(board, I)).toBe(false);
  });
});

describe('mergePiece', () => {
  it('writes the piece type in the board without mutating it', () => {
    const board = createBoard();
    const merged = mergePiece(board, I);
    expect(merged[1].slice(3, 7)).toEqual(['I', 'I', 'I', 'I']);
    expect(merged[1][2]).toBeNull();
    expect(board[1].every((cell) => cell === null)).toBe(true);
  });
});

describe('clearLines', () => {
  it('leaves a board without full lines untouched', () => {
    const board = withRows({ 19: fullExcept(0) });
    expect(clearLines(board)).toEqual({ board, cleared: 0 });
  });

  it('clears a full line and drops the lines above', () => {
    const board = withRows({ 18: fullExcept(0, 1, 2, 3, 4, 5, 6, 7, 8), 19: fullExcept() });
    const result = clearLines(board);
    expect(result.cleared).toBe(1);
    expect(result.board).toHaveLength(BOARD_HEIGHT);
    expect(result.board[19]).toEqual(fullExcept(0, 1, 2, 3, 4, 5, 6, 7, 8));
    expect(result.board[18].every((cell) => cell === null)).toBe(true);
  });

  it('clears 4 lines at once', () => {
    const board = withRows({
      16: fullExcept(),
      17: fullExcept(),
      18: fullExcept(),
      19: fullExcept(),
    });
    expect(clearLines(board)).toEqual({ board: createBoard(), cleared: 4 });
  });

  it('clears lines that are not contiguous', () => {
    const board = withRows({
      17: fullExcept(),
      18: fullExcept(5),
      19: fullExcept(),
    });
    const result = clearLines(board);
    expect(result.cleared).toBe(2);
    expect(result.board[19]).toEqual(fullExcept(5));
  });

  it('never clears penalty lines', () => {
    const board = withRows({ 19: Array<Cell>(BOARD_WIDTH).fill('P') });
    expect(clearLines(board)).toEqual({ board, cleared: 0 });
  });
});

describe('addPenaltyLines', () => {
  it('adds indestructible lines at the bottom and pushes the stack up', () => {
    const board = withRows({ 19: fullExcept(0) });
    const result = addPenaltyLines(board, 2);
    expect(result.overflow).toBe(false);
    expect(result.board).toHaveLength(BOARD_HEIGHT);
    expect(result.board[19].every((cell) => cell === 'P')).toBe(true);
    expect(result.board[18].every((cell) => cell === 'P')).toBe(true);
    expect(result.board[17]).toEqual(fullExcept(0));
  });

  it('does nothing for 0 or negative lines', () => {
    const board = createBoard();
    expect(addPenaltyLines(board, 0)).toEqual({ board, overflow: false });
    expect(addPenaltyLines(board, -3)).toEqual({ board, overflow: false });
  });

  it('reports an overflow when blocks leave the board', () => {
    const board = withRows({ 0: fullExcept(0) });
    expect(addPenaltyLines(board, 1).overflow).toBe(true);
  });

  it('caps the number of lines at the board height', () => {
    const result = addPenaltyLines(createBoard(), 99);
    expect(result.board).toHaveLength(BOARD_HEIGHT);
    expect(result.board.every((row) => row.every((cell) => cell === 'P'))).toBe(true);
  });
});

describe('computeSpectrum', () => {
  it('is all zeros for an empty board', () => {
    expect(computeSpectrum(createBoard())).toEqual(Array(BOARD_WIDTH).fill(0));
  });

  it('gives the height of the highest block of each column', () => {
    const board = withRows({ 19: fullExcept(1), 17: fullExcept(1, 2, 3, 4, 5, 6, 7, 8, 9) });
    expect(computeSpectrum(board)).toEqual([3, 0, 1, 1, 1, 1, 1, 1, 1, 1]);
  });

  it('ignores holes under a block', () => {
    const board = withRows({ 10: fullExcept(...[1, 2, 3, 4, 5, 6, 7, 8, 9]) });
    expect(computeSpectrum(board)[0]).toBe(10);
  });
});

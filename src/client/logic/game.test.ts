import { BOARD_HEIGHT, BOARD_WIDTH } from '@shared/constants';
import type { PieceType } from '@shared/tetrominoes';
import { computeSpectrum, createBoard } from './board';
import { applyInput, createGame, enqueuePieces, receivePenalty, tick } from './game';
import type { Board, Cell, GameState } from './types';

const started = (queue: PieceType[]): GameState => tick(createGame(queue));

const withCells = (cells: [number, number][]): Board =>
  createBoard().map((row, r) =>
    row.map((cell, c): Cell => (cells.some(([cr, cc]) => cr === r && cc === c) ? 'J' : cell)),
  );

const tickUntil = (state: GameState, done: (s: GameState) => boolean, max = 100): GameState => {
  let current = state;
  for (let i = 0; i < max && !done(current); i++) current = tick(current);
  return current;
};

describe('createGame / enqueuePieces', () => {
  it('starts with an empty board and no piece', () => {
    const state = createGame();
    expect(state).toMatchObject({ piece: null, queue: [], status: 'playing', grounded: false });
    expect(state.board).toEqual(createBoard());
  });

  it('appends received pieces to the queue', () => {
    expect(enqueuePieces(createGame(['I']), ['O', 'T']).queue).toEqual(['I', 'O', 'T']);
  });
});

describe('tick', () => {
  it('takes the next piece of the queue when none is falling', () => {
    const state = tick(createGame(['T', 'O']));
    expect(state.piece).toMatchObject({ type: 'T', row: 0 });
    expect(state.queue).toEqual(['O']);
  });

  it('waits when the queue is empty', () => {
    const state = createGame();
    expect(tick(state)).toEqual(state);
  });

  it('makes the piece fall by one row', () => {
    const state = tick(started(['O']));
    expect(state.piece?.row).toBe(1);
  });

  it('does not change a lost game', () => {
    const lost = { ...createGame(['O']), status: 'lost' as const };
    expect(tick(lost)).toBe(lost);
  });

  it('locks only on the tick after touching the stack (lock delay)', () => {
    const landed = tickUntil(started(['O', 'I']), (s) => s.grounded);
    expect(landed.piece?.type).toBe('O');
    expect(landed.piece?.row).toBe(BOARD_HEIGHT - 2);

    const locked = tick(landed);
    expect(locked.board[BOARD_HEIGHT - 1][4]).toBe('O');
    expect(locked.piece?.type).toBe('I');
  });

  it('lets the player slide the piece during the delay', () => {
    const landed = tickUntil(started(['O', 'I']), (s) => s.grounded);
    const moved = applyInput(landed, 'left');
    expect(moved.piece?.col).toBe((landed.piece?.col ?? 0) - 1);
    const locked = tick(moved);
    expect(locked.board[BOARD_HEIGHT - 1][3]).toBe('O');
  });

  it('keeps falling if the piece slides off its support', () => {
    const board = withCells([
      [BOARD_HEIGHT - 1, 4],
      [BOARD_HEIGHT - 1, 5],
    ]);
    const landed = tickUntil({ ...started(['O']), board }, (s) => s.grounded);
    expect(landed.piece?.row).toBe(BOARD_HEIGHT - 3);
    const slid = applyInput(applyInput(landed, 'left'), 'left');
    const next = tick(slid);
    expect(next.grounded).toBe(false);
    expect(next.piece?.row).toBe(BOARD_HEIGHT - 2);
  });

  it('spawns the next piece right after a lock', () => {
    const landed = tickUntil(started(['O', 'I']), (s) => s.grounded);
    expect(tick(landed).piece?.type).toBe('I');
  });

  it('waits for new pieces after a lock when the queue is empty', () => {
    const landed = tickUntil(started(['O']), (s) => s.grounded);
    const locked = tick(landed);
    expect(locked.piece).toBeNull();
    expect(locked.status).toBe('playing');
    expect(tick(enqueuePieces(locked, ['T'])).piece?.type).toBe('T');
  });
});

describe('game over', () => {
  it('is detected when the next piece cannot enter the board', () => {
    const state = { ...createGame(['O']), board: withCells([[1, 4]]) };
    const result = tick(state);
    expect(result.status).toBe('lost');
    expect(result.piece).toBeNull();
  });

  it('ignores inputs once lost', () => {
    const lost = tick({ ...createGame(['O']), board: withCells([[1, 4]]) });
    expect(applyInput(lost, 'left')).toBe(lost);
  });
});

describe('applyInput', () => {
  it('ignores inputs while no piece is falling', () => {
    const state = createGame(['T']);
    expect(applyInput(state, 'left')).toBe(state);
  });

  it('moves left and right', () => {
    const state = started(['T']);
    const col = state.piece?.col ?? 0;
    expect(applyInput(state, 'left').piece?.col).toBe(col - 1);
    expect(applyInput(state, 'right').piece?.col).toBe(col + 1);
  });

  it('rotates', () => {
    expect(applyInput(started(['T']), 'rotate').piece?.rotation).toBe(1);
  });

  it('soft drops by one row', () => {
    expect(applyInput(started(['T']), 'softDrop').piece?.row).toBe(1);
  });

  it('hard drops and locks immediately, then spawns the next piece', () => {
    const state = applyInput(started(['O', 'T']), 'hardDrop');
    expect(state.board[BOARD_HEIGHT - 1][4]).toBe('O');
    expect(state.board[BOARD_HEIGHT - 2][5]).toBe('O');
    expect(state.piece?.type).toBe('T');
  });

  it('reports the cleared lines of the last action', () => {
    const almostFull = createBoard().map((row, r): Cell[] =>
      r === BOARD_HEIGHT - 1 ? row.map((_, c) => (c >= 3 && c <= 6 ? null : 'J')) : row,
    );
    const state = applyInput({ ...started(['I', 'T']), board: almostFull }, 'hardDrop');
    expect(state.lastCleared).toBe(1);
    expect(state.board[BOARD_HEIGHT - 1].every((cell) => cell === null)).toBe(true);
    expect(applyInput(state, 'left').lastCleared).toBe(0);
  });
});

describe('receivePenalty', () => {
  it('adds penalty lines at the bottom', () => {
    const state = receivePenalty(started(['T']), 2);
    expect(state.board[BOARD_HEIGHT - 1].every((cell) => cell === 'P')).toBe(true);
    expect(state.board[BOARD_HEIGHT - 2].every((cell) => cell === 'P')).toBe(true);
    expect(computeSpectrum(state.board)).toEqual(Array(BOARD_WIDTH).fill(2));
  });

  it('does nothing for 0 lines or once lost', () => {
    const state = started(['T']);
    expect(receivePenalty(state, 0)).toBe(state);
    const lost = { ...state, status: 'lost' as const };
    expect(receivePenalty(lost, 3)).toBe(lost);
  });

  it('works while no piece is falling', () => {
    const state = receivePenalty(createGame(['T']), 1);
    expect(state.piece).toBeNull();
    expect(state.board[BOARD_HEIGHT - 1][0]).toBe('P');
  });

  it('loses the game when blocks are pushed out of the board', () => {
    const state = { ...started(['T']), board: withCells([[0, 0]]) };
    expect(receivePenalty(state, 1).status).toBe('lost');
  });

  it('lifts the falling piece when the stack rises under it', () => {
    const landed = tickUntil(started(['O']), (s) => s.grounded);
    const raised = receivePenalty(landed, 2);
    expect(raised.status).toBe('playing');
    expect(raised.piece?.row).toBe((landed.piece?.row ?? 0) - 2);
  });

  it('loses the game when the piece cannot be lifted out of the stack', () => {
    // the stack almost reaches the top: raising it by one line traps the piece at row 0
    const state = { ...started(['O']), board: withCells([[2, 4]]) };
    expect(state.piece?.row).toBe(0);
    expect(receivePenalty(state, 1).status).toBe('lost');
  });
});

describe('a full game', () => {
  it('plays pieces down to a line clear', () => {
    let state = started(['I', 'I', 'O', 'O']);
    // first I against the left wall: columns 0-3
    state = applyInput(applyInput(applyInput(state, 'left'), 'left'), 'left');
    state = applyInput(state, 'hardDrop');
    expect(state.board[BOARD_HEIGHT - 1].slice(0, 4)).toEqual(['I', 'I', 'I', 'I']);
    // second I right next to it: columns 4-7
    state = applyInput(applyInput(state, 'right'), 'hardDrop');
    expect(state.board[BOARD_HEIGHT - 1].filter(Boolean)).toHaveLength(8);
    expect(state.lastCleared).toBe(0);
    // an O against the right wall fills the last two columns
    state = applyInput(
      applyInput(applyInput(applyInput(state, 'right'), 'right'), 'right'),
      'right',
    );
    state = applyInput(state, 'hardDrop');
    expect(state.lastCleared).toBe(1);
    expect(computeSpectrum(state.board).slice(0, 8)).toEqual(Array(8).fill(0));
    expect(computeSpectrum(state.board).slice(8)).toEqual([1, 1]);
  });
});

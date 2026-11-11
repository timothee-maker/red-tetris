import { INITIAL_ROTATION, PIECE_TYPES, SPAWN_COLUMN, SPAWN_ROW } from './tetrominoes';

describe('tetrominoes', () => {
  it('defines the 7 original piece types', () => {
    expect([...PIECE_TYPES].sort()).toEqual(['I', 'J', 'L', 'O', 'S', 'T', 'Z']);
  });

  it('spawns every piece at the top, centered', () => {
    expect(SPAWN_ROW).toBe(0);
    expect(SPAWN_COLUMN).toBe(3);
    expect(INITIAL_ROTATION).toBe(0);
  });
});

import {
  getShape,
  INITIAL_ROTATION,
  PIECE_TYPES,
  SHAPES,
  SPAWN_COLUMN,
  SPAWN_ROW,
} from './tetrominoes';

const draw = (type: Parameters<typeof getShape>[0], rotation: number) =>
  getShape(type, rotation).map((row) => row.map((v) => (v ? 'X' : '.')).join(''));

describe('tetrominoes', () => {
  it('defines the 7 original piece types', () => {
    expect([...PIECE_TYPES].sort()).toEqual(['I', 'J', 'L', 'O', 'S', 'T', 'Z']);
  });

  it('spawns every piece at the top, centered', () => {
    expect(SPAWN_ROW).toBe(0);
    expect(SPAWN_COLUMN).toBe(3);
    expect(INITIAL_ROTATION).toBe(0);
  });

  it('gives 4 rotations of 4 cells in a 4x4 box for every piece', () => {
    for (const type of PIECE_TYPES) {
      expect(SHAPES[type]).toHaveLength(4);
      for (const shape of SHAPES[type]) {
        expect(shape).toHaveLength(4);
        shape.forEach((row) => expect(row).toHaveLength(4));
        expect(shape.flat().filter(Boolean)).toHaveLength(4);
      }
    }
  });

  it('draws the I piece horizontally then vertically', () => {
    expect(draw('I', 0)).toEqual(['....', 'XXXX', '....', '....']);
    expect(draw('I', 1)).toEqual(['..X.', '..X.', '..X.', '..X.']);
  });

  it('draws the T piece in its 4 rotations', () => {
    expect(draw('T', 0)).toEqual(['.X..', 'XXX.', '....', '....']);
    expect(draw('T', 1)).toEqual(['.X..', '.XX.', '.X..', '....']);
    expect(draw('T', 2)).toEqual(['....', 'XXX.', '.X..', '....']);
    expect(draw('T', 3)).toEqual(['.X..', 'XX..', '.X..', '....']);
  });

  it('draws S and Z as mirror images', () => {
    expect(draw('S', 0)).toEqual(['.XX.', 'XX..', '....', '....']);
    expect(draw('Z', 0)).toEqual(['XX..', '.XX.', '....', '....']);
  });

  it('keeps the O piece identical in every rotation', () => {
    expect(draw('O', 0)).toEqual(['.XX.', '.XX.', '....', '....']);
    for (const r of [1, 2, 3]) expect(draw('O', r)).toEqual(draw('O', 0));
  });

  it('returns to the same shape after 4 rotations, and wraps the rotation index', () => {
    for (const type of PIECE_TYPES) {
      expect(getShape(type, 4)).toEqual(getShape(type, 0));
      expect(getShape(type, -1)).toEqual(getShape(type, 3));
    }
  });
});

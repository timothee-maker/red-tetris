import { SPAWN_COLUMN } from '@shared/tetrominoes';
import { getCells, spawnPiece } from './piece';

describe('piece', () => {
  it('spawns at the shared spawn point', () => {
    expect(spawnPiece('T')).toEqual({ type: 'T', rotation: 0, row: 0, col: SPAWN_COLUMN });
  });

  it('gives the board coordinates of the 4 blocks', () => {
    expect(getCells(spawnPiece('T'))).toEqual([
      [0, 4],
      [1, 3],
      [1, 4],
      [1, 5],
    ]);
  });

  it('follows the piece position and rotation', () => {
    const cells = getCells({ type: 'I', rotation: 1, row: 5, col: 0 });
    expect(cells).toEqual([
      [5, 2],
      [6, 2],
      [7, 2],
      [8, 2],
    ]);
  });
});

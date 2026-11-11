import { BOARD_HEIGHT, BOARD_WIDTH, SPECTRUM_LENGTH } from './constants';

describe('constants', () => {
  it('uses a 10x20 board', () => {
    expect(BOARD_WIDTH).toBe(10);
    expect(BOARD_HEIGHT).toBe(20);
  });

  it('has one spectrum value per column', () => {
    expect(SPECTRUM_LENGTH).toBe(BOARD_WIDTH);
  });
});

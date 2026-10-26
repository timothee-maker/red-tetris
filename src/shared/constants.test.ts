import { BOARD_HEIGHT, BOARD_WIDTH } from './constants';

describe('constants', () => {
  it('uses a 10x20 board', () => {
    expect(BOARD_WIDTH).toBe(10);
    expect(BOARD_HEIGHT).toBe(20);
  });
});

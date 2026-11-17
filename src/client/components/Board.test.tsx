// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { createBoard } from '../logic/board';
import { spawnPiece } from '../logic/piece';
import { Board } from './Board';

describe('Board', () => {
  it('renders 200 cells', () => {
    render(<Board board={createBoard()} piece={null} />);
    expect(screen.getByLabelText('board').children).toHaveLength(200);
  });

  it('shows the falling piece without changing the board', () => {
    const board = createBoard();
    render(<Board board={board} piece={spawnPiece('T')} />);
    expect(document.querySelectorAll('.cell--T')).toHaveLength(4);
    expect(board.flat().every((cell) => cell === null)).toBe(true);
  });
});

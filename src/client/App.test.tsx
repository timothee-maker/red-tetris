// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

describe('App', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows the landing page with a laptop to click', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: 'Red Tetris' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play Red Tetris' })).toBeEnabled();
    expect(screen.queryByLabelText('board')).toBeNull();
  });

  it('opens the game after the zoom, plays, and closes with Escape', () => {
    renderAt('/');
    fireEvent.click(screen.getByRole('button', { name: 'Play Red Tetris' }));
    // Zooming: the game has not started yet.
    expect(screen.queryByLabelText('board')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(screen.getByLabelText('board')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(document.querySelectorAll('.board .cell:not(.cell--empty)').length).toBeGreaterThan(0);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByLabelText('board')).toBeNull();
    expect(screen.getByRole('button', { name: 'Play Red Tetris' })).toBeEnabled();
  });

  it('closes with the close button', () => {
    renderAt('/');
    fireEvent.click(screen.getByRole('button', { name: 'Play Red Tetris' }));
    act(() => {
      vi.advanceTimersByTime(700);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByLabelText('board')).toBeNull();
  });

  it('opens the game directly on a game URL, without the landing click', () => {
    renderAt('/room1/alice');
    expect(screen.getByLabelText('board')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play Red Tetris' })).toBeDisabled();
  });

  it('goes back to the landing page when closing a game URL', () => {
    renderAt('/room1/alice');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByLabelText('board')).toBeNull();
    expect(screen.getByRole('button', { name: 'Play Red Tetris' })).toBeEnabled();
  });

  it('shows an error page on unknown routes', () => {
    renderAt('/a/b/c');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});

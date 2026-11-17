// @vitest-environment jsdom
import { act, fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from '../store';
import { piecesReceived } from '../store/gameSlice';
import { randomPieces, useLocalPieces } from './useLocalPieces';
import { useGameLoop } from './useGameLoop';
import { useKeyboard } from './useKeyboard';

const setup = (hook: () => void) => {
  const store = createStore();
  const Probe = () => {
    hook();
    return null;
  };
  render(
    <Provider store={store}>
      <Probe />
    </Provider>,
  );
  return store;
};

describe('useGameLoop', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('dispatches a tick every interval', () => {
    const store = setup(() => useGameLoop(100));
    act(() => {
      store.dispatch(piecesReceived(['T']));
      vi.advanceTimersByTime(100);
    });
    expect(store.getState().game.game.piece?.type).toBe('T');
  });
});

describe('useKeyboard', () => {
  const spawned = () => {
    const store = setup(useKeyboard);
    act(() => {
      store.dispatch(piecesReceived(['T', 'T']));
    });
    return store;
  };

  it('ignores unrelated keys', () => {
    const store = spawned();
    expect(fireEvent.keyDown(window, { code: 'KeyA' })).toBe(true);
    expect(store.getState().game.game.piece).toBeNull();
  });

  it('prevents the default scroll and ignores a held hard drop', () => {
    const store = spawned();
    expect(fireEvent.keyDown(window, { code: 'Space', repeat: true })).toBe(false);
    expect(store.getState().game.game.queue).toHaveLength(2);
  });
});

describe('useLocalPieces', () => {
  it('fills the queue when it runs low', () => {
    const store = setup(useLocalPieces);
    expect(store.getState().game.game.queue.length).toBeGreaterThanOrEqual(3);
  });

  it('draws the requested number of pieces', () => {
    expect(randomPieces(4)).toHaveLength(4);
  });
});

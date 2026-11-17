import { createStore } from './index';
import {
  gameReset,
  inputPressed,
  penaltyReceived,
  piecesReceived,
  tickReceived,
} from './gameSlice';

const game = (store: ReturnType<typeof createStore>) => store.getState().game.game;

describe('gameSlice', () => {
  it('starts with an empty game', () => {
    const { piece, queue, status } = game(createStore());
    expect([piece, queue, status]).toEqual([null, [], 'playing']);
  });

  it('queues received pieces and spawns one on tick', () => {
    const store = createStore();
    store.dispatch(piecesReceived(['T', 'I']));
    store.dispatch(tickReceived());
    expect(game(store).piece?.type).toBe('T');
    expect(game(store).queue).toEqual(['I']);
  });

  it('applies inputs to the falling piece', () => {
    const store = createStore();
    store.dispatch(piecesReceived(['T']));
    store.dispatch(tickReceived());
    const col = game(store).piece!.col;
    store.dispatch(inputPressed('left'));
    expect(game(store).piece!.col).toBe(col - 1);
  });

  it('applies penalty lines', () => {
    const store = createStore();
    store.dispatch(penaltyReceived(2));
    expect(game(store).board[19]![0]).toBe('P');
  });

  it('resets the game', () => {
    const store = createStore();
    store.dispatch(piecesReceived(['T']));
    store.dispatch(gameReset());
    expect(game(store).queue).toEqual([]);
  });
});

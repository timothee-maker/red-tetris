import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PieceType } from '@shared/tetrominoes';
import { applyInput, createGame, enqueuePieces, receivePenalty, tick } from '../logic/game';
import type { GameState, Input } from '../logic/types';

export interface GameSliceState {
  game: GameState;
}

const initialState = (): GameSliceState => ({ game: createGame() });

/** Every reducer delegates to the pure logic and returns a new object. */
const gameSlice = createSlice({
  name: 'game',
  initialState: initialState(),
  reducers: {
    gameReset: () => initialState(),
    tickReceived: (state) => ({ game: tick(state.game) }),
    inputPressed: (state, action: PayloadAction<Input>) => ({
      game: applyInput(state.game, action.payload),
    }),
    piecesReceived: (state, action: PayloadAction<PieceType[]>) => ({
      game: enqueuePieces(state.game, action.payload),
    }),
    penaltyReceived: (state, action: PayloadAction<number>) => ({
      game: receivePenalty(state.game, action.payload),
    }),
  },
});

export const { gameReset, tickReceived, inputPressed, piecesReceived, penaltyReceived } =
  gameSlice.actions;
export const gameReducer = gameSlice.reducer;

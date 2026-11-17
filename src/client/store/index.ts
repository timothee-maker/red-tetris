import { configureStore } from '@reduxjs/toolkit';
import { gameReducer } from './gameSlice';

export const createStore = () => configureStore({ reducer: { game: gameReducer } });

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

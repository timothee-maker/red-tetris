import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { tickReceived } from '../store/gameSlice';

export const GRAVITY_INTERVAL_MS = 500;

/** Dispatches a gravity tick at a constant speed while the game is being played. */
export const useGameLoop = (intervalMs: number = GRAVITY_INTERVAL_MS) => {
  const dispatch = useAppDispatch();
  const playing = useAppSelector((state) => state.game.game.status === 'playing');

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => dispatch(tickReceived()), intervalMs);
    return () => clearInterval(id);
  }, [playing, intervalMs, dispatch]);
};

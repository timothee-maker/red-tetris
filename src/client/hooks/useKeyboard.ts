import { useEffect } from 'react';
import type { Input } from '../logic/types';
import { inputPressed } from '../store/gameSlice';
import { useAppDispatch } from '../store/hooks';

const KEY_TO_INPUT: Record<string, Input> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'rotate',
  ArrowDown: 'softDrop',
  Space: 'hardDrop',
};

/** Maps the keyboard to game inputs: arrows move/rotate/soft drop, space hard drops. */
export const useKeyboard = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const input = KEY_TO_INPUT[event.code];
      if (input === undefined) return;
      // Stops the page from scrolling.
      event.preventDefault();
      // A held space bar must not hard drop every following piece.
      if (event.repeat && (input === 'hardDrop' || input === 'rotate')) return;
      dispatch(inputPressed(input));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dispatch]);
};

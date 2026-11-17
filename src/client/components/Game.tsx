import { useGameLoop } from '../hooks/useGameLoop';
import { useKeyboard } from '../hooks/useKeyboard';
import { useLocalPieces } from '../hooks/useLocalPieces';
import { gameReset } from '../store/gameSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Board } from './Board';

/** Just the game: board, loop, keyboard. Mounting it starts the game. */
export const Game = () => {
  const dispatch = useAppDispatch();
  const { board, piece, status } = useAppSelector((state) => state.game.game);
  useLocalPieces(); // TEMPORARY: replaced by the server's pieces
  useGameLoop();
  useKeyboard();

  return (
    <>
      <Board board={board} piece={piece} />
      {status === 'lost' && (
        <div className="overlay">
          <p>Game over</p>
          <button onClick={() => dispatch(gameReset())}>Restart</button>
        </div>
      )}
    </>
  );
};

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameReset } from '../store/gameSlice';
import { useAppDispatch } from '../store/hooks';
import { GameScreen } from './GameScreen';

interface LandingProps {
  /** Game URL (`/<room>/<player>`): the game is already open, no landing click needed. */
  direct?: boolean;
}

/** Landscape, desk and laptop, all in CSS. Clicking the laptop screen opens the game. */
export const Landing = ({ direct = false }: LandingProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [from, setFrom] = useState<DOMRect | null>(null);

  const close = useCallback(() => {
    dispatch(gameReset());
    setFrom(null);
    if (direct) navigate('/');
  }, [dispatch, navigate, direct]);

  return (
    <main className="scene">
      <div className="hill hill--far" />
      <div className="mist mist--left" />
      <div className="hill hill--mid" />
      <div className="mist mist--right" />

      <section className="hero">
        <h1>Red Tetris</h1>
        <p>Take a seat, open the laptop and play.</p>
      </section>

      <div className="hill hill--near">
        <div className="desk">
          <div className="chair">
            <div className="chair__back" />
            <div className="chair__seat" />
            <div className="chair__stem" />
          </div>
          <div className="desk__top" />
          <div className="desk__leg desk__leg--left" />
          <div className="desk__leg desk__leg--right" />
          <div className="desk__drawer" />
          <div className="laptop">
            <button
              className="laptop__screen"
              aria-label="Play Red Tetris"
              disabled={from !== null || direct}
              onClick={(event) => setFrom(event.currentTarget.getBoundingClientRect())}
            >
              <span className="laptop__play">▶</span>
              <span className="laptop__blocks">
                <i className="cell--T" />
                <i className="cell--I" />
                <i className="cell--Z" />
              </span>
            </button>
            <div className="laptop__base" />
          </div>
        </div>
      </div>

      {(direct || from !== null) && <GameScreen from={from} onClose={close} />}
    </main>
  );
};

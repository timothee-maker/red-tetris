import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Game } from './Game';

/** Must match the `transform` transition of `.screen__panel` in styles.css. */
export const ZOOM_MS = 700;

interface GameScreenProps {
  /** Where the laptop screen is: the panel grows from this rectangle. `null`: no zoom, already open. */
  from: DOMRect | null;
  onClose: () => void;
}

/**
 * The laptop screen zooming to the middle of the page (FLIP technique: the panel is
 * laid out at its final size, then visually moved back onto the laptop and released).
 * The game only starts once the zoom is over. Without `from` (direct URL) there is no zoom.
 */
export const GameScreen = ({ from, onClose }: GameScreenProps) => {
  const panel = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(from === null);

  useLayoutEffect(() => {
    const el = panel.current;
    if (el === null || from === null) return;
    const to = el.getBoundingClientRect();
    if (to.width === 0 || to.height === 0) return;
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    el.style.transition = 'none';
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${from.width / to.width}, ${from.height / to.height})`;
    el.getBoundingClientRect(); // forces the browser to apply the starting point
    el.style.transition = '';
    el.style.transform = '';
  }, [from]);

  useEffect(() => {
    if (from === null) return undefined;
    const id = setTimeout(() => setReady(true), ZOOM_MS);
    return () => clearTimeout(id);
  }, [from]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="screen">
        <div className="screen__panel" ref={panel}>
          {ready && (
            <>
              <button className="screen__close" aria-label="Close" onClick={onClose}>
                ×
              </button>
              <Game />
            </>
          )}
        </div>
      </div>
    </>
  );
};

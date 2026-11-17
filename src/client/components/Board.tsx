import { mergePiece } from '../logic/board';
import type { Board as BoardType, Piece } from '../logic/types';

interface BoardProps {
  board: BoardType;
  piece: Piece | null;
}

/** The falling piece is merged for display only, it is not part of the board state. */
export const Board = ({ board, piece }: BoardProps) => {
  const shown = piece === null ? board : mergePiece(board, piece);
  return (
    <div className="board" aria-label="board">
      {shown.flatMap((row, r) =>
        row.map((cell, c) => <div key={`${r}-${c}`} className={`cell cell--${cell ?? 'empty'}`} />),
      )}
    </div>
  );
};

import { useEffect } from 'react';
import { PIECE_TYPES, type PieceType } from '@shared/tetrominoes';
import { piecesReceived } from '../store/gameSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

const LOW_QUEUE = 3;
const BATCH_SIZE = 5;

export const randomPieces = (count: number): PieceType[] =>
  Array.from({ length: count }, () => PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)]!);

/**
 * TEMPORARY solo piece source: it plays the role of the server until the socket
 * middleware is plugged in (it will then ask `piece:request` instead).
 */
export const useLocalPieces = () => {
  const dispatch = useAppDispatch();
  const queueLength = useAppSelector((state) => state.game.game.queue.length);

  useEffect(() => {
    if (queueLength < LOW_QUEUE) dispatch(piecesReceived(randomPieces(BATCH_SIZE)));
  }, [queueLength, dispatch]);
};

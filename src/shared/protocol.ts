/**
 * socket.io protocol shared by the client and the server.
 *
 * This file is the contract between both sides: it is frozen once merged,
 * any change must be agreed on by both developers.
 *
 * Usage:
 *   server: new Server<ClientToServerEvents, ServerToClientEvents>(httpServer)
 *   client: io() as Socket<ServerToClientEvents, ClientToServerEvents>
 */
import type { PieceType } from './tetrominoes';

/** Height of the highest block of each column, one value per column (10 values). */
export type Spectrum = number[];

/** `lobby`: waiting for the host, `playing`: game running, `ended`: game over, can restart. */
export type RoomStatus = 'lobby' | 'playing' | 'ended';

export interface PlayerInfo {
  /** Unique id of the player (the socket id). */
  id: string;
  name: string;
  /** `false` once the player has lost or left during a game. */
  alive: boolean;
}

export interface RoomState {
  players: PlayerInfo[];
  /** Id of the host, `null` only if the room is empty. */
  host: string | null;
  status: RoomStatus;
}

export type RoomErrorCode =
  'NAME_TAKEN' | 'GAME_ALREADY_STARTED' | 'NOT_HOST' | 'NOT_IN_ROOM' | 'INVALID_PAYLOAD';

export interface RoomError {
  /** Stable code for the program, `message` is for the human. */
  code: RoomErrorCode;
  message: string;
}

/** Events sent by the client to the server. */
export interface ClientToServerEvents {
  /** Join a room. Refused if the name is taken or the game has started. */
  'room:join': (data: { room: string; name: string }) => void;
  /** Host only. Starts the game, or restarts it once it has ended. */
  'game:start': () => void;
  /** Ask for the next `count` pieces of the shared sequence. Answered by `piece:batch`. */
  'piece:request': (data: { count: number }) => void;
  /** Sent when a piece locks. Relayed to the opponents as `spectrum:update`. */
  'board:spectrum': (data: { spectrum: Spectrum }) => void;
  /** Number of lines just cleared. The server sends `count - 1` penalty lines to opponents. */
  'lines:cleared': (data: { count: number }) => void;
  /** The player can no longer place a piece. */
  'player:lost': () => void;
}

/** Events sent by the server to the client. */
export interface ServerToClientEvents {
  /** Full room state, sent to everyone on every change. */
  'room:state': (data: RoomState) => void;
  'room:error': (data: RoomError) => void;
  'game:started': () => void;
  /** Pieces of the shared sequence, in order, starting at the player's own index. */
  'piece:batch': (data: { pieces: PieceType[] }) => void;
  'spectrum:update': (data: { playerId: string; spectrum: Spectrum }) => void;
  /** Indestructible lines to add at the bottom of the board. */
  penalty: (data: { lines: number }) => void;
  /** `winner` is the id of the last player standing, `null` if nobody won (e.g. solo loss). */
  'game:over': (data: { winner: string | null }) => void;
}

// Type definition for the state of a game room.
export interface RoomState {
  id: string;
  players: number;
  playersNames: string[];
  roomName: string;
  sunkShips: Record<string, ShipType[]>;
  hasEnded: boolean;
}

// Type definition for player context.
export interface PlayerContextType {
  playerName: string;
  setPlayerName: (name: string) => void;
}

// Enum for common error messages.
export enum ErrorMessage {
  PlayerNotFound = "Player not found.",
  UnexpectedError = "An unexpected error occurred.",
  ServerError = "Server error occurred.",
}

// Enum for server response errors.
export enum ServerResponseError {
  PlayerNotFound = "Player not found.",
}

// All possible ship types in the game.
export type ShipType = "Cruiser" | "Destroyer" | "Submarine" | "Battleship" | "Carrier";

// Mapping ship types to their lengths.
export const shipLengths: { [key in ShipType]: number } = {
  Destroyer: 2,
  Cruiser: 3,
  Submarine: 3,
  Battleship: 4,
  Carrier: 5,
};

// Possible cell types on the board.
export type CellType = "Ship" | "HitShip" | "Miss" | null;

// Coordinate type for board positions.
export interface Coordinate {
  row: number;
  column: number;
}

// Type for a cell on the board.
export interface BoardCell {
  coordinate: Coordinate;
  type: CellType;
}

// Type for ship placement information.
export interface Placement {
  orientation: "Horizontal" | "Vertical";
  startCoordinate: { row: number; column: number };
  shipType: ShipType;
}

// Type for the state of the game during play.
export interface GameState {
  yourTurn: boolean;
  yourBoard: BoardCell[];
  opponentBoard: BoardCell[] | null;
}

// Type for the result of a finished game.
export interface GameResult {
  winner: string;
  loser: string;
  type: string;
}
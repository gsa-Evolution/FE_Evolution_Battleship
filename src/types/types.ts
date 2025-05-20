export interface RoomState {
  id: string;
  players: number;
  playersNames: string[];
  roomName: string;
  sunkShips: Record<string, ShipType[]>;
  hasEnded: boolean;
}

export enum ErrorMessage {
  PlayerNotFound = "Player not found.",
  UnexpectedError = "An unexpected error occurred.",
  ServerError = "Server error occurred.",
}

export enum ServerResponseError {
  PlayerNotFound = "Player not found.",
}

export type ShipType = "Cruiser" | "Destroyer" | "Submarine" | "Battleship" | "Carrier";

export const shipLengths: { [key in ShipType]: number } = {
  Destroyer: 2,
  Cruiser: 3,
  Submarine: 3,
  Battleship: 4,
  Carrier: 5,
};

export type CellType = "Ship" | "HitShip" | "Miss" | null;

export interface Coordinate {
  row: number;
  column: number;
}

export interface BoardCell {
  coordinate: Coordinate;
  type: CellType;
}

export interface Placement {
  orientation: "Horizontal" | "Vertical";
  startCoordinate: { row: number; column: number };
  shipType: ShipType;
}

export interface GameState {
  yourTurn: boolean;
  yourBoard: BoardCell[];
  opponentBoard: BoardCell[] | null;
}

export interface GameResult {
  winner: string;
  loser: string;
  type: string;
}
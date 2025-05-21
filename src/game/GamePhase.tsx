import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePlayer } from "../lobby/PlayerContext";
import { RoomState, CellType, Coordinate, BoardCell, GameState, GameResult, shipLengths } from "../types/types";
import { GameBoard, ResultGameWinner, ResultGameLoser } from "../components/Overlay";
import { getRoomList, getTurnLabel, playBackButtonSound } from "../utils/utils";
import StartGame from "../assets/sounds/Game/Start_Game.wav";
import GameBackground from "../assets/sounds/Game/Game_Background.wav";
import EvolutionLogo from "../assets/images/Logo.svg";
import "./GamePhase.css";
import config from "../config";

const GamePhase: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { playerName } = usePlayer();
  const navigate = useNavigate();
  const wsRef = useRef<WebSocket | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    yourTurn: false,
    yourBoard: [],
    opponentBoard: null
  });
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomState[]>([]);
  const [lastAttackedCellOpponent, setLastAttackedCellOpponent] = useState<Coordinate | null>(null);
  const [showOpponentOverlay, setShowOpponentOverlay] = useState(false);
  const previousSunkShips = useRef<{ [key: string]: string[] }>({});
  const [newlyAttackedCells, setNewlyAttackedCells] = useState<Coordinate[]>([]);
  const previousYourBoard = useRef<BoardCell[]>([]);
  const previousOpponentBoard = useRef<BoardCell[] | null>(null);

  const currentRoomId = rooms.find((room) => room.id === roomId);
  const currentRoomName = currentRoomId?.roomName || "Unknown";
  const opponentName =
    currentRoomId?.playersNames[0] === playerName
      ? currentRoomId.playersNames[1]
      : currentRoomId?.playersNames[0];

  const winnerSentences = [
    "you have proven your might on the battlefield!",
    "victory is yours as your strategy prevails!",
    "the seas bow to your command!",
    "your fleet stands unchallenged!",
    "the enemy has no answer to your brilliance!",
    "you lead your ships to an inevitable triumph!",
    "your victory is as certain as the sunrise!",
    "the battle is won and you are the master of the seas!",
    "you have conquered the waves with unmatched skill!",
    "your strategy sinks the enemy’s fleet with precision!"
  ];

  const loserSentences = [
    "you have failed on the battlefield.",
    "defeat is yours as your strategy crumbles.",
    "the seas have rejected your command.",
    "your fleet is shattered and broken.",
    "the enemy has outplayed you at every turn.",
    "your ships falter and victory slips away.",
    "your defeat is as certain as the dusk.",
    "the battle is lost and the seas mock your efforts.",
    "you have been overpowered and undone by your own mistakes.",
    "your strategy sinks as your fleet falls apart."
  ];  

  const getRandomSentence = (sentencesArray: any) => {
    const randomIndex = Math.floor(Math.random() * sentencesArray.length);
    return sentencesArray[randomIndex];
  };

  const playRandomSoundAttack = (folder: string) => {
    const soundFiles = {
      "../assets/sounds/Game/Hit": [
        "1.wav", "2.wav", "3.wav"
      ],
      "../assets/sounds/Game/Miss": [
        "1.wav", "2.wav", "3.wav", "4.wav"
      ],
    };
  
    const files = soundFiles[folder as keyof typeof soundFiles];
    if (files) {
      const randomFile = files[Math.floor(Math.random() * files.length)];
      const audio = new Audio(new URL(`${folder}/${randomFile}`, import.meta.url).toString());
      audio.play().catch((error) => console.error("Audio playback failed:", error));
    }
  };

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const roomsList = await getRoomList();
        setRooms(roomsList);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    };
    fetchRooms();
  }, [gameState]);

  useEffect(() => {
    const ws = new WebSocket(`${config.protocol === "http" ? "ws" : "wss"}://${config.baseUrl}/join/${roomId}/${playerName}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connection established");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "AttackShips") {
          const newAttacks: Coordinate[] = [];
          message.yourBoard.forEach(([coordinate, type]: [Coordinate, CellType]) => {
            const previousCell = previousYourBoard.current.find(
              (cell) => cell.coordinate.row === coordinate.row && cell.coordinate.column === coordinate.column
            );
            if (!previousCell || previousCell.type !== type) {
              newAttacks.push(coordinate);
            }
          });

          // Update the newly attacked cells for animation
          setNewlyAttackedCells(newAttacks);

          // Play sound for the last played cell
          const lastCell = newAttacks[newAttacks.length - 1];
          if (lastCell) {
            const lastCellResultOpponent = message.yourBoard.find(
              ([coord]: [Coordinate, CellType]) =>
                coord.row === lastCell.row && coord.column === lastCell.column
            )?.[1];

            if (lastCellResultOpponent === "HitShip") {
              playRandomSoundAttack("../assets/sounds/Game/Hit");
            } else if (lastCellResultOpponent === "Miss") {
              playRandomSoundAttack("../assets/sounds/Game/Miss");
            }
          }

          // Update the game state
          setGameState({
            yourTurn: message.yourTurn,
            yourBoard: message.yourBoard.map(([coordinate, type]: [Coordinate, CellType]) => ({
              coordinate,
              type,
            })),
            opponentBoard: message.opponentBoard
              ? message.opponentBoard.map(([coordinate, type]: [Coordinate, CellType]) => ({
                  coordinate,
                  type,
                }))
              : null,
          });

          // Update the previous board state
          previousYourBoard.current = message.yourBoard.map(([coordinate, type]: [Coordinate, CellType]) => ({
            coordinate,
            type,
          }));
        } else if (message.type === "Win") {
          setGameResult({
            winner: message.winner,
            loser: message.loser,
            type: message.type,
          });
        } else if (message.type === "Error") {
          setError(message.error);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
        setError("An error occurred while processing the server response.");
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [roomId, playerName, opponentName]);

  useEffect(() => {
    if (!gameState?.yourTurn) {
      setShowOpponentOverlay(true);
    } else {
      setShowOpponentOverlay(false);
    }
  }, [gameState?.yourTurn]);

  useEffect(() => {
    if (newlyAttackedCells.length > 0) {
      const timeout = setTimeout(() => {
        setNewlyAttackedCells([]);
      }, 1000); // Match the animation duration

      return () => clearTimeout(timeout);
    }
  }, [newlyAttackedCells]);

  const startGameAudioRef = useRef<HTMLAudioElement | null>(null);
  const gameBackgroundAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!startGameAudioRef.current) {
      startGameAudioRef.current = new Audio(StartGame);
      startGameAudioRef.current.loop = false;
    }
    const audio = startGameAudioRef.current;
    audio.currentTime = 0;
    audio.play().catch((error) => {
      if (error.name !== "AbortError") {
        console.error("StartGame playback failed:", error);
      }
    });

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    if (!gameBackgroundAudioRef.current) {
      gameBackgroundAudioRef.current = new Audio(GameBackground);
      gameBackgroundAudioRef.current.loop = true;
    }
    const audio = gameBackgroundAudioRef.current;
    audio.currentTime = 0;
    audio.play().catch((error) => {
      if (error.name !== "AbortError") {
        console.error("GameBackground playback failed:", error);
      }
    });

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    if (gameResult && startGameAudioRef.current) {
      startGameAudioRef.current.pause();
      startGameAudioRef.current.currentTime = 0;
    }
  }, [gameResult]);

  const victorySoundRef = useRef<HTMLAudioElement | null>(null);
  const defeatSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (gameResult?.winner === playerName) {
      const victorySound = new Audio(new URL("../assets/sounds/Game/Victory/Victory.wav", import.meta.url).toString());
      victorySound.loop = true;
      victorySound.play().catch((error) => console.error("Victory sound playback failed:", error));
      victorySoundRef.current = victorySound;
    } else if (gameResult?.loser === playerName) {
      const defeatSounds = [
        "../assets/sounds/Game/Defeat/1.wav",
        "../assets/sounds/Game/Defeat/2.wav",
      ];
      const randomDefeatSound = defeatSounds[Math.floor(Math.random() * defeatSounds.length)];
      const defeatSound = new Audio(new URL(randomDefeatSound, import.meta.url).toString());
      defeatSound.loop = true;
      defeatSound.play().catch((error) => console.error("Defeat sound playback failed:", error));
      defeatSoundRef.current = defeatSound;
    }

    return () => {
      // Cleanup: Stop and reset both sounds
      if (victorySoundRef.current) {
        victorySoundRef.current.pause();
        victorySoundRef.current.currentTime = 0;
      }
      if (defeatSoundRef.current) {
        defeatSoundRef.current.pause();
        defeatSoundRef.current.currentTime = 0;
      }
    };
  }, [gameResult]);

  const handleBackToLobby = () => {
    // Play back button sound
    playBackButtonSound();

    // Stop and reset both sounds when navigating back to the lobby
    if (victorySoundRef.current) {
      victorySoundRef.current.pause();
      victorySoundRef.current.currentTime = 0;
    }
    if (defeatSoundRef.current) {
      defeatSoundRef.current.pause();
      defeatSoundRef.current.currentTime = 0;
    }

    localStorage.removeItem("lastJoinedRoom");
    navigate("/lobby", { state: { fromRoom: true } });
  };

  const handleCellClick = (coordinate: Coordinate) => {
    if (!gameState?.yourTurn) {
      setError("It's not your turn!");
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "AttackShips",
          coordinate,
        })
      );
      setLastAttackedCellOpponent(coordinate); // Track the attacked cell on the opponent's board
    } else {
      setError("WebSocket is not connected.");
    }
  };

  const renderBoardOpponent = (board: BoardCell[] | null, isOpponent: boolean) => {
    const grid = Array.from({ length: 10 }, () =>
      Array.from({ length: 10 }, () => null as CellType)
    );

    if (board) {
      board.forEach(({ coordinate, type }) => {
        grid[coordinate.row][coordinate.column] = type;
      });
    }

    return (
      <div className="board-container">
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isLastAttackedCell =
              lastAttackedCellOpponent?.row === rowIndex &&
              lastAttackedCellOpponent?.column === colIndex;

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() =>
                  isOpponent && handleCellClick({ row: rowIndex, column: colIndex })
                }
                className={`board-cell ${
                  cell === "Ship" && !isOpponent
                    ? "ship"
                    : cell === "HitShip"
                    ? `hit ${isLastAttackedCell ? "attacked-hit" : ""}`
                    : cell === "Miss"
                    ? `miss ${isLastAttackedCell ? "attacked-miss" : ""}`
                    : "default"
                }`}
              />
            );
          })
        )}
      </div>
    );
  };

  const renderBoardPlayer = (board: BoardCell[] | null, isOpponent: boolean) => {
    const grid = Array.from({ length: 10 }, () =>
      Array.from({ length: 10 }, () => null as CellType)
    );

    if (board) {
      board.forEach(({ coordinate, type }) => {
        grid[coordinate.row][coordinate.column] = type;
      });
    }

    return (
      <div className="board-container" style={{ position: "relative", zIndex: 2 }}>
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isNewlyAttackedCell = newlyAttackedCells.some(
              (attackedCell) =>
                attackedCell.row === rowIndex && attackedCell.column === colIndex
            );

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() =>
                  isOpponent && handleCellClick({ row: rowIndex, column: colIndex })
                }
                className={`board-cell ${
                  cell === "Ship" && !isOpponent
                    ? "ship"
                    : cell === "HitShip"
                    ? `hit ${isNewlyAttackedCell ? "attacked-hit" : ""}`
                    : cell === "Miss"
                    ? `miss ${isNewlyAttackedCell ? "attacked-miss" : ""}`
                    : "default"
                }`}
              />
            );
          })
        )}
        {/* Conditionally render the translucent overlay */}
        {gameState.yourTurn && (
          <div
            style={{
              position: "absolute",
              top: "0%",
              left: "0%",
              width: "101%",
              height: "100%",
              backgroundColor: "rgba(0, 70, 128, 0.75)",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    );
  };

  const renderShipsPlayer = (sunkShips: string[], isOpponent: boolean) => {
    const allShips = ["Carrier", "Battleship", "Cruiser", "Submarine", "Destroyer"];
  
    const sortedShips = isOpponent
      ? allShips
      : allShips.sort((a, b) => shipLengths[a as keyof typeof shipLengths] - shipLengths[b as keyof typeof shipLengths]);
  
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: isOpponent ? "flex-start" : "flex-end",
          gap: "10px",
          position: "absolute",
          top: isOpponent ? "10px" : "auto",
          bottom: isOpponent ? "auto" : "10px",
          left: isOpponent ? "10px" : "auto",
          right: isOpponent ? "auto" : "10px",
        }}
      >
        {sortedShips.map((ship) => (
          <div
            key={ship}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              width: `${shipLengths[ship as keyof typeof shipLengths] * 40}px`, // Width based on ship size
              height: "40px", // Fixed height
              backgroundColor: sunkShips.includes(ship) ? "red" : "var(--classicBlue)", // Red for sunk ships, blue for others
              color: "white",
              position: "relative",
              border: "1px solid white",
            }}
          >
            {Array.from({ length: shipLengths[ship as keyof typeof shipLengths] }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: "40px",
                  height: "100%",
                  borderRight: i < shipLengths[ship as keyof typeof shipLengths] - 1 ? "1px solid white" : "none",
                }}
              />
            ))}
            {/* Translucent overlay */}
            {gameState.yourTurn && (
              <div
                style={{
                  position: "absolute",
                  top: -1,
                  left: -1,
                  width: "100%",
                  height: "100%",
                  backgroundColor: "rgba(0, 70, 128, 0.75)", // Translucent black overlay
                  border: "1px solid rgba(255, 255, 255, 0)",
                  pointerEvents: "none",
                }}
              />
            )}
            <span
              style={{
                position: "absolute",
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "black",
                color: "white",
                padding: "5px",
                borderRadius: "5px",
                whiteSpace: "nowrap",
                opacity: 0,
                pointerEvents: "none",
                transition: "opacity 0.2s",
              }}
              className="tooltip"
            >
              {ship}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderShipsOpponent = (sunkShips: string[], isOpponent: boolean) => {
    const allShips = ["Carrier", "Battleship", "Submarine", "Cruiser", "Destroyer"];
  
    const sortedShips = isOpponent
      ? allShips
      : allShips.sort((a, b) => shipLengths[a as keyof typeof shipLengths] - shipLengths[b as keyof typeof shipLengths]);
  
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: isOpponent ? "flex-start" : "flex-end",
          gap: "10px",
          position: "absolute",
          top: isOpponent ? "10px" : "auto",
          bottom: isOpponent ? "auto" : "10px",
          left: isOpponent ? "10px" : "auto",
          right: isOpponent ? "auto" : "10px",
        }}
      >
        {sortedShips.map((ship) => (
          <div
            key={ship}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              width: `${shipLengths[ship as keyof typeof shipLengths] * 40}px`, // Width based on ship size
              height: "40px", // Fixed height
              backgroundColor: sunkShips.includes(ship) ? "red" : "var(--classicBlue)", // Red for sunk ships, blue for others
              color: "white",
              position: "relative",
              border: "1px solid white",
            }}
          >
            {Array.from({ length: shipLengths[ship as keyof typeof shipLengths] }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: "40px",
                  height: "100%",
                  borderRight: i < shipLengths[ship as keyof typeof shipLengths] - 1 ? "1px solid white" : "none",
                }}
              />
            ))}
            <span
              style={{
                position: "absolute",
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "black",
                color: "white",
                padding: "5px",
                borderRadius: "5px",
                whiteSpace: "nowrap",
                opacity: 0,
                pointerEvents: "none",
                transition: "opacity 0.2s",
              }}
              className="tooltip"
            >
              {ship}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const hasMountedOpponentBoard = useRef(false);

  useEffect(() => {
    if (!hasMountedOpponentBoard.current) {
      hasMountedOpponentBoard.current = true;
      previousOpponentBoard.current = gameState.opponentBoard
        ? [...gameState.opponentBoard]
        : null;
      return;
    }

    if (
      lastAttackedCellOpponent &&
      gameState.opponentBoard &&
      previousOpponentBoard.current
    ) {
      // Find the cell in the new opponent board
      const newCell = gameState.opponentBoard.find(
        (cell) =>
          cell.coordinate.row === lastAttackedCellOpponent.row &&
          cell.coordinate.column === lastAttackedCellOpponent.column
      );
      // Find the cell in the previous opponent board
      const prevCell = previousOpponentBoard.current.find(
        (cell) =>
          cell.coordinate.row === lastAttackedCellOpponent.row &&
          cell.coordinate.column === lastAttackedCellOpponent.column
      );
      // If the cell type changed, play the sound
      if (newCell && (!prevCell || newCell.type !== prevCell.type)) {
        if (newCell.type === "HitShip") {
          playRandomSoundAttack("../assets/sounds/Game/Hit");
        } else if (newCell.type === "Miss") {
          playRandomSoundAttack("../assets/sounds/Game/Miss");
        }
      }
    }
    // Update the previous opponent board for next comparison
    previousOpponentBoard.current = gameState.opponentBoard
      ? [...gameState.opponentBoard]
      : null;
  }, [gameState.opponentBoard, lastAttackedCellOpponent]);

  const hasMountedSunkShips = useRef(false);

  useEffect(() => {
    if (!currentRoomId?.sunkShips) return;

    // Avoid playing sound on first mount
    if (!hasMountedSunkShips.current) {
      hasMountedSunkShips.current = true;
      previousSunkShips.current = { ...currentRoomId.sunkShips };
      return;
    }

    // Helper to play random sunk ship sound
    const playRandomSunkShipSound = () => {
      const files = ["1.wav", "2.wav", "3.wav", "4.wav"];
      const randomFile = files[Math.floor(Math.random() * files.length)];
      const audio = new Audio(new URL(`../assets/sounds/Game/SunkShip/${randomFile}`, import.meta.url).toString());
      audio.play().catch((error) => console.error("SunkShip sound playback failed:", error));
    };

    // Check for new sunk ships for both players
    [playerName, opponentName].forEach((name) => {
      if (!name) return;
      const prev = previousSunkShips.current[name] || [];
      const curr = currentRoomId.sunkShips[name] || [];
      const newSunk = curr.filter((ship) => !prev.includes(ship));
      if (newSunk.length > 0) {
        playRandomSunkShipSound();
      }
    });

    // Update previous sunk ships after check
    previousSunkShips.current = { ...currentRoomId.sunkShips };
  }, [currentRoomId?.sunkShips, playerName, opponentName]);

  if (gameResult) {
    return (
      <>
        <ResultGameWinner triggerAnimation={gameResult.winner === playerName}/>
        <ResultGameLoser triggerAnimation={gameResult.winner === opponentName}/>
        <div className="game-phase-container">
          <h1>
            {gameResult.winner === playerName ? (
              <>
                Victory in the <span className="room-name">{currentRoomName}</span>!
              </>
            ) : (
              <>
                Defeat in the <span className="room-name">{currentRoomName}</span>!
              </>
            )}
          </h1>
          <h2 className="game-result">
            {gameResult.winner === playerName
              ? `Captain ${playerName}, ${getRandomSentence(winnerSentences)}`
              : gameResult.loser === playerName
              ? `Captain ${playerName}, ${getRandomSentence(loserSentences)}`
              : "You are not part of this game."}
          </h2>
          <button
            className="back-to-lobby-button-endgame"
            onClick={handleBackToLobby}
          >
          <img
            src={EvolutionLogo}
            alt="Evolution Logo"
            className="evolution-logo"
          />
            Lobby
          </button>
        </div>
      </>
    );
  }

  if (!gameState) {
    console.error("Game state is undefined:", gameState);
    return <p className="loading-gamestate">Loading game state...</p>;
  }

  return (
    <>
      <GameBoard />
      <div>
        {!gameState.yourTurn && showOpponentOverlay && <div className="overlay-opponent-turn" />}
      </div>

      <div className="game-phase-container">
        {/* Opponent's ships on the top left */}
        <div className="opponent-sunk-ships">
          {opponentName && currentRoomId?.sunkShips ? renderShipsOpponent(currentRoomId.sunkShips[opponentName] || [], true) : null}
        </div>

        <h2 className="opponent-name">{opponentName}</h2>
        {renderBoardOpponent(gameState.opponentBoard, true)}

        <h1 className="player-turn">
          {gameState.yourTurn ? getTurnLabel(playerName) : getTurnLabel(opponentName || "Unknown")}
        </h1>
        {error && <p style={{ color: "red" }}>{error}</p>}

        <h2 className="player-name" style={{ opacity: gameState.yourTurn ? 0.35 : 1, position: gameState.yourTurn ? "static" : "relative" }}>
          {playerName}
        </h2>
        {renderBoardPlayer(gameState.yourBoard, false)}
             
        {/* Player's ships on the bottom right */}
        <div className="player-sunk-ships">
          {playerName && currentRoomId?.sunkShips ? renderShipsPlayer(currentRoomId.sunkShips[playerName] || [], false) : null}
        </div>
  
        <button
          className="back-to-lobby-button"
          onClick={handleBackToLobby}
        >
          <img
            src={EvolutionLogo}
            alt="Evolution Logo"
            className="evolution-logo"
          />
          Lobby
        </button>
      </div>
    </>
  );
};

export default GamePhase;

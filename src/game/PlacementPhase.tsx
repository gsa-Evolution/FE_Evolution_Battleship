import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePlayer } from "../lobby/PlayerContext";
import { getRoomList, waitingAfterSentences, waitingBeforeSentences } from "../utils/utils";
import { ShipType, shipLengths, Placement } from "../types/types";
import "./PlacementPhase.css";
import { PlacementBoard, PlacementWaitingBefore, PlacementWaitingAfter } from "../components/Overlay";
import EvolutionLogo from "../assets/images/Logo.svg";
import RandomButton1 from "../assets/sounds/Placement/Placement/Random/Random1.wav";
import RandomButton2 from "../assets/sounds/Placement/Placement/Random/Random2.wav";
import PlaceShips from "../assets/sounds/Placement/Placement/PlaceShips/Place_Ships.wav";
import { playBackButtonSound } from "../utils/utils";

const PlacementPhase: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const wsRef = useRef<WebSocket | null>(null);
  const { playerName } = usePlayer();

  const [roomName, setRoomName] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selectedShip, setSelectedShip] = useState<ShipType | null>(null);
  const [selectedPlacement, setSelectedPlacement] = useState<Placement | null>(null);
  const [previewCoordinates, setPreviewCoordinates] = useState<{ row: number; column: number }[]>([]);
  const [orientation] = useState<"Horizontal" | "Vertical">("Horizontal");
  const [error, setError] = useState<string | null>(null);
  const [waitingForOpponentEnterRoom, setWaitingForOpponentEnterRoom] = useState(true);
  const [waitingForOpponentStartGame, setWaitingForOpponentStartGame] = useState(false);
  const [animatedCells, setAnimatedCells] = useState<{ row: number; column: number }[]>([]);

  const audioRefs = useRef<HTMLAudioElement[]>([]);

  const playRandomSoundLoop = (folder: string) => {
    stopAllSounds();
  
    const soundFiles = {
      "../assets/sounds/Placement/WaitingBefore": [
        "1.wav", "2.wav", "3.wav", "4.wav", "5.wav", "6.wav", "7.wav", "8.wav", "9.wav", "10.wav",
        "11.wav", "12.wav", "13.wav", "14.wav", "15.wav", "16.wav", "17.wav", "18.wav", "19.wav", "20.wav",
        "21.wav", "22.wav", "23.wav", "24.wav", "25.wav", "26.wav", "27.wav", "28.wav", "29.wav", "30.wav", "31.wav", "32.wav", "33.wav", "34.wav", "35.wav", "36.wav"
      ],
      "../assets/sounds/Placement/WaitingAfter": [
        "1.wav", "2.wav", "3.wav", "4.wav", "5.wav", "6.wav", "7.wav", "8.wav", "9.wav", "10.wav",
        "11.wav", "12.wav", "13.wav"
      ],
    };
  
    const files = soundFiles[folder as keyof typeof soundFiles];
    if (files) {
      const playNextSound = () => {
        const randomFile = files[Math.floor(Math.random() * files.length)];
        const audio = new Audio(new URL(`${folder}/${randomFile}`, import.meta.url).toString());
        audioRefs.current.push(audio);
        audio.play().catch((error) => {
          if (error.name !== "AbortError") {
            console.error("Audio playback failed:", error);
          }
        });
        audio.addEventListener("ended", playNextSound);
      };
  
      playNextSound();
    }
  };

  const stopAllSounds = () => {
    audioRefs.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    audioRefs.current = [];
  };

  useEffect(() => {
    if (waitingForOpponentEnterRoom && !waitingForOpponentStartGame) {
      playRandomSoundLoop("../assets/sounds/Placement/WaitingBefore");
    } else if (waitingForOpponentStartGame && !waitingForOpponentEnterRoom) {
      playRandomSoundLoop("../assets/sounds/Placement/WaitingAfter");
    }
  }, [waitingForOpponentEnterRoom, waitingForOpponentStartGame]);

  const getRandomSentence = (sentencesArray: any) => {
    const randomIndex = Math.floor(Math.random() * sentencesArray.length);
    return sentencesArray[randomIndex];
  };  

  const toggleOrientation = () => {
    if (selectedPlacement) {
      const newOrientation = selectedPlacement.orientation === "Horizontal" ? "Vertical" : "Horizontal";
      const length = shipLengths[selectedPlacement.shipType];
      const { row, column } = selectedPlacement.startCoordinate;

      // Validate if the new orientation would go out of bounds
      if (
        (newOrientation === "Vertical" && row - (length - 1) < 0) || // Vertical out of bounds (upwards)
        (newOrientation === "Horizontal" && column + (length - 1) >= 10) // Horizontal out of bounds (rightwards)
      ) {
        setError("Cannot rotate ship, it would go out of bounds!");
        return;
      }

      // Update the placement with the new orientation
      const updatedPlacement: Placement = {
        ...selectedPlacement,
        orientation: newOrientation,
      };

      setPlacements((prev) =>
        prev.map((p) => (p.shipType === selectedPlacement.shipType ? updatedPlacement : p))
      );
      setSelectedPlacement(updatedPlacement);
      setError(null);

      const placeShipsSounds = [
        "../assets/sounds/Placement/Placement/11.wav",
        "../assets/sounds/Placement/Placement/12.wav",
        "../assets/sounds/Placement/Placement/13.wav",
        "../assets/sounds/Placement/Placement/14.wav",
      ];
      const randomPlaceShipSound = new URL(
        placeShipsSounds[Math.floor(Math.random() * placeShipsSounds.length)],
        import.meta.url
      ).toString();
      const placeShipsSound = new Audio(randomPlaceShipSound);
      placeShipsSound.play();
    }
  };

  const handleShipClick = (placement: Placement) => {
    setSelectedPlacement(placement);
    setSelectedShip(placement.shipType);
  };

  const handleDragStart = (placement: Placement) => {
    setSelectedPlacement(placement);
    setSelectedShip(placement.shipType);
    setPlacements((prev) => prev.filter((p) => p.shipType !== placement.shipType));
  };

  const handleDragOver = (row: number, column: number, orientation: "Horizontal" | "Vertical") => {
    if (selectedShip) {
      const length = shipLengths[selectedShip];
      const newPreview: { row: number; column: number }[] = [];

      // Validate if the preview is out of bounds
      if (
        (orientation === "Vertical" && row - (length - 1) < 0) || // Vertical out of bounds
        (orientation === "Horizontal" && column + (length - 1) >= 10) // Horizontal out of bounds
      ) {
        setPreviewCoordinates([]); // Clear preview if out of bounds
        return;
      }

      for (let i = 0; i < length; i++) {
        const newRow = orientation === "Horizontal" ? row : row - i; // Reverse vertical placement
        const newColumn = orientation === "Horizontal" ? column + i : column;
        newPreview.push({ row: newRow, column: newColumn });
      }
      setPreviewCoordinates(newPreview);
    }
  };

  const handleDrop = (row: number, column: number, orientation: "Horizontal" | "Vertical") => {
    setPreviewCoordinates([]);
    if (selectedShip) {
      const length = shipLengths[selectedShip];

      // Validate if the placement is out of bounds
      if (
        (orientation === "Vertical" && row - (length - 1) < 0) || // Vertical out of bounds
        (orientation === "Horizontal" && column + (length - 1) >= 10) // Horizontal out of bounds
      ) {
        setError("Ship placement is out of bounds!");
        return;
      }

      const newPlacement: Placement = {
        orientation,
        startCoordinate: { row, column },
        shipType: selectedShip,
      };
      const newCoordinates = getOccupiedCoordinates(newPlacement);

      const isOverlapping = placements.some((p) => {
        const occupiedCoordinates = getOccupiedCoordinates(p);
        return newCoordinates.some((coord) =>
          occupiedCoordinates.some(
            (occupied) => occupied.row === coord.row && occupied.column === coord.column
          )
        );
      });
      if (isOverlapping) {
        setError("Ship placement overlaps with another ship!");
        return;
      }

      const placeShipsSounds = [
        "../assets/sounds/Placement/Placement/11.wav",
        "../assets/sounds/Placement/Placement/12.wav",
        "../assets/sounds/Placement/Placement/13.wav",
        "../assets/sounds/Placement/Placement/14.wav",
      ];
      const randomPlaceShipSound = new URL(
        placeShipsSounds[Math.floor(Math.random() * placeShipsSounds.length)],
        import.meta.url
      ).toString();
      const placeShipsSound = new Audio(randomPlaceShipSound);
      placeShipsSound.play();

      setPlacements((prev) => prev.concat(newPlacement));
      setSelectedShip(null);
      setSelectedPlacement(null);
      setError(null);

      setAnimatedCells(newCoordinates);

      setTimeout(() => setAnimatedCells([]), 1000);
    }
  };

  const handleBackToLobby = () => {
    stopAllSounds();
    playBackButtonSound();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    localStorage.removeItem("lastJoinedRoom");
    navigate("/lobby", { state: { playerName, fromRoom: true } });
  };

  const getOccupiedCoordinates = (placement: Placement): { row: number; column: number }[] => {
    const { startCoordinate, orientation, shipType } = placement;
    const length = shipLengths[shipType];
    const coordinates: { row: number; column: number }[] = [];
    for (let i = 0; i < length; i++) {
      const row = orientation === "Horizontal" ? startCoordinate.row : startCoordinate.row - i; // Reverse vertical placement
      const column = orientation === "Horizontal" ? startCoordinate.column + i : startCoordinate.column;
      coordinates.push({ row, column });
    }
    return coordinates;
  };

  const handleRandomPlacement = () => {
    const randomSounds = [RandomButton1, RandomButton2];
    const randomSound = randomSounds[Math.floor(Math.random() * randomSounds.length)];
    const audio = new Audio(randomSound);
    audio.play();

    const generateRandomPlacement = (shipType: ShipType): Placement | null => {
      const length = shipLengths[shipType];
      const maxAttempts = 100; // Limit the number of attempts to avoid infinite loops
  
      for (let attempts = 0; attempts < maxAttempts; attempts++) {
        const orientation = Math.random() > 0.5 ? "Horizontal" : "Vertical";
        const maxRow = orientation === "Horizontal" ? 10 : length - 1; // Ensure vertical ships start within
        const maxColumn = orientation === "Horizontal" ? 10 - length : 10;
  
        const row = orientation === "Horizontal"
          ? Math.floor(Math.random() * maxRow)
          : Math.floor(Math.random() * (10 - maxRow)) + maxRow; // Adjust for vertical placement
        const column = Math.floor(Math.random() * maxColumn);
  
        const newPlacement: Placement = {
          orientation,
          startCoordinate: { row, column },
          shipType,
        };
  
        const newCoordinates = getOccupiedCoordinates(newPlacement);
  
        // Check if the placement is valid (no intersections and within bounds)
        const isOverlapping = placements.some((p) => {
          const occupiedCoordinates = getOccupiedCoordinates(p);
          return newCoordinates.some((coord) =>
            occupiedCoordinates.some(
              (occupied) => occupied.row === coord.row && occupied.column === coord.column
            )
          );
        });
  
        if (!isOverlapping) {
          return newPlacement;
        }
      }
  
      return null;
    };
  
    const newPlacements: Placement[] = [];
    const allAnimatedCells: { row: number; column: number }[] = [];
  
    for (const ship of Object.keys(shipLengths) as ShipType[]) {
      const placement = generateRandomPlacement(ship);
      if (placement) {
        newPlacements.push(placement);
        allAnimatedCells.push(...getOccupiedCoordinates(placement));
      } else {
        setError("Failed to place all ships randomly. Please try again.");
        return;
      }
    }
  
    setPlacements(newPlacements);
    setAnimatedCells(allAnimatedCells); // Trigger animation for all placed cells
    setError(null);
  
    setTimeout(() => setAnimatedCells([]), 1000);
  };

  const transformPlacementsForBackend = (placements: Placement[]) => {
    return placements.map(({ startCoordinate, orientation, shipType }) => ({
      startCoordinate,
      orientation,
      shipType,
    }));
  };

  useEffect(() => {
    if (!playerName) {
      navigate("/");
    }
  }, [playerName, navigate]);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/join/${roomId}/${playerName}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connection established");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "PlaceShips") {
          if (message.players < 2) {
            setWaitingForOpponentEnterRoom(true);
          } else {
            setWaitingForOpponentEnterRoom(false);
            if (message.board != null) {
              setWaitingForOpponentStartGame(true);
            } else {
              setWaitingForOpponentStartGame(false);
            }
          }
        } else if (message.type === "AttackShips") {
          setWaitingForOpponentEnterRoom(false);
          setWaitingForOpponentStartGame(false);
          stopAllSounds();
          navigate(`/game/${roomId}`);
        } else if (message.type === "Error") {
          setError(message.error);
        }
      } catch (e) {
        console.warn("Message received:", event.data);
        if (event.data === "ShipOutOfBounds") {
          setError("Ship placement is out of bounds!");
        } else if (event.data === "ShipsAreIntersecting") {
          setError("Placed ships are intersecting!");
        } else if (event.data === "WrongAmountOfShips") {
          setError("Wrong amount of placed ships!");
        } else {
          setError(`Unexpected message from server: ${event.data}`);
        }
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
  }, [roomId, playerName, navigate]);

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const rooms = await getRoomList(); // Fetch all rooms
        const room = rooms.find((r: { id: string }) => r.id === roomId); // Find the room by roomId
        if (room) {
          setRoomName(room.roomName.toString()); // Set the room name
        } else {
          console.error("Room not found");
        }
      } catch (error) {
        console.error("Error fetching room details:", error);
      }
    };

    fetchRoomDetails();
  }, [roomId]);

  return (
    <>
      <PlacementWaitingBefore triggerAnimation={waitingForOpponentEnterRoom} />
      <PlacementWaitingAfter triggerAnimation={waitingForOpponentStartGame} />
      <PlacementBoard triggerAnimation={waitingForOpponentEnterRoom || waitingForOpponentStartGame} />
      <div className="full-background">
        <div className="placement-phase-container">
          {waitingForOpponentEnterRoom ? (
            <div className="waiting-container">
              <h1 className="waiting-title">
                {getRandomSentence(waitingBeforeSentences)}
                <span className="room-name">{roomName || "unknown"}</span>!
              </h1>
              <p className="waiting-phrase">Captain {playerName}, the other captain delays their arrival and the battle awaits...</p>

              <button className="back-to-lobby-button-placement" onClick={handleBackToLobby}>
              <img
                src={EvolutionLogo}
                alt="Evolution Logo"
                className="evolution-logo"
              />
                Lobby
              </button>
            </div>
          ) : waitingForOpponentStartGame ? (
            <div className="waiting-container">
              <h1 className="waiting-title">
                {getRandomSentence(waitingAfterSentences)}
                <span className="room-name">{roomName || "unknown"}</span>!
              </h1>
              <p className="waiting-phrase">Captain {playerName}, brace yourself because the battle is about to begin...</p>

              <button className="back-to-lobby-button-placement" onClick={handleBackToLobby}>
              <img
                src={EvolutionLogo}
                alt="Evolution Logo"
                className="evolution-logo"
              />
                Lobby
              </button>
            </div>
          ) : (
            <div style={{ textAlign: "center", marginTop: "-75px"}}>
              <p className="placement-instructions">Captain {playerName}, position your ships wisely to outsmart your opponent and secure victory in the <span className="room-name">{roomName}</span>!</p>
              {error && <p style={{ color: "red" }}>{error}</p>}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop:"50px" }}>
                {/* Ship buttons on the left */}
                <div style={{ flex: "0 0 auto" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "10px" }}>
                    {Object.keys(shipLengths)
                      .sort((a, b) => shipLengths[b as ShipType] - shipLengths[a as ShipType]) // Sort ships by size
                      .map((ship) => (
                        <div
                          key={ship}
                          draggable={!placements.some((p) => p.shipType === ship)}
                          onDragStart={() => setSelectedShip(ship as ShipType)}
                          style={{
                            display: "flex",
                            flexDirection: "row", // Horizontal layout
                            alignItems: "center",
                            justifyContent: "center",
                            width: `${shipLengths[ship as ShipType] * 40}px`, // Width based on ship size
                            height: "40px", // Fixed height
                            backgroundColor: placements.some((p) => p.shipType === ship) ? "#004680" : "#6297AC",
                            color: "white",
                            cursor: placements.some((p) => p.shipType === ship) ? "not-allowed" : "grab",
                            position: "relative",
                            border: "1px solid white", // White outline
                          }}
                        >
                          {/* Horizontal bars representing ship size */}
                          {Array.from({ length: shipLengths[ship as ShipType] }).map((_, i) => (
                            <div
                              key={i}
                              style={{
                                width: "40px",
                                height: "100%",
                                borderRight: i < shipLengths[ship as ShipType] - 1 ? "1px solid white" : "none",
                              }}
                            />
                          ))}
                          {/* Tooltip for ship name */}
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
                </div>

                {/* Grid in the center */}
                <div style={{ display: "flex", justifyContent: "center", flexDirection: "column" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(10, 40px)",
                      gridTemplateRows: "repeat(10, 40px)",
                      gap: "1px",
                      justifyContent: "center",
                    }}
                  >
                    {Array.from({ length: 10 }).map((_, row) =>
                      Array.from({ length: 10 }).map((_, column) => {
                        const placement = placements.find((p) =>
                          Array.from({ length: shipLengths[p.shipType] }).some((_, i) => {
                            const shipRow = p.orientation === "Horizontal" ? p.startCoordinate.row : p.startCoordinate.row - i; // Reverse vertical placement
                            const shipColumn = p.orientation === "Horizontal" ? p.startCoordinate.column + i : p.startCoordinate.column;
                            return shipRow === row && shipColumn === column;
                          })
                        );

                        const isAnimated = animatedCells.some((cell) => cell.row === row && cell.column === column);

                        return (
                          <div
                            key={`${row}-${column}`}
                            style={{
                              width: "40px",
                              height: "40px",
                              border: "2px solid white",
                              backgroundColor: placement
                                ? placement === selectedPlacement
                                  ? "#5BC2E7"
                                  : "#6297AC"
                                : previewCoordinates.some((coord) => coord.row === row && coord.column === column)
                                ? "#6297AC"
                                : "#004680",
                            }}
                            className={isAnimated ? "cell-animate" : ""}
                            onClick={() => placement && handleShipClick(placement)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              handleDragOver(row, column, orientation);
                            }}
                            onDrop={() => handleDrop(row, column, orientation)}
                            onDragStart={() => placement && handleDragStart(placement)}
                            draggable={!!placement && placement === selectedPlacement}
                          />
                        );
                      })
                    )}
                  </div>
                  <div className="bottom-buttons">
                    <button
                      className="back-to-lobby-button-placement"
                      onClick={handleBackToLobby}
                    >
                    <img
                      src={EvolutionLogo}
                      alt="Evolution Logo"
                      className="evolution-logo"
                    />
                      Lobby
                    </button>

                    {Object.keys(shipLengths).every((ship) =>
                      placements.some((p) => p.shipType === ship)
                    ) && (
                      <button
                      className="place-ships-button"
                        onClick={() => {
                          const audio = new Audio(PlaceShips);
                          audio.play();

                          if (wsRef.current?.readyState === WebSocket.OPEN) {
                            const transformedPlacements = transformPlacementsForBackend(placements);
                            wsRef.current.send(
                              JSON.stringify({
                                type: "PlaceShips",
                                placements: transformedPlacements,
                              })
                            );
                          } else {
                            setError("WebSocket is not connected.");
                          }
                        }}
                      >
                        Battle!
                      </button>
                    )}
                  </div>
                </div>

                {/* Buttons on the right */}
                <div style={{ flex: "0 0 auto", position: "relative", height: "150px", width: "50px" }}>
                  <div className="button-container">
                    <button className="icon-button random-button" onClick={handleRandomPlacement} />
                    {selectedPlacement && (
                      <button className="icon-button rotate-button" onClick={toggleOrientation} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PlacementPhase;

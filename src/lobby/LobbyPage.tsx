import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RoomState } from "../types/types";
import { usePlayer } from "./PlayerContext";
import EvolutionLogo from "../assets/images/EVOLUTION_Logo.svg";
import IntroLobbyAudio from "../assets/sounds/Lobby/Intro_Lobby.wav";
import IntroLobbyBackground from "../assets/sounds/Lobby/Lobby_Background_1.wav";
import ButtonForwardAudio from "../assets/sounds/UI/Button_Forward.wav";
import ButtonProfileAudio from "../assets/sounds/UI/Button_Profile.wav";
import { getRoomList } from "../utils/utils";
import "./LobbyPage.css";
import config from "../config";

const LobbyPage: React.FC = () => {
  const [rooms, setRooms] = useState<RoomState[]>([]);  
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const { playerName, setPlayerName } = usePlayer();
  const forwardButtonSound = new Audio(ButtonForwardAudio);
  const profileButtonSound = new Audio(ButtonProfileAudio);

  const playButtonSound = () => {
    forwardButtonSound.currentTime = 0;
    forwardButtonSound.play().catch((err) => console.error("Error playing button sound:", err));
  };

  const playProfileButtonSound = () => {
    profileButtonSound.currentTime = 0;
    profileButtonSound.play().catch((err) => console.error("Error playing profile button sound:", err));
  };

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const roomList = await getRoomList();
        setRooms(roomList);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        setError("Failed to load rooms. Please try again later.");
      }
    };

    fetchRooms();

    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!playerName) {
      const savedName = localStorage.getItem("playerName");
      if (savedName) {
        setPlayerName(savedName);
      } else {
        navigate("/");
      }
    }
  }, [playerName, navigate, setPlayerName]);

  useEffect(() => {
    const audioStart = new Audio(IntroLobbyAudio);
    const audioBackground = new Audio(IntroLobbyBackground);
    audioBackground.loop = true; // Enable looping

    const timerStart = setTimeout(() => {
      audioStart.play().catch((err) => console.error("Error playing audio:", err));
    }, 2000);
    const timerBackground = setTimeout(() => {
      audioBackground.play().catch((err) => console.error("Error playing audio:", err));
    });

    return () => {
      clearTimeout(timerStart);
      audioStart.pause();
      audioStart.currentTime = 0;
      clearTimeout(timerBackground);
      audioBackground.pause();
      audioBackground.currentTime = 0;
    };
  }, []);

  const joinRoom = async (room: RoomState) => {
    playButtonSound();
    try {
      const ws = new WebSocket(`${config.protocol === "http" ? "ws" : "wss"}://${config.baseUrl}/join/${room.id}/${playerName}`);

      ws.onopen = () => {
        console.log("WebSocket connection established");
        localStorage.setItem("lastJoinedRoom", room.id);
        navigate(`/rooms/${room.id}`);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Failed to join room.");
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
      };
    } catch (err) {
      console.error("Error joining room:", err);
      setError("Error joining room.");
    }
  };

  const createRoom = async () => {
    playButtonSound();
    try {
      const response = await fetch(`${config.protocol}://${config.baseUrl}/createGame`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const roomId = await response.text();
        navigate(`/rooms/${roomId}`);
      } else {
        const errorMessage = await response.text();
        console.error("Error creating room:", errorMessage);
      }
    } catch (err) {
      console.error("Error creating room:", err);
    }
  }

  return (
      <div className="lobby-container">

        <div className="logo">
          <img src={EvolutionLogo} alt="Evolution Logo" />
        </div>

        <h1 className="welcome">Welcome, captain {playerName}!</h1>

        {error && <p className="error-message">{error}</p>}

        {rooms.length > 0 ? (
          <div className="rooms-table-container">
            <table className="rooms-table">
              <thead>
                <tr>
                  <th>Battle Localization</th>
                  <th>Captains</th>
                  <th>⚔️</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id}>
                    <td>{room.roomName}</td>
                    <td>
                      {room.players}/2
                    </td>
                    <td>
                      {room.hasEnded ? (
                        <button className="disabled-button" disabled>
                          Battle Ended
                        </button>
                      ) : (
                        <button
                          className="join-room-button"
                          onClick={() => joinRoom(room)}
                          disabled={room.players >= 2 && !room.playersNames.includes(playerName)}
                        >
                          {room.playersNames.includes(playerName) ? "Rejoin Battle" : "Join Battle"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No rooms available</p>
        )}

        <div className="button-container-lobby">
          <button
            className="change-profile-button"
            onClick={() => {
              playProfileButtonSound();
              navigate("/");
            }}
          >
            Change Profile
          </button>

          <button className="create-room-button" onClick={() => createRoom()}>
            + Create Battle
          </button>
        </div>
      </div>
  );
};

export default LobbyPage;

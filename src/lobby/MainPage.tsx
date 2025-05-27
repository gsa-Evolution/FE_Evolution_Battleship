import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayer } from "./PlayerContext";
import "./MainPage.css";
import EvolutionLogo from "../assets/images/EVOLUTION_Logo.svg";
import { handlePlaySound } from "../utils/utils";

// Main component for the main page.
const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const { setPlayerName } = usePlayer();

  const [localPlayerName, setLocalPlayerName] = useState("");
  const [error, setError] = useState("");

  // Validates name and enters the lobby.
  const handleEnterLobby = () => {
    if (localPlayerName.trim() === "") {
      setError("Please enter your name before proceeding.");
      return;
    }
    setError("");
    setPlayerName(localPlayerName);
    navigate("/lobby");
  };

  return (
    <div className="transparent-box" >
      <div className="main-container">
        <h1>Welcome to the</h1>

        <div>
          <img src={EvolutionLogo} alt="Evolution Logo" />
        </div>

        <h1>
          <span style={{ fontWeight: "bold" }}>Battleship</span> game!
        </h1>
        <div style={{ margin: "40px 0" }}>
          <input
            type="text"
            placeholder="Enter your name..."
            value={localPlayerName}
            onChange={(e) => setLocalPlayerName(e.target.value)}
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: "bold",
              padding: "10px",
              fontSize: "16px",
              borderRadius: "5px",
              border: "1px solid #ccc",
              width: "200px",
              color: "#004680",
              backgroundColor: "var(--white)",
            }}
          />
        </div>
        {error && <p style={{ color: "red", marginBottom: "20px" }}>{error}</p>}
        <button
          className="enter-button"
          onClick={() => {
            handlePlaySound();
            handleEnterLobby();
          }}
        >
          START
        </button>
      </div>
    </div>
  );
};

export default MainPage;

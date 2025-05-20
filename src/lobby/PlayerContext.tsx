import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface PlayerContextType {
  playerName: string;
  setPlayerName: (name: string) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playerName, setPlayerName] = useState(localStorage.getItem("playerName") || "");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to MainPage if playerName is empty and not on MainPage
    if (!playerName.trim() && location.pathname !== "/") {
      navigate("/");
    }
  }, [playerName, location, navigate]);

  useEffect(() => {
    // Update localStorage whenever playerName changes
    localStorage.setItem("playerName", playerName);
  }, [playerName]);

  return (
    <PlayerContext.Provider value={{ playerName, setPlayerName }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PlayerContextType } from "../types/types";

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// Provider component to wrap the app and manage player state.
export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playerName, setPlayerName] = useState(localStorage.getItem("playerName") || "");
  const location = useLocation();
  const navigate = useNavigate();

  // Redirects to MainPage if playerName is empty and not on MainPage.
  useEffect(() => {
    if (!playerName.trim() && location.pathname !== "/") {
      navigate("/");
    }
  }, [playerName, location, navigate]);

  // Updates localStorage whenever playerName changes.
  useEffect(() => {
    localStorage.setItem("playerName", playerName);
  }, [playerName]);

  // Provides playerName and setter to children components.
  return (
    <PlayerContext.Provider value={{ playerName, setPlayerName }}>
      {children}
    </PlayerContext.Provider>
  );
};

// Custom hook to access player context.
export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
};

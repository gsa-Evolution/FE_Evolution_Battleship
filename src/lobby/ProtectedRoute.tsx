import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePlayer } from "./PlayerContext";

// Component to protect routes that require a player's name.
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { playerName } = usePlayer();
  const location = useLocation();

  // Redirects to MainPage if playerName is missing and not already on MainPage.
  if (!playerName.trim() && location.pathname !== "/") {
    return <Navigate to="/" replace />;
  }

  // Renders children if access is allowed.
  return <>{children}</>;
};

export default ProtectedRoute;

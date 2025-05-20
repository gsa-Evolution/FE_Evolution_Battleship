import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePlayer } from "./PlayerContext";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { playerName } = usePlayer();
  const location = useLocation();

  // Allow access to MainPage ("/") even if playerName is empty
  if (!playerName.trim() && location.pathname !== "/") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

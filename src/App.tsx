import { BrowserRouter, Route, Routes } from "react-router";
import './App.css'
import MainPage from "./lobby/MainPage";
import LobbyPage from "./lobby/LobbyPage";
import PlacementPage from "./game/PlacementPhase";
import GamePage from "./game/GamePhase";
import ProtectedRoute from "./lobby/ProtectedRoute";
import { PlayerProvider } from "./lobby/PlayerContext";

function App() {
  return (
    <BrowserRouter>
      <PlayerProvider>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/lobby" element={
            <ProtectedRoute>
              <LobbyPage />
            </ProtectedRoute>} />
          <Route path="/rooms/:roomId" element={
            <ProtectedRoute>
              <PlacementPage />
            </ProtectedRoute>} />
          <Route path="/game/:roomId" element={
            <ProtectedRoute>
              <GamePage />
            </ProtectedRoute>} />
        </Routes>
      </PlayerProvider>
    </BrowserRouter>
  );
}

export default App;

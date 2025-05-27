import React from "react";
import "./Overlay.css";

// Props interface to control animation triggering.
interface OverlayProps {
  triggerAnimation: boolean;
}

// Overlay shown before ship placement phase, with animation if triggerAnimation is true.
export const PlacementWaitingBefore: React.FC<OverlayProps> = ({ triggerAnimation }) => {
    return (
        <div className={`placement-overlay-before ${!triggerAnimation ? "hidden" : ""}`} />
    );
};

// Overlay shown after ship placement phase, with animation if triggerAnimation is true.
export const PlacementWaitingAfter: React.FC<OverlayProps> = ({ triggerAnimation }) => {
    return (
        <div className={`placement-overlay-after ${!triggerAnimation ? "hidden" : ""}`} />
    );
};

// Overlay for the board during placement, hidden if triggerAnimation is true.
export const PlacementBoard: React.FC<OverlayProps> = ( { triggerAnimation }) => {
    return (
        <div className={`board ${triggerAnimation ? "hidden" : ""}`} />
    );
};

// Overlay for the game board, always visible to create the blue background.
export const GameBoard: React.FC<{}> = () => {
    return (
        <div className={`board`} />
    );
};

// Overlay shown when the player wins, with animation if triggerAnimation is true.
export const ResultGameWinner: React.FC<OverlayProps> = ({ triggerAnimation }) => {
    return (
        <div className={`result-game-winner ${!triggerAnimation ? "hidden" : ""}`} />
    );
};

// Overlay shown when the player loses, with animation if triggerAnimation is true.
export const ResultGameLoser: React.FC<OverlayProps> = ({ triggerAnimation }) => {
    return (
        <div className={`result-game-loser ${!triggerAnimation ? "hidden" : ""}`} />
    );
};

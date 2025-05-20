import React from "react";
import "./Overlay.css";

interface OverlayProps {
  triggerAnimation: boolean;
}

export const PlacementWaitingBefore: React.FC<OverlayProps> = ({ triggerAnimation }) => {
    return (
        <div className={`placement-overlay-before ${!triggerAnimation ? "hidden" : ""}`} />
    );
};

export const PlacementWaitingAfter: React.FC<OverlayProps> = ({ triggerAnimation }) => {
    return (
        <div className={`placement-overlay-after ${!triggerAnimation ? "hidden" : ""}`} />
    );
};

export const PlacementBoard: React.FC<OverlayProps> = ( { triggerAnimation }) => {
    return (
        <div className={`board ${triggerAnimation ? "hidden" : ""}`} />
    );
};

export const GameBoard: React.FC<{}> = () => {
    return (
        <div className={`board`} />
    );
};

export const ResultGameWinner: React.FC<OverlayProps> = ({ triggerAnimation }) => {
    return (
        <div className={`result-game-winner ${!triggerAnimation ? "hidden" : ""}`} />
    );
};

export const ResultGameLoser: React.FC<OverlayProps> = ({ triggerAnimation }) => {
    return (
        <div className={`result-game-loser ${!triggerAnimation ? "hidden" : ""}`} />
    );
};
import { RoomState } from "../types/types";
import IntroSound from "../assets/sounds/Main/Intro.wav";
import ButtonBackAudio from "../assets/sounds/UI/Button_Back.wav";
import config from "../config";

// Fetches the list of rooms from the backend API.
export const getRoomList = async (): Promise<RoomState[]> => {
  try {
    const response = await fetch(`${config.protocol}://${config.baseUrl}/rooms`);
    if (!response.ok) {
      throw new Error("Failed to fetch room list");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching room list:", error);
    throw error;
  }
};

// Plays the back button sound effect.
export const playBackButtonSound = () => {
  const audio = new Audio(ButtonBackAudio);
  audio.play();
};

// Plays intro sound when starting.
export const handlePlaySound = () => {
  const audio = new Audio(IntroSound);
  audio.play().catch((err) => console.error("Audio playback failed:", err));
};

// Sentences for the waiting screen before ship placement.
export const waitingBeforeSentences = [
    "The stillness is overwhelming, as peaceful as the waters of the ",
    "Time seems to slow, as quiet as the waters of the ",
    "The atmosphere is heavy, as serene as the waters of the ",
    "It feels like an endless wait, as calm as the waters of the ",
    "The air is thick with silence, as undisturbed as the waters of the ",
    "Everything is frozen in place, as tranquil as the waters of the ",
    "The moment hangs in the balance, as still as the waters of the ",
    "The tension is palpable, as quiet as the waters of the ",
    "The world outside seems distant, as motionless as the waters of the ",
    "Every sound feels muted, as peaceful as the waters of the ",
    "The silence is suffocating, as still as the waters of the ",
    "The emptiness surrounds me, as calm as the waters of the ",
    "The world feels distant, as quiet as the waters of the ",
    "Time pauses, as tranquil as the waters of the ",
    "The quietness presses in, as serene as the waters of the ",
    "A gentle calm fills the air, as peaceful as the waters of the ",
    "The weight of stillness hangs, as undisturbed as the waters of the ",
    "There is nothing but silence, as motionless as the waters of the ",
    "The room feels frozen, as still as the waters of the "
];

// Sentences for the waiting screen after ship placement.
export const waitingAfterSentences = [
    "The board twitches with tension, as if unsure what's coming in the chaos of the ",
    "A strange energy buzzes through the air, building in the uncertainty of the ",
    "The calm is gone, replaced by a restless stirring in the depths of the ",
    "Something shifts, like the waters are confused in the turmoil of the ",
    "The board flickers with indecision, waiting for a move that never comes in the fog of the ",
    "Voices echo without source, building a storm of confusion in the heart of the ",
    "The battlefield feels off-balance, tilting toward something unknown in the pull of the ",
    "A storm brews not in the sky, but in the choices yet unmade in the chaos of the ",
    "The air snaps with tension, like static before a lightning strike in the middle of the ",
    "The ships hesitate on the edge of existence, half-formed in the confusion of the ",
    "The board warps with uncertainty, unsure of who will strike first in the noise of the ",
    "The moment stumbles, tripping over unseen decisions in the churn of the ",
    "The sea grumbles like it's waiting for orders that never come in the confusion of the ",
    "Nothing makes sense yet, just tension waiting to break loose in the wild unknown of the ",
    "The pieces hover, aimless and twitching in the disturbed waters of the ",
    "Everything feels slightly wrong, like a plan gone sideways in the storm of the ",
    "The energy is chaotic, each second louder than the last in the madness of the ",
    "No one's quite ready, but something is already starting in the strange hum of the ",
    "The game forgets its rules for a moment, lost in the spinning mind of the "
];

// Returns the correct turn label for a given player name.
export const getTurnLabel = (name: string) => {
  if (!name) return "";
  const lastChar = name.trim().slice(-1).toLowerCase();
  return lastChar === "s" ? `${name}' Turn` : `${name}'s Turn`;
};

// Utility to get a random sentence from an array.
export const getRandomSentence = (sentencesArray: any) => {
  const randomIndex = Math.floor(Math.random() * sentencesArray.length);
  return sentencesArray[randomIndex];
};

// Plays a random sunk ship sound effect.
export const playRandomSunkShipSound = () => {
  const files = ["1.wav", "2.wav", "3.wav", "4.wav"];
  const randomFile = files[Math.floor(Math.random() * files.length)];
  const audio = new Audio(new URL(`../assets/sounds/Game/SunkShip/${randomFile}`, import.meta.url).toString());
  audio.play().catch((error) => console.error("SunkShip sound playback failed:", error));
};

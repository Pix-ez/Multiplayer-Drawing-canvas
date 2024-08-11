import React, { createContext, useState, useContext } from "react";

interface GameState {
  roomId: string;
  userName: string;
  users: string[];
  ready: boolean;
  gameStarted: boolean;
  currentDrawer: string;
  currentWord: string;
  scores: Record<string, number>;
  roundTimeRemaining: number;
  gameTimeRemaining: number;
}

interface GameContextType extends GameState {
  setRoomId: (id: string) => void;
  setUserName: (name: string) => void;
  setUsers: (users: string[]) => void;
  setReady: (ready: boolean) => void;
  setGameStarted: (started: boolean) => void;
  setCurrentDrawer: (drawer: string) => void;
  setCurrentWord: (word: string) => void;
  setScores: (scores: Record<string, number>) => void;
  setRoundTimeRemaining: (time: number) => void;
  setGameTimeRemaining: (time: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [users, setUsers] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentDrawer, setCurrentDrawer] = useState("");
  const [currentWord, setCurrentWord] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [roundTimeRemaining, setRoundTimeRemaining] = useState(0);
  const [gameTimeRemaining, setGameTimeRemaining] = useState(0);

  const value: GameContextType = {
    roomId,
    setRoomId,
    userName,
    setUserName,
    users,
    setUsers,
    ready,
    setReady,
    gameStarted,
    setGameStarted,
    currentDrawer,
    setCurrentDrawer,
    currentWord,
    setCurrentWord,
    scores,
    setScores,
    roundTimeRemaining,
    setRoundTimeRemaining,
    gameTimeRemaining,
    setGameTimeRemaining,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};
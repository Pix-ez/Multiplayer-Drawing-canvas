//@ts-nocheck

import { v4 as uuidv4 } from 'uuid';
import { words } from './words.json';
import { Server as SocketIOServer } from 'socket.io';
class Room {
  id: string;
  users: string[];
  ready: Record<string, boolean>;
  scores: Record<string, number>;
  currentPlayerIndex: number;
  currentWord: string | null;
  gameInProgress: boolean;
  roundTimeRemaining: number;
  gameTimeRemaining: number;
  roundTimer: NodeJS.Timeout | null;
  gameTimer: NodeJS.Timeout | null;
  status: string; // New property
  
   

  constructor(id: string) {
    this.id = id;
    this.users = [];
    this.ready = {};
    this.scores = {};
    this.currentPlayerIndex = -1;
    this.currentWord = null;
    this.gameInProgress = false;
    this.roundTimeRemaining = 30;
    this.gameTimeRemaining = 60;
    this.roundTimer = null;
    this.gameTimer = null;
    this.status = 'waiting';
   
  }
  
  addUser(userName: string) {
    this.users.push(userName);
    this.ready[userName] = false;
    this.scores[userName] = 0;
  }
  setUserReady(userName: string) {
    this.ready[userName] = true;
  }


  
  allUsersReady(): boolean {
    return this.users.every(user => this.ready[user]);
  }

  selectNextPlayer(): string {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.users.length;
    return this.users[this.currentPlayerIndex];
  }

  setCurrentWord(word: string) {
    this.currentWord = word;
  }

  updateScore(userName: string, points: number) {
    this.scores[userName] += points;
  }

  setStatus(status) {
    this.status = status;
  }
  
    startGame(io: SocketIOServer) {
    
      this.gameInProgress = true;
      this.status = 'in-game';
      this.gameTimeRemaining = 60;
      this.startRound(io);
  
      this.gameTimer = setInterval(() => {
        this.gameTimeRemaining--;
        io.to(this.id).emit('game-time', this.gameTimeRemaining);
  
        if (this.gameTimeRemaining <= 0) {
          this.endGame(io);
        }
      }, 1000);
    }
  
    startRound(io: SocketIOServer) {
      this.roundTimeRemaining = 30;
      const currentPlayer = this.selectNextPlayer();
      const word = getRandomWord();
      this.setCurrentWord(word);
  
      io.to(this.id).emit('round-start', {
        drawer: currentPlayer,
        word: this.currentWord,
        roundTime: this.roundTimeRemaining
      });
  
      this.roundTimer = setInterval(() => {
        this.roundTimeRemaining--;
        // console.log(this.roundTimeRemaining);
        io.to(this.id).emit('round-time', this.roundTimeRemaining);
  
        if (this.roundTimeRemaining <= 0) {
          this.endRound(io);
        }
      }, 1000);
    }
  
    endRound(io: SocketIOServer) {
      if (this.roundTimer) {
        clearInterval(this.roundTimer);
      }
      io.to(this.id).emit('round-end', { word: this.currentWord });
      
      if (this.gameInProgress) {
        this.startRound(io);
      }
    }

    endGame(io: SocketIOServer) {
      this.gameInProgress = false;
      if (this.gameTimer) {
        clearInterval(this.gameTimer);
      }
      if (this.roundTimer) {
        clearInterval(this.roundTimer);
      }
      io.to(this.id).emit('game-end', { finalScores: this.scores });
    }
  
  
    toJSON() {
      return {
        id: this.id,
        users: this.users,
        ready: this.ready,
        scores: this.scores,
        currentPlayerIndex: this.currentPlayerIndex,
        gameInProgress: this.gameInProgress,
        roundTimeRemaining: this.roundTimeRemaining,
        gameTimeRemaining: this.gameTimeRemaining,
        currentWord: this.currentWord,
        status: this.status
      };
    }
  }

  
function getRandomWord(): string {
  return words[Math.floor(Math.random() * words.length)];
}

class RoomManager {
private rooms: Map<string, Room>;

constructor() {
  this.rooms = new Map();
}

createRoom(): string {
  const roomId = uuidv4().slice(0, 5);
  const room = new Room(roomId);

  this.rooms.set(roomId, room);
  return roomId;
}

getRoom(roomId: string): Room | undefined {
  return this.rooms.get(roomId);
}

deleteRoom(roomId: string) {
  this.rooms.delete(roomId);
}
}

export default RoomManager;
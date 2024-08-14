
//@ts-nocheck
// import express from 'express';
// import http from 'http';
// import { Server as SocketIOServer } from 'socket.io';
// import bodyParser from 'body-parser';
// import cors from 'cors';
// import { v4 as uuidv4 } from 'uuid';
// import { words } from './words.json';

// class Room {
//   id: string;
//   users: string[];
//   ready: Record<string, boolean>;
//   scores: Record<string, number>;
//   currentPlayerIndex: number;
//   currentWord: string | null;
//   gameInProgress: boolean;
//   roundTimeRemaining: number;
//   gameTimeRemaining: number;
//   roundTimer: NodeJS.Timeout | null;
//   gameTimer: NodeJS.Timeout | null;

//   constructor(id: string) {
//     this.id = id;
//     this.users = [];
//     this.ready = {};
//     this.scores = {};
//     this.currentPlayerIndex = -1;
//     this.currentWord = null;
//     this.gameInProgress = false;
//     this.roundTimeRemaining = 30;
//     this.gameTimeRemaining = 60;
//     this.roundTimer = null;
//     this.gameTimer = null;
//   }

//   addUser(userName: string) {
//     this.users.push(userName);
//     this.ready[userName] = false;
//     this.scores[userName] = 0;
//   }

//   setUserReady(userName: string) {
//     this.ready[userName] = true;
//   }

//   allUsersReady(): boolean {
//     return this.users.every(user => this.ready[user]);
//   }

//   selectNextPlayer(): string {
//     this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.users.length;
//     return this.users[this.currentPlayerIndex];
//   }

//   setCurrentWord(word: string) {
//     this.currentWord = word;
//   }

//   updateScore(userName: string, points: number) {
//     this.scores[userName] += points;
//   }

//   startGame(io: SocketIOServer) {
    
//     this.gameInProgress = true;
//     this.gameTimeRemaining = 60;
//     this.startRound(io);

//     this.gameTimer = setInterval(() => {
//       this.gameTimeRemaining--;
//       io.to(this.id).emit('game-time', this.gameTimeRemaining);

//       if (this.gameTimeRemaining <= 0) {
//         this.endGame(io);
//       }
//     }, 1000);
//   }

//   startRound(io: SocketIOServer) {
//     this.roundTimeRemaining = 30;
//     const currentPlayer = this.selectNextPlayer();
//     const word = getRandomWord();
//     this.setCurrentWord(word);

//     io.to(this.id).emit('round-start', {
//       drawer: currentPlayer,
//       word: this.currentWord,
//       roundTime: this.roundTimeRemaining
//     });

//     this.roundTimer = setInterval(() => {
//       this.roundTimeRemaining--;
//       // console.log(this.roundTimeRemaining);
//       io.to(this.id).emit('round-time', this.roundTimeRemaining);

//       if (this.roundTimeRemaining <= 0) {
//         this.endRound(io);
//       }
//     }, 1000);
//   }

//   endRound(io: SocketIOServer) {
//     if (this.roundTimer) {
//       clearInterval(this.roundTimer);
//     }
//     io.to(this.id).emit('round-end', { word: this.currentWord });
    
//     if (this.gameInProgress) {
//       this.startRound(io);
//     }
//   }

//   endGame(io: SocketIOServer) {
//     this.gameInProgress = false;
//     if (this.gameTimer) {
//       clearInterval(this.gameTimer);
//     }
//     if (this.roundTimer) {
//       clearInterval(this.roundTimer);
//     }
//     io.to(this.id).emit('game-end', { finalScores: this.scores });
//   }

//   toJSON() {
//     return {
//       id: this.id,
//       users: this.users,
//       ready: this.ready,
//       scores: this.scores,
//       currentPlayerIndex: this.currentPlayerIndex,
//       gameInProgress: this.gameInProgress,
//       roundTimeRemaining: this.roundTimeRemaining,
//       gameTimeRemaining: this.gameTimeRemaining,
//     };
//   }
// }


// class RoomManager {
//   private rooms: Map<string, Room>;

//   constructor() {
//     this.rooms = new Map();
//   }

//   createRoom(): string {
//     const roomId = uuidv4().slice(0, 5);
//     const room = new Room(roomId);
//     this.rooms.set(roomId, room);
//     return roomId;
//   }

//   getRoom(roomId: string): Room | undefined {
//     return this.rooms.get(roomId);
//   }

//   deleteRoom(roomId: string) {
//     this.rooms.delete(roomId);
//   }
// }

// // Server setup
// const app = express();
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.json());
// app.use(cors());

// const server = http.createServer(app);
// const io = new SocketIOServer(server, {
//   cors: { origin: '*' },
// });

// const roomManager = new RoomManager();

// function getRandomWord(): string {
//   return words[Math.floor(Math.random() * words.length)];
// }

// io.on('connection', (socket) => {
//   socket.on('join-room', ({ roomId, userName }) => {
//     const room = roomManager.getRoom(roomId);
//     if (!room) {
//       return socket.emit('room-error', 'Room not found');
//     }

//     if (room.users.includes(userName)) {
//       return socket.emit('room-error', 'User already in room');
//     }

//     room.addUser(userName);
//     socket.join(roomId);

//     io.to(roomId).emit('room-joined', { message: `${userName} joined the room ${roomId}` });
//     io.to(roomId).emit('room', room.toJSON());
//   });

//   socket.on('ready', ({ roomId, userName }) => {
//     // console.log("user ready", roomId, userName);
//     const room = roomManager.getRoom(roomId);
    
//     if (!room) {
//       return socket.emit('room-error', 'Room not found');
//     }

//     room.setUserReady(userName);
//     // console.log(room)
//     io.to(roomId).emit('user-ready', { userName });

//     if (room.allUsersReady() && !room.gameInProgress) {
//       room.startGame(io);
//       io.to(roomId).emit('game-start');
//       // console.log("game started", room.gameInProgress);
//     }

    
//   });

//   socket.on('guess', ({ roomId, userName, guess }) => {
//     const room = roomManager.getRoom(roomId);
//     if (room && room.gameInProgress && guess === room.currentWord) {
//       room.updateScore(userName, 10); // Award points for correct guess
//       io.to(roomId).emit('correct-guess', { userName, word: room.currentWord });
//       room.endRound(io);
//     }
//   });

//   socket.on('draw-line', ({ prevPoint, currentPoint, color, roomId }) => {
//     const room = roomManager.getRoom(roomId);
//     console.log("draw line", prevPoint, currentPoint, color, roomId);
//     if (room) {
      
//       // Broadcast the drawing data to all other users in the room
//       socket.to(roomId).emit('draw-line', { prevPoint, currentPoint, color });
//     }
//   });

//   // ... (other socket event handlers)
// });

// app.get('/create-room', (req, res) => {
//   const roomId = roomManager.createRoom();
//   res.json({ message: 'Room created successfully', room: roomId });
// });

// app.post('/join-room/:roomId', (req, res) => {
//   const roomId = req.params.roomId;
//   const userName = req.body.name;

//   const room = roomManager.getRoom(roomId);
//   if (!room) {
//     return res.status(404).json({ error: 'Room not found' });
//   }

//   room.addUser(userName);
//   res.status(200).json({ message: `${userName} joined the room ${roomId}` });
// });

// app.get('/room/:roomId', (req, res) => {
//   const roomId = req.params.roomId;
//   const room = roomManager.getRoom(roomId);

//   if (!room) {
//     return res.status(404).json({ error: 'Room not found' });
//   }

//   res.json({ roomData: room.toJSON() });
// });

// server.listen(3001, () => {
//   console.log('✔️ Server listening on port 3001');
// });

import express from 'express';
import http from 'http';
import socketIo from 'socket.io';
import cors from 'cors';
import RoomManager from './RoomManager';

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const roomManager = new RoomManager();

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, userName }) => {
    const room = roomManager.getRoom(roomId);
    if (!room) {
      return socket.emit('room-error', 'Room not found');
    }

    if (room.users.includes(userName)) {
      return socket.emit('room-error', 'User already in room');
    }

    const isHost = room.users.length === 0; // First user to join is the host
    room.addUser(userName);
    socket.join(roomId);

    io.to(roomId).emit('room-joined', { 
      message: `${userName} joined the room ${roomId}`,
      isHost,
      status: room.status // Assuming you add a 'status' property to your room model
    });
    io.to(roomId).emit('room', room.toJSON());
  });

  socket.on('ready', ({ roomId, userName }) => {
    const room = roomManager.getRoom(roomId);
    
    if (!room) {
      return socket.emit('room-error', 'Room not found');
    }

    room.setUserReady(userName);
    io.to(roomId).emit('user-ready', { userName });
    io.to(roomId).emit('room-update', room.toJSON());

    if (room.allUsersReady() && !room.gameInProgress) {
      room.setStatus('ready');
      room.startGame(io);
      io.to(roomId).emit('game-start');
      io.to(roomId).emit('room-update', room.toJSON());
    }
  });

  socket.on('start-game', ({ roomId }) => {
    const room = roomManager.getRoom(roomId);
    if (room && !room.gameInProgress) {
      room.startGame(io);
      io.to(roomId).emit('game-start');
      io.to(roomId).emit('room-update', room.toJSON());
    }
  });

  socket.on('guess', ({ roomId, userName, guess }) => {
    const room = roomManager.getRoom(roomId);
    if (room && room.gameInProgress && guess === room.currentWord) {
      room.updateScore(userName, 10); // Award points for correct guess
      io.to(roomId).emit('correct-guess', { userName, word: room.currentWord });
      room.endRound(io);
    }
  });

  socket.on('draw-line', ({ prevPoint, currentPoint, color, roomId }) => {
    // console.log('draw-line called', prevPoint, currentPoint, color ,roomId);
    const room = roomManager.getRoom(roomId);
    if (room) {
      // Broadcast the drawing data to all other users in the room
      socket.to(roomId).emit('draw-line', { prevPoint, currentPoint, color });
    }
  });
});

app.get('/create-room', (req, res) => {
  const roomId = roomManager.createRoom();
  res.json({ message: 'Room created successfully', room: roomId });
});

app.post('/join-room/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const userName = req.body.name;

  const room = roomManager.getRoom(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  room.addUser(userName);
  res.status(200).json({ message: `${userName} joined the room ${roomId}` });
});

app.get('/room/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const room = roomManager.getRoom(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.json({ roomData: room.toJSON() });
});

server.listen(3001, () => {
  console.log('✔️ Server listening on port 3001');
});
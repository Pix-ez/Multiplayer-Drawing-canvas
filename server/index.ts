// //@ts-nocheck
// import express from 'express'
// import http from 'http'
// import bodyParser from "body-parser";
// import cors from 'cors';
// import { v4 as uuidv4 } from 'uuid';
// import { words } from './words.json'


// //configure server
// const app = express()
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.json())
// app.use(cors()); // Enable CORS

// //setup socket server
// const server = http.createServer(app)

// import { Server } from 'socket.io'
// const io = new Server(server, {
//   cors: {
//     origin: '*',
//   },
// })

// //room data
// const rooms = {};

// type Point = { x: number; y: number }

// type DrawLine = {
//   prevPoint: Point | null
//   currentPoint: Point
//   color: string
// }

// // Function to get a random word from the word list
// function getRandomWord() {
//   const randomIndex = Math.floor(Math.random() * words.length);
//   return words[randomIndex];
// }


// function selectNextPlayer(roomId: string) {
//   const room = rooms[roomId];
//   if (room.users.length === 0) {
//     // Handle the case when there are no users in the room
//     return;
//   }

//   if (room.currentPlayerIndex === 0) {
//     room.currentPlayerIndex = 0
//   } else {
//     room.currentPlayerIndex = room.currentPlayerIndex + 1;
//     // Increment the index and wrap around if needed
//   }



//   console.log('Current player index:', room.currentPlayerIndex);
//   console.log('Users:', room.users);

//   const currentPlayer = room.users[room.currentPlayerIndex];
//   const word = getRandomWord();
//   io.to(roomId).emit('select-player', { player: currentPlayer, word }); // Emit event to select the next player and send the word
// }


// io.on('connection', (socket) => {

//   socket.on('join-room', ({ roomId, userName }) => {
//     if (!rooms[roomId]) {
//       return socket.emit('room-error', 'Room not found');
//     }

//     const room = rooms[roomId];
//     room.users.push(userName);
//     socket.join(roomId);

//     // Update scores object and create a default entry with a score of 0 for the new user
//     room.scores[userName] = 0;
//     console.log(`${userName} joined room ${roomId}`);
//     console.log(room)
//     // socket.emit('room-joined', { message: `${userName} joined the room ${roomId}` });

//     // Broadcast the updated user list to all room members
//     io.to(roomId).emit('room-joined', { message: `${userName} joined the room ${roomId}` });
//     io.to(roomId).emit('room', room);

//   });

//   socket.on('ready', ({ roomId, userName }) => {
//     if (!rooms[roomId]) {
//       return socket.emit('room-error', 'Room not found');
//     }
//     const room = rooms[roomId];
//     room.ready[userName] = true;

//     // Check if all users are ready
//     const numReadyUsers = Object.keys(room.ready).length;

//     const totalUsers = room.users.length;



//     if (numReadyUsers === totalUsers) {
//       // Send the 'game-start' event to the room
//       io.to(roomId).emit('game-start');
//       selectNextPlayer(roomId); // Select the first player
//     } else {
//       // Send the 'user-ready' event to the room
//       io.to(roomId).emit('user-ready', { userName });


//     }
//   });

//   // Listen for 'round-finished' event from the client
//   socket.on('round-finished', (roomId) => {
//     selectNextPlayer(roomId); // Select the next player and send a new word
//   });

//   socket.on('client-ready', () => {
//     socket.broadcast.emit('get-canvas-state')
//   })

//   socket.on('canvas-state', (state) => {
//     console.log('received canvas state')
//     socket.broadcast.emit('canvas-state-from-server', state)
//   })

//   socket.on('draw-line', ({ prevPoint, currentPoint, color }: DrawLine) => {
//     socket.broadcast.emit('draw-line', { prevPoint, currentPoint, color })
//   })

//   socket.on('clear', () => io.emit('clear'))
// })



// app.get('/create-room', (req, res) => {
//   const room = uuidv4().slice(0, 5);

//   const newRoom = {
//     room,
//     users: [],
//     ready: {}, // Initialize the ready property
//     scores: {},
//     currentPlayerIndex: 0, // Initialize currentPlayerIndex to 0
//   };

//   rooms[room] = newRoom;

//   console.log('Room created:', newRoom);
//   res.json({ message: 'Room created successfully', room });
// });


// app.post('/join-room/:roomId', (req, res) => {
//   const roomId = req.params.roomId;
//   const userName = req.body.name;

//   if (!rooms[roomId]) {
//     return res.status(404).json({ error: 'Room not found' });
//   }

//   rooms[roomId].users.push(userName); // Add the user's name to the users array of the room

//   console.log(`${userName} joined room ${roomId}`);
//   // res.redirect(`/main/${roomId}`);
//   res.status(200).json({ message: `${userName} joined the room ${roomId}` });
// });



// app.get('/room/:roomid', (req, res) => {
//   const roomId = req.params.roomid;

//   if (!rooms[roomId]) {
//     return res.status(404).json({ error: 'Room not found' });
//   }

//   const roomData = rooms[roomId];

//   res.json({ roomData });
// });



// //starting server
// server.listen(3001, () => {
//   console.log('✔️ Server listening on port 3001')
// })

//@ts-nocheck
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import bodyParser from 'body-parser';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { words } from './words.json';

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

  startGame(io: SocketIOServer) {
    this.gameInProgress = true;
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
    };
  }
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

// Server setup
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*' },
});

const roomManager = new RoomManager();

function getRandomWord(): string {
  return words[Math.floor(Math.random() * words.length)];
}

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, userName }) => {
    const room = roomManager.getRoom(roomId);
    if (!room) {
      return socket.emit('room-error', 'Room not found');
    }

    if (room.users.includes(userName)) {
      return socket.emit('room-error', 'User already in room');
    }

    room.addUser(userName);
    socket.join(roomId);

    io.to(roomId).emit('room-joined', { message: `${userName} joined the room ${roomId}` });
    io.to(roomId).emit('room', room.toJSON());
  });

  socket.on('ready', ({ roomId, userName }) => {
    const room = roomManager.getRoom(roomId);
    if (!room) {
      return socket.emit('room-error', 'Room not found');
    }

    room.setUserReady(userName);
    io.to(roomId).emit('user-ready', { userName });

    if (room.allUsersReady() && !room.gameInProgress) {
      room.startGame(io);
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

  // ... (other socket event handlers)
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
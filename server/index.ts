//@ts-nocheck
import express from 'express'
import http from 'http'
import bodyParser from "body-parser";
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { words } from './words.json'


//configure server
const app = express()
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())
app.use(cors()); // Enable CORS

//setup socket server
const server = http.createServer(app)

import { Server } from 'socket.io'
const io = new Server(server, {
  cors: {
    origin: '*',
  },
})

//room data
const rooms = {};

type Point = { x: number; y: number }

type DrawLine = {
  prevPoint: Point | null
  currentPoint: Point
  color: string
}

// Function to get a random word from the word list
function getRandomWord() {
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}


function selectNextPlayer(roomId: string) {
  const room = rooms[roomId];
  if (room.users.length === 0) {
    // Handle the case when there are no users in the room
    return;
  }

  if (room.currentPlayerIndex === 0) {
    room.currentPlayerIndex = 0
  } else {
    room.currentPlayerIndex = room.currentPlayerIndex + 1;
    // Increment the index and wrap around if needed
  }



  console.log('Current player index:', room.currentPlayerIndex);
  console.log('Users:', room.users);

  const currentPlayer = room.users[room.currentPlayerIndex];
  const word = getRandomWord();
  io.to(roomId).emit('select-player', { player: currentPlayer, word }); // Emit event to select the next player and send the word
}


io.on('connection', (socket) => {

  socket.on('join-room', ({ roomId, userName }) => {
    if (!rooms[roomId]) {
      return socket.emit('room-error', 'Room not found');
    }

    const room = rooms[roomId];
    room.users.push(userName);
    socket.join(roomId);

    // Update scores object and create a default entry with a score of 0 for the new user
    room.scores[userName] = 0;
    console.log(`${userName} joined room ${roomId}`);
    console.log(room)
    // socket.emit('room-joined', { message: `${userName} joined the room ${roomId}` });

    // Broadcast the updated user list to all room members
    io.to(roomId).emit('room-joined', { message: `${userName} joined the room ${roomId}` });
    io.to(roomId).emit('room', room);

  });

  socket.on('ready', ({ roomId, userName }) => {
    if (!rooms[roomId]) {
      return socket.emit('room-error', 'Room not found');
    }
    const room = rooms[roomId];
    room.ready[userName] = true;

    // Check if all users are ready
    const numReadyUsers = Object.keys(room.ready).length;

    const totalUsers = room.users.length;



    if (numReadyUsers === totalUsers) {
      // Send the 'game-start' event to the room
      io.to(roomId).emit('game-start');
      selectNextPlayer(roomId); // Select the first player
    } else {
      // Send the 'user-ready' event to the room
      io.to(roomId).emit('user-ready', { userName });


    }
  });

  // Listen for 'round-finished' event from the client
  socket.on('round-finished', (roomId) => {
    selectNextPlayer(roomId); // Select the next player and send a new word
  });

  socket.on('client-ready', () => {
    socket.broadcast.emit('get-canvas-state')
  })

  socket.on('canvas-state', (state) => {
    console.log('received canvas state')
    socket.broadcast.emit('canvas-state-from-server', state)
  })

  socket.on('draw-line', ({ prevPoint, currentPoint, color }: DrawLine) => {
    socket.broadcast.emit('draw-line', { prevPoint, currentPoint, color })
  })

  socket.on('clear', () => io.emit('clear'))
})



app.get('/create-room', (req, res) => {
  const room = uuidv4().slice(0, 5);

  const newRoom = {
    room,
    users: [],
    ready: {}, // Initialize the ready property
    scores: {},
    currentPlayerIndex: 0, // Initialize currentPlayerIndex to 0
  };

  rooms[room] = newRoom;

  console.log('Room created:', newRoom);
  res.json({ message: 'Room created successfully', room });
});


app.post('/join-room/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const userName = req.body.name;

  if (!rooms[roomId]) {
    return res.status(404).json({ error: 'Room not found' });
  }

  rooms[roomId].users.push(userName); // Add the user's name to the users array of the room

  console.log(`${userName} joined room ${roomId}`);
  // res.redirect(`/main/${roomId}`);
  res.status(200).json({ message: `${userName} joined the room ${roomId}` });
});



app.get('/room/:roomid', (req, res) => {
  const roomId = req.params.roomid;

  if (!rooms[roomId]) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const roomData = rooms[roomId];

  res.json({ roomData });
});



//starting server
server.listen(3001, () => {
  console.log('✔️ Server listening on port 3001')
})

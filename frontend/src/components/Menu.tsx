
//@ts-nocheck
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useGameContext } from '../Context';
const socket = io('http://localhost:3001');

const Menu = () => {
  const navigate = useNavigate();
  const {
    roomId, setRoomId,
    userName, setUserName,
    users, setUsers,
    ready, setReady,
    gameStarted, setGameStarted,
    setCurrentDrawer,
    setCurrentWord,
    setScores,
    setRoundTimeRemaining,
    setGameTimeRemaining
  } = useGameContext();

  const [error, setError] = React.useState('');
  const [joined, setJoined] = React.useState(false);

  useEffect(() => {
    socket.on('room-joined', (data) => {
      console.log(data.message);
      setJoined(true);
    });

    socket.on('room', (data) => {
      console.log('Room data:', data);
      setUsers(data.users);
    });

    socket.on('game-start', () => {
      setGameStarted(true);
      navigate('/game');
    });

    socket.on('room-error', setError);

    return () => {
      socket.off('room-joined');
      socket.off('room');
      socket.off('game-start');
      socket.off('room-error');
    };
  }, [navigate, setUsers, setGameStarted]);

  const joinRoom = (roomId) => {
    if (!userName.trim()) {
      setError('Please enter a name');
      return;
    }

    setRoomId(roomId);
    socket.emit('join-room', { roomId, userName });
  };

  const CreateRoom = async (event) => {
    event.preventDefault();
  
    if (!userName.trim()) {
      setError('Please enter a name');
      return;
    }
  
    try {
      const res = await axios.get('http://localhost:3001/create-room');
  
      if (res.status === 200) {
        const newRoomId = res.data.room;
        setRoomId(newRoomId);
        joinRoom(newRoomId);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Failed to create room');
    }
  };
  
  const JoinRoom = (event) => {
    event.preventDefault();

    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }

    joinRoom(roomId);
  };

  const handleReady = () => {
    socket.emit('ready', { roomId, userName });
    setReady(true);
  };

  if (joined) {
    return (
      <div>
        <h2>Room: {roomId}</h2>
        <h3>Users in room:</h3>
        <ul>
          {users.map((user, index) => (
            <li key={index}>{user}{user === userName && ' (You)'}</li>
          ))}
        </ul>
        <button onClick={handleReady} disabled={ready}>
          {ready ? 'Waiting for others...' : 'Ready'}
        </button>
      </div>
    );
  }

  return (
    <div>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <div>
        <input 
          placeholder='Type your name!'
          onChange={(event) => setUserName(event.target.value)}
          value={userName}
        />
        <button onClick={CreateRoom}>
          Create room
        </button>
      </div>

      <div>
        <input 
          placeholder='Type room id'
          onChange={(event) => setRoomId(event.target.value)}
          value={roomId}
        />
        <button onClick={JoinRoom}>
          Join room
        </button>
      </div>
    </div>
  );
};

export default Menu;
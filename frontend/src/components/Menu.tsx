
//@ts-nocheck
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

const Menu = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [roomid, setRoomid] = useState('');
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);
  const [users, setUsers] = useState([]);
  const [ready, setReady] = useState(false);

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
      navigate('/game');
    });

    socket.on('room-error', setError);

    return () => {
      socket.off('room-joined');
      socket.off('room');
      socket.off('game-start');
      socket.off('room-error');
    };
  }, [navigate]);

  const joinRoom = (roomId) => {
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    sessionStorage.setItem('roomid', roomId);
    sessionStorage.setItem('name', name);
    socket.emit('join-room', { roomId, userName: name });
  };

  const CreateRoom = async (event) => {
    event.preventDefault();
  
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }
  
    try {
      const res = await axios.get('http://localhost:3001/create-room');
  
      if (res.status === 200) {
        const roomId = res.data.room;
        setRoomid(roomId);
        joinRoom(roomId);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Failed to create room');
    }
  };
  
  const JoinRoom = (event) => {
    event.preventDefault();

    if (!roomid.trim()) {
      setError('Please enter a room ID');
      return;
    }

    joinRoom(roomid);
  };

  const handleReady = () => {
    socket.emit('ready', { roomId: roomid, userName: name });
    setReady(true);
  };

  if (joined) {
    return (
      <div>
        <h2>Room: {roomid}</h2>
        <h3>Users in room:</h3>
        <ul>
          {users.map((user, index) => (
            <li key={index}>{user}{user === name && ' (You)'}</li>
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
          onChange={(event) => setName(event.target.value)}
          value={name}
        />
        <button onClick={CreateRoom}>
          Create room
        </button>
      </div>

      <div>
        <input 
          placeholder='Type room id'
          onChange={(event) => setRoomid(event.target.value)}
          value={roomid}
        />
        <button onClick={JoinRoom}>
          Join room
        </button>
      </div>
    </div>
  );
};

export default Menu;
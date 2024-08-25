//@ts-nocheck

import React, { useState, useRef, useEffect } from 'react';
import socket from '../hooks/socketService';
import { useGameContext } from '../Context';


const ChatBox = ({ guesses}) => {
    const {
        roomId, setRoomId,
        userName, setUserName,
        users, setUsers,
      } = useGameContext();

  const [inputGuess, setInputGuess] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // console.log(guesses)
    scrollToBottom();
  }, [guesses]);

  const handleGuess = () => {
    if (inputGuess.trim() !== '') {
        
    socket.emit('submit-guess', { roomId, userName, guess: inputGuess.trim() });
    setInputGuess('');
    }
  };

  return (
    <div className="chat-box" style={{
      width: '300px',
      height: '400px',
      border: '1px solid #ccc',
      display: 'flex',
      flexDirection: 'column'
    }}>
             <div className="messages" style={{
        flexGrow: 1,
        overflowY: 'auto',
        padding: '10px',
      }}>
        {guesses.map((guess, index) => (
          <div key={index} style={{
            marginBottom: '10px',
            color: guess.isCorrect ? 'green' : 'black'
          }}>
            {guess.isCorrect ? (
              <span style={{ color: 'green' }}>
                <strong>{guess.name}</strong> has guessed correct!
              </span>
            ) : (
              <>
                <strong>{guess.name}</strong> has guessed {guess.guessWord}
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{
        display: 'flex',
        padding: '10px',
        borderTop: '1px solid #ccc'
      }}>
 
        <input
          type="text"
          value={inputGuess}
          onChange={(e) => setInputGuess(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && inputGuess.trim() !== '') {
              handleGuess();
            }
          }}
          placeholder="Enter your guess"
          style={{ flexGrow: 1, marginRight: '10px' }}
        />
        <button onClick={handleGuess} disabled={inputGuess.trim() === ''}>Guess</button>
      </div>
    </div>
  );
};

export default ChatBox;
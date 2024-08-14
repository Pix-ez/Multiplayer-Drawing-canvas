//@ts-nocheck

import { FC, useContext, useEffect, useState } from 'react'
import { useDraw } from '../hooks/useDraw'
import { ChromePicker } from 'react-color'
import socket from '../hooks/socketService';
import { useGameContext } from '../Context';
import { drawLine } from '../utils/drawLine'
import axios from 'axios'



type DrawLineProps = {
    prevPoint: Point | null
    currentPoint: Point
    color: string
  }
  
  interface Room {
    ready: Record<string, boolean>;
    room: string;
    users: string[];
    scores: Record<string, number>;
  }
  
  const Game: FC<pageProps> = ({ }) => {
    const [color, setColor] = useState<string>('#000');
    const { canvasRef, onMouseDown, clear} = useDraw(createLine);
    // const roomId = sessionStorage.getItem('roomid');
    // const userName = sessionStorage.getItem('name');
    const {
      roomId, setRoomId,
      userName, setUserName,
      users, setUsers,
      ready, setReady,
      gameStarted, setGameStarted,
      currentDrawer,setCurrentDrawer,
      currentWord,setCurrentWord,
      scores,setScores,
      roundTimeRemaining, setRoundTimeRemaining,
      gameTimeRemaining ,setGameTimeRemaining
    } = useGameContext();
    // const [isReady, setIsReady] = useState(false);
    // const [room, setRoom] = useState<Room | undefined>();
    // const [gameStarted, setGameStarted] = useState(false);
    // const [roundTimeRemaining, setRoundTimeRemaining] = useState(30);
    // const [gameTimeRemaining, setGameTimeRemaining] = useState(60);
    // const [currentDrawer, setCurrentDrawer] = useState('');
    // const [currentWord, setCurrentWord] = useState('');
    const [isDrawing, setIsDrawing] = useState(false);
    const [guess, setGuess] = useState('');
  
    useEffect(() => {
      
      
      // if (!sessionStorage.getItem('hasJoinedRoom')) {
      //   socket.emit('join-room', { roomId, userName });
      //   sessionStorage.setItem('hasJoinedRoom', 'true');
      // }
  
  
      // socket.on('user-ready', ({ userName }) => {
      //   setRoom((prevRoom) => {
      //     if (prevRoom) {
      //       return {
      //         ...prevRoom,
      //         ready: { ...prevRoom.ready, [userName]: true },
      //       };
      //     }
      //     return prevRoom;
      //   });
      // });
  
      socket.on('round-start', ({ drawer, word, roundTime }) => {
        setCurrentDrawer(drawer);
        setCurrentWord(word);
        setRoundTimeRemaining(roundTime);
        setIsDrawing(drawer === userName);
        clear(); // Clear canvas for new round
      });
  
      socket.on('game-time', (time) => {
        setGameTimeRemaining(time);
      });
      
      socket.on('round-time', (time) => {
        // console.log(time);
        setRoundTimeRemaining(time);
      });
  
      socket.on('round-end', ({ word }) => {
        alert(`Round ended. The word was: ${word}`);
      });
  
      socket.on('correct-guess', ({ userName, word }) => {
        alert(`${userName} guessed correctly! The word was: ${word}`);
      });
  
      socket.on('game-end', ({ finalScores }) => {
        setGameStarted(false);
        alert('Game Over! Final Scores: ' + JSON.stringify(finalScores));
      });
  
      socket.on('draw-line', ({ prevPoint, currentPoint, color }: DrawLineProps) => {
        
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return console.log('no ctx here');
        drawLine({ prevPoint, currentPoint, ctx, color });
      });
  
      socket.on('clear', clear);
  
      return () => {
        socket.off('room-joined');
        socket.off('room');
        socket.off('game-start');
        socket.off('user-ready');
        socket.off('round-start');
        socket.off('game-time');
        socket.off('round-time');
        socket.off('round-end');
        socket.off('correct-guess');
        socket.off('game-end');
        socket.off('draw-line');
        socket.off('clear');
      };
    }, []);
  
    function createLine({ prevPoint, currentPoint, ctx, roomId }: Draw) {
      console.log("draw-line called", prevPoint, currentPoint, roomId);  // Log the roomId to verify
      
      socket.emit('draw-line', { prevPoint, currentPoint, color, roomId });
      drawLine({ prevPoint, currentPoint, ctx, color });
    }
    
  
    const handleReadyClick = () => {
      setIsReady(true);
      socket.emit('ready', { roomId, userName });
    };
  
    const handleGuessSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (guess.trim() !== '') {
        socket.emit('guess', { roomId, userName, guess: guess.trim() });
        setGuess('');
      }
    };
  
    // if (!gameStarted) {
    //   return (
    //     <>
    //       <div className='flex flex-col items-start bg-blue-600 w-1/5 h-2/5 self-center ml-4'>
    //         <a className='text-black text-lg font-extrabold'>{roomId}</a>
    //         {room?.users.map((user) => (
    //           <div key={user}>
    //             <span className='text-black text-lg font-extrabold'>{user}</span>
    //             <span className='text-black text-lg font-extrabold'>
    //               {room.ready[user] ? ' (Ready)' : ''}
    //             </span>
    //           </div>
    //         ))}
    //       </div>
    //       <button
    //         className='text-black text-lg font-extrabold bg-yellow-500'
    //         onClick={handleReadyClick}
    //         disabled={isReady}
    //       >
    //         Ready!
    //       </button>
    //     </>
    //   );
    // }
  
    return (
      <>
        <div className='flex flex-row w-screen h-screen gap-10'>
          <div className='flex flex-col items-start bg-blue-600 w-1/5 h-2/5 self-center ml-4'>
            {users?.map((user) => (
              <div key={user}>
                <span className='text-black text-lg font-extrabold'>{user}</span>
                <span className='text-black text-lg font-extrabold'>{scores[user]}</span>
              </div>
            ))}
          </div>
  
          <div className='flex flex-col items-center'>
            <div>
              <p>Game Time: {gameTimeRemaining} seconds</p>
              <p>Round Time: {roundTimeRemaining} seconds</p>
              <p>Current Drawer: {currentDrawer}</p>
              {isDrawing && <p>Word to draw: {currentWord}</p>}
            </div>
  
            <div className='w-fit h-fit bg-white flex justify-center items-center mt-10'>
              <canvas
                ref={canvasRef}
                onMouseDown={onMouseDown}
                width={750}
                height={750}
                className='border border-black rounded-md'
              />
            </div>
  
            {!isDrawing && (
              <form onSubmit={handleGuessSubmit}>
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Enter your guess"
                  className='border border-black p-2 mr-2'
                />
                <button type="submit" className='bg-blue-500 text-white p-2 rounded'>Guess</button>
              </form>
            )}
          </div>
  
          
            <div className='flex flex-col gap-10 pr-10 mt-10'>
              <ChromePicker color={color} onChange={(e) => setColor(e.hex)} />
              <button
                type='button'
                className='p-2 rounded-md border border-black bg-blue-800 text-lg font-extrabold'
                onClick={() => socket.emit('clear')}
              >
                Clear canvas
              </button>
            </div>
          
        </div>
      </>
    );
  }
  
  export default Game;
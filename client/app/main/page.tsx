// 'use client'

// import { FC, useContext, useEffect, useState } from 'react'
// import { useDraw } from '../../hooks/useDraw'
// import { ChromePicker } from 'react-color'

// import { io } from 'socket.io-client'
// import { drawLine } from '../../utils/drawLine'

// import axios from 'axios'
// const socket = io('http://localhost:3001')

// interface pageProps { }

// type DrawLineProps = {
//   prevPoint: Point | null
//   currentPoint: Point
//   color: string
// }

// interface Room {
//   ready: Record<string, boolean>;
//   room: string;
//   users: string[];
//   scores: Record<string, number>;
// }


// const page: FC<pageProps> = ({ }) => {
//   const [color, setColor] = useState<string>('#000');
//   const { canvasRef, onMouseDown, clear } = useDraw(createLine);
//   const roomId = sessionStorage.getItem('roomid');
//   const userName = sessionStorage.getItem('name');
//   const [isReady, setIsReady] = useState(false);
//   const [room, setRoom] = useState<Room | undefined>();
//   const [start, setStart] = useState(false)
//   const [countdown, setCountdown] = useState(61);
//   const [startCountdown, setStartCountdown] = useState(false);
//   console.log(roomId, userName);


//   // Send join-room event when the component mounts
//   if (!sessionStorage.getItem('hasJoinedRoom')) {
//     socket.emit('join-room', { roomId, userName });
//     sessionStorage.setItem('hasJoinedRoom', 'true');
//   }

//   useEffect(() => {


//     // Listen for room-joined event
//     socket.on('room-joined', (data) => {
//       console.log(data.message);
//       alert(data.message);
//     });

//     // Listen for user-list event
//     socket.on('room', (data) => {
//       console.log(data);
//       setRoom(data)
//     });

//     socket.on('game-start', () => {
//       setStart(true);
//       setStartCountdown(true);
//     });

//     // Listen for user-ready event
//     socket.on('user-ready', ({ userName }) => {
//       setRoom((prevRoom) => {
//         if (prevRoom) {
//           const updatedUsers = prevRoom.users.map((user) => {
//             if (user === userName) {
//               return `${user} (Ready)`; // Append "(Ready)" to the user name
//             }
//             return user;
//           });
//           return {
//             ...prevRoom,
//             users: updatedUsers,
//           };
//         }
//         return prevRoom;
//       });

//       // Check if all users are ready
//       const allReady = room?.users.every((user) => user.includes('(Ready)'));
//       if (allReady) {
//         setStart(true);
//       }
//     });


//     return () => {

//       socket.off('room-joined')
//       socket.off('user-list')
//       socket.off('game-start');
//       socket.off('user-ready');

//     }



//   }, []);



//   useEffect(() => {
//     let countdownTimer;
  
//     // Listen for 'select-player' event from the server
//     socket.on('select-player', ({ player, word }) => {
//       console.log(`Selected player: ${player}`);
//       console.log(`Word for player: ${word}`);
      
//       // Start the countdown for the current player
//       setStartCountdown(true);
//       setCountdown(10);
//     });
  
//     // Emit 'round-finished' event to the server when the countdown reaches 0
//     const countdownInterval = setInterval(() => {
//       setCountdown((prevCountdown) => {
//         if (prevCountdown === 1) {
//           clearInterval(countdownInterval);
//           socket.emit('round-finished', roomId);
//         }
//         return prevCountdown - 1;
//       });
//     }, 1000);
  
//     // Clean up the timer and event listener on component unmount
//     return () => {
//       clearInterval(countdownInterval);
//       socket.off('select-player');
//     };
//   }, []);
  
//   useEffect(() => {
//     if (startCountdown && countdown > 0) {
//       const timer = setTimeout(() => {
//         setCountdown((prevCountdown) => prevCountdown - 1);
//       }, 1000);
  
//       return () => clearTimeout(timer);
//     }
//   }, [startCountdown, countdown]);

//   useEffect(() => {
//     const ctx = canvasRef.current?.getContext('2d')


//     socket.emit('client-ready')


//     socket.on('get-canvas-state', () => {
//       if (!canvasRef.current?.toDataURL()) return
//       console.log('sending canvas state')
//       socket.emit('canvas-state', canvasRef.current.toDataURL())
//     })

//     socket.on('canvas-state-from-server', (state: string) => {
//       console.log('I received the state')
//       const img = new Image()
//       img.src = state
//       img.onload = () => {
//         ctx?.drawImage(img, 0, 0)
//       }
//     })

//     socket.on('draw-line', ({ prevPoint, currentPoint, color }: DrawLineProps) => {
//       if (!ctx) return console.log('no ctx here')
//       drawLine({ prevPoint, currentPoint, ctx, color })
//     })

//     socket.on('clear', clear)

//     return () => {
//       socket.off('draw-line')
//       socket.off('get-canvas-state')
//       socket.off('canvas-state-from-server')
//       socket.off('clear')
//     }
//   }, [canvasRef])

//   // useEffect(() => {
//   //   if (startCountdown && countdown > 0) {
//   //     const timer = setTimeout(() => {
//   //       setCountdown((prevCountdown) => prevCountdown - 1);
//   //     }, 1000);

//   //     return () => clearTimeout(timer);
//   //   }
//   // }, [startCountdown, countdown]);







//   function createLine({ prevPoint, currentPoint, ctx }: Draw) {
//     socket.emit('draw-line', { prevPoint, currentPoint, color })
//     drawLine({ prevPoint, currentPoint, ctx, color })
//   }

//   const handleReadyClick = () => {
//     setIsReady(true);


//     // Send the 'ready' event to the server with the roomId
//     socket.emit('ready', { roomId, userName });
//   };


//   // Render the game UI if start is true
//   if (start) {
//     return (
//       <>
//         {startCountdown && (
//           <div>
//             <p>Game starting in {countdown} seconds</p>
//           </div>
//         )}

//         <div className='flex flex-row  w-screen h-screen gap-10'>


//           <div className='flex flex-col items-start bg-blue-600 w-1/5 h-2/5 self-center ml-4'>
//             {room?.users.map((user) => (
//               <div key={user}>
//                 <span className='text-black text-lg font-extrabold'>{user}</span>
//                 <span className='text-black text-lg font-extrabold'>{room?.scores[user]}</span>
//               </div>
//             ))}

//           </div>

//           <div className='w-fit h-fit bg-white flex justify-center items-center mt-10'>
//             <canvas
//               ref={canvasRef}
//               onMouseDown={onMouseDown}
//               width={750}
//               height={750}
//               className='border border-black rounded-md'
//             />
//           </div>

//           <div className='flex flex-col gap-10 pr-10 mt-10'>
//             <ChromePicker color={color} onChange={(e) => setColor(e.hex)} />
//             <button
//               type='button'
//               className='p-2 rounded-md border border-black bg-blue-800 text-lg font-extrabold'
//               onClick={() => socket.emit('clear')}>
//               Clear canvas
//             </button>
//           </div>
//         </div>
//       </>
//     );
//   }
//   return (

//     <>

//       <div className='flex flex-col items-start bg-blue-600 w-1/5 h-2/5 self-center ml-4'>
//         <a className='text-black text-lg font-extrabold'>{roomId}</a>
//         {room?.users.map((user) => (
//           <div key={user}>
//             <span className='text-black text-lg font-extrabold'>{user}</span>
//             <span className='text-black text-lg font-extrabold'>
//               {room.ready[user] ? 'Ready' : ''}
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



//   )
// }

// export default page

'use client'

import { FC, useContext, useEffect, useState } from 'react'
import { useDraw } from '../../hooks/useDraw'
import { ChromePicker } from 'react-color'
import { io } from 'socket.io-client'
import { drawLine } from '../../utils/drawLine'
import axios from 'axios'

const socket = io('http://localhost:3001')

interface pageProps { }

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

const page: FC<pageProps> = ({ }) => {
  const [color, setColor] = useState<string>('#000');
  const { canvasRef, onMouseDown, clear } = useDraw(createLine);
  const roomId = sessionStorage.getItem('roomid');
  const userName = sessionStorage.getItem('name');
  const [isReady, setIsReady] = useState(false);
  const [room, setRoom] = useState<Room | undefined>();
  const [gameStarted, setGameStarted] = useState(false);
  const [roundTimeRemaining, setRoundTimeRemaining] = useState(30);
  const [gameTimeRemaining, setGameTimeRemaining] = useState(60);
  const [currentDrawer, setCurrentDrawer] = useState('');
  const [currentWord, setCurrentWord] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [guess, setGuess] = useState('');

  useEffect(() => {
    if (!sessionStorage.getItem('hasJoinedRoom')) {
      socket.emit('join-room', { roomId, userName });
      sessionStorage.setItem('hasJoinedRoom', 'true');
    }

    socket.on('room-joined', (data) => {
      console.log(data.message);
      alert(data.message);
    });

    socket.on('room', (data) => {
      console.log(data);
      setRoom(data);
    });

    socket.on('game-start', () => {
      setGameStarted(true);
    });

    socket.on('user-ready', ({ userName }) => {
      setRoom((prevRoom) => {
        if (prevRoom) {
          return {
            ...prevRoom,
            ready: { ...prevRoom.ready, [userName]: true },
          };
        }
        return prevRoom;
      });
    });

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

  function createLine({ prevPoint, currentPoint, ctx }: Draw) {
    if (isDrawing) {
      socket.emit('draw-line', { prevPoint, currentPoint, color });
      drawLine({ prevPoint, currentPoint, ctx, color });
    }
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

  if (!gameStarted) {
    return (
      <>
        <div className='flex flex-col items-start bg-blue-600 w-1/5 h-2/5 self-center ml-4'>
          <a className='text-black text-lg font-extrabold'>{roomId}</a>
          {room?.users.map((user) => (
            <div key={user}>
              <span className='text-black text-lg font-extrabold'>{user}</span>
              <span className='text-black text-lg font-extrabold'>
                {room.ready[user] ? ' (Ready)' : ''}
              </span>
            </div>
          ))}
        </div>
        <button
          className='text-black text-lg font-extrabold bg-yellow-500'
          onClick={handleReadyClick}
          disabled={isReady}
        >
          Ready!
        </button>
      </>
    );
  }

  return (
    <>
      <div className='flex flex-row w-screen h-screen gap-10'>
        <div className='flex flex-col items-start bg-blue-600 w-1/5 h-2/5 self-center ml-4'>
          {room?.users.map((user) => (
            <div key={user}>
              <span className='text-black text-lg font-extrabold'>{user}</span>
              <span className='text-black text-lg font-extrabold'>{room?.scores[user]}</span>
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

        {isDrawing && (
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
        )}
      </div>
    </>
  );
}

export default page;
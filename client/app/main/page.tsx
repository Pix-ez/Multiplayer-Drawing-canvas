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
  const [start, setStart] = useState(false)
  const [countdown, setCountdown] = useState(61);
  const [startCountdown, setStartCountdown] = useState(false);
  console.log(roomId, userName);


  // Send join-room event when the component mounts
  if (!sessionStorage.getItem('hasJoinedRoom')) {
    socket.emit('join-room', { roomId, userName });
    sessionStorage.setItem('hasJoinedRoom', 'true');
  }

  useEffect(() => {


    // Listen for room-joined event
    socket.on('room-joined', (data) => {
      console.log(data.message);
      alert(data.message);
    });

    // Listen for user-list event
    socket.on('room', (data) => {
      console.log(data);
      setRoom(data)
    });

    socket.on('game-start', () => {
      setStart(true);
      setStartCountdown(true);
    });

    // Listen for user-ready event
    socket.on('user-ready', ({ userName }) => {
      setRoom((prevRoom) => {
        if (prevRoom) {
          const updatedUsers = prevRoom.users.map((user) => {
            if (user === userName) {
              return `${user} (Ready)`; // Append "(Ready)" to the user name
            }
            return user;
          });
          return {
            ...prevRoom,
            users: updatedUsers,
          };
        }
        return prevRoom;
      });

      // Check if all users are ready
      const allReady = room?.users.every((user) => user.includes('(Ready)'));
      if (allReady) {
        setStart(true);
      }
    });


    return () => {

      socket.off('room-joined')
      socket.off('user-list')
      socket.off('game-start');
      socket.off('user-ready');

    }



  }, []);



  useEffect(() => {
    let countdownTimer;
  
    // Listen for 'select-player' event from the server
    socket.on('select-player', ({ player, word }) => {
      console.log(`Selected player: ${player}`);
      console.log(`Word for player: ${word}`);
      
      // Start the countdown for the current player
      setStartCountdown(true);
      setCountdown(10);
    });
  
    // Emit 'round-finished' event to the server when the countdown reaches 0
    const countdownInterval = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown === 1) {
          clearInterval(countdownInterval);
          socket.emit('round-finished', roomId);
        }
        return prevCountdown - 1;
      });
    }, 1000);
  
    // Clean up the timer and event listener on component unmount
    return () => {
      clearInterval(countdownInterval);
      socket.off('select-player');
    };
  }, []);
  
  useEffect(() => {
    if (startCountdown && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);
  
      return () => clearTimeout(timer);
    }
  }, [startCountdown, countdown]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')


    socket.emit('client-ready')


    socket.on('get-canvas-state', () => {
      if (!canvasRef.current?.toDataURL()) return
      console.log('sending canvas state')
      socket.emit('canvas-state', canvasRef.current.toDataURL())
    })

    socket.on('canvas-state-from-server', (state: string) => {
      console.log('I received the state')
      const img = new Image()
      img.src = state
      img.onload = () => {
        ctx?.drawImage(img, 0, 0)
      }
    })

    socket.on('draw-line', ({ prevPoint, currentPoint, color }: DrawLineProps) => {
      if (!ctx) return console.log('no ctx here')
      drawLine({ prevPoint, currentPoint, ctx, color })
    })

    socket.on('clear', clear)

    return () => {
      socket.off('draw-line')
      socket.off('get-canvas-state')
      socket.off('canvas-state-from-server')
      socket.off('clear')
    }
  }, [canvasRef])

  // useEffect(() => {
  //   if (startCountdown && countdown > 0) {
  //     const timer = setTimeout(() => {
  //       setCountdown((prevCountdown) => prevCountdown - 1);
  //     }, 1000);

  //     return () => clearTimeout(timer);
  //   }
  // }, [startCountdown, countdown]);







  function createLine({ prevPoint, currentPoint, ctx }: Draw) {
    socket.emit('draw-line', { prevPoint, currentPoint, color })
    drawLine({ prevPoint, currentPoint, ctx, color })
  }

  const handleReadyClick = () => {
    setIsReady(true);


    // Send the 'ready' event to the server with the roomId
    socket.emit('ready', { roomId, userName });
  };


  // Render the game UI if start is true
  if (start) {
    return (
      <>
        {startCountdown && (
          <div>
            <p>Game starting in {countdown} seconds</p>
          </div>
        )}

        <div className='flex flex-row  w-screen h-screen gap-10'>


          <div className='flex flex-col items-start bg-blue-600 w-1/5 h-2/5 self-center ml-4'>
            {room?.users.map((user) => (
              <div key={user}>
                <span className='text-black text-lg font-extrabold'>{user}</span>
                <span className='text-black text-lg font-extrabold'>{room?.scores[user]}</span>
              </div>
            ))}

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

          <div className='flex flex-col gap-10 pr-10 mt-10'>
            <ChromePicker color={color} onChange={(e) => setColor(e.hex)} />
            <button
              type='button'
              className='p-2 rounded-md border border-black bg-blue-800 text-lg font-extrabold'
              onClick={() => socket.emit('clear')}>
              Clear canvas
            </button>
          </div>
        </div>
      </>
    );
  }
  return (

    <>

      <div className='flex flex-col items-start bg-blue-600 w-1/5 h-2/5 self-center ml-4'>
        {room?.users.map((user) => (
          <div key={user}>
            <span className='text-black text-lg font-extrabold'>{user}</span>
            <span className='text-black text-lg font-extrabold'>
              {room.ready[user] ? 'Ready' : ''}
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



  )
}

export default page

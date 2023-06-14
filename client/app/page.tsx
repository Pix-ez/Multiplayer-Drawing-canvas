"use client"



import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useContext, useState } from 'react';
import { Context } from '../context/appContext';

const Page = () => {
  
  const router = useRouter();
  const [name, setName] = useState('');
  const [roomid, setRoomid] = useState('');

  const CreateRoom = async (event: any) => {
    event.preventDefault();
  
    try {
      const res = await axios.get('http://localhost:3001/create-room');
  
      if (res.status === 200) {
        const roomId = res.data.room;
        
  
        sessionStorage.clear();
        sessionStorage.setItem('roomid', roomId);
        sessionStorage.setItem('name', name);
  
        router.push('/main');
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };
  

  const JoinRoom = async (event: any) => {
    event.preventDefault();

    try {
      sessionStorage.clear()
      sessionStorage.setItem('roomid',roomid )
      sessionStorage.setItem('name', name);
      // await axios.post(`http://localhost:3001/join-room/${roomid}`, { name });
      router.push('/main'); // Redirect to the /main page with the room ID as part of the URL
    } catch (error) {
      
      console.error('Error joining the room:', error);
      // Handle error case
    }

    // console.log(room)
  };

  return (
    <div>
            <div>
              <input placeholder='Type your name!'

               onChange={(event)=>{setName(event.target.value)}}
               />
            <button onClick={CreateRoom}>
                Create room
            </button>

            </div>

             <div>
              <input placeholder='Type room id'
              onChange={(event)=>{setRoomid(event.target.value)}}/>

            <button onClick={JoinRoom}>
               Join room
            </button>

            </div>
         
        </div>
  );
};

export default Page;

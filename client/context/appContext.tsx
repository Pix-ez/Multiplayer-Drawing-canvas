
import React,  { createContext,  useState } from "react";


export const Context = createContext()
export const ContextProvider =(props:any)=>{
    const[roomid , setRoomid] =useState()
  
    const value ={
        roomid,
        setRoomid
    
    }
    return <Context.Provider value={value}>{props.children}</Context.Provider>
}
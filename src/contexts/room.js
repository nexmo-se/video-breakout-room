// @flow
import { useState, useEffect, createContext } from "react";
import useSession from "hooks/session";
import RoomAPI from "api/room";


export const RoomContext = createContext({});
export default function RoomContextProvider({ children }){
  const [rooms, setRooms] = useState([]);
  const mSession = useSession();

  async function handleRoomCreation(roomName) {
    const generatedRoom = await RoomAPI.generateSession(roomName);
    setRooms((prevRooms) => {      
      return [ ...prevRooms, generatedRoom ]
    })
    return new Promise((resolve, reject) => {
      resolve(generatedRoom);
    })
  }

  return (
    <RoomContext.Provider value={{ 
      rooms,
      handleRoomCreation,
    }}>
      {children}
    </RoomContext.Provider>
  )
}
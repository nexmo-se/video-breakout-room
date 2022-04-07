// @flow
import { useState, useEffect, createContext } from "react";
import useSession from "hooks/session";
import RoomAPI from "api/room";
import useMessage from "hooks/message";
import CredentialAPI from "api/credential";


export const RoomContext = createContext({});
export default function RoomContextProvider({ children }){
  const [inBreakoutRoom, setInBreakoutRoom] = useState(null);
  const [isBreakoutRoomCreated, setIsBreakoutRoomCreated] = useState(true);
  const [mainRoom, setMainRoom] = useState();

  const [role, setRole] = useState(false);
  const [signal, setSignal] = useState();

  const mSession = useSession();
  const mMessage = useMessage();

  useEffect(() => {
    if (mMessage.breakoutRooms.length !== 0  && !inBreakoutRoom ) {
      let roomNameFound = mMessage.breakoutRooms.find((room) => room["member"].includes(mSession.user.name));
      if (roomNameFound) {
        setSignal('breakoutRoomChanged');
      }
      else if (isBreakoutRoomCreated && mSession.user.role == "participant" && mMessage.breakoutRoomsType !== "automatic") setSignal('breakoutRoomCreated');
    }
    else if (mMessage.breakoutRooms.length === 0) {  
      if (inBreakoutRoom) setSignal('breakoutRoomRemoved');
      setIsBreakoutRoomCreated(true);
    }
    else if (mMessage.breakoutRooms.length !== 0  && inBreakoutRoom) {
      setIsBreakoutRoomCreated(false);
      let roomNameFound = mMessage.breakoutRooms.find((room) => room.name === inBreakoutRoom);
      let roomSessionIdFound = mMessage.breakoutRooms.find((room) => room.sessionId === mSession.session.sessionId);
      
      if (!roomNameFound && !roomSessionIdFound) {
        setSignal('breakoutRoomRemoved');
      }
      else if (!roomNameFound && roomSessionIdFound) {
        setSignal('breakoutRoomRenamed');
        setInBreakoutRoom(roomSessionIdFound.name)
      }
      else if (!roomNameFound["member"].includes(mSession.user.name)) {
        setSignal('breakoutRoomChanged');
      }
    }
    else {
      setSignal(null);
    }
  // eslint-disable-next-line
  }, [ mMessage.breakoutRooms ]) 

  async function handleRoomCreate(breakoutRooms) {
    const generatedRoom = await RoomAPI.generateSession(mainRoom, {breakoutRooms});
    return new Promise((resolve, reject) => {
      resolve(generatedRoom);
    })
  }

  async function handleRoomRemove(roomId) {
    if (roomId === mainRoom) {
      const removedRoom = await RoomAPI.removeAllBreakoutRooms(roomId);
      return new Promise((resolve, reject) => {
        resolve(removedRoom);
      })
    }
    const removedRoom = await RoomAPI.removeBreakoutRoom(roomId);
      return new Promise((resolve, reject) => {
        resolve(removedRoom);
      })

  }

  async function connect(user, role, roomId){
      if(user) {
        const credentialInfo = {
          role,
          data: user.toJSON()
        }

        credentialInfo["roomId"] = mainRoom;
        
        if (roomId) {
          credentialInfo["roomId"] = roomId;
        }
        const credential = await CredentialAPI.generateCredential(credentialInfo);
        await mSession.connect(credential);
        setRole(role);
      }
  }

  async function createMainRoom(user, roomName) {
    const roomInfo = await RoomAPI.getRoomInfo(roomName);
    setMainRoom(roomName)
    mSession.createUser(user);
    mMessage.setBreakoutRooms(roomInfo.breakoutRooms ?? [])
  }

  function handleChangeRoom(publisher, subscriber, roomName) {
    const newRooms = [...mMessage.breakoutRooms];
    const targetRoomIndex = newRooms.findIndex((room) => room.name === roomName);
    newRooms.forEach((room) => {
      if (room["member"].includes(mSession.user.name)) {
        room["member"].splice(room["member"].indexOf(mSession.user.name),1);
      }
    })

    setSignal(null);
    mSession.session.unpublish(publisher);
    subscriber.unsubscribe();
    connect(mSession.user, role,  targetRoomIndex!== -1  ? newRooms[targetRoomIndex].id : '');

    if (targetRoomIndex !== -1 ) {
      newRooms[targetRoomIndex]["member"].push(mSession.user.name);
      setInBreakoutRoom(roomName);
    }
    else {
      setInBreakoutRoom(null);
    }

    RoomAPI.sendBreakoutRoom(mSession.userSessions[0], { "breakoutRooms": newRooms})
  }

  function handleExitRoom() {
    const newRooms = [...mMessage.breakoutRooms];
    const targetRoomIndex = newRooms.findIndex((room) => room.name === inBreakoutRoom);

    if (targetRoomIndex !== -1 ) {
      newRooms[targetRoomIndex]["member"].splice(newRooms[targetRoomIndex]["member"].indexOf(mSession.user.name),1);
      setInBreakoutRoom(null);
      RoomAPI.sendBreakoutRoom(mSession.userSessions[0], { "breakoutRooms": newRooms})
    }
  }

  return (
    <RoomContext.Provider value={{ 
      inBreakoutRoom,
      signal,
      mainRoom,
      connect,
      createMainRoom,
      handleRoomCreate,
      handleRoomRemove,
      handleChangeRoom,
      handleExitRoom
    }}>
      {children}
    </RoomContext.Provider>
  )
}
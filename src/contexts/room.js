// @flow
import { useState, useEffect, createContext } from "react";
import useMessage from "hooks/message";
import useSession from "hooks/session";
import RoomAPI from "api/room";
import CredentialAPI from "api/credential";


export const RoomContext = createContext({});
export default function RoomContextProvider({ children }){
  
  const [mainRoom, setMainRoom] = useState(null);
  const [inBreakoutRoom, setInBreakoutRoom] = useState(null);
  const [inBreakoutRoomId, setInBreakoutRoomId] = useState(null);

  const mSession = useSession();
  const mMessage = useMessage();

  
  useEffect(() => {
    if (inBreakoutRoom) {
      let roomInfo = mMessage.breakoutRooms.find((room) => room.name === inBreakoutRoom)
      setInBreakoutRoomId(roomInfo ? roomInfo.id : null)
    }
    else {
      setInBreakoutRoomId(null)
    }
  }, [inBreakoutRoom])

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

  async function joinMainRoom(user, roomName) {
    const roomInfo = await RoomAPI.getRoomInfo(roomName);
    setMainRoom(roomName);
    mSession.createUser(user);
    mMessage.setBreakoutRooms(roomInfo.breakoutRooms ?? [])
  }

  function handleChangeRoom(publisher, subscriber, roomName) {
    const newRooms = [...mMessage.breakoutRooms];
    const targetRoomIndex = newRooms.findIndex((room) => room.name === roomName);

    mSession.session.unpublish(publisher);
    subscriber.unsubscribe();

    connect(mSession.user, targetRoomIndex!== -1  ? newRooms[targetRoomIndex].id : '');
    
    if (roomName) {
      setInBreakoutRoom(roomName);
    }
    else {
      setInBreakoutRoom(null);
    }

    RoomAPI.sendJoinBreakoutRoom(mSession.mainSession, { "user": mSession.user, "fromRoom": inBreakoutRoom ?? 'Main Room', "toRoom": roomName ?? 'Main Room'})
  }

  function handleExitRoom() {
    const newRooms = [...mMessage.breakoutRooms];
    const targetRoomIndex = newRooms.findIndex((room) => room.name === inBreakoutRoom);

    if (targetRoomIndex !== -1 ) {
      newRooms[targetRoomIndex]["member"].splice(newRooms[targetRoomIndex]["member"].indexOf(mSession.user.name),1);
      setInBreakoutRoom(null);
    }
  }

  async function connect(user, roomId){
    if (!user) return;
    mSession.setIsConnected(false);
    const userJson = user.toJSON();
    const credentialInfo = {
      role: userJson.role === "moderator" ? "moderator" : "publisher",
      data: userJson
    }
    credentialInfo["roomId"] = mainRoom;
    if (roomId) {
      credentialInfo["roomId"] = roomId;
    }

    try{
      const credential = await CredentialAPI.generateCredential(credentialInfo);
      await mSession.connect(credential);
      return Promise.resolve();
    }catch(err){
      throw err;
    }
  }

  return (
    <RoomContext.Provider value={{
      mainRoom,
      inBreakoutRoom,
      inBreakoutRoomId,
      connect,
      setInBreakoutRoom,
      joinMainRoom,
      handleRoomCreate,
      handleRoomRemove,
      handleChangeRoom,
      handleExitRoom
    }}>
      {children}
    </RoomContext.Provider>
  )
}
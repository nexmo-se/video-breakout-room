// @flow
import { useState, useEffect, useRef, createContext } from "react";
import useMessage from "hooks/message";
import useSession from "hooks/session";
import RoomAPI from "api/room";
import CredentialAPI from "api/credential";
import MessageAPI from "api/message";
import config from "config";


export const RoomContext = createContext({});
export default function RoomContextProvider({ children }){
  
  const [mainRoom, setMainRoom] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(mainRoom);
  const [inBreakoutRoom, setInBreakoutRoom] = useState();

  const mSession = useSession();
  const mMessage = useMessage();

  const currentRoomRef = useRef();
  currentRoomRef.current = currentRoom;

  const mSessionRef = useRef();
  mSessionRef.current = mSession;

  useEffect(() => {
      if (inBreakoutRoom) {
        setCurrentRoom(inBreakoutRoom);
      }
      else {
        setCurrentRoom(mainRoom);
      }
  }, [inBreakoutRoom, mainRoom])

  async function handleRoomCreate(breakoutRooms) {
    const generatedRoom = await RoomAPI.generateSession(mainRoom.id, {breakoutRooms});
    return new Promise((resolve, reject) => {
      resolve(generatedRoom);
    })
  }

  async function handleRoomRemove(roomId) {
    if (roomId === mainRoom.id) {
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

  function handleInBreakoutRoomChange(roomName) {
    const room = mMessage.breakoutRooms.find((room) => room.name === roomName);
    if (room) {
      setInBreakoutRoom(room);
    }
    else {
      setInBreakoutRoom(null);
    }
  }

  async function joinMainRoom(user, roomName) {
    const roomInfo = await RoomAPI.getRoomInfo(roomName);
    setMainRoom({
      id: roomInfo.mainRoom.id,
      name: roomInfo.mainRoom.name
    });
    mSession.createUser(user);
    mMessage.setBreakoutRooms(roomInfo.breakoutRooms ?? []);
    mMessage.setParticipants([user]);
    MessageAPI.broadcastMsg(roomName, 'participant-joined', user);
  }

  async function handleChangeRoom(publisher, subscriber, roomName) {
    const newRooms = [...mMessage.breakoutRooms];
    const targetRoomIndex = newRooms.findIndex((room) => room.name === roomName);

    if (config.keepAllConnection) {
      mSession.session.unpublish(publisher);
      subscriber.unsubscribe();
    }
    else {
      mSession.session.unpublish(publisher);
      mSession.session.disconnect();
    }


    await connect(mSession.user, targetRoomIndex!== -1  ? newRooms[targetRoomIndex].id : '');

    MessageAPI.broadcastMsg(mainRoom.id, 'join-breakout-room', { "user": mSession.user, "from": currentRoom.name, "to": roomName ? roomName : mainRoom.name});
    setInBreakoutRoom(targetRoomIndex !== -1 && newRooms[targetRoomIndex].name !== mainRoom.name ? newRooms[targetRoomIndex] : null);
  }

  async function connect(user, roomId){
    if (!user) return;
    const userJson = user.toJSON();
    const credentialInfo = {
      role: userJson.role === "moderator" ? "moderator" : "publisher",
      data: userJson
    }
    credentialInfo["roomId"] = mainRoom.id;
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

  async function handleExitPage() {
    await MessageAPI.broadcastMsg(currentRoomRef.current.id, 'participant-leaved', mSessionRef.current.user);
    if (mSessionRef.current.session) {
      mSessionRef.current.session.disconnect();
    }
  }

  return (
    <RoomContext.Provider value={{
      mainRoom,
      currentRoom,
      inBreakoutRoom,
      connect,
      joinMainRoom,
      handleRoomCreate,
      handleRoomRemove,
      handleChangeRoom,
      handleInBreakoutRoomChange,
      handleExitPage
    }}>
      {children}
    </RoomContext.Provider>
  )
}
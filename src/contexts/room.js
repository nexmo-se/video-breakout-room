// @flow
import { useState, useEffect, useRef, createContext } from "react";
import useMessage from "hooks/message";
import useSession from "hooks/session";
import RoomAPI from "api/room";
import CredentialAPI from "api/credential";
import config from "config";


export const RoomContext = createContext({});
export default function RoomContextProvider({ children }){
  
  const [mainRoom, setMainRoom] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(mainRoom);
  const [inBreakoutRoom, setInBreakoutRoom] = useState();

  const mSession = useSession();
  const mMessage = useMessage();

  const mainRoomRef = useRef();
  mainRoomRef.current = mainRoom;

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

  async function handleRoomCreate(type, breakoutRooms) {
    const generatedRoom = await RoomAPI.generateSession(mainRoom.id, {type, breakoutRooms});
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

    setMainRoom(roomInfo.mainRoom);
    mSession.updateUser(user);
    mMessage.setBreakoutRooms(roomInfo.breakoutRooms ?? []);
    await connect(user, roomInfo.mainRoom.id);
    await RoomAPI.updateParticipant(roomInfo.mainRoom.id, {type: 'participant-joined', participant: user});
    const { participants } = await RoomAPI.getParticipants(roomName);
    mMessage.setParticipants(participants);
  }

  async function refreshInfo() {
    const { participants } = await RoomAPI.getParticipants(mainRoom.id);
    const { breakoutRooms } = await RoomAPI.getBreakoutRooms(mainRoom.id);
    
    mMessage.setParticipants(participants);
    mMessage.setBreakoutRooms(breakoutRooms ?? []);
  }

  async function handleChangeRoom(publisher, subscriber, roomName) {
    const newRooms = [...mMessage.breakoutRooms];
    let targetRoom = newRooms.find((room) => room.name === roomName);

    if (config.keepAllConnection) {
      mSession.session.unpublish(publisher);
      subscriber.unsubscribe();
    }
    else {
      mSession.session.unpublish(publisher);
      mSession.session.disconnect();
    }

    const connectionSuccess = await connect(mSession.user, targetRoom ? targetRoom.id : '');

    if (!connectionSuccess) {
      // Force connect to main room;
      targetRoom = null;
      roomName = '';
      await connect(mSession.user);
    }

    let data = {
      fromRoom: currentRoom.name, 
      toRoom: roomName ? roomName : mainRoom.name, 
      participant: mSession.user.name
    }

    setInBreakoutRoom(targetRoom && targetRoom.name !== mainRoom.name ? targetRoom : null);

    const {participants, breakoutRooms} = await RoomAPI.joinBreakoutRoom(mainRoom.id, "join-breakout-room", data);
    mMessage.setParticipants(participants);
    mMessage.setBreakoutRooms(breakoutRooms);
  }

  async function connect(user, roomId){
    if (!user) return;
    const userJson = user;
    const credentialInfo = {
      role: userJson.role === "moderator" ? "moderator" : "publisher",
      data: userJson
    }
    if (roomId) {
      credentialInfo["roomId"] = roomId;
    }
    else {
      credentialInfo["roomId"] = mainRoom.id;
    }

    try{
      const credential = await CredentialAPI.generateCredential(credentialInfo);
      if (!credential) {
        alert("Fail to generate token: Room Not found"); 
        return Promise.resolve(false)
      }
      await mSession.connect(credential);
      return Promise.resolve(true);
    }catch(err){
      throw err;
    }
  }

  async function handleExitPage() {
    await RoomAPI.updateParticipant(mainRoomRef.current.id, {type: 'participant-leaved', participant: mSessionRef.current.user.name});
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
      handleExitPage,
      refreshInfo
    }}>
      {children}
    </RoomContext.Provider>
  )
}
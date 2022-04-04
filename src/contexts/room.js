// @flow
import { useState, useEffect, createContext } from "react";
import useSession from "hooks/session";
import RoomAPI from "api/room";
import usePublisher from "hooks/publisher";
import useMessage from "hooks/message";
import CredentialAPI from "api/credential";
import { RoomPreferences, VolunteerActivismOutlined } from "@mui/icons-material";


export const RoomContext = createContext({});
export default function RoomContextProvider({ children }){
  const [inBreakoutRoom, setInBreakoutRoom] = useState(null);
  const [newBreakoutRoom, setNewBreakoutRoom] = useState(true);
  const [mainRoom, setMainRoom] = useState();

  const [role, setRole] = useState(false);
  const [credential, setCredential] = useState(false);
  const [signal, setSignal] = useState();

  const mSession = useSession();
  const mPublisher = usePublisher();
  const mMessage = useMessage();


  useEffect(() => {
    if (mMessage.breakoutRooms.length !== 0  && !inBreakoutRoom ) {
      let roomNameFound = mMessage.breakoutRooms.find((room) => room["member"].includes(mSession.user.name));
      if (roomNameFound) {
        setSignal('breakoutRoomChanged');
      }
      else if (newBreakoutRoom && mSession.user.role === "participant") setSignal('breakoutRoomCreated');

    }
    else if (mMessage.breakoutRooms.length === 0) {  
      if (inBreakoutRoom) setSignal('breakoutRoomRemoved');
      setNewBreakoutRoom(true);
    }
    else if (mMessage.breakoutRooms.length !== 0  && inBreakoutRoom) {
      setNewBreakoutRoom(false);
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
      // check if inBreakoutRoom includes user name

    }
    else {
      setSignal(null);
    }
  }, [ mMessage.breakoutRooms ])

  async function handleRoomCreate(breakoutRooms) {
    const generatedRoom = await RoomAPI.generateSession(mainRoom, {breakoutRooms});
    return new Promise((resolve, reject) => {
      resolve(generatedRoom);
    })
  }

  async function handleRoomRemove(roomId) {
    const removedRoom = await RoomAPI.removeSession(roomId);
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

  function handleChangeRoom(publisher, subscriber, user, roomName) {
    setSignal(null);
    mSession.session.unpublish(publisher);
    subscriber.unsubscribe();
    connect(user, role,  roomName ? roomName : '');

    setInBreakoutRoom(null);
    if (mMessage.breakoutRooms.length === 0) { return }

    const newRooms = [...mMessage.breakoutRooms];
    newRooms.map((room) => {
      if (room["member"].includes(user.name)) {
        room["member"].splice(room["member"].indexOf(user.name),1);
      }
    })

    const targetRoomIndex = newRooms.findIndex((room) => room.name === roomName);
    if (targetRoomIndex !== -1 ) {
      newRooms[targetRoomIndex]["member"].push(user.name);
      setInBreakoutRoom(roomName);
    }

    RoomAPI.sendBreakoutRoom(mSession.userSessions[0], newRooms)
  }

  return (
    <RoomContext.Provider value={{ 
      inBreakoutRoom,
      signal,
      connect,
      createMainRoom,
      handleRoomCreate,
      handleRoomRemove,
      handleChangeRoom
    }}>
      {children}
    </RoomContext.Provider>
  )
}
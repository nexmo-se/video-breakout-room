// @flow
import { useState, useEffect, createContext } from "react";
import useSession from "hooks/session";
import RoomAPI from "api/room";
import usePublisher from "hooks/publisher";
import useMessage from "hooks/message";
import CredentialAPI from "api/credential";
import { RoomPreferences } from "@mui/icons-material";


export const RoomContext = createContext({});
export default function RoomContextProvider({ children }){
  const [inBreakoutRoom, setInBreakoutRoom] = useState(null);
  const [newBreakoutRoom, setNewBreakoutRoom] = useState(true);

  const [role, setRole] = useState(false);
  const [credential, setCredential] = useState(false);
  const [signal, setSignal] = useState();


  const mSession = useSession();
  const mPublisher = usePublisher();
  const mMessage = useMessage();


  useEffect(() => {
    if (mMessage.breakoutRooms.length !== 0  && !inBreakoutRoom && newBreakoutRoom) {
      setSignal('breakoutRoomCreated');
      setNewBreakoutRoom(false);
    }
    else if (mMessage.breakoutRooms.length === 0) {  
      if (inBreakoutRoom) setSignal('breakoutRoomRemoved');
      setNewBreakoutRoom(true);
    }
    else if (mMessage.breakoutRooms.length !== 0  && inBreakoutRoom) {
      let roomNameFound = mMessage.breakoutRooms.find((room) => room.name === inBreakoutRoom);
      let roomSessionIdFound = mMessage.breakoutRooms.find((room) => room.sessionId === mSession.session.sessionId);
      if (!roomNameFound && !roomSessionIdFound) {
        setSignal('breakoutRoomRemoved');
      }
      else if (!roomNameFound && roomSessionIdFound) {
        setSignal('breakoutRoomRenamed');
        setInBreakoutRoom(roomSessionIdFound.name)
      }
    }
    else {
      setSignal(null);
    }
  }, [ mMessage.breakoutRooms ])

  async function handleRoomCreation(roomName, maxMember) {
    const generatedRoom = await RoomAPI.generateSession(roomName);
    generatedRoom["maxMember"] = maxMember;
    return new Promise((resolve, reject) => {
      resolve(generatedRoom);
    })
  }

  async function connect(user, role, roomName){
      if (credential) {
        return await mSession.connect(credential);
      }
      if(user) {
        const credentialInfo = {
          role,
          data: user.toJSON()
        }
        if (roomName) credentialInfo["roomName"] = roomName;
        const credential = await CredentialAPI.generateCredential(credentialInfo);
        await mSession.connect(credential);
        setRole(role);
      }
  }

  function handleChangeRoom(publisher, subscriber, user, roomName) {
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
      handleRoomCreation,
      handleChangeRoom
    }}>
      {children}
    </RoomContext.Provider>
  )
}
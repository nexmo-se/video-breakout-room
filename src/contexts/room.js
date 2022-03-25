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
  const [role, setRole] = useState(false);
  const [credential, setCredential] = useState(false);


  const mSession = useSession();
  const mPublisher = usePublisher();
  const mMessage = useMessage();

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

    if (mMessage.breakoutRooms.length === 0) { setInBreakoutRoom(null); return; }

    const newRooms = [...mMessage.breakoutRooms];
    newRooms.map((room) => {
      if (room["member"].includes(user.name)) {
        room["member"].splice(room["member"].indexOf(user.name),1);
      }
    })

    setInBreakoutRoom(null);
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
      connect,
      handleRoomCreation,
      handleChangeRoom
    }}>
      {children}
    </RoomContext.Provider>
  )
}
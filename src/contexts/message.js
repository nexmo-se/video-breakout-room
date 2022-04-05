// @flow
import { useState, useEffect, createContext, useRef } from "react";
import useSession from "hooks/session";

import User from "entities/user";
import Message from "entities/message";

export const MessageContext = createContext({});
export default function MessageProvider({ children }){
  const [ raisedHands, setRaisedHands ] = useState([]);
  const [ messages, setMessages ] = useState([]);
  const [ breakoutRooms, setBreakoutRooms ] = useState([]);
  const [ breakoutRoomsType, setBreakoutRoomsType ] = useState("automatic");

  const [ roomSessionListeners, setSessionListeners ] = useState([]);


  const mSession = useSession();
  const sessionRef = useRef(null);
  const breakoutRoomsRef= useRef(null);
  sessionRef.current = mSession.session;
  breakoutRoomsRef.current = breakoutRooms;

  function removeRaisedHand(user){
    setRaisedHands((prevRaisedHands) => prevRaisedHands.filter((prevRaisedHand) => {
      return prevRaisedHand.id !== user.id
    }))
  }

  useEffect(() => {
    if (!mSession.participants.find((user) => user.role === "moderator")) {
      const newRooms = [...breakoutRooms];
      newRooms.forEach((room) => room["member"] = []);
      setBreakoutRooms(newRooms);
    }
  }, [mSession.participants])

  useEffect(() => {
    if(mSession.session && !roomSessionListeners.find((session) => session.sessionId === mSession.session.sessionId)){    

      mSession.session.on("signal:raise-hand", ({ data }) => {
        setRaisedHands((prevRaisedHands) => {
          const jsonData = JSON.parse(data);
          const user = User.fromJSON(jsonData);
          const isNewUser = prevRaisedHands.filter((raisedHand) => raisedHand.id === user.id).length === 0;
          if(isNewUser) return [ ...prevRaisedHands, user ]
          else return prevRaisedHands;
        })
      });

      mSession.session.on("signal:message", (e) => {
        const jsonData = JSON.parse(e.data)
        const message = Message.fromJSON(jsonData);

        if (!message.toBreakoutRoom && e.target.sessionId !== sessionRef.current.sessionId) return;

        if (message.toBreakoutRoom) {
          const userRoom = breakoutRoomsRef.current.find((room) => room["member"].includes(mSession.user.name));
          if (!userRoom || userRoom.name !== message.toBreakoutRoom) return;
        }

        setMessages((prevMessages) => {
          return [ ...prevMessages, message ]
        })
      })

      mSession.session.on("signal:breakout-room", ({ data }) => {
        const jsonData = JSON.parse(data);          

        setBreakoutRoomsType(jsonData.type ?? "automatic");
        setBreakoutRooms(jsonData.breakoutRooms)
      })
      setSessionListeners([...roomSessionListeners, mSession.session])
    }
  }, [ mSession.session, roomSessionListeners ])

  return (
    <MessageContext.Provider value={{ 
      raisedHands,
      removeRaisedHand,
      messages,
      breakoutRoomsType,
      breakoutRooms,
      setBreakoutRooms
    }}>
      {children}
    </MessageContext.Provider>
  )
}
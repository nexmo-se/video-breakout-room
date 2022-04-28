// @flow
import { useState, useEffect, createContext, useRef } from "react";
import useSession from "hooks/session";
import User from "entities/user";
import Message from "entities/message";

export const MessageContext = createContext({});
export default function MessageProvider({ children }){
  const [ raisedHands, setRaisedHands ] = useState([]);
  const [ messages, setMessages ] = useState([]);
  const [ participants, setParticipants] = useState([]);
  const [ breakoutRooms, setBreakoutRooms ] = useState([]);
  const [ breakoutRoomSignal, setBreakoutRoomSignal ] = useState();
  const [ timer, setTimer ] = useState();
  const [ roomSessionListeners, setSessionListeners ] = useState();
  const mSession = useSession();

  const sessionRef = useRef(null);
  sessionRef.current = mSession.session;

  const breakoutRoomsRef= useRef(null);
  breakoutRoomsRef.current = breakoutRooms;

  function removeRaisedHand(user){
    setRaisedHands((prevRaisedHands) => prevRaisedHands.filter((prevRaisedHand) => {
      return prevRaisedHand.id !== user.id
    }))
  }

  useEffect(() => {
    const me = participants.find((user) => user.name === mSession.user.name)
    if (me && me.isCohost !== mSession.user.isCohost) {
      mSession.updateUser(me);
    }
  }, [participants])

  useEffect(() => {
    if(!mSession.session) return;
    if (roomSessionListeners) {
      roomSessionListeners.off("signal:raise-hand");
      roomSessionListeners.off("signal:message");
      roomSessionListeners.off("signal:breakout-room");
      roomSessionListeners.off("signal:join-breakout-room");
      roomSessionListeners.off("signal:count-down-timer");
      roomSessionListeners.off("signal:update-participant");
    }

    mSession.session.on("signal:raise-hand", ({ data }) => {
      setRaisedHands((prevRaisedHands) => {
        const jsonData = JSON.parse(data);
        const user = User.fromJSON(jsonData);
        user.raisedHandsFromRoom = jsonData.fromRoom.name ?? 'X';
        const isNewUser = prevRaisedHands.filter((raisedHand) => raisedHand.id === user.id 
                                && raisedHand.raisedHandsFromRoom === user.raisedHandsFromRoom).length === 0;
        if(isNewUser) return [ ...prevRaisedHands, user ]
        else return prevRaisedHands;
      })
    });

    mSession.session.on("signal:message", (e) => {
      const jsonData = JSON.parse(e.data)
      const message = Message.fromJSON(jsonData);
      setMessages((prevMessages) => {
        return [ ...prevMessages, message ]
      })
    })

    mSession.session.on("signal:breakout-room", ({ data }) => {
      const jsonData = JSON.parse(data);
      setBreakoutRooms(jsonData.breakoutRooms);
      setBreakoutRoomSignal((prevSignal) => {
        if (!prevSignal || (data !== JSON.stringify(prevSignal))) {
          return jsonData
        }
      });
    });

    mSession.session.on("signal:join-breakout-room", ({ data }) => {
      const jsonData = JSON.parse(data);         
      setBreakoutRooms(jsonData);

    });

    mSession.session.on("signal:count-down-timer", ({ data }) => {
      const jsonData = JSON.parse(data);
      setTimer(jsonData.hasOwnProperty("period") ? jsonData : null);
    });

    mSession.session.on("signal:update-participant", ({ data }) => {
      const jsonData = JSON.parse(data);
      setParticipants(jsonData);
    });

    setSessionListeners(mSession.session)
  }, [ mSession.session ])

  return (
    <MessageContext.Provider value={{ 
      raisedHands,
      messages,
      breakoutRooms,
      breakoutRoomSignal,
      timer,
      participants,
      removeRaisedHand,
      setBreakoutRooms,
      setParticipants
    }}>
      {children}
    </MessageContext.Provider>
  )
}
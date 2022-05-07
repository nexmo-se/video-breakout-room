// @flow
import { useState, useEffect, createContext } from "react";
import useSession from "hooks/session";
import User from "entities/user";
import Message from "entities/message";
import RoomAPI from "api/room";

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

  function removeRaisedHand(user){
    setRaisedHands((prevRaisedHands) => prevRaisedHands.filter((prevRaisedHand) => {
      return prevRaisedHand.id !== user.id
    }))
  }

  async function refreshInfo(mainRoomId) {
    const { participants } = await RoomAPI.getParticipants(mainRoomId);
    const { breakoutRooms } = await RoomAPI.getBreakoutRooms(mainRoomId);
    
    setParticipants(participants);
    setBreakoutRooms(breakoutRooms ?? []);
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
      roomSessionListeners.off("signal:data-refreshed");
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

    mSession.session.on("signal:data-refreshed", ({ data }) => {
      const jsonData = JSON.parse(data);
      refreshInfo(jsonData);
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
      setParticipants,
      refreshInfo
    }}>
      {children}
    </MessageContext.Provider>
  )
}
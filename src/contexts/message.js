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
  const [ cohosts, setCohosts ] = useState([]);
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
    if (!participants) return;
    const newRooms = [...breakoutRooms];
    // If moderator leave main session
    if (!participants.find((user) => user.role === "moderator")) {
      setBreakoutRooms([]);
      setBreakoutRoomSignal({"message": "forceReturn", "breakoutRooms": []});
      setCohosts([]);
      return;
    }
    const memberList = participants.reduce(
      (acc, next) => {acc.push(next["name"]); return acc;},
      []);    
    newRooms.forEach((room) => {
      room["member"] = room["member"].filter((member) => memberList.includes(member));
    });
    setBreakoutRooms(newRooms);

  }, [participants])

  useEffect(() => {
    if (!mSession.streams) return;
    mSession.streams.forEach((stream) => {
      if(!participants.find((user) => user.name === stream.name)) {
        const data = JSON.parse(stream.connection.data);
        const user = User.fromJSON(data);
        setParticipants([...participants, user]);
      }
    })

  }, [mSession.streams])

  useEffect(() => {
    if(!mSession.session) return;
    if (roomSessionListeners) {
      roomSessionListeners.off("signal:raise-hand");
      roomSessionListeners.off("signal:message");
      roomSessionListeners.off("signal:breakout-room");
      roomSessionListeners.off("signal:join-breakout-room");
      roomSessionListeners.off("signal:count-down-timer");
      roomSessionListeners.off("signal:cohost");
      roomSessionListeners.off("signal:participant-joined");
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
      setBreakoutRoomSignal(jsonData);
    });

    mSession.session.on("signal:join-breakout-room", ({ data }) => {
      const jsonData = JSON.parse(data);         
      
      setBreakoutRooms((prevBreakoutRoom) => {
        const newRoom = [...prevBreakoutRoom];
        const prevRoomIndex = newRoom.findIndex((room) => room.name === jsonData.from );
        const targetRoomIndex = newRoom.findIndex((room) => room.name === jsonData.to);

        if (prevRoomIndex !== -1) newRoom[prevRoomIndex]["member"] = [...newRoom[prevRoomIndex]["member"]].filter((member) => member !== jsonData.user.name)

        if (targetRoomIndex !== -1 && !newRoom[targetRoomIndex]["member"].includes(jsonData.user.name)) {
          newRoom[targetRoomIndex]["member"] = [...newRoom[targetRoomIndex]["member"], jsonData.user.name];
        }
        if (targetRoomIndex !== -1 && newRoom[targetRoomIndex]["memberAssigned"].includes(jsonData.user.name)) {
          newRoom[targetRoomIndex]["memberAssigned"] = [...newRoom[targetRoomIndex]["memberAssigned"]].filter((member) => member !== jsonData.user.name)            }
          return newRoom
      })
    });

    mSession.session.on("signal:count-down-timer", ({ data }) => {
      const jsonData = JSON.parse(data);
      setTimer(jsonData.hasOwnProperty("period") ? jsonData : null);
    });

    mSession.session.on("signal:co-host", ({ data }) => {
      const jsonData = JSON.parse(data);
      setCohosts(jsonData);
    });

    mSession.session.on("signal:participant-joined", ({ data }) => {
      const jsonData = JSON.parse(data);
      const user = User.fromJSON(jsonData);
      setParticipants((prevParticipant) => [ ...prevParticipant, user ])
    });

    mSession.session.on("signal:participant-leaved", ({ data }) => {
      const jsonData = JSON.parse(data);
      setParticipants((prevParticipant) => {
        return [ ...prevParticipant].filter((user) => user.name !== jsonData.name)
      })
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
      cohosts,
      participants,
      removeRaisedHand,
      setBreakoutRooms,
      setParticipants,
    }}>
      {children}
    </MessageContext.Provider>
  )
}
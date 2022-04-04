// @flow
import { useState, useEffect, createContext, useRef } from "react";
import { v4 as uuid } from "uuid"
import useSession from "hooks/session";
import useRoom from "hooks/room"

import User from "entities/user";
import Message from "entities/message";
import Room from "entities/room";

export const MessageContext = createContext({});
export default function MessageProvider({ children }){
  const [ forceVideo, setForceVideo ] = useState();
  const [ forceAudio, setForceAudio ] = useState();
  const [ forceUnpublish, setForceUnpublish ] = useState();
  const [ forcePublish, setForcePublish ] = useState();
  const [ forcePublishFailed, setForcePublishFailed ] = useState();
  const [ raisedHands, setRaisedHands ] = useState([]);
  const [ messages, setMessages ] = useState([]);
  const [ breakoutRooms, setBreakoutRooms ] = useState([]);
  const [ breakoutRoomsType, setBreakoutRoomsType ] = useState("automatic");

  const [ breakoutRoomsRequest, setBreakoutRoomsRequest ] = useState(false);
  const [ roomSessionListeners, setSessionListeners ] = useState([]);


  const mSession = useSession();
  const sessionRef = useRef(null);

  function removeRaisedHand(user){
    setRaisedHands((prevRaisedHands) => prevRaisedHands.filter((prevRaisedHand) => {
      return prevRaisedHand.id !== user.id
    }))
  }

  useEffect(() => {
    sessionRef.current = mSession.session;
    if(mSession.session && !roomSessionListeners.find((session) => session.sessionId === mSession.session.sessionId)){    
      mSession.session.on("signal:force-video", ({ data }) => {
        const jsonData = JSON.parse(data)
        const user = User.fromJSON(JSON.parse(data));
        setForceVideo({
          token: uuid(),
          hasVideo: jsonData.hasVideo,
          user
        })
      });

      mSession.session.on("signal:force-audio", ({ data }) => {
        const jsonData = JSON.parse(data)
        const user = User.fromJSON(JSON.parse(data));
        setForceAudio({
          token: uuid(),
          hasAudio: jsonData.hasAudio,
          user
        })
      })

      mSession.session.on("signal:force-unpublish", ({ data }) => {
        const user = User.fromJSON(JSON.parse(data));
        setForceUnpublish({
          token: uuid(),
          user
        })
      });

      mSession.session.on("signal:force-publish", ({ data }) => {
        const user = User.fromJSON(JSON.parse(data));
        setForcePublish({
          token: uuid(),
          user
        })
      });

      mSession.session.on("signal:force-publish-failed", ({ data, from }) => {
        const user = User.fromJSON(JSON.parse(data));
        setForcePublishFailed({ user, from })
      })

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
        if (e.target.sessionId !== sessionRef.current.sessionId) return;
        setMessages((prevMessages) => {
          const jsonData = JSON.parse(e.data)
          const message = Message.fromJSON(jsonData);
          return [ ...prevMessages, message ]
        })
      })

      mSession.session.on("signal:breakout-room", ({ data }) => {
        const jsonData = JSON.parse(data);          

        setBreakoutRoomsType((prevBreakoutRoomsType) => {
          return jsonData.type ?? "automatic"
        })
        setBreakoutRooms((prevBreakoutRooms) => {
          return jsonData.breakoutRooms;
        })
      })
      setSessionListeners([...roomSessionListeners, mSession.session])
    }
  }, [ mSession.session ])

  return (
    <MessageContext.Provider value={{ 
      forceVideo,
      forceAudio,
      forceUnpublish,
      forcePublish,
      forcePublishFailed,
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
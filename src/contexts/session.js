// @flow
import { useState, createContext, useEffect } from "react";
import { v4 as uuid } from "uuid";
import OT from "@opentok/client";
import config from "config";

export const SessionContext = createContext({});
function SessionProvider({ children }){
  const [ user, setUser ] = useState();
  const [ session, setSession ] = useState();
  const [ userSessions, setUserSessions ] = useState([]);
  const [ streams, setStreams ] = useState([]);
  const [ changedStream, setChangedStream ] = useState();
  const [ connections, setConnections ] = useState([]);

  function handleStreamPropertyChanged({ stream, changedProperty, newValue, oldValue }){
    setChangedStream({ stream, changedProperty, newValue, oldValue, token: uuid() });
  }

  function handleConnectionCreated(e){
    setConnections((prevConnections) => [ ...prevConnections, e.connection ]);
  }

  function handleConnectionDestroyed(e){
    setConnections((prevConnections) => [ ...prevConnections].filter((connection) => connection.id !== e.connection.id));
  }

  function handleStreamCreated(e){
    setStreams((prevStreams) => [ ...prevStreams, e.stream ]);
  }

  function handleStreamDestroyed(e){
    setStreams((prevStreams) => [ ...prevStreams].filter((stream) => stream.id !== e.stream.id));
  }

  function updateUser(user) {
    setUser(user)
  }

  async function connect(credential){
    try{
      if (session) {
        session.off("streamPropertyChanged");
        session.off("streamCreated");
        session.off("streamDestroyed");
        session.off("sessionDisconnected");
        session.off("connectionCreated");
        session.off("connectionDestroyed");
      }
      let newSession =  userSessions.find((tSession) => tSession.id === credential.sessionId);
      setStreams([]); // Clear old streams

      if (newSession) {
        newSession.on("streamPropertyChanged", handleStreamPropertyChanged);
        newSession.on("streamCreated", (e) => handleStreamCreated(e));
        newSession.on("streamDestroyed", (e) => handleStreamDestroyed(e));
  
        newSession.on("connectionCreated", (e) => handleConnectionCreated(e));
        newSession.on("connectionDestroyed", (e) => handleConnectionDestroyed(e));
      }
     else {
        newSession = OT.initSession(credential.apiKey, credential.sessionId); 

        newSession.on("streamPropertyChanged", handleStreamPropertyChanged);
        newSession.on("streamCreated", (e) => handleStreamCreated(e));
        newSession.on("streamDestroyed", (e) => handleStreamDestroyed(e));
  
        newSession.on("connectionCreated", (e) => handleConnectionCreated(e));
        newSession.on("connectionDestroyed", (e) => handleConnectionDestroyed(e));
        
        await new Promise((resolve, reject) => {
          newSession.connect(credential.token, (err) => {
            if(err) reject(err);
            else resolve();
          })
        });
        if (config.keepAllConnection) setUserSessions([...userSessions, newSession]);
      }
      setSession(newSession);
    }catch(err){
      console.log(err);
    }
  }

  return (
    <SessionContext.Provider value={{
      user,
      session,
      streams,
      changedStream,
      connections,
      connect,
      updateUser,
    }}>
      {children}
    </SessionContext.Provider>
  )
}
export default SessionProvider
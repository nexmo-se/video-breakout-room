// @flow
import { useState, createContext, useEffect } from "react";
import { v4 as uuid } from "uuid";
import OT, { Session, Stream, Connection } from "@opentok/client";

import Credential from "entities/credential";
import User from "entities/user";


export const SessionContext = createContext<any>({});
function SessionProvider({ children }){
  const [ isConnected, setIsConnected ] = useState<boolean>(false);
  const [ session, setSession ] = useState<Session>();
  const [ changedStream, setChangedStream ] = useState<any>();
  const [ streams, setStreams ] = useState<Array<Stream>>([]);

  const [ connections, setConnections ] = useState<Array<Connection>>([]);
  const [ participants, setParticipants ] = useState([]);
  const [ userSessions, setUserSessions ] = useState([]);

  useEffect(() => {
    const participants = connections.map((connection) => {
      const data = JSON.parse(connection.data);
      const user = User.fromJSON(data);
      user.connection = connection;
      user.id = connection.id;
      return user;
    }).sort((a, b) => {
      if(a.name.toLowerCase() < b.name.toLowerCase()) return -1
      else if(a.name.toLowerCase() > b.name.toLowerCase()) return 1;
      else return 0;
    })

    setParticipants(participants);
  }, [ connections ]);

  function handleStreamPropertyChanged({ stream, changedProperty, newValue, oldValue }){
    setChangedStream({ stream, changedProperty, newValue, oldValue, token: uuid() });
  }

  function handleConnectionCreated({ connection }){
    setConnections((prevConnections) => [ ...prevConnections, connection ]);
  }

  function handleConnectionDestroyed({ connection }){
    setConnections((prevConnections) => {
      return prevConnections.filter((prevConnection) => {
        return prevConnection.id !== connection.id;
      })
    })
  }

  function handleStreamCreated(e){
    
    setStreams((prevStreams) => [ ...prevStreams, e.stream]);
  }

  function handleStreamDestroyed({ stream }){
    setStreams((prevStreams) => {
      return prevStreams.filter((prevStream) => {
        return prevStream.id !== stream.id
      })
    })
  }

  function clearSessions() {
    setStreams([]);
    setIsConnected(false);
  }

  function handleSessionDisconnected(e) {
    e.preventDefault();
    setSession(null);
  }

  async function connect(credential){
    try{
      let session =  userSessions.find((tSession) => tSession.id === credential.sessionId);
      if (!session) {
        session = OT.initSession(credential.apiKey, credential.sessionId); 

        session.on("streamPropertyChanged", handleStreamPropertyChanged);
        session.on("streamCreated", (e) => handleStreamCreated(e));
        session.on("streamDestroyed", handleStreamDestroyed);
        session.on("sessionDisconnected", (e) => handleSessionDisconnected(e));
  
        session.on("connectionCreated", handleConnectionCreated);
        session.on("connectionDestroyed", handleConnectionDestroyed);
        
        await new Promise((resolve, reject) => {
          session.connect(credential.token, (err) => {
            if(err) reject(err);
            else resolve();
          })
        });
      }
      console.log("set session id", session.id);
      setSession(session);
      setUserSessions([...userSessions, session]);
      setIsConnected(true);
    }catch(err){
      console.log(err);
      setIsConnected(false);
    }
  }
  
  return (
    <SessionContext.Provider value={{
      connect,
      session,
      changedStream,
      isConnected,
      streams,
      connections,
      participants,
      clearSessions,
      userSessions
    }}>
      {children}
    </SessionContext.Provider>
  )
}
export default SessionProvider
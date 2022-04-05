// @flow
import { useState, createContext, useEffect } from "react";
import { v4 as uuid } from "uuid";
import OT from "@opentok/client";

import User from "entities/user";


export const SessionContext = createContext({});
function SessionProvider({ children }){
  const [ isConnected, setIsConnected ] = useState(false);
  const [ session, setSession ] = useState();
  const [ changedStream, setChangedStream ] = useState();
  const [ streams, setStreams ] = useState([]);
  const [ prevRoomStreams, setPrevRoomStreams ] = useState([]);

  const [ prevRoomConnections, setPrevRoomConnections ] = useState([]);
  const [ connections, setConnections ] = useState([]);
  const [ participants, setParticipants ] = useState([]);
  const [ userSessions, setUserSessions ] = useState([]);
  const [ user, setUser ] = useState();


  useEffect(() => {
    const participants = connections.map((connection) => {
      const data = JSON.parse(connection.data);
      const user = User.fromJSON(data);
      user.connection = connection;
      user.id = connection.id;
      return user
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

  function handleConnectionCreated(e){
    setPrevRoomConnections((prevConnection)=> {
      const newConnection = {...prevConnection};
      const sessionId = e.target.sessionId;
      if (newConnection[sessionId]) newConnection[sessionId] = [...newConnection[sessionId], e.connection];
      else newConnection[sessionId] = [e.connection];
      return newConnection;
    })
      // setConnections((prevConnections) => [ ...prevConnections, e.connection ]);
  }

  function handleConnectionDestroyed(e){
    setPrevRoomConnections((prevConnection)=> {
      const newConnection = {...prevConnection};
      const sessionId = e.target.sessionId;
      newConnection[sessionId] = newConnection[sessionId].filter((connection) => connection.id !== e.connection.id);
      return newConnection;
    });
  }

  function handleStreamCreated(e){
    setPrevRoomStreams((prevStreams)=> {
      const newStream = {...prevStreams};
      const sessionId = e.target.sessionId;
      if (newStream[sessionId]) newStream[sessionId] = [...newStream[sessionId], e.stream];
      else newStream[sessionId] = [e.stream];
      return newStream;
    })
  }

  function handleStreamDestroyed(e){
    setPrevRoomStreams((prevStreams)=> {
      const newStream = {...prevStreams};
      const sessionId = e.target.sessionId;
      newStream[sessionId] = newStream[sessionId].filter((stream) => stream.id !== e.stream.id);
      return newStream;
    })
  }

  useEffect(() => {
    if (session && isConnected) {
      const sessionId = session.sessionId;
      const targetStreams = {...prevRoomStreams}[sessionId];
      const mainSessionId = userSessions[0].sessionId;
      const targetConnections = {...prevRoomConnections}[mainSessionId];

      if (targetStreams && targetStreams !== streams) {
        setStreams(targetStreams)
      }
      targetConnections ? setConnections(targetConnections) : setConnections([]);
    }
  // eslint-disable-next-line
  }, [prevRoomStreams, prevRoomConnections,  session, isConnected])

  function disconnectSession() {
    setIsConnected(false);
  }

  function handleSessionDisconnected(e) {
    setSession(null);
  }

  function createUser(user) {
    setUser(user)
  }

  async function connect(credential){
    try{
      let session =  userSessions.find((tSession) => tSession.id === credential.sessionId);
      if (!session) {
        session = OT.initSession(credential.apiKey, credential.sessionId); 

        session.on("streamPropertyChanged", handleStreamPropertyChanged);
        session.on("streamCreated", (e) => handleStreamCreated(e));
        session.on("streamDestroyed", (e) => handleStreamDestroyed(e));
        session.on("sessionDisconnected", (e) => handleSessionDisconnected(e));
  
        session.on("connectionCreated", (e) => handleConnectionCreated(e));
        session.on("connectionDestroyed", (e) => handleConnectionDestroyed(e));
        
        await new Promise((resolve, reject) => {
          session.connect(credential.token, (err) => {
            if(err) reject(err);
            else resolve();
          })
        });
        setUserSessions([...userSessions, session]);
      }
      setSession(session);
      setIsConnected(true);
      setStreams([]); // Clear old streams
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
      disconnectSession,
      userSessions,
      user,
      createUser,
    }}>
      {children}
    </SessionContext.Provider>
  )
}
export default SessionProvider
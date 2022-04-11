// @flow
import { useState, createContext, useEffect, useRef } from "react";
import { v4 as uuid } from "uuid";
import OT from "@opentok/client";
import User from "entities/user";

export const SessionContext = createContext({});
function SessionProvider({ children }){
  const [ user, setUser ] = useState();
  const [ isConnected, setIsConnected ] = useState(false);
  const [ session, setSession ] = useState();
  const [ mainSession, setMainSession] = useState();
  const [ userSessions, setUserSessions ] = useState([]);
  const [ streams, setStreams ] = useState([]);
  const [ changedStream, setChangedStream ] = useState();
  const [ allRoomsStreams, setAllRoomsStreams ] = useState([]);
  const [ connections, setConnections ] = useState([]);
  const [ participants, setParticipants ] = useState([]);

  const mainSessionRef = useRef(null);
  mainSessionRef.current = mainSession;

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

  useEffect(() => {
    if (session && isConnected) {
      const sessionId = session.sessionId;
      const targetStreams = {...allRoomsStreams}[sessionId];

      if (targetStreams && targetStreams !== streams) {
        setStreams(targetStreams)
      }
    }
  // eslint-disable-next-line
  }, [allRoomsStreams, session, isConnected])

  function handleStreamPropertyChanged({ stream, changedProperty, newValue, oldValue }){
    setChangedStream({ stream, changedProperty, newValue, oldValue, token: uuid() });
  }

  function handleConnectionCreated(e){
    if (mainSessionRef.current && e.target.sessionId !== mainSessionRef.current.sessionId) return;
    setConnections((prevConnections) => [ ...prevConnections, e.connection ]);
  }

  function handleConnectionDestroyed(e){
    if (e.target.sessionId !== mainSessionRef.current.sessionId) return;
    setConnections((prevConnections) => [ ...prevConnections].filter((connection) => connection.id !== e.connection.id));
  }

  function handleStreamCreated(e){
    setAllRoomsStreams((prevStreams)=> {
      const newStream = {...prevStreams};
      const sessionId = e.target.sessionId;
      if (newStream[sessionId]) newStream[sessionId] = [...newStream[sessionId], e.stream];
      else newStream[sessionId] = [e.stream];
      return newStream;
    })
  }

  function handleStreamDestroyed(e){
    setAllRoomsStreams((prevStreams)=> {
      const newStream = {...prevStreams};
      const sessionId = e.target.sessionId;
      newStream[sessionId] = newStream[sessionId].filter((stream) => stream.id !== e.stream.id);
      return newStream;
    })
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
      setStreams([]); // Clear old streams
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
        if (userSessions.length === 0) {setMainSession(session)}
        setUserSessions([...userSessions, session]);
      }
      setSession(session);
      setIsConnected(true);
    }catch(err){
      console.log(err);
      setIsConnected(false);
    }
  }
  
  return (
    <SessionContext.Provider value={{
      user,
      session,
      mainSession,
      userSessions,
      isConnected,
      streams,
      changedStream,
      allRoomsStreams,
      connections,
      participants,
      connect,
      createUser,
      setIsConnected
    }}>
      {children}
    </SessionContext.Provider>
  )
}
export default SessionProvider
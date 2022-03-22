// @flow
import { useState, createContext, useEffect } from "react";
import { v4 as uuid } from "uuid";
import OT, { Session, Stream, Connection } from "@opentok/client";

import Credential from "entities/credential";
import User from "entities/user";
import { ConstructionOutlined } from "@mui/icons-material";


export const SessionContext = createContext<any>({});
function SessionProvider({ children }){
  const [ isConnected, setIsConnected ] = useState<boolean>(false);
  const [ session, setSession ] = useState<Session>();
  const [ changedStream, setChangedStream ] = useState<any>();
  const [ streams, setStreams ] = useState<Array<Stream>>([]);
  const [ prevRoomStreams, setPrevRoomStreams ] = useState<Array<Stream>>([]);

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
    setPrevRoomStreams((prevStreams)=> {
      const newStream = {...prevStreams};
      const sessionId = e.target.sessionId;
      if (newStream[sessionId]) newStream[sessionId] = [...newStream[sessionId], e.stream];
      else newStream[sessionId] = [e.stream];
      return newStream;
    })
    // setStreams((prevStreams) => [ ...prevStreams, e.stream]);
  }

  function handleStreamDestroyed(e){
    console.log("destoy from session id", e.target.sessionId);

    setPrevRoomStreams((prevStreams)=> {
      const newStream = {...prevStreams};
      const sessionId = e.target.sessionId;
      newStream[sessionId] = newStream[sessionId].filter((stream) => stream.id !== e.stream.id);
      return newStream;
    })


    // setStreams((prevStreams) => {
    //   console.log("prev stream", prevStreams);
    //   return prevStreams.filter((prevStream) => {
    //     return prevStream.id !== e.stream.id
    //   })
    // })
  }

  useEffect(() => {
    if (session) {
      // find based on session ID
      const sessionId = session.sessionId;
      const targetStreams = {...prevRoomStreams}[sessionId];
      console.log("prevroom stream",prevRoomStreams );
      console.log("session id", sessionId);
      console.log("taget stream", targetStreams);
      console.log("previous stream", streams);
      if (targetStreams) {
        console.log("im setting stream");
        setStreams(targetStreams);
      }
    }

  }, [prevRoomStreams, session])

  useEffect(() => {
    console.log("stream change", streams)
  }, [streams])

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
        session.on("streamDestroyed", (e) => handleStreamDestroyed(e));
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
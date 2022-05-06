import AskNameDialog from "components/AskNameDialog"
import config from "config";
import { useState, useEffect, useRef } from "react"
import clsx from "clsx";

import useSession from "hooks/session";
import useSubscriber from "hooks/subscriber";
import usePublisher from "hooks/publisher";
import useRoom from "hooks/room";
import useNotification from "hooks/notification";
import useMessage from "hooks/message";

import FullPageLoading from "components/FullPageLoading";
import LayoutContainer from "components/LayoutContainer";
import VonageLogo from "components/VonageLogo"
import LiveBadge from "components/LiveBadge";
import VideoControl from "components/VideoControl";
import ChatList from "components/ChatList";
import ChatInput from "components/ChatInput";
import BreakoutRoomButton from "components/BreakoutRoomButton";
import ManagePeopleButton from "components/ManagePeopleButton";
import BreakoutRoomControl from "components/BreakoutRoomControl";
import MessageBar from "components/MessageBar";
import ShareScreen from "components/ShareScreen";
import CountDownTimer from "components/CountdownTimer";

import useStyles from "./styles"

export default function ModeratorPage() {
    const [isBreakout, setIsBreakout] = useState(false);
    const [isManagePeople, setIsManagePeople] = useState(false);

    const mSession = useSession();
    const mStyles = useStyles();
    const mRoom = useRoom();
    const mNotification = useNotification();
    const mPublisher = usePublisher("cameraContainer", true, true);
    const mMessage = useMessage();
    const mSubscriber = useSubscriber({ 
      moderator: "cameraContainer", 
      camera: "cameraContainer", 
      screen: "cameraContainer" 
    });

    const subscriberRef = useRef(null);

    useEffect(() => {
      if (!mMessage.breakoutRoomSignal) return;

      let roomNameFound;
      let roomSessionIdFound;
      let roomAssigned = mMessage.breakoutRoomSignal.breakoutRooms.find((room) => room["memberAssigned"].includes(mSession.user.name));
      if (mRoom.inBreakoutRoom) {
        roomNameFound = mMessage.breakoutRoomSignal.breakoutRooms.find((room) => room.name === mRoom.inBreakoutRoom.name);
        roomSessionIdFound = mMessage.breakoutRoomSignal.breakoutRooms.find((room) => room.sessionId === mSession.session.sessionId);
      }
      if (mMessage.breakoutRoomSignal.message === 'allRoomRemoved' && mRoom.inBreakoutRoom) {  
        mNotification.openNotification("Room removed by Host/Co-host", "You will be redirected to main session in 5 seconds.",  () => handleChangeRoom())
      }
      if (mMessage.breakoutRoomSignal.message === 'roomRemoved' && mRoom.inBreakoutRoom && !roomNameFound) {  
          mNotification.openNotification("Room removed by Host/Co-host", "You will be redirected to main session in 5 seconds.",  () => handleChangeRoom())
      }
      if (mMessage.breakoutRoomSignal.message === 'roomEdited' && !roomNameFound && roomSessionIdFound) {
         mNotification.openNotification("Room renamed by Host/Co-host", "New Room Name: " + roomSessionIdFound.name, ()=>{mRoom.handleInBreakoutRoomChange(roomSessionIdFound.name)});
      }
      if (mMessage.breakoutRoomSignal.message === 'participantMoved' && ((roomNameFound && !roomNameFound["member"].includes(mSession.user.name)) || (!roomNameFound && roomAssigned))) {
          mNotification.openNotification("Room assigned by Host/Co-host", `You will be redirected to Room: ${roomAssigned ? roomAssigned.name: mRoom.mainRoom.name} in 5 seconds.`, () => handleChangeRoom(roomAssigned ? roomAssigned.name: ''))
      }
    }, [ mMessage.breakoutRoomSignal ])

    useEffect(() => {
      if(mSession.session && mSession.session.currentState === "connected") {
        mPublisher.publish(mSession.user);
      }
    }, [ mSession.session]);

    useEffect(() => {
      if(mSession.session && mSession.session.currentState === "connected" ) {
        mSubscriber.subscribe(mSession.streams);
      }
    }, [ mSession.streams, mSession.session, mSubscriber  ]);

    useEffect(() => {
      if (mSubscriber.subscribers) subscriberRef.current = mSubscriber;
    }, [mSubscriber.subscribers, mSubscriber] )

    useEffect(() => {
      if (mMessage.breakoutRooms.length !== 0 ) setIsBreakout(true);
    }, [mMessage.breakoutRooms])

    useEffect(() => {
      if (mMessage.timer) {
        mNotification.openNotification(`Room Countdown Timer Triggered`, `Room will be closed in ${mMessage.timer.period} minutes`, () => {})
      }
    }, [mMessage.timer])

    useEffect(() => {
      if (mPublisher.stream && mPublisher.stream.destroyed) {
        mNotification.openNotification("", "Oops, Someone has stopped you publishing a stream.", () => {})
      }
    }, [ mPublisher.stream ])
  
    useEffect(() => {
      if (mSession.forceDisconnected) {
        mNotification.openNotification("", "Oops, Someone has disconnected you from the room.", () => {})
      }
    }, [ mSession.forceDisconnected ])  

    useEffect(() => {
      window.addEventListener('pagehide', () => mRoom.handleExitPage() )
      return () => {
        window.removeEventListener('pagehide', () => mRoom.handleExitPage())
        mRoom.handleExitPage();
      }
    }, [])

    function handleChangeRoom(roomName = '') {
      mRoom.handleChangeRoom(mPublisher.publisher, subscriberRef.current, roomName);
    }

    if(!mSession.user && !mSession.session) {
    return (
        <AskNameDialog 
          pin={config.moderatorPin}
          role="moderator"
          onSubmit={(user, room) => { mRoom.joinMainRoom(user, room);}}
        />
      )
    }
    else if(mSession.user && !mSession.session) return <FullPageLoading />
    else if(mSession.user && mSession.session) return (
      <>
      <div className={mStyles.container}>
        {mSession.session.currentState !== "connected" ? <FullPageLoading/> : null}
        <div className={clsx(mRoom.inBreakoutRoom ? mStyles.containerInRoom : '', mStyles.leftContainer, mStyles.black)}>
        { mRoom.inBreakoutRoom ?
              (
              <div className={mStyles.header}>
                <strong style={{paddingRight: "16px"}}>{mRoom.inBreakoutRoom.name}</strong>
                {!config.keepAllConnection ? <span style={{fontStyle:"italic"}}>(Disconnected from main session)</span> : null}
              </div>
              ) : null
          }
          <div className={mStyles.cameraContainer}>
            <LayoutContainer id="cameraContainer" size="big" />
          </div>
          <div className={mStyles.logoContainer}>
            <LiveBadge/>
          </div>
          <VonageLogo 
            style={{ 
              position: "absolute", 
              bottom: 0, 
              right: 0,
              zIndex: 2 
            }}
          />
        </div>
        <div className={mStyles.rightContainer}>
          <div className={mStyles.videoControl}>
            <h4 className="Vlt-center">My Controls</h4>
            <VideoControl 
              mPublisher={mPublisher} 
            >
            <MessageBar />
            <BreakoutRoomButton
              isBreakout={isBreakout}
              setIsBreakout={setIsBreakout}
            />
            <ManagePeopleButton
              isManagePeople={isManagePeople}
              setIsManagePeople={setIsManagePeople}
            />
            <ShareScreen/>
            </VideoControl>
          </div>
          <div className={mStyles.chatContainer}>
            <ChatList/>
            <ChatInput byPass={true}/>
          </div>
        </div>
        <CountDownTimer
        handleChangeRoom={handleChangeRoom}>  
        </CountDownTimer>
      </div>
        <BreakoutRoomControl
        when={isBreakout}
        setIsBreakout={setIsBreakout}
        handleChangeRoom={handleChangeRoom}
        ></BreakoutRoomControl>
    </>
    )
}
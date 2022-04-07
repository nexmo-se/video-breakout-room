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
import WhiteLayer from "components/WhiteLayer";
import LiveBadge from "components/LiveBadge";
import VideoControl from "components/VideoControl";
import ChatList from "components/ChatList";
import ChatInput from "components/ChatInput";
import BreakoutRoomButton from "components/BreakoutRoomButton";
import ManagePeopleButton from "components/ManagePeopleButton";
import BreakoutRoomControl from "components/BreakoutRoomControl";
import Button from "components/Button";
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
      if (mRoom.signal === 'breakoutRoomRemoved') {  
        mNotification.openNotification("Room removed by Host/Co-host", "Click confirm to Return to main session OR you will be directed to main session automatically after 5 seconds.", () => handleChangeRoom())
      }
      if (mRoom.signal === 'breakoutRoomRenamed') {  
        mNotification.openNotification("Room renamed by Host/Co-host", "Room rename by host, new Room Name: " +  mRoom.inBreakoutRoom, ()=>{});
      }
      if (mRoom.signal === 'breakoutRoomChanged') {
        let roomAssinged = mMessage.breakoutRooms.find((room) => room["member"].includes(mSession.user.name))
          mNotification.openNotification("Room changed by Host/Co-host", `You have been reassigned to Room: ${roomAssinged ? roomAssinged.name : "Main Room"}. Click confirm to join the room OR you will be directed to the room automatically after 5 seconds.`, () => handleChangeRoom(roomAssinged ? roomAssinged.name : ''))
      }
    // eslint-disable-next-line
    }, [ mRoom.signal ])

    useEffect(() => {
    if(mSession.user) mRoom.connect(mSession.user, "moderator");
      // eslint-disable-next-line
    }, [ mSession.user ]);

    useEffect(() => {
      if(mSession.session) mPublisher.publish(mSession.user);
      // eslint-disable-next-line
    }, [ mSession.session ]);

    useEffect(() => {
      if(mSession.session && mSession.isConnected ) {
        mSubscriber.subscribe(mSession.streams);
      }
    }, [ mSession.streams, mSession.session, mSession.isConnected, mSubscriber  ]);

    useEffect(() => {
      if (mSubscriber.subscribers) subscriberRef.current = mSubscriber;
    }, [mSubscriber.subscribers, mSubscriber] )

    function handleChangeRoom(roomName = '') {
      mRoom.handleChangeRoom(mPublisher.publisher, subscriberRef.current, roomName);
    }

    useEffect(() => {
      if (mMessage.breakoutRooms.length !== 0 ) setIsBreakout(true);
    }, [mMessage.breakoutRooms])

    useEffect(() => {
      if (mMessage.timer) {
        mNotification.openNotification(`Room Countdown Timer Triggered`, `Room will be closed in ${mMessage.timer.period} minutes`, () => {})
      }
    }, [mMessage.timer])

    if(!mSession.user && !mSession.session) {
    return (
        <AskNameDialog 
          pin={config.moderatorPin}
          role="moderator"
          onSubmit={(user, room) => { mRoom.createMainRoom(user, room);}}
        />
      )
    }
    else if(mSession.user && !mSession.session) return <FullPageLoading />
    else if(mSession.user && mSession.session) return (
      <>
      <div className={mStyles.container}>
        {!mSession.isConnected ? <FullPageLoading/> : null}
        <div className={clsx(mStyles.leftContainer, mStyles.black)}>
        { mRoom.inBreakoutRoom ?
              (
              <div className={mStyles.header}>
                <strong>{mRoom.inBreakoutRoom}</strong>
                <Button hierarchy="link" text="Return to main room" onClick={() => handleChangeRoom()} style={{position: "absolute", top: 0, right: "16px", minHeight: "32px", margin: 0}}></Button>
              </div>
              ) : null
          }
          <LayoutContainer id="cameraContainer" size="big" />
          <WhiteLayer/>
          <div className={mStyles.logoContainer}>
            <LiveBadge/>
          </div>
          <VonageLogo 
            style={{ 
              position: "absolute", 
              bottom: 32, 
              right: 32,
              zIndex: 2 
            }}
          />
          <MessageBar />
        </div>
        <div className={mStyles.rightContainer}>
          <div className={mStyles.videoControl}>
            <h4 className="Vlt-center">My Controls</h4>
            <VideoControl 
              publisher={mPublisher.publisher} 
            >
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
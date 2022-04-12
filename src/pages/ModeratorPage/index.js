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
    const mPublisher = usePublisher("cameraContainer", true, false);
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
        roomNameFound = mMessage.breakoutRoomSignal.breakoutRooms.find((room) => room.name === mRoom.inBreakoutRoom);
        roomSessionIdFound = mMessage.breakoutRoomSignal.breakoutRooms.find((room) => room.sessionId === mSession.session.sessionId);
      }
      if (mMessage.breakoutRoomSignal.message === 'allRoomRemoved' && mRoom.inBreakoutRoom) {  
        mNotification.openNotification("Room removed by Host/Co-host", "You will be redirected to main session in 5 seconds.",  () => handleChangeRoom())
      }
      if (mMessage.breakoutRoomSignal.message === 'roomRemoved' && mRoom.inBreakoutRoom && !roomNameFound) {  
          mNotification.openNotification("Room removed by Host/Co-host", "You will be redirected to main session in 5 seconds.",  () => handleChangeRoom())
      }
      if (mMessage.breakoutRoomSignal.message === 'roomEdited' && !roomNameFound && roomSessionIdFound) {
         mNotification.openNotification("Room renamed by Host/Co-host", "New Room Name: " + roomSessionIdFound.name, ()=>{mRoom.setInBreakoutRoom(roomSessionIdFound.name)});
      }
      if (mMessage.breakoutRoomSignal.message === 'participantMoved' && ((roomNameFound && !roomNameFound["member"].includes(mSession.user.name)) || (!roomNameFound && roomAssigned))) {
          mNotification.openNotification("Room assigned by Host/Co-host", `You will be redirected to Room: ${roomAssigned ? roomAssigned.name : "Main Room"} in 5 seconds.`, () => handleChangeRoom(roomAssigned ? roomAssigned.name : ''))
      }
    // eslint-disable-next-line
    }, [ mMessage.breakoutRoomSignal ])

    useEffect(() => {
    if(mSession.user) mRoom.connect(mSession.user);
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

    useEffect(() => {
      if (mMessage.breakoutRooms.length !== 0 ) setIsBreakout(true);
    }, [mMessage.breakoutRooms])

    useEffect(() => {
      if (mMessage.timer) {
        mNotification.openNotification(`Room Countdown Timer Triggered`, `Room will be closed in ${mMessage.timer.period} minutes`, () => {})
      }
    }, [mMessage.timer])

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
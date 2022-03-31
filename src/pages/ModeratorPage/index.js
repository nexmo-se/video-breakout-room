import AskNameDialog from "components/AskNameDialog"
import config from "config";
import { useState, useEffect, useRef } from "react"
import CredentialAPI from "api/credential";
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
import BreakoutRoomControl from "components/BreakoutRoomControl";
import Button from "components/Button";

import useStyles from "./styles"

export default function ModeratorPage() {
    const [isBreakout, setIsBreakout] = useState(false);
    const [activeRoom, setActiveRoom] = useState();

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

    const [ videoControlVisible, setVideoControlVisible ] = useState(false);
    const subscriberRef = useRef(null);

    useEffect(() => {
      if (mRoom.signal === 'breakoutRoomRemoved') {  
        mNotification.openNotification("Room removed by Host", "Click confirm to Return to main session OR you will be directed to main session automatically after 5 seconds.", () => handleChangeRoom())
      }
      if (mRoom.signal === 'breakoutRoomRenamed') {  
        mNotification.openNotification("Room renamed by Host", "Room rename by host, new Room Name: " +  mRoom.inBreakoutRoom, ()=>{});
      }
      if (mRoom.signal === 'breakoutRoomChanged') {
        let roomAssinged = mMessage.breakoutRooms.find((room) => room["member"].includes(mSession.user.name))
          mNotification.openNotification("Room changed by Host", `You have been reassigned to Room: ${roomAssinged ? roomAssinged.name : "Main Room"}. Click confirm to join the room OR you will be directed to the room automatically after 5 seconds.`, () => handleChangeRoom(roomAssinged ? roomAssinged.name : ''))
      }
    }, [ mRoom.signal ])

    useEffect(() => {
    if(mSession.user) mRoom.connect(mSession.user, "moderator")
    }, [ mSession.user ]);

    useEffect(() => {
      if(mSession.session) mPublisher.publish(mSession.user);
    }, [ mSession.session ]);

    useEffect(() => {
      if(mSession.session && mSession.isConnected ) {
        mSubscriber.subscribe(mSession.streams);
      }
    }, [ mSession.streams, mSession.session, mSession.isConnected  ]);

    useEffect(() => {
      if (mSubscriber.subscribers) subscriberRef.current = mSubscriber;
    }, [mSubscriber.subscribers] )

    function handleChangeRoom(roomName = '') {
      mRoom.handleChangeRoom(mPublisher.publisher, subscriberRef.current, mSession.user, roomName);
    }

    if(!mSession.user && !mSession.session) {
    return (
        <AskNameDialog 
          pin={config.moderatorPin}
          role="moderator"
          onSubmit={(user) => mSession.createUser(user)}
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
        </div>
        <div className={mStyles.rightContainer}>
          <div className={mStyles.videoControl}>
            <h4 className="Vlt-center">My Controls</h4>
            <VideoControl 
              publisher={mPublisher.publisher} 
              hidden={!videoControlVisible}
            >
            <BreakoutRoomButton
              isBreakout={isBreakout}
              setIsBreakout={setIsBreakout}
            />
            </VideoControl>
          </div>
          <div className={mStyles.chatContainer}>
            <ChatList/>
            <ChatInput byPass={true}/>
          </div>
        </div>
      </div>
        <BreakoutRoomControl
        when={isBreakout}
        setIsBreakout={setIsBreakout}
        handleChangeRoom={handleChangeRoom}
        ></BreakoutRoomControl>
    </>
    )
}
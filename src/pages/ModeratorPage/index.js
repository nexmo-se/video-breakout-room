import AskNameDialog from "components/AskNameDialog"
import config from "config";
import { useState, useEffect } from "react"
import CredentialAPI from "api/credential";
import clsx from "clsx";

import useSession from "hooks/session";
import useSubscriber from "hooks/subscriber";
import usePublisher from "hooks/publisher";
import useRoom from "hooks/room";
import useNotification from "hooks/notification";

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

    const [user, setUser] = useState();
    const mSession = useSession();
    const mStyles = useStyles();
    const mRoom = useRoom();
    const mNotification = useNotification();
    const mPublisher = usePublisher("cameraContainer", true, false);
    const mSubscriber = useSubscriber({ 
      moderator: "cameraContainer", 
      camera: "cameraContainer", 
      screen: "cameraContainer" 
    });

    const [ videoControlVisible, setVideoControlVisible ] = useState(false);


    useEffect(() => {
      if (mRoom.signal === 'breakoutRoomRemoved') {  
        mNotification.openNotification("Room removed by Host", "Click confirm to Return to main session OR you will be directed to main session automatically after 5 seconds.", handleBackMainRoom)
      }
      if (mRoom.signal === 'breakoutRoomRenamed') {  
        mNotification.openNotification("Room renamed by Host", "Room rename by host, new Room Name: " +  mRoom.inBreakoutRoom, ()=>{});
      }
    }, [ mRoom.signal ])

    function handleSubmit(user){
        setUser(user);
        return;
      }

    useEffect(() => {
    if(user) mRoom.connect(user, "moderator")
    }, [ user ]);

    useEffect(() => {
      if(mSession.session) mPublisher.publish(user);
    }, [ mSession.session ]);

    useEffect(() => {
      if(mSession.session) mSubscriber.subscribe(mSession.streams);
    }, [ mSession.streams, mSession.session ]);

    useEffect(() => {
        if (activeRoom || mRoom.inBreakoutRoom) {
          mRoom.handleChangeRoom(mPublisher.publisher, mSubscriber, user, activeRoom ? activeRoom : '');
        }
    }, [activeRoom])

    function handleBackMainRoom() {
      setActiveRoom(null);
    }

    if(!user && !mSession.session) {
    return (
        <AskNameDialog 
          pin={config.moderatorPin}
          role="moderator"
          onSubmit={handleSubmit}
        />
      )
    }
    else if(user && !mSession.session) return <FullPageLoading />
    else if(user && mSession.session) return (
      <>
      <div className={mStyles.container}>
        {!mSession.isConnected ? <FullPageLoading/> : null}
        <div className={clsx(mStyles.leftContainer, mStyles.black)}>
        { mRoom.inBreakoutRoom ?
              (
              <div className={mStyles.header}>
                <strong>{mRoom.inBreakoutRoom}</strong>
                <Button hierarchy="link" text="Return to main room" onClick={handleBackMainRoom} style={{position: "absolute", top: 0, right: "16px", minHeight: "32px", margin: 0}}></Button>
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
            <ChatInput user={user} byPass={true}/>
          </div>
        </div>
      </div>
        <BreakoutRoomControl
        when={isBreakout}
        setIsBreakout={setIsBreakout}
        setActiveRoom={setActiveRoom}
        ></BreakoutRoomControl>
    </>
    )
}
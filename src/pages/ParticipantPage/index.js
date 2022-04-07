// @flow
import { useEffect, useState, useRef } from "react";
import clsx from "clsx";
import config from "config";

import useStyles from "./styles";
import useSession from "hooks/session";
import usePublisher from "hooks/publisher";
import useMessage from "hooks/message";
import useSubscriber from "hooks/subscriber";
import useRoom from "hooks/room";
import useNotification from "hooks/notification"

import LiveBadge from "components/LiveBadge";
import VonageLogo from "components/VonageLogo"
import WhiteLayer from "components/WhiteLayer";
import ChatList from "components/ChatList";
import ChatInput from "components/ChatInput";
import FullPageLoading from "components/FullPageLoading";
import VideoControl from "components/VideoControl";
import AskNameDialog from "components/AskNameDialog";
import LayoutContainer from "components/LayoutContainer";
import PromptChooseRoom from "components/PromptChooseRoom";
import CountDownTimer from "components/CountdownTimer";
import Button from "components/Button";
import MessageBar from "components/MessageBar";
import BreakoutRoomButton from "components/BreakoutRoomButton";
import BreakoutRoomControl from "components/BreakoutRoomControl";
 
export default function ParticipantPage(){
  const [ chooseRoomPrompt, setChooseRoomPrompt ] = useState(false);

  const [ activeRoom, setActiveRoom ] = useState();
  const [isBreakout, setIsBreakout] = useState(false);
  const [isCohost, setIsCohost] = useState(false);

  const mSession = useSession();
  const mRoom = useRoom();
  const mPublisher = usePublisher("cameraContainer", true, true);
  const mStyles = useStyles();
  const mMessage = useMessage();
  const mNotification = useNotification();
  const mSubscriber = useSubscriber({ 
    moderator: "moderatorContainer", 
    camera: "cameraContainer", 
    screen: "cameraContainer" 
  });

  const subscriberRef = useRef(null);

  useEffect(() => {
    setChooseRoomPrompt(false);
    if (mRoom.signal === 'breakoutRoomCreated') {
      let roomAssinged = mMessage.breakoutRooms.find((room) => room["member"].includes(mSession.user.name))
      if (roomAssinged) {
         mNotification.openNotification("Room assigned by Host/Co-host", `You have been assigned to Room: ${roomAssinged.name}. Click confirm to join the room OR you will be directed to the room automatically after 5 seconds.`, () => handleChangeRoom(roomAssinged.name))
      }
      else if (mMessage.breakoutRooms[0]["member"].length === 0) {
        setChooseRoomPrompt(true);
      }
    }
    if (mRoom.signal === 'breakoutRoomRemoved') {  
      mNotification.openNotification("Room removed by Host/Co-host", "Click confirm to Return to main session OR you will be directed to main session automatically after 5 seconds.",  () => handleChangeRoom())
    }
    if (mRoom.signal === 'breakoutRoomRenamed') {  
      mNotification.openNotification("Room renamed by Host/Co-host", "Room rename by host, new Room Name: " + mRoom.inBreakoutRoom, ()=>{});
    }
    if (mRoom.signal === 'breakoutRoomChanged') {
      let roomAssinged = mMessage.breakoutRooms.find((room) => room["member"].includes(mSession.user.name))
        mNotification.openNotification("Room changed by Host/Co-host", `You have been reassigned to Room: ${roomAssinged ? roomAssinged.name : "Main Room"}. Click confirm to join the room OR you will be directed to the room automatically after 5 seconds.`, () => handleChangeRoom(roomAssinged ? roomAssinged.name : ''))
    }
  // eslint-disable-next-line
  }, [ mRoom.signal ])

  useEffect(() => {
    if (mMessage.timer) {
      mNotification.openNotification(`Room Countdown Timer Triggered`, `Room will be closed in ${mMessage.timer.period} minutes`,
     () => {})
    }
  }, [mMessage.timer])

  useEffect(() => {
    if (mSubscriber.subscribers) subscriberRef.current = mSubscriber;
  }, [mSubscriber.subscribers, mSubscriber] )

  function handleConfirm() {
    handleChangeRoom(activeRoom);
    setChooseRoomPrompt(false);
  }

  function handleCancel() {
    setChooseRoomPrompt(false);
    setActiveRoom(null);
  }

  function handleChangeRoom(roomName = '') {
    mRoom.handleChangeRoom(mPublisher.publisher, subscriberRef.current, roomName);
    setActiveRoom(roomName? roomName : null);
  }

  useEffect(() => {
    if(mSession.user) mRoom.connect(mSession.user, "publisher")
    // eslint-disable-next-line
  }, [ mSession.user ]);

  useEffect(() => {
    if(mSession.session) {
      mPublisher.publish(mSession.user);
    }
    // eslint-disable-next-line
  }, [ mSession.session ]);

  useEffect(() => {
    if(mSession.session && mSession.isConnected) {
      mSubscriber.subscribe(mSession.streams);
    }
  }, [ mSession.streams, mSession.session, mSession.isConnected, mSubscriber ]);

  useEffect(() => {
      if (!isCohost && mSession.user && mMessage.cohosts.includes(mSession.user.name)) {
        mNotification.openNotification("New role: Co-host assigned", "You have been assigned to a new Role: Co-host, you are allowed to manage breakout rooms in this meeting ", () => {setIsCohost(true)})
      }
      else if (isCohost && mSession.user && !mMessage.cohosts.includes(mSession.user.name)) {
        mNotification.openNotification("Role: Co-host removed", "Co-host permission removed", () => {setIsCohost(false)})
      }
  }, [mMessage.cohosts, mSession.user])

  useEffect(() => {
    if (mMessage.breakoutRooms.length !== 0 ) setIsBreakout(true);
  }, [mMessage.breakoutRooms])

  if(!mSession.user && !mSession.session){
    return (
      <AskNameDialog 
        pin={config.participantPin}
        role="participant"
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
            {
            mRoom.inBreakoutRoom ?
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
          <CountDownTimer
              handleChangeRoom={handleChangeRoom}>  
          </CountDownTimer>
          <MessageBar />
        </div>
        <div className={mStyles.rightContainer}>
          <div className={mStyles.moderator}>
            <LayoutContainer id="moderatorContainer" size="big" />
          </div>
          <div className={mStyles.videoControl}>
            <h4 className="Vlt-center">My Controls</h4>
            <VideoControl 
              publisher={mPublisher.publisher} 
            >
            { isCohost ?
              <BreakoutRoomButton
              isBreakout={isBreakout}
              setIsBreakout={setIsBreakout}
            />
            : null
            }
            </VideoControl> 
          </div>
          <div className={mStyles.chatContainer}>
            <ChatList/>
            <ChatInput byPass={true}/>
          </div>
        </div>
      </div>
      <PromptChooseRoom
        when={chooseRoomPrompt}
        onOK={handleConfirm}
        onCancel={handleCancel}
        title="Join a breakout room"
        okText="Join"
        CancelText="Cancel"
        activeRoom={activeRoom}
        setActiveRoom={setActiveRoom}
      ></PromptChooseRoom>
      { isCohost ?
      <BreakoutRoomControl
        when={isBreakout}
        setIsBreakout={setIsBreakout}
        handleChangeRoom={handleChangeRoom}
      ></BreakoutRoomControl>
      : null
      }
    </>
  )
}

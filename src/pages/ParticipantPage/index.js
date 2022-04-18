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
import ShareScreen from "components/ShareScreen";

 
export default function ParticipantPage(){
  const [ chooseRoomPrompt, setChooseRoomPrompt ] = useState(false);

  const [ activeRoom, setActiveRoom ] = useState();
  const [isBreakout, setIsBreakout] = useState(false);
  const [isCohost, setIsCohost] = useState(false);

  const mSession = useSession();
  const mRoom = useRoom();
  const mPublisher = usePublisher("cameraContainer", true, false);
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
    if (!mMessage.breakoutRoomSignal) return;

    setChooseRoomPrompt(false);

    let roomNameFound;
    let roomSessionIdFound;
    let roomAssigned = mMessage.breakoutRoomSignal.breakoutRooms.find((room) => room["memberAssigned"].includes(mSession.user.name));
    if (mRoom.inBreakoutRoom) {
      roomNameFound = mMessage.breakoutRoomSignal.breakoutRooms.find((room) => room.name === mRoom.inBreakoutRoom.name);
      roomSessionIdFound = mMessage.breakoutRoomSignal.breakoutRooms.find((room) => room.sessionId === mSession.session.sessionId);
    }
    if (mMessage.breakoutRoomSignal.message === 'roomCreated (chooseroom)' && !mRoom.inBreakoutRoom && !isCohost) {
        setChooseRoomPrompt(true);
    }
    if (mMessage.breakoutRoomSignal.message === 'roomCreated (automatic)'  && !mRoom.inBreakoutRoom && roomAssigned) {
      mNotification.openNotification("Room assigned by Host/Co-host", `You will be redirected to Room: ${roomAssigned.name} in 5 seconds.`, () => handleChangeRoom(roomAssigned ? roomAssigned.name : ''))
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
    if (mMessage.breakoutRoomSignal.message === 'participantMoved' && ((roomNameFound && !roomNameFound["member"].includes(mSession.user.name)) || ((!roomNameFound && roomAssigned)))) {
        mNotification.openNotification("Room assigned by Host/Co-host", `You will be redirected to Room: ${roomAssigned ? roomAssigned.name : "Main Room"} in 5 seconds.`, () => handleChangeRoom(roomAssigned ? roomAssigned.name : ''))
    }
    if (mMessage.breakoutRoomSignal.message === "forceReturn" && mRoom.inBreakoutRoom ) {
        mNotification.openNotification("Moderator left", "You will be redirected to main session in 5 seconds.",  () => handleChangeRoom())
    }
  // eslint-disable-next-line
  }, [ mMessage.breakoutRoomSignal ])


  useEffect(() => {
    if (mMessage.timer) {
      mNotification.openNotification(`Room Countdown Timer Triggered`, `Room will be closed in ${mMessage.timer.period} minutes`,
     () => {})
    }
  }, [mMessage.timer])

  useEffect(() => {
    if (mSubscriber.subscribers) subscriberRef.current = mSubscriber;
  }, [mSubscriber.subscribers, mSubscriber] )

  useEffect(() => {
    if(mSession.user) mRoom.connect(mSession.user)
    // eslint-disable-next-line
  }, [ mSession.user ]);

  useEffect(() => {
    if(mSession.session && mSession.session.currentState === "connected") {
      mPublisher.publish(mSession.user);
    }
    // eslint-disable-next-line
  }, [ mSession.session ]);

  useEffect(() => {
    if(mSession.session && mSession.session.currentState === "connected") {
      mSubscriber.subscribe(mSession.streams);
    }
  }, [ mSession.streams, mSession.session, mSubscriber ]);

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


  useEffect(() => {
    window.addEventListener('unload', () => mRoom.handleExitPage() )
    return () => {
      window.removeEventListener('unload', () => mRoom.handleExitPage())
      mRoom.handleExitPage();
    }
  }, [])

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

  if(!mSession.user && !mSession.session){
    return (
      <AskNameDialog 
        pin={config.participantPin}
        role="participant"
        onSubmit={(user, room) => { mRoom.joinMainRoom(user, room);}}
      />
    )
  }
  else if(mSession.user && !mSession.session) return <FullPageLoading />
  else if(mSession.user && mSession.session) return (
    <>
      <div className={mStyles.container}>
        {mSession.session.currentState !== "connected" ? <FullPageLoading/> : null}
      <div className={clsx(mStyles.leftContainer, mStyles.black)}>
            {
            mRoom.inBreakoutRoom ?
              (
              <div className={mStyles.header}>
                <strong>{mRoom.inBreakoutRoom.name}</strong>
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
            <ShareScreen/>
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

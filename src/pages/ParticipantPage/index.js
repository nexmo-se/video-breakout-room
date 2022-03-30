// @flow
import React, { useEffect } from "react";
import clsx from "clsx";
import config from "config";
import User from "entities/user";

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
import Button from "components/Button";
import RoomAPI from "api/room";
 


export default function ParticipantPage(){
  const [ user, setUser ] = React.useState();
  const [ videoControlVisible, setVideoControlVisible ] = React.useState<boolean>(false);
  const [ chooseRoomPrompt, setChooseRoomPrompt ] = React.useState(false);
  const [ messagePrompt, setMessagePrompt ] = React.useState(false);

  const [ activeRoom, setActiveRoom ] = React.useState();

  const mSession = useSession();
  const mRoom = useRoom();
  const mPublisher = usePublisher("cameraContainer", true, false);
  const mScreenPublisher = usePublisher("cameraContainer");
  const mStyles = useStyles();
  const mMessage = useMessage();
  const mNotification = useNotification();
  const mSubscriber = useSubscriber({ 
    moderator: "moderatorContainer", 
    camera: "cameraContainer", 
    screen: "cameraContainer" 
  });

  function handleSubmit(user){
    setUser(user);
  }

  React.useEffect(() => {
    setChooseRoomPrompt(false);
    if (mRoom.signal === 'breakoutRoomCreated') {
      let roomAssinged = mMessage.breakoutRooms.find((room) => room["member"].includes(user.name))
      if (roomAssinged) {
       return  mNotification.openNotification("Room assigned by Host", `You have been assigned to Room: ${roomAssinged.name}. Click confirm to Return to join the room OR you will be directed to main session automatically after 5 seconds.`, () => handleChangeRoom(roomAssinged.name))
      }
      else if (mMessage.breakoutRooms[0]["member"].length === 0) {
        setChooseRoomPrompt(true);
      }
    }
    else if (mRoom.signal === 'breakoutRoomRemoved') {  
      mNotification.openNotification("Room removed by Host", "Click confirm to Return to main session OR you will be directed to main session automatically after 5 seconds.",  () => handleChangeRoom())
    }
    else if (mRoom.signal === 'breakoutRoomRenamed') {  
      mNotification.openNotification("Room renamed by Host", "Room rename by host, new Room Name: " + mRoom.inBreakoutRoom, ()=>{});
    }
  }, [ mRoom.signal ])

  function handleConfirm() {
    handleChangeRoom(activeRoom);
    setChooseRoomPrompt(false);
  }

  function handleCancel() {
    setChooseRoomPrompt(false);
    setActiveRoom(null);
  }

  function handleChangeRoom(roomName = '') {
    mRoom.handleChangeRoom(mPublisher.publisher, mSubscriber, user, roomName);
    setActiveRoom(roomName? roomName : null);
  }

  React.useEffect(() => {
    if(user) mRoom.connect(user, "publisher")
  }, [ user ]);

  React.useEffect(() => {
    if(mSession.session) {
      mPublisher.publish(user);
    }
  }, [ mSession.session ]);

  React.useEffect(() => {
    if(mSession.session && mSession.isConnected && mSession.streams.length !== 0) {
      mSubscriber.subscribe(mSession.streams);
    }
  }, [ mSession.streams, mSession.session, mSession.isConnected ]);

  if(!user && !mSession.session){
    return (
      <AskNameDialog 
        pin={config.participantPin}
        role="participant"
        onSubmit={handleSubmit}
      />
    )
  }
  else if(user && !mSession.session) return <FullPageLoading />
  else if(user && mSession.session) return (
    <React.Fragment>
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
        </div>
        <div className={mStyles.rightContainer}>
          <div className={mStyles.moderator}>
            <LayoutContainer id="moderatorContainer" size="big" />
          </div>
          <div className={mStyles.videoControl}>
            <h4 className="Vlt-center">My Controls</h4>
            <VideoControl 
              publisher={mPublisher.publisher} 
              hidden={!videoControlVisible}
            >
            </VideoControl>
          </div>
          <div className={mStyles.chatContainer}>
            <ChatList/>
            <ChatInput user={user} byPass={true}/>
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
    </React.Fragment>
  )
}

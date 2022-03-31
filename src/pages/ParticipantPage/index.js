// @flow
import React, { useEffect, useState } from "react";
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
import { SettingsInputAntennaTwoTone } from "@mui/icons-material";
 


export default function ParticipantPage(){
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

  const subscriberRef = React.useRef(null);

  React.useEffect(() => {
    setChooseRoomPrompt(false);
    if (mRoom.signal === 'breakoutRoomCreated') {
      let roomAssinged = mMessage.breakoutRooms.find((room) => room["member"].includes(mSession.user.name))
      if (roomAssinged) {
         mNotification.openNotification("Room assigned by Host", `You have been assigned to Room: ${roomAssinged.name}. Click confirm to join the room OR you will be directed to the room automatically after 5 seconds.`, () => handleChangeRoom(roomAssinged.name))
      }
      else if (mMessage.breakoutRooms[0]["member"].length === 0) {
        setChooseRoomPrompt(true);
      }
    }
    if (mRoom.signal === 'breakoutRoomRemoved') {  
      mNotification.openNotification("Room removed by Host", "Click confirm to Return to main session OR you will be directed to main session automatically after 5 seconds.",  () => handleChangeRoom())
    }
    if (mRoom.signal === 'breakoutRoomRenamed') {  
      mNotification.openNotification("Room renamed by Host", "Room rename by host, new Room Name: " + mRoom.inBreakoutRoom, ()=>{});
    }
    if (mRoom.signal === 'breakoutRoomChanged') {
      let roomAssinged = mMessage.breakoutRooms.find((room) => room["member"].includes(mSession.user.name))
        mNotification.openNotification("Room changed by Host", `You have been reassigned to Room: ${roomAssinged ? roomAssinged.name : "Main Room"}. Click confirm to join the room OR you will be directed to the room automatically after 5 seconds.`, () => handleChangeRoom(roomAssinged ? roomAssinged.name : ''))
    }
  }, [ mRoom.signal ])

  React.useEffect(() => {
    if (mSubscriber.subscribers) subscriberRef.current = mSubscriber;
  }, [mSubscriber.subscribers] )

  function handleConfirm() {
    handleChangeRoom(activeRoom);
    setChooseRoomPrompt(false);
  }

  function handleCancel() {
    setChooseRoomPrompt(false);
    setActiveRoom(null);
  }

  function handleChangeRoom(roomName = '') {
    mRoom.handleChangeRoom(mPublisher.publisher, subscriberRef.current, mSession.user, roomName);
    setActiveRoom(roomName? roomName : null);
  }

  React.useEffect(() => {
    if(mSession.user) mRoom.connect(mSession.user, "publisher")
  }, [ mSession.user ]);

  React.useEffect(() => {
    if(mSession.session) {
      mPublisher.publish(mSession.user);
    }
  }, [ mSession.session ]);

  React.useEffect(() => {
    if(mSession.session && mSession.isConnected) {
      mSubscriber.subscribe(mSession.streams);
    }
  }, [ mSession.streams, mSession.session, mSession.isConnected ]);

  if(!mSession.user && !mSession.session){
    return (
      <AskNameDialog 
        pin={config.participantPin}
        role="participant"
        onSubmit={(user) => mSession.createUser(user)}
      />
    )
  }
  else if(mSession.user && !mSession.session) return <FullPageLoading />
  else if(mSession.user && mSession.session) return (
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
    </React.Fragment>
  )
}

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
import { notification } from 'antd';


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

      // TODO if active room not inside mMessage.breakout room , prompt return to main dialog

      if (mMessage.breakoutRoomsRequest && !activeRoom) {
        // TODO: check if room already assigned, if yes, prompt to ask join room
        setChooseRoomPrompt(true);
      }
      else if (mMessage.breakoutRooms.length === 0  && activeRoom) {  
        openNotification("Room removed by Host", "Click confirm to Return to main session OR you will be directed to main session automatically after 5 seconds.")
      }
      else if (mMessage.breakoutRooms.length !== 0  && activeRoom) {
        // TODO: check if need change room.
        // TODO: change if needed
        if (!mMessage.breakoutRooms.find((room) => room.name === activeRoom)) {
          openNotification("Room removed by Host", "Click confirm to Return to main session OR you will be directed to main session automatically after 5 seconds.")

        }
      }
  }, [ mMessage.breakoutRooms ])

  function handleConfirm() {
    mRoom.handleChangeRoom(mPublisher.publisher, mSubscriber, user, activeRoom);
    setChooseRoomPrompt(false);
  }

  function handleCancel() {
    setChooseRoomPrompt(false);
    setActiveRoom(null);
  }

  function handleBackMainRoom() {
    mRoom.handleChangeRoom(mPublisher.publisher, mSubscriber, user);
    setActiveRoom(null);
  }

  function openNotification(message, description) {
    const key = `open${Date.now()}`;
    const btn = (
      <Button type="secondary" text="Confirm" size="small" onClick={() => {handleBackMainRoom(); notification.close(key);}}>
        Confirm
      </Button>
    );
    notification.open({
      message,
      description,
      btn,
      key,
      duration: 5,
      onClose: handleBackMainRoom,
    });
  };

  React.useEffect(() => {
    if(user) mRoom.connect(user, "publisher")
  }, [ user ]);

  React.useEffect(() => {
    if(mSession.session) {
      mPublisher.publish(user);
    }
  }, [ mSession.session ]);

  React.useEffect(() => {
    if(mSession.session && mSession.isConnected) {
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
            { mRoom.inBreakoutRoom ?
              (
              <div className={mStyles.header}>
                <strong>{activeRoom}</strong>
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

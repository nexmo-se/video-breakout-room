// @flow
import React, { useEffect } from "react";
import clsx from "clsx";
import config from "config";
import CredentialAPI from "api/credential";
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


export default function ParticipantPage(){
  const [ user, setUser ] = React.useState();
  const [ videoControlVisible, setVideoControlVisible ] = React.useState<boolean>(false);
  const [ openPrompt, setOpenPrompt ] = React.useState(false);
  const [ activeRoom, setActiveRoom ] = React.useState();
  const [ inBreakoutRoom, setInBreakoutRoom ] = React.useState(false);

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
      if (mMessage.breakoutRooms.length !== 0 && !activeRoom) {
        setOpenPrompt(true);
      }
  }, [ mMessage.breakoutRooms ])


  async function connect(roomName){
    if(user){
      const credentialInfo = {
        role: "publisher",
        data: user.toJSON()
      }
      if (roomName) credentialInfo["roomName"] = roomName;
      const credential = await CredentialAPI.generateCredential(credentialInfo);
      await mSession.connect(credential);
    }
  }

  function handleConfirm() {
    mSession.session.unpublish(mPublisher.publisher);
    mSubscriber.unsubscribe();
    connect(activeRoom);
    setOpenPrompt(false);
    const newRooms = [...mMessage.breakoutRooms];
    // Find room based on room name
    const targetRoomIndex = newRooms.findIndex((room) => room.name === activeRoom);
    newRooms[targetRoomIndex]["member"].push(user.name);
    setInBreakoutRoom(true);
    mSession.userSessions[0].signal({
      type: "join-room",
      data: JSON.stringify(newRooms)
    }); 
  }

  function handleCancel() {
    setOpenPrompt(false);
    setActiveRoom(null);
  }

  function handleBackMainRoom() {
    mSession.session.unpublish(mPublisher.publisher);
    mSubscriber.unsubscribe();
    connect();
    const newRooms = [...mMessage.breakoutRooms];
    // Find room based on room name
    const targetRoomIndex = newRooms.findIndex((room) => room.name === activeRoom);
    newRooms[targetRoomIndex]["member"].splice(newRooms[targetRoomIndex]["member"].indexOf(user.name),1);
    setInBreakoutRoom(false);
    mSession.userSessions[0].signal({
      type: "join-room",
      data: JSON.stringify(newRooms)
    }); 
  }

  React.useEffect(() => {
    if(user) connect()
  }, [ user ]);

  React.useEffect(() => {
    if(mSession.session) {
      mPublisher.publish(user);
    }
  }, [ mSession.session ]);

  React.useEffect(() => {
    console.log("session", mSession.session)
    console.log("msession stream", mSession.streams)
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
      <div className={clsx(mStyles.leftContainer, mStyles.black)}>
            { inBreakoutRoom ?
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
        when={openPrompt}
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

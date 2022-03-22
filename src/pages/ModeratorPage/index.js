import AskNameDialog from "components/AskNameDialog"
import config from "config";
import { useState, useEffect } from "react"
import CredentialAPI from "api/credential";
import clsx from "clsx";

import useSession from "hooks/session";
import useSubscriber from "hooks/subscriber";
import usePublisher from "hooks/publisher";

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

import useStyles from "./styles"

export default function ModeratorPage() {
    const [isBreakout, setIsBreakout] = useState(false);
    const [user, setUser] = useState();
    const mSession = useSession();
    const mStyles = useStyles();
    const mPublisher = usePublisher("cameraContainer", true, false);
    const mSubscriber = useSubscriber({ 
      moderator: "cameraContainer", 
      camera: "cameraContainer", 
      screen: "cameraContainer" 
    });

    const [ videoControlVisible, setVideoControlVisible ] = useState(false);

    function handleSubmit(user){
        setUser(user);
        return;
      }

    async function connect(roomName){
    if(user){
        const credentialInfo = {
          role: "moderator",
          data: user.toJSON()
        }
        if (roomName) credentialInfo["roomName"] = roomName
        const credential = await CredentialAPI.generateCredential(credentialInfo);
        await mSession.connect(credential);
    }
    }

    useEffect(() => {
    if(user) connect()
    }, [ user ]);

    useEffect(() => {
      if(mSession.session) mPublisher.publish(user);
    }, [ mSession.session ]);

    useEffect(() => {
      if(mSession.session) mSubscriber.subscribe(mSession.streams);
    }, [ mSession.streams, mSession.session ]);


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
        <div className={clsx(mStyles.leftContainer, mStyles.black)}>
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
        ></BreakoutRoomControl>
    </>
    )
}
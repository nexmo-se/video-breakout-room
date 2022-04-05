// @flow
import { useState , useEffect } from "react";

import useStyles from "./styles";
import useSession from "hooks/session";

import HangupButton from "components/HangupButton";
import MuteButton from "components/MuteButton";
import VideoButton from "components/VideoButton";
import useRoom from "hooks/room";

function VideoControl({ publisher, children }){
  const [ hasAudio, setHasAudio ] = useState(true);
  const [ hasVideo, setHasVideo ] = useState(true);
  const mSession = useSession();
  const mStyles = useStyles();
  const mRoom = useRoom();

  function handleVideoClick(){
    setHasVideo((prevVideo) => !prevVideo);
  }

  function handleAudioClick(){
    setHasAudio((prevAudio) => !prevAudio);
  }

  function handleHangupClick(){
    mRoom.handleExitRoom();
    mSession.session.disconnect();
    window.location.replace("/thank-you");
  }

  useEffect(() => {
    const { changedStream } = mSession;
    if(changedStream){
      const { connection:otherConnection } = changedStream.stream;
      const { connection:myConnection } = mSession.session;
      if(otherConnection.id === myConnection.id && publisher?.stream.id === changedStream.stream.id){
        switch(changedStream.changedProperty){
          case "hasAudio": return setHasAudio(changedStream.newValue);
          case "hasVideo": return setHasVideo(changedStream.newValue);
          default: return;
        }
      }
    }
  // eslint-disable-next-line 
  }, [ mSession.changedStream ]);

  useEffect(() => {
    if(publisher) publisher.publishAudio(hasAudio);
  }, [ hasAudio, publisher ])

  useEffect(() => {
    if(publisher) publisher.publishVideo(hasVideo);
  }, [ hasVideo, publisher ]);

  if(!publisher) return null;
  return(
    <div id="video-control" className={mStyles.root}>
      {children}
      <VideoButton 
        hasVideo={hasVideo} 
        onClick={handleVideoClick}
        style={{ marginLeft: 8 }}
      />
      <MuteButton 
        hasAudio={hasAudio} 
        onClick={handleAudioClick}
        style={{ marginLeft: 8 }}
      />
      <HangupButton 
        onClick={handleHangupClick}
        style={{ marginLeft: 8, marginRight: 8 }}
        />
    </div>
  )
}

VideoControl.defaultProps = { sizeMultiplier: 1 }
export default VideoControl;
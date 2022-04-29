// @flow
import { useState , useEffect } from 'react';
import { useNavigate } from "react-router-dom";

import HangupButton from 'components/HangupButton';
import MuteButton from 'components/MuteButton';
import VideoButton from 'components/VideoButton';

import useStyles from './styles';
import useSession from 'hooks/session';

function VideoControl({ publisher, publisherStream, children }){
  const [ hasAudio, setHasAudio ] = useState(true);
  const [ hasVideo, setHasVideo ] = useState(true);
  const mSession = useSession();
  const mStyles = useStyles();
  const navigate = useNavigate();

  function handleVideoClick(){
    setHasVideo((prevVideo) => !prevVideo);
  }

  function handleAudioClick(){
    setHasAudio((prevAudio) => !prevAudio);
  }

  function handleHangupClick(){
    navigate("/thank-you");
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
  }, [ mSession.changedStream ]);

  useEffect(() => {
    if(publisher) {
      publisher.publishAudio(hasAudio);
      const targetDom = document.getElementById(hasAudio ? `${publisher.id}-mute` : publisher.id);

      if (!targetDom) return;
      if (hasAudio) {
        targetDom.remove();
      }
      else{
        const childNodeStr = `<div
        id=${publisher.id}-mute
        style="
        position: absolute; 
        bottom: 8px; 
        left: 8px;
        background: url(${process.env.PUBLIC_URL}/assets/mute.png);
        background-position: center;
        background-size: contain;
        height: 22px;
        width: 22px;
        background-repeat: no-repeat;">
        </div>`;
        targetDom.insertAdjacentHTML('beforeend', childNodeStr);
      }
    }
  }, [ hasAudio, publisher ])

  useEffect(() => {
    if(publisher) publisher.publishVideo(hasVideo);
  }, [ hasVideo, publisher ]);

  useEffect(() => {
    if (!publisherStream) return;
    if (publisherStream.hasAudio && !hasAudio) {
      setHasAudio(true);
    }
  }, [publisherStream])
  
  useEffect(() => {
    if (publisher && publisher.stream && publisher.stream.destroyed) {
      setHasAudio(false);
      setHasVideo(false);
    }
  }, [publisher])

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
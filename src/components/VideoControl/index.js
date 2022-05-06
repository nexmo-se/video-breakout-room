// @flow
import { useEffect } from 'react';
import { useNavigate } from "react-router-dom";

import HangupButton from 'components/HangupButton';
import MuteButton from 'components/MuteButton';
import VideoButton from 'components/VideoButton';

import useStyles from './styles';
import useRoom from 'hooks/room';

function VideoControl({ mPublisher, children }){
  const { hasAudio, hasVideo, setHasAudio, setHasVideo, publisher} = mPublisher;
  const mRoom = useRoom();
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
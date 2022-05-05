// @flow
import { useState, useEffect } from 'react';
import User from 'entities/user';

import ShareScreenButton from 'components/ShareScreenButton';
import useSession from 'hooks/session';
import usePublisher from 'hooks/publisher';
import useRoom from 'hooks/room';

function ShareScreen(){
  const [ sharing, setSharing ] = useState(false);
  const { publisher: screenPublisher, publish, unpublish } = usePublisher("cameraContainer", true, false);
  const { session } = useSession();
  const { inBreakoutRoom } = useRoom();

  async function handleShareScreenClick(){
    if(session && !sharing){
      const screenUser = new User("sharescreen", "sharescreen");
      await publish( 
        screenUser,
        { videoSource: "screen", width: "100%", height: "100%"  }
      );
      setSharing(true);
    }else if(session && sharing){
        await unpublish();
        setSharing(false);
    }
  }

  useEffect(() => {
    if (!screenPublisher) setSharing(false);
    else {setSharing(true);}
  }, [screenPublisher, sharing])

  useEffect(() => {
     if (screenPublisher) {
       unpublish();
     }
  }, [inBreakoutRoom])

  return (
    <ShareScreenButton 
      style={{ marginLeft: 8 }}
      onClick={handleShareScreenClick}
      isSharing={sharing}
    />
  )
}
export default ShareScreen;
import { useState } from "react";

import useMessage from "hooks/message";
import useSession from "hooks/session";
import useRoom from "hooks/room";

import RaiseHandButton from "components/RaiseHandButton";

import Alert from '@mui/material/Alert';
import useStyles from "./styles";

export default function MessageBar(props) {
  const mStyle = useStyles();
  const mMessage = useMessage();
  const mSession = useSession();
  const mRoom = useRoom();
  
  // sometimes seeing both mRoom.inBreakoutRoom and mRoom.mainRoom are undefined..
  const currentRoom = mRoom.inBreakoutRoom ?? mRoom.mainRoom;
  // console.log("xxx", mSession.user, mRoom.inBreakoutRoom, mRoom.mainRoom, currentRoom)
  // console.log("xxx", mMessage.raisedHands)

  if (!mSession.user || !currentRoom) {
    return null;
  } 
  else if ( "moderator" === mSession.user.role 
            && mMessage.raisedHands 
            && mMessage.raisedHands.length > 0 
  ) {
    var raisedHands = mMessage.raisedHands.slice().reverse();
    return (<div className={mStyle.container}>
      {
        
        raisedHands.map((user, idx) => {
          return (<SnackbarWrapper key={`SnackbarWrapper-${idx}`} user={user} />)
        })
      }
      </div>)
  } 
  else if ( "participant" === mSession.user.role ) {
    return (<div className={mStyle.container}>
      <RaiseHandButton 
        user={mSession.user}
        room={currentRoom}
      /> 
    </div>)
  } else {
    return null
  }
}

function SnackbarWrapper(props) {
  const [open, setOpen] = useState(true);
  const mMessage = useMessage();
  
  const handleClose = (e, user) => {
    e.preventDefault();
    mMessage.removeRaisedHand(user)
    setOpen(false)
  }
  return (<>
    <div 
      open={open} 
      key={`Snackbar-${props.user.id}`}
    >
      <Alert 
          onClose={e => handleClose(e, props.user)} 
          severity="info" 
          sx={{ width: '100%' }}>
        <p> {`${props.user.name} in Room ${props.user.raisedHandsFromRoom} requested for help`}</p>
      </Alert>
    </div>
  </>)
}

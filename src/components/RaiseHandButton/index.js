import React from 'react';
import Message from 'entities/message';
import User from 'entities/user';

import useSession from 'hooks/session';
import MessageAPI from 'api/message';

import RaiseHandIcon from '@material-ui/icons/PanTool';
import ControlButton from 'components/ControlButton';

function RaiseHandButton(props) {
  const mSession = useSession();

  function handleClick() {
    const { connection } = mSession.session;
    const data = JSON.parse(connection.data);
    const user = User.fromJSON(data);
    user.id = connection.id;


    MessageAPI.broadcastMsg(props.room, 'raise-hand', user);

    const message = new Message(
        props.room, null, 
        user, `${user.name} is raising hand`);
    MessageAPI.sendMessage(mSession.session, message);
  }

  return (
    <ControlButton 
    {...props}
    onClick = {handleClick}
    active={true}
    tooltip="Request Help"
  >
    <RaiseHandIcon fontSize="inherit"/>
  </ControlButton>
  )
  }



RaiseHandButton.defaultProps = { size: 50, fontSize: 24 }
export default RaiseHandButton;
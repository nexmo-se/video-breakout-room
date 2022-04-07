import React from "react";

import Message from "entities/message";
import User from "entities/user";

import useSession from "hooks/session";
import MessageAPI from "api/message";
import useMessage from "hooks/message";

function RaiseHandButton(props) {
  const mSession = useSession();
  const mMessage = useMessage();

  function handleClick() {
    const { connection } = mSession.session;
    const data = JSON.parse(connection.data);
    const user = User.fromJSON(data);
    user.id = connection.id;

    let roomInfo = mMessage.breakoutRooms.find((room) => room.name === props.room)

    MessageAPI.broadcastMsg(roomInfo ? roomInfo.id : props.room, 'raise-hand', user);

    const message = new Message(
        props.room, null, 
        user, `${user.name} is raising hand`);
    MessageAPI.sendMessage(mSession.session, message);
  }

  return (
    <button 
      className="Vlt-btn Vlt-bg-aqua Vlt-white" 
      onClick={handleClick}
    >
      Raise Hand
    </button>
  )
}

RaiseHandButton.defaultProps = { size: 50, fontSize: 24 }
export default RaiseHandButton;
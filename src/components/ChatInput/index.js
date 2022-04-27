// @flow
import { useState } from 'react';
import MessageAPI from 'api/message';
import useSession from 'hooks/session';
import useRoom from 'hooks/room';

import Message from 'entities/message';

import TextInput from 'components/TextInput';
import Button from 'components/Button';
import useMessage from 'hooks/message';


function ChatInput({ byPass, toBreakoutRoom, resetSelectedRoom }){
  const [ text, setText ] = useState("");
  const mSession = useSession();
  const mRoom = useRoom();
  const mMessage = useMessage();

  function handleClick(e){
    if(e) e.preventDefault();
    const isApproved = (byPass)? true: false;
    const fromRoomName = mRoom.currentRoom.name;
    const message = new Message(fromRoomName, toBreakoutRoom ?? null, mSession.user, text, isApproved);
    
    if (toBreakoutRoom) {
      let toBreakoutRoomInfo = mMessage.breakoutRooms.find((room) => room.name === toBreakoutRoom)

      MessageAPI.broadcastMsg(mRoom.currentRoom.id, 'message', message, toBreakoutRoom === 'all' ? null : toBreakoutRoomInfo.id)
    }
    else {
      MessageAPI.sendMessage(mSession.session, message);
    }
    setText("");
    if( resetSelectedRoom) resetSelectedRoom();
  }

  return (
    <form style={{ display: "flex", flexDirection: "row" }} onSubmit={handleClick}>
      <TextInput text={text} onChange={setText} style={{ marginRight: 8, flexGrow: 1 }}/>
      <Button type="submit" text="Send" onClick={handleClick} style={{ flexShrink: 1 }}/>
    </form>
  )
}
export default ChatInput;
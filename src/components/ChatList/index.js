// @flow
import { useRef, useEffect } from 'react';
import useMessage from 'hooks/message';

import ChatBubble from 'components/ChatBubble';

function ChatList(){
  const mMessage = useMessage();
  const list = useRef<any>(null);

  const styles = {
    container: {
      display: "flex", flexDirection: "column", overflowY: "scroll",
      width: "100%", flex: 1, paddingTop: 16, paddingBottom: 16
    }
  }

  useEffect(() => {
    list.current.scrollTop = list.current.scrollHeight;
  }, [ mMessage.messages ])

  function getBackgroundColor(stringInput) {
    let stringUniqueHash = [...stringInput].reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    let colorIndex1 =  Math.abs((stringUniqueHash ) % 255);
    return `rgb(${colorIndex1}, 50, 100, 0.6)`;
}

  return(
    <div ref={list} style={styles.container}>
      {mMessage.messages.map((message, i) => {
        const color = getBackgroundColor(message.fromRoomName);
        if(message.isApproved){
          return <ChatBubble color={color} key={`chatbubble-${i}`} roomName = {message.fromRoomName} name={message.sender.name} message={message.text} />
        }else return null;
      })}
    </div>
  )
}

export default ChatList;
// @flow
import { useRef, useEffect } from "react"
import useMessage from "hooks/message";

import ChatBubble from "components/ChatBubble";

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

  return(
    <div ref={list} style={styles.container}>
      {mMessage.messages.map((message) => {
        if(message.isApproved){
          return <ChatBubble name={message.sender.name} message={message.text} />
        }else return null;
      })}
    </div>
  )
}

export default ChatList;
import React from "react";

import Avatar from 'react-avatar';

function ChatBubble(props){
  const { roomName, name, message, color } = props;
  return (
    <div className="Vlt-card Vlt-card--lesspadding" style={{ marginTop: 8, marginBottom: 4, backgroundColor: color }}>
      <div className="Vlt-card__content" style={{ display: "flex", flexDirection: "row" }}>
        <Avatar src={`https://ui-avatars.com/api/?name=${name}`} round={true} size={50} style={{ marginRight: 16 }}/>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 200  }}>
          <p style={{marginBottom: 0}}>{roomName}</p>
          <p><b>{name}</b></p>
          <p style={{ wordBreak: "break-word", whiteSpace: "normal" }}>{message}</p>
        </div>
      </div>
    </div>
  );
}
export default ChatBubble;
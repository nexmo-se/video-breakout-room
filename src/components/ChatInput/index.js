// @flow
import React from "react";
import MessageAPI from "api/message";
import useSession from "hooks/session";

import Message from "entities/message";

import TextInput from "components/TextInput";
import Button from "components/Button";

function ChatInput({ byPass }){
  const [ text, setText ] = React.useState("");
  const mSession = useSession();

  function handleClick(e){
    if(e) e.preventDefault();
    const isApproved = (byPass)? true: false;
    const message = new Message(mSession.user, text, isApproved);
    MessageAPI.sendMessage(mSession.session, message);
    setText("");
  }

  return (
    <form style={{ display: "flex", flexDirection: "row" }} onSubmit={handleClick}>
      <TextInput text={text} onChange={setText} style={{ marginRight: 8, flexGrow: 1 }}/>
      <Button type="submit" text="Send" onClick={handleClick} style={{ flexShrink: 1 }}/>
    </form>
  )
}
export default ChatInput;
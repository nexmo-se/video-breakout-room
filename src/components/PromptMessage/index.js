import React, { useCallback, useEffect, useState } from "react";
import { Modal, Form, InputNumber, Radio } from "antd";
import useRoom from "hooks/room";
import useSession from "hooks/session";
import useMessage from "hooks/message";
import useStyles from "./styles"
const { Panel } = Collapse;



export default function PromptMessage(props) {
  const mroom = useRoom();
  const mSession = useSession();
  const mMessage = useMessage();
  const mStyles = useStyles();

  const { when, onOK, onCancel, title, okText, cancelText} = props;
//   const [roomGroup, setRoomGroup] = useState({})

//     useEffect(() => {
//         let newRoomGroup = {...roomGroup};
//         let participantAssigned = [];
//         mMessage.breakoutRooms.forEach((room) => {
//             newRoomGroup[room.name] = room.member;
//             participantAssigned.concat(room.member);
//         })
//         setRoomGroup(newRoomGroup);
//     }, [mMessage.breakoutRooms])


    return (
    <Modal
      title={title}
      visible={when}
      onOk={onOK}
      okText={okText}
      onCancel={onCancel}
      cancelText={cancelText}
      closable={true}
    >
    </Modal>
  ) 
}
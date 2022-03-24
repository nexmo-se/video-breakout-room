import React, { useCallback, useEffect, useState } from "react";
import { Modal, Form, InputNumber, Radio } from "antd";
import useRoom from "hooks/room";
import useSession from "hooks/session";
import useMessage from "hooks/message";
import Person from "@material-ui/icons/Person"
import useStyles from "./styles"
import { Collapse } from 'antd';
const { Panel } = Collapse;



export default function PromptChooseRooms(props) {
  const mroom = useRoom();
  const mSession = useSession();
  const mMessage = useMessage();
  const mStyles = useStyles();

  const { when, onOK, onCancel, title, okText, cancelText, activeRoom, setActiveRoom } = props;
  const [ numberParticipants, setNumberOfParticipants] = useState(mSession.participants.length);
  const [roomGroup, setRoomGroup] = useState({})
  const [ buttonDisabled, setButtonDisabled] = useState(true);

    useEffect(() => {
        let newRoomGroup = {...roomGroup};
        let participantAssigned = [];
        mMessage.breakoutRooms.forEach((room) => {
            newRoomGroup[room.name] = room.member;
            participantAssigned.concat(room.member);
        })
        setRoomGroup(newRoomGroup);
    }, [mMessage.breakoutRooms])


    useEffect(() => {
      if(activeRoom) {
        setButtonDisabled(false)
      }

    }, [activeRoom])

    function handleRoomChange(e) {
      e.stopPropagation();      
     setActiveRoom(e.target.value);
    }

    function handleJoinRoom() {
      onOK();
    }

    return (
    <Modal
      title={title}
      visible={when}
      onOk={handleJoinRoom}
      okText={okText}
      onCancel={onCancel}
      cancelText={cancelText}
      closable={true}
      okButtonProps={{ disabled: buttonDisabled }}
    >
      <Collapse defaultActiveKey={['1']} accordion ghost>
        {roomGroup && Object.entries(roomGroup).map(([key,value],i) => {
          const genExtra = () => (
            <Radio value={key} key={'radio-' + i} checked={activeRoom === key} onClick={handleRoomChange}></Radio>
          ); 
          return(
            <Panel header={key + ' (' + value.length + ')'} key={"chooseroom-" +i} extra={genExtra()}>
            {
                value.map((participant, i) => (
                    <h6 key={"participant-" + i}><Person></Person>{participant}</h6>
                ))
                }
            </Panel>
        )})
        }
    </Collapse>
    </Modal>
  ) 
}
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
  const [ roomOccupied, setRoomOccupied ] = useState([]);

    useEffect(() => {
      console.log("room group", mMessage.breakoutRooms);
        let newRoomGroup = {};
        mMessage.breakoutRooms.forEach((room) => {
          newRoomGroup[room.name] = room.member;
          setRoomGroup(newRoomGroup);
          if (room.member.length >= room.maxMember) {
            console.log("im here1");
            setRoomOccupied((prev) => {
              return [...new Set([...prev, room.name])]
            })
          }
         if (roomOccupied.includes(room.name)){
          console.log("im here2");

            setRoomOccupied((prev) => {
              let newRoomOccupied = [...prev];
              newRoomOccupied.splice(newRoomOccupied.indexOf(room.name), 1);
              return newRoomOccupied;
            })
          }
        })
    }, [mMessage.breakoutRooms])



    useEffect(() => {
      console.log("room occupied", roomOccupied)
    }, [roomOccupied])
    useEffect(() => {
      if(activeRoom) {
        setButtonDisabled(false)
      }

    }, [activeRoom])

    function handleRoomChange(e) {
      e.stopPropagation();      
     setActiveRoom(e.target.value);
    }

    return (
    <Modal
      title={title}
      visible={when}
      onOk={onOK}
      okText={okText}
      onCancel={onCancel}
      cancelText={cancelText}
      closable={true}
      okButtonProps={{ disabled: buttonDisabled }}
    >
      <Collapse defaultActiveKey={['1']} accordion ghost>
        {roomGroup && Object.entries(roomGroup).map(([key,value],i) => {
          const genExtra = () => (
            <>
            {
              roomOccupied.includes(key) ?
              <span>FULL</span>
            : <Radio value={key} key={'radio-' + i} checked={activeRoom === key} disabled={roomOccupied.includes(key) ? true : false} onClick={handleRoomChange}></Radio>
            }
            </>
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
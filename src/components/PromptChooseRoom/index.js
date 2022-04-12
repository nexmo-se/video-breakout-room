import React, { useEffect, useState } from 'react';
import { Collapse, Modal, Radio } from 'antd';
import Person from '@material-ui/icons/Person';
import useMessage from 'hooks/message';
const { Panel } = Collapse;



export default function PromptChooseRooms(props) {
  const mMessage = useMessage();

  const { when, onOK, onCancel, title, okText, cancelText, activeRoom, setActiveRoom } = props;
  const [roomGroup, setRoomGroup] = useState({})
  const [ buttonDisabled, setButtonDisabled] = useState(true);
  const [ roomOccupied, setRoomOccupied ] = useState([]);

    useEffect(() => {
        let newRoomGroup = {};
        mMessage.breakoutRooms.forEach((room) => {
          newRoomGroup[room.name] = room.member;
          setRoomGroup(newRoomGroup);
          if (room.member.length >= room.maxParticipants) {
            setRoomOccupied((prev) => {
              return [...new Set([...prev, room.name])]
            })
          }
         else if (roomOccupied.includes(room.name)){
            setRoomOccupied((prev) => {
              let newRoomOccupied = [...prev];
              newRoomOccupied.splice(newRoomOccupied.indexOf(room.name), 1);
              return newRoomOccupied;
            })
          }
        })
      // eslint-disable-next-line
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
                    <h6 key={"participant-" + i}><Person style={{marginRight: "12px", marginLeft:"24px", verticalAlign:"bottom", fontSize: "18px"
                  }}></Person>{participant}</h6>
                ))
            }
            </Panel>
        )})
        }
    </Collapse>
    </Modal>
  ) 
}
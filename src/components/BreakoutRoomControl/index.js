import { useEffect, useState, useRef } from "react";
import useStyles from "./styles";
import useRoom from "hooks/room"
import useSession from "hooks/session"
import useMessage from "hooks/message"
import clsx from "clsx";
import Person from "@material-ui/icons/Person"
import Delete from "@material-ui/icons/Delete"
import Edit from "@material-ui/icons/Edit"
import SwapVert from "@material-ui/icons/SwapVert"


import { Collapse, Popconfirm, Popover, Input, InputNumber, Form, Select } from 'antd';
import Button from 'components/Button'
import RoomAPI from "api/room";
const { Option } = Select
const { Panel } = Collapse;

export default function BreakoutRoomControl(props) {
    const { when, setIsBreakout, handleChangeRoom } = props
    const mStyles = useStyles();
    const mSession = useSession();
    const mMessage = useMessage();
    const mRoom = useRoom();
    const inputRoomName = useRef(null);
    const inputMaxParticipant = useRef(null);

    const [roomGroup, setRoomGroup] = useState({})
    const [ showAddNewRoom, setShowAddNewRoom ] = useState(false);
    const [ selectedRoom, setSelectedRoom ] = useState();
    const [ selectedParticipant, setSelectedParticipant ] = useState();
    const [ selectedParticipantRoom, setSelectedParticipantRoom ] = useState();


    const [form] = Form.useForm();

    useEffect(() => {
        if (mMessage.breakoutRooms.length === 0) return setIsBreakout(false);

        let newRoomGroup = {
            "Main Room": []
        };
        let participantAssigned = [];
        let participantUnAssigned = [];
        mMessage.breakoutRooms.forEach((room) => {
            newRoomGroup[room.name] = room.member;
            participantAssigned = participantAssigned.concat(room.member);
        })
        mSession.participants.forEach((user) => {
            if (!participantAssigned.includes(user.name)) {
                participantUnAssigned.push(user.name);
            }
        })
        newRoomGroup["Main Room"] = participantUnAssigned;
        setRoomGroup(newRoomGroup);

    }, [mMessage.breakoutRooms, mSession.participants])

    const content = (
        <>
        <Input.Group>
              <Input 
              addonBefore="Room name:"
              defaultValue={`Room ${mMessage.breakoutRooms.length +1}`}
              ref={inputRoomName}
              required
              />
              <InputNumber 
                addonBefore="Max participant:"
                min={1} 
                defaultValue={1}
                ref={inputMaxParticipant}
                required
                />
        </Input.Group>
        <Button text="Create" onClick={handleAddNewRoom}></Button>
        </>
    );

    const contentEditRoom = (roomName, maxParticipant) => {
        return (
        <>
        <Form
            form={form}
            layout="vertical"
            name="form_in_modal"
        >
        <Input.Group>
            <Form.Item
            label="Room Name"
            name={roomName}
            rules={[{ required: true, message: 'Please input a room name!' }]}
            initialValue={roomName}
        >
            <Input/>
        </Form.Item>
            <Form.Item
            label="Max Participants"
            name={roomName + '-maxParticipants'}
            rules={[{ required: true, message: 'Please input max participants!' }]}
            initialValue={maxParticipant}
        >
            <InputNumber min={1}/>
        </Form.Item>
        </Input.Group>
        <Button text="Edit" onClick={handleEditRoom}></Button>
        </Form>
        </>
    )};

    const contentMoveParticipant = (participant, defaultRoom) => {    
        return (
        <>
        <p>Move <strong>{participant}</strong> to Room:</p>
        <Select defaultValue={defaultRoom} style={{ width: 200 }} onChange={(value) => setSelectedParticipantRoom(value)}>
        {
            roomGroup && Object.entries(roomGroup).map(([key,value],i) => {
                return (
                    <Option key={`Option-${participant}-${i}`} value={key}>{key}</Option>
                )
            })
        }
         </Select>
         <Button text="Move" onClick={handleMoveRoom} style={{marginTop: "24px"}}></Button>
        </>
    )};
    
    const [ position, setPosition ] = useState({
        diffX: 0,
        diffY: 0,
        dragging: false,
        styles: {}
    })
 
    function dragStart(e) {
        const newPosition = {...position};
        newPosition["diffX"] = e.screenX - e.currentTarget.getBoundingClientRect().left;
        newPosition["diffY"] = e.screenY - e.currentTarget.getBoundingClientRect().top
        newPosition["dragging"] = true; 
        setPosition(newPosition);
    }

    function dragging(e) {
        if (position.dragging) {
            let left = e.screenX - position.diffX;
            let top = e.screenY - position.diffY;
            const newPosition = {...position};
            newPosition["styles"] = {
                left, top
            }

            setPosition(newPosition)
        }
    }

    function dragEnd() {
        const newPosition = {...position};
        newPosition["dragging"] = false;
        setPosition(newPosition);
    }

    function handleJoinRoom(e) {
        if (mRoom.inBreakoutRoom === e.target.value) {
            return handleChangeRoom();
        }
        handleChangeRoom(e.target.value);
    }

    function handleAddNewRoom() {
        let roomName = inputRoomName.current.input.value;
        let maxParticipants = inputMaxParticipant.current.value;
        setShowAddNewRoom(false);
        let data =  [
                {
                    "name": roomName,
                    "maxParticipants": maxParticipants
                }
            ];
        mRoom.handleRoomCreate(data).then((response) => {
            let newRoom = response.find((room) => room.name === roomName);
            newRoom["member"] = [];
            RoomAPI.sendBreakoutRoom(mSession.userSessions[0], [...mMessage.breakoutRooms, newRoom]);
        });
    }

    function handleCloseAllRoom() {
        let p = [];
        mMessage.breakoutRooms.forEach((room) => {
            p.push(mRoom.handleRoomRemove(room.id));
        })
        
        Promise.all(p).then((response) => {
            RoomAPI.sendBreakoutRoom(mSession.userSessions[0], [])
            setIsBreakout(false);
        })
    }

    function handleDeleteRoom(roomName) {
        const newRooms = [...mMessage.breakoutRooms];
        let targetIndex = newRooms.findIndex((room) => room.name === roomName);
        
        mRoom.handleRoomRemove(newRooms[targetIndex].id).then((response) => {
            newRooms.splice(targetIndex, 1);
            RoomAPI.sendBreakoutRoom(mSession.userSessions[0], newRooms)
        })
    }

    function handleEditRoom() {
        const formRoomName = form.getFieldValue(selectedRoom);
        const formMaxparticipant = form.getFieldValue(selectedRoom + '-maxParticipants');
        const newRooms = mMessage.breakoutRooms.map(room => ({...room}));
        let targetIndex = newRooms.findIndex((room) => room.name === selectedRoom);
        newRooms[targetIndex]["name"] = formRoomName;
        newRooms[targetIndex]["maxParticipants"] = formMaxparticipant; 
        setSelectedRoom(null);  
        if (selectedRoom !== formRoomName) {
            RoomAPI.renameRoom(selectedRoom, formRoomName);
        }
        RoomAPI.sendBreakoutRoom(mSession.userSessions[0], newRooms);
    }

    function handleMoveRoom() {
        const newRooms = mMessage.breakoutRooms.map(room => ({...room}));
        let targetRoomIndex = newRooms.findIndex((room) => room.name === selectedParticipantRoom);
        let prevRoomIndex = newRooms.findIndex((room) => room["member"].includes(selectedParticipant));

        if (targetRoomIndex === prevRoomIndex || !selectedParticipantRoom) {
            return;
        }
        
        if (targetRoomIndex !==  -1)  {
            newRooms[targetRoomIndex]["member"] = [...newRooms[targetRoomIndex]["member"], selectedParticipant];
        }
        if (prevRoomIndex !==  -1) {
            newRooms[prevRoomIndex]["member"] = [...newRooms[prevRoomIndex]["member"]].filter((a) => a !== selectedParticipant);
        }

        RoomAPI.sendBreakoutRoom(mSession.userSessions[0], newRooms);
    }

    return when ? (
        <>
        <div className={mStyles.root} style={position.styles} onMouseDown={dragStart} onMouseMove={dragging} onMouseUp={dragEnd}>
        <h4 className={mStyles.header}>Breakout Room Control</h4>
        <Collapse defaultActiveKey={['1']} accordion ghost>
        {roomGroup && Object.entries(roomGroup).map(([key,value],i) => {
          const breakoutRoom = mMessage.breakoutRooms.find((room) => room.name === key);
          const genExtra = () => (
                i !== 0 ? 
                <>
                  <Popconfirm
                        title="Are you sure to delete this room?"
                        onConfirm={() => handleDeleteRoom(key)}
                        onCancel={()=>{}}
                        okText="Yes"
                        cancelText="No"
                        value={key}
                    >
                    <Button hierarchy="link" text={<Delete style={{fill:"black"}}/>} key={'delete-' + i} style={{minHeight: "24px", minWidth: "24px", padding: "0px", margin: "0px"}}></Button> 
                </Popconfirm>
                <Popover visible={selectedRoom === key? true: false} content={contentEditRoom(key, breakoutRoom ? breakoutRoom["maxParticipants"] : 1)} title="Edit Room" trigger="click"  onVisibleChange={(visible) => visible ? setSelectedRoom(key) : setSelectedRoom(null)} overlayStyle={{width: "250px"}}>
                    <Button value={key} hierarchy="link" text={<Edit style={{fill:"black"}}/>} key={'edit-' + i} onClick={() => setSelectedRoom(key)} style={{minHeight: "24px", minWidth: "24px", padding: "0px", margin: "0px"}}></Button>      
                 </Popover>
                 <Button value={key} text={mRoom.inBreakoutRoom === key ? "Leave" : "Join"} key={'joinroom-' + i} onClick={handleJoinRoom} style={{minHeight: "24px", padding: "0px 4px", margin: "0px"}}></Button> 
                </>
                : null
          ); 
          return(
            <Panel header={key + ' (' + value.length + ')'} key={"chooseroom-" + i} extra={genExtra()}>
             {
                value.map((participant, i) => (                     
                    <div key={`participant-${i}`} style={{position: "relative"}}>
                    <p ><Person style={{marginRight: "12px", marginLeft:"24px", verticalAlign:"bottom", fontSize: "18px"}}></Person>{participant}</p> 
                     <Popover visible={selectedParticipant === participant? true: false} content={contentMoveParticipant(participant, key)} title="Move Participant" trigger="click"  onVisibleChange={(visible) => visible ? setSelectedParticipant(participant) : setSelectedParticipant(null)} overlayStyle={{width: "250px"}}>
                        <Button value={participant} hierarchy="link" text={<SwapVert style={{fill:"black", position:"absolute", right: 0, top: 0}}/>} onClick={() => setSelectedParticipant(participant)} style={{minHeight: "24px", minWidth: "24px", padding: "0px", margin: "0px"}}></Button>      
                    </Popover>
                    </div>
                ))
            }
            </Panel>
        )})
        }
        </Collapse>
        <div>
        <Popover visible={showAddNewRoom} content={content} title="Add New Room" trigger="click"  onVisibleChange={(visible) => setShowAddNewRoom(visible)} overlayStyle={{width: "250px"}}>
            <Button text="Add New Room" hierarchy="tertiary"></Button>
        </Popover>
        <Popconfirm
                    title="Are you sure to close all rooms?"
                    onConfirm={handleCloseAllRoom}
                    onCancel={()=>{}}
                    okText="Yes"
                    cancelText="No"
                >
            <Button text="Close All Rooms" hierarchy="destructive"></Button>
        </Popconfirm>
        </div>
        </div>
        </>
    ): null;
}
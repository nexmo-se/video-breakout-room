import { useState } from "react";
import Delete from "@material-ui/icons/Delete"
import Edit from "@material-ui/icons/Edit"
import Chat from "@material-ui/icons/Chat"
import Button from 'components/Button'
import EditRoomContent from '../EditRoomContent'
import MessageRoomContent from '../MessageRoomContent'

import useMessage from 'hooks/message'
import useRoom from 'hooks/room'
import { Popconfirm, Popover } from 'antd';
import RoomAPI from "api/room";
import useSession from "hooks/session";

export default function ActionButtons(props) {
    const {index, roomName, setIsLoading, handleChangeRoom, styles} = props;
    
    const [ selectedEditRoom, setSelectedEditRoom ] = useState();
    const [ selectedMessageRoom, setSelectedMessageRoom ] = useState();

    const mMessage = useMessage();
    const mRoom = useRoom();
    const mSession = useSession();
    const breakoutRoom = mMessage.breakoutRooms.find((room) => room.name === roomName);

    const editRoomContent = (roomName, maxParticipants) => {
        return (
            <EditRoomContent
                roomName={roomName}
                maxParticipant={maxParticipants}
                selectedRoom={selectedEditRoom}
                setSelectedRoom={setSelectedEditRoom}
                setIsLoading={setIsLoading}
            ></EditRoomContent>
        )
    }

    const messageRoomContent = (roomName) => {
        return (
            <MessageRoomContent
                roomName= {roomName}
                selectedRoom={selectedMessageRoom}
                setSelectedRoom={setSelectedMessageRoom}
            >
            </MessageRoomContent>
        )
    }

    function handleDeleteRoom(roomName) {
        setIsLoading(true);
        const newRooms = [...mMessage.breakoutRooms];
        let targetIndex = newRooms.findIndex((room) => room.name === roomName);
        
        mRoom.handleRoomRemove(newRooms[targetIndex].id).then((response) => {
            newRooms.splice(targetIndex, 1);
            setIsLoading(false);
            RoomAPI.sendBreakoutRoomUpdate(mSession.mainSession, {"message": "roomRemoved", "breakoutRooms": newRooms})
        })
    }

    function handleJoinRoom(e) {
        if (mRoom.inBreakoutRoom === e.target.value) {
            return handleChangeRoom();
        }
        handleChangeRoom(e.target.value);
    }


    return (
            index !== 0? 
            <>
            <Popover visible={selectedMessageRoom === roomName? true: false} content={messageRoomContent(roomName)} title="Message Room" trigger="click"  onVisibleChange={(visible) => visible ? setSelectedMessageRoom(roomName) : setSelectedMessageRoom(null)} overlayStyle={styles.popover}>
                <Button value={roomName} hierarchy="link" text={<Chat style={styles.icon}/>} key={'message-' + index} onClick={() => setSelectedMessageRoom(roomName)} style={styles.button}></Button>      
             </Popover>
            <Popover visible={selectedEditRoom === roomName? true: false} content={editRoomContent(roomName, breakoutRoom ? breakoutRoom["maxParticipants"] : 1)} title="Edit Room" trigger="click"  onVisibleChange={(visible) => visible ? setSelectedEditRoom(roomName) : setSelectedEditRoom(null)} overlayStyle={styles.popover}>
                <Button value={roomName} hierarchy="link" text={<Edit style={styles.icon}/>} key={'edit-' + index} onClick={() => setSelectedEditRoom(roomName)} style={styles.button}></Button>      
            </Popover>
            <Popconfirm
                    title="Are you sure to delete this room?"
                    onConfirm={() => handleDeleteRoom(roomName)}
                    onCancel={()=>{}}
                    okText="Yes"
                    cancelText="No"
                    value={roomName}
                >
                <Button hierarchy="link" text={<Delete style={styles.icon}/>} key={'delete-' + index} style={styles.button}></Button> 
            </Popconfirm>
            <Button value={roomName} text={mRoom.inBreakoutRoom === roomName ? "Leave" : "Join"} key={'joinroom-' + index} onClick={handleJoinRoom} style={{...styles.button,  padding: "0px 4px"}}></Button> 
            </>
            : null
      ); 
}

ActionButtons.defaultProps = {
    styles: {
        button: {
            minHeight: "24px", minWidth: "24px", padding: "0px", margin: "0px"
        },
        icon: {
            fill:"black"
        },
        popover: {
            width: "250px"
        }
    }
}

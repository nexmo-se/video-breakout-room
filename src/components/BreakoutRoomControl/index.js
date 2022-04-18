import { useEffect, useState } from 'react';
import { Collapse, Popconfirm, Popover } from 'antd';

import Chat from '@material-ui/icons/Chat';
import HourglassEmpty from '@material-ui/icons/HourglassEmpty';
import ActionButtons from './components/ActionButtons';
import AddRoomContent from './components/AddRoomContent';
import SetTimerContent from './components/SetTimerContent';
import MessageRoomContent from './components/MessageRoomContent';
import ParticipantList from './components/ParticipantList';
import Button from 'components/Button';

import clsx from 'clsx';
import useStyles from './styles';
import useRoom from 'hooks/room';
import useMessage from 'hooks/message';
import MessageAPI from 'api/message';

const { Panel } = Collapse;

export default function BreakoutRoomControl(props) {
    const { when, setIsBreakout, handleChangeRoom } = props

    const [ roomGroup, setRoomGroup] = useState({})
    const [ showAddNewRoom, setShowAddNewRoom ] = useState(false);
    const [ showSetTimer, setShowSetTimer ] = useState(false);
    const [ showBroadCastMessage, setShowBroadCastMessage ] = useState(false);
    const [ isLoading, setIsLoading ] = useState(true);

    const mStyles = useStyles();
    const mMessage = useMessage();
    const mRoom = useRoom();


    useEffect(() => {
        setIsLoading(true);

        if (mMessage.breakoutRooms.length === 0) {
            setRoomGroup({});
            return setIsBreakout(false);
        }
        let newRoomGroup = {};
        let participantJoined = [];
        let participantNotJoin = [];

        mMessage.breakoutRooms.forEach((room) => {
            const roomMember = room.member.concat(room.memberAssigned.map((member) => member + ' (joining)'));
            newRoomGroup[room.name] = roomMember;
            participantJoined = participantJoined.concat(room.member, room.memberAssigned);
        })
        mMessage.participants.forEach((user) => {
            if (participantJoined.includes(user.name)) return;
            let userName = user.name; 
            participantNotJoin.push(userName);
        })
        newRoomGroup[mRoom.mainRoom.name] = newRoomGroup[mRoom.mainRoom.name].concat(participantNotJoin);

        if ((newRoomGroup[mRoom.mainRoom.name].length + participantNotJoin.length) === mMessage.participants.length && mMessage.timer && (mMessage.timer.endTime <= new Date().getTime())) {            
            handleCloseAllRoom();
            MessageAPI.broadcastMsg(mRoom.currentRoom.id, 'count-down-timer', {});
        }
        setRoomGroup(newRoomGroup);
        setIsLoading(false);
    }, [mMessage.breakoutRooms, mMessage.participants, setIsBreakout])

    
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

    async function handleCloseAllRoom() {    
        setIsLoading(true); 
        await MessageAPI.broadcastMsg(mRoom.currentRoom.id, 'breakout-room', {"message": "allRoomRemoved", "breakoutRooms":[]});
        await mRoom.handleRoomRemove(mRoom.mainRoom.id);
        setIsBreakout(false);
    }
    const addRoomcontent = () => {
        return (
            <AddRoomContent
                setIsLoading={setIsLoading}
                setShowAddNewRoom={setShowAddNewRoom}
            ></AddRoomContent>
        )
    }

    const broadCastMessagecontent = () => {
        return (
            <MessageRoomContent
                roomName= "All Rooms"
                selectedRoom="all"
                setSelectedRoom={setShowBroadCastMessage}
            ></MessageRoomContent>
        )
    }

    const setTimerContent = () => {
        return (
            <SetTimerContent
                setShowSetTimer={setShowSetTimer}
            >
            </SetTimerContent>
        )
    }

    return when ? (
        <>
        <div className={mStyles.root} style={position.styles} onMouseDown={dragStart} onMouseMove={dragging} onMouseUp={dragEnd}>
        <h4 className={mStyles.header}>Breakout Room Control</h4>
         {isLoading? <div className={clsx("Vlt-spinner", mStyles.spinner)} /> : null}
        <Collapse defaultActiveKey={['1']} accordion ghost>
        {roomGroup && Object.entries(roomGroup).map(([key,value],i) => {
          return(
            <Panel header={key + ' (' + value.length + ')'} key={"chooseroom-" + i} 
            extra={<ActionButtons 
                roomName={key} 
                setIsLoading={setIsLoading}
                handleChangeRoom={handleChangeRoom}/>}
            >
            <ParticipantList 
                roomName={key}
                roomOptions = {Object.keys(roomGroup)}
                participantList= {value}
                setIsLoading = {setIsLoading}
            />                    
            </Panel>
        )})
        }
        </Collapse>
        <div>
        <Popover visible={showSetTimer} content={setTimerContent} title="Set Countdown Timer" trigger="click"  onVisibleChange={(visible) => setShowSetTimer(visible)} overlayStyle={{width: "420px"}}>
                <Button text={<HourglassEmpty style={{margin: 0}}></HourglassEmpty>} hierarchy="tertiary"></Button>
        </Popover>
        <Popover visible={showBroadCastMessage} content={broadCastMessagecontent} title="BroadCast Message" trigger="click"  onVisibleChange={(visible) => setShowBroadCastMessage(visible)} overlayStyle={{width: "250px"}}>
                <Button text={<Chat style={{margin: 0}}></Chat>} hierarchy="tertiary"></Button>
            </Popover>
        <Popover visible={showAddNewRoom} content={addRoomcontent} title="Add New Room" trigger="click"  onVisibleChange={(visible) => setShowAddNewRoom(visible)} overlayStyle={{width: "250px"}}>
            <Button text="+ Add" hierarchy="secondary"></Button>
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
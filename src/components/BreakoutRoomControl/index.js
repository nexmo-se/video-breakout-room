import { useEffect, useState } from "react";
import useStyles from "./styles";
import useRoom from "hooks/room"
import useSession from "hooks/session"
import useMessage from "hooks/message"
import clsx from "clsx";
import ActionButtons from "./components/ActionButtons";
import AddRoomContent from "./components/AddRoomContent"
import SetTimerContent from "./components/SetTimerContent"


import { Collapse, Popconfirm, Popover } from 'antd';
import Button from 'components/Button'
import RoomAPI from "api/room";
import ParticipantList from "./components/ParticipantList";
import Chat from "@material-ui/icons/Chat";
import HourglassEmpty from "@material-ui/icons/HourglassEmpty";


import MessageRoomContent from "./components/MessageRoomContent";
const { Panel } = Collapse;

export default function BreakoutRoomControl(props) {
    const { when, setIsBreakout, handleChangeRoom } = props
    const mStyles = useStyles();
    const mSession = useSession();
    const mMessage = useMessage();
    const mRoom = useRoom();

    const [ roomGroup, setRoomGroup] = useState({})
    const [ showAddNewRoom, setShowAddNewRoom ] = useState(false);
    const [ showSetTimer, setShowSetTimer ] = useState(false);
    const [ showBroadCastMessage, setShowBroadCastMessage ] = useState(false);
    const [ isLoading, setIsLoading ] = useState(true);


    useEffect(() => {
        setIsLoading(true);

        if (mMessage.breakoutRooms.length === 0) {
            setRoomGroup({});
            return setIsBreakout(false);
        }
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

        if (participantAssigned.length === 0 && mMessage.timer && (mMessage.timer.endTime <= new Date().getTime())) {            
            handleCloseAllRoom();
            RoomAPI.sendCountDownTimer(mSession.mainSession, {});
        }
        setRoomGroup(newRoomGroup);
        setIsLoading(false);
    }, [mMessage.breakoutRooms, mSession.participants, setIsBreakout])
    
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

    function handleCloseAllRoom() {    
        setIsLoading(true); 
        return mRoom.handleRoomRemove(mRoom.mainRoom).then((response) => {
            RoomAPI.sendBreakoutRoomUpdate(mSession.mainSession, {"message": "allRoomRemoved", "breakoutRooms":[]})
            setIsBreakout(false);
        })
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
                index={i} 
                roomName={key} 
                setIsLoading={setIsLoading}
                handleChangeRoom={handleChangeRoom}/>}
            >
            <ParticipantList 
                roomName={key}
                roomOption = {Object.keys(roomGroup)}
                participantList= {value}
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
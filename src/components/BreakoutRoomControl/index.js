import { useEffect, useState } from "react";
import useStyles from "./styles";
import useRoom from "hooks/room"
import useSession from "hooks/session"
import useMessage from "hooks/message"
import clsx from "clsx";
import ActionButtons from "./components/ActionButtons";
import AddRoomContent from "./components/AddRoomContent"


import { Collapse, Popconfirm, Popover } from 'antd';
import Button from 'components/Button'
import RoomAPI from "api/room";
import ParticipantList from "./components/ParticipantList";
const { Panel } = Collapse;

export default function BreakoutRoomControl(props) {
    const { when, setIsBreakout, handleChangeRoom } = props
    const mStyles = useStyles();
    const mSession = useSession();
    const mMessage = useMessage();
    const mRoom = useRoom();

    const [ roomGroup, setRoomGroup] = useState({})
    const [ showAddNewRoom, setShowAddNewRoom ] = useState(false);
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
            RoomAPI.sendBreakoutRoom(mSession.userSessions[0], {"breakoutRooms":[]})
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
        <Popover visible={showAddNewRoom} content={addRoomcontent} title="Add New Room" trigger="click"  onVisibleChange={(visible) => setShowAddNewRoom(visible)} overlayStyle={{width: "250px"}}>
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
import { useEffect, useState } from "react";
import useStyles from "./styles";
import useRoom from "hooks/room"
import useSession from "hooks/session"
import useMessage from "hooks/message"
import clsx from "clsx";
import Person from "@material-ui/icons/Person"
import { Collapse } from 'antd';
import Button from 'components/Button'
const { Panel } = Collapse;

export default function BreakoutRoomControl(props) {
    const { when } = props
    const mStyles = useStyles();
    const mSession = useSession();
    const mMessage = useMessage();


    const [roomGroup, setRoomGroup] = useState({
        "Main Room": []
    })

    useEffect(() => {
        let newRoomGroup = {...roomGroup};
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

    function handleJoinRoom() {
        // TODO
    }

    return when ? (
        <>
        <div className={mStyles.root} style={position.styles} onMouseDown={dragStart} onMouseMove={dragging} onMouseUp={dragEnd}>
        <h4 className={mStyles.header}>Breakout Room Control</h4>
        <Collapse defaultActiveKey={['1']} accordion ghost>
        {roomGroup && Object.entries(roomGroup).map(([key,value],i) => {
          const genExtra = () => (
            <Button value={key} text="Join" key={'joinroom-' + i} onClick={handleJoinRoom} style={{minHeight: "24px", padding: "0px 4px", margin: "0px 24px"}}></Button>
          ); 
          return(
            <Panel header={key + ' (' + value.length + ')'} key={"chooseroom-" + i} extra={genExtra()}>
            {
                value.map((participant, i) => (
                    <p key={"participant-" + i}><Person style={{marginRight: "12px", marginLeft:"24px", verticalAlign:"bottom", fontSize: "18px"}}></Person>{participant}</p>
                ))
                }
            </Panel>
        )})
        }
    </Collapse>
        </div>
        </>
    ): null;
}
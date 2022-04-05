import { useState } from "react";
import MoveRoomContent from "../MoveRoomContent";
import Person from "@material-ui/icons/Person"
import SwapVert from "@material-ui/icons/SwapVert"
import Button from 'components/Button'
import { Popover } from 'antd';


export default function ParticipantList(props) {

    const { roomName, participantList, styles, roomOption } = props;
    const [ selectedParticipant, setSelectedParticipant ] = useState();


    const moveRoomContent = (participant, roomName) => {
        return (
            <MoveRoomContent
                participant={participant}
                defaultRoom={roomName}
                roomOption={roomOption}
                selectedParticipant={selectedParticipant}
            ></MoveRoomContent>
        )
    }

    return (
    participantList && participantList.length!== 0 ? 
        participantList.map((participant, i) => {
        return (
            <div key={`participant-${i}`} style={styles.container}>
            <p ><Person style={styles.personIcon}></Person>{participant}</p> 
            <Popover visible={selectedParticipant === participant? true: false} content={moveRoomContent(participant, roomName)} title="Move Participant" trigger="click"  onVisibleChange={(visible) => visible ? setSelectedParticipant(participant) : setSelectedParticipant(null)} overlayStyle={styles.popover}>
                <Button value={participant} hierarchy="link" text={<SwapVert style={styles.swapIcon}/>} onClick={() => setSelectedParticipant(participant)} style={styles.button}></Button>      
            </Popover>
            </div>
        )
    })
    : null
    )

}

ParticipantList.defaultProps = {
    styles: {
        container: {
            position: "relative"
        },
        button: {
            minHeight: "24px", minWidth: "24px", padding: "0px", margin: "0px"
        },
        personIcon: {
            marginRight: "12px", marginLeft:"24px", verticalAlign:"bottom", fontSize: "18px"
        },
        swapIcon: {
            fill:"black", position:"absolute", right: 0, top: 0
        },
        popover: {
            width: "250px"
        }
    }
}
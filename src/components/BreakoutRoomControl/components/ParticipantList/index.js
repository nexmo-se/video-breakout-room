import { useState } from 'react';
import { Popover } from 'antd';
import Person from '@material-ui/icons/Person';
import SwapVert from '@material-ui/icons/SwapVert';
import MoveRoomContent from '../MoveRoomContent';
import Button from 'components/Button';

export default function ParticipantList(props) {

    const { roomName, participantList, setIsLoading, styles, roomOptions } = props;
    const [ selectedParticipant, setSelectedParticipant ] = useState();

    const moveRoomContent = (roomName) => {
        return (
            <MoveRoomContent
                defaultRoom={roomName}
                roomOptions={roomOptions}
                selectedParticipant={selectedParticipant}
                setSelectedParticipant={setSelectedParticipant}
                setIsLoading = {setIsLoading}
            ></MoveRoomContent>
        )
    }

    return (
    participantList && participantList.length!== 0 ? 
        participantList.map((participant, i) => {
        return (
            <div key={`participant-${i}`} style={styles.container}>
            <p ><Person style={styles.personIcon}></Person>{participant}</p>
            {!participant.includes(" (joining)") ?
            <Popover visible={selectedParticipant === participant? true: false} content={moveRoomContent(roomName)} title="Move Participant" trigger="click"  onVisibleChange={(visible) => visible ? setSelectedParticipant(participant) : setSelectedParticipant(null)} overlayStyle={styles.popover}>
                <Button value={participant} hierarchy="link" text={<SwapVert style={styles.swapIcon}/>} onClick={() => setSelectedParticipant(participant)} style={styles.button}></Button>      
            </Popover> : null
            }
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
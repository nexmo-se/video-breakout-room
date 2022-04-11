import { useState } from 'react';
import { Select } from 'antd';
import useMessage from 'hooks/message';
import useSession from 'hooks/session';
import Button from 'components/Button';
import RoomAPI from 'api/room';
const { Option } = Select


export default function MoveRoomContent(props) {  
    
    const { defaultRoom, roomOptions, selectedParticipant, styles } = props;
    const [ selectedParticipantRoom, setSelectedParticipantRoom ] = useState();
    const mMessage = useMessage();
    const mSession = useSession();

    function handleMoveRoom() {
        const newRooms = mMessage.breakoutRooms.map(room => ({...room}));
        let targetRoomIndex = newRooms.findIndex((room) => room.name === selectedParticipantRoom);
        let prevRoomIndex = newRooms.findIndex((room) => room["member"].includes(selectedParticipant));

        if (targetRoomIndex === prevRoomIndex || !selectedParticipantRoom) {
            return;
        }

        if (targetRoomIndex !==  -1 && newRooms[targetRoomIndex].member.length >= newRooms[targetRoomIndex].maxParticipants) {
            return alert(`Room: ${newRooms[targetRoomIndex].name} is full`);
        }
        
        if (targetRoomIndex !==  -1)  {
            newRooms[targetRoomIndex]["memberAssigned"] = [...newRooms[targetRoomIndex]["memberAssigned"], selectedParticipant];
        }
        if (prevRoomIndex !==  -1) {
            newRooms[prevRoomIndex]["member"] = [...newRooms[prevRoomIndex]["member"]].filter((a) => a !== selectedParticipant);
        }

        RoomAPI.sendBreakoutRoomUpdate(mSession.mainSession, {"message": "participantMoved", "breakoutRooms": newRooms});
    }

    return (
    <>
    <p>Move <strong>{selectedParticipant}</strong> to Room:</p>
    <Select defaultValue={defaultRoom} style={styles.select} onChange={(value) => setSelectedParticipantRoom(value)}>
    {
        roomOptions && roomOptions.map((option, i) => {
            return (
                <Option key={`Option-${selectedParticipant}-${i}`} value={option}>{option}</Option>
            )
        })
    }
     </Select>
     <Button text="Move" onClick={handleMoveRoom} style={styles.button}></Button>
    </>
)};


MoveRoomContent.defaultProps = {
    styles: {
        button: {
            marginTop: "24px"
        },
        select: {
            width: 200 
        }
    }
}
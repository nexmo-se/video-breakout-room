import { useState } from "react"
import useMessage from "hooks/message";
import useSession from "hooks/session";
import Button from 'components/Button'
import RoomAPI from "api/room"
import { Select } from 'antd';
const { Option } = Select


export default function MoveRoomContent(props) {  
    
    const { participant, defaultRoom, roomOption, selectedParticipant, styles } = props;
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
            newRooms[targetRoomIndex]["member"] = [...newRooms[targetRoomIndex]["member"], selectedParticipant];
        }
        if (prevRoomIndex !==  -1) {
            newRooms[prevRoomIndex]["member"] = [...newRooms[prevRoomIndex]["member"]].filter((a) => a !== selectedParticipant);
        }

        RoomAPI.sendBreakoutRoom(mSession.userSessions[0], {"breakoutRooms": newRooms});
    }

    return (
    <>
    <p>Move <strong>{participant}</strong> to Room:</p>
    <Select defaultValue={defaultRoom} style={styles.select} onChange={(value) => setSelectedParticipantRoom(value)}>
    {
        roomOption && roomOption.map((option, i) => {
            return (
                <Option key={`Option-${participant}-${i}`} value={option}>{option}</Option>
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
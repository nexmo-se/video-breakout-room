import { useEffect, useState } from 'react';
import { Select } from 'antd';
import useMessage from 'hooks/message';
import Button from 'components/Button';
import RoomAPI from 'api/room';
import useRoom from 'hooks/room';
const { Option } = Select


export default function MoveRoomContent(props) {  
    
    const { defaultRoom, roomOptions, selectedParticipant, setSelectedParticipant, setIsLoading, styles } = props;
    const [ selectedParticipantRoom, setSelectedParticipantRoom ] = useState();
    const mMessage = useMessage();
    const mRoom = useRoom();

    function handleMoveRoom() {
        const newRooms = mMessage.breakoutRooms.map(room => ({...room}));
        let targetRoomIndex = newRooms.findIndex((room) => room.name === selectedParticipantRoom);
        let prevRoomIndex = newRooms.findIndex((room) => room["member"].includes(selectedParticipant));

        if (targetRoomIndex === prevRoomIndex || !selectedParticipantRoom) {
            return;
        }

        if (targetRoomIndex !==  -1 && newRooms[targetRoomIndex].maxParticipants && newRooms[targetRoomIndex].member.length >= newRooms[targetRoomIndex].maxParticipants) {
            window.alert(`Room: ${newRooms[targetRoomIndex].name} is full`);
            return;
        }

        setIsLoading(true);
        let data = {
            fromRoom: prevRoomIndex !== -1 ? newRooms[prevRoomIndex].name : null, 
            toRoom: targetRoomIndex !== -1 ? newRooms[targetRoomIndex].name : null, 
            participant: selectedParticipant
        }
        
        RoomAPI.moveParticipant(mRoom.mainRoom.id, "participantMoved", data);

        setSelectedParticipant(null);
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
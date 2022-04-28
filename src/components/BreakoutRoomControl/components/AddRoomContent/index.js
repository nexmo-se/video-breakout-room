import { useRef } from 'react';
import { Input, InputNumber } from 'antd';
import Button from 'components/Button';
import useMessage from "hooks/message";
import useRoom from "hooks/room";


export default function AddRoomContent(props) { 
    const { setIsLoading, setShowAddNewRoom } = props;
    const inputRoomName = useRef(null);
    const inputMaxParticipant = useRef(null);
    const mMessage = useMessage();
    const mRoom = useRoom();

    function handleAddNewRoom() {
        setIsLoading(true);
        let roomName = inputRoomName.current.input.value;
        let maxParticipants = inputMaxParticipant.current.value;
        setShowAddNewRoom(false);
        let data =  [
                {
                    "name": roomName,
                    "maxParticipants": maxParticipants
                }
            ];
        mRoom.handleRoomCreate("roomAdded", data).then((response) => {
            setIsLoading(false);
        })
    }

    return (
    <>
    <Input.Group>
          <Input 
          addonBefore="Room name:"
          defaultValue={`Room ${mMessage.breakoutRooms.length +1}`}
          ref={inputRoomName}
          required
          />
          <InputNumber 
            addonBefore="Max participant:"
            min={1} 
            defaultValue={1}
            ref={inputMaxParticipant}
            required
            />
    </Input.Group>
    <Button text="Create" onClick={handleAddNewRoom}></Button>
    </>
)
};
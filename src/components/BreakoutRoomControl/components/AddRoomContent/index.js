import { useRef } from 'react';
import { Input, InputNumber } from 'antd';
import RoomAPI from 'api/room';
import Button from 'components/Button';
import useMessage from "hooks/message";
import useSession from "hooks/session";
import useRoom from "hooks/room";


export default function AddRoomContent(props) { 
    const { setIsLoading, setShowAddNewRoom } = props;
    const inputRoomName = useRef(null);
    const inputMaxParticipant = useRef(null);
    const mMessage = useMessage();
    const mSession = useSession();
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
        mRoom.handleRoomCreate(data).then((response) => {
            let newRoom = response.find((room) => room.name === roomName);
            newRoom["memberAssigned"] = [];
            newRoom["member"] = [];
            setIsLoading(false);
            RoomAPI.sendBreakoutRoomUpdate(mSession.mainSession, {"message": "roomAdded", "breakoutRooms": [...mMessage.breakoutRooms, newRoom]});
        });
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
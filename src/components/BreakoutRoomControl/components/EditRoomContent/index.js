
import { Input, InputNumber, Form } from 'antd';
import Button from 'components/Button'
import RoomAPI from "api/room";
import useMessage from "hooks/message";
import useSession from "hooks/session";

export default function EditRoomContent(props) {
   const { roomName, maxParticipant, selectedRoom, setIsLoading, setSelectedRoom } = props
   const [form] = Form.useForm();
   const mMessage = useMessage();
   const mSession = useSession();

   function handleEditRoom() {
    const formRoomName = form.getFieldValue(selectedRoom);
    const formMaxparticipant = form.getFieldValue(selectedRoom + '-maxParticipants');
    const newRooms = mMessage.breakoutRooms.map(room => ({...room}));
    let targetIndex = newRooms.findIndex((room) => room.name === selectedRoom);
    newRooms[targetIndex]["name"] = formRoomName;
    newRooms[targetIndex]["maxParticipants"] = formMaxparticipant; 
    setSelectedRoom(null); 
    const targetRoom = mMessage.breakoutRooms.find((room) => room.name === selectedRoom); 
    
    if (!targetRoom || (targetRoom.name === formRoomName && targetRoom.maxParticipants === formMaxparticipant)) return;

    setIsLoading(true);
    let p = [];
    if (targetRoom.name !== formRoomName) {
        p.push(RoomAPI.renameRoom(targetRoom.id, formRoomName));
    }
    if (targetRoom.maxParticipants !== formMaxparticipant) {
        p.push(RoomAPI.updateRoom(targetRoom.id, formMaxparticipant));
    }

    Promise.all(p).then((response) => {
        setIsLoading(false);
        RoomAPI.sendBreakoutRoom(mSession.userSessions[0], {"breakoutRooms": newRooms});
    })

}

    return (
    <>
    <Form
        form={form}
        layout="vertical"
        name="form_in_modal"
    >
    <Input.Group>
        <Form.Item
        label="Room Name"
        name={roomName}
        rules={[{ required: true, message: 'Please input a room name!' }]}
        initialValue={roomName}
    >
        <Input/>
    </Form.Item>
        <Form.Item
        label="Max Participants"
        name={roomName + '-maxParticipants'}
        rules={[{ required: true, message: 'Please input max participants!' }]}
        initialValue={maxParticipant}
    >
        <InputNumber min={1}/>
    </Form.Item>
    </Input.Group>
    <Button text="Edit" onClick={handleEditRoom}></Button>
    </Form>
    </>
)};
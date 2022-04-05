import ChatInput from "components/ChatInput";

export default function MessageRoomContent(props) {
    const {roomName, selectedRoom, setSelectedRoom} = props;

    return (
        <>
        <p>Send message to {roomName}</p>
        <ChatInput bypass={true} toBreakoutRoom={selectedRoom} resetSelectedRoom={() => setSelectedRoom(null)}></ChatInput>
        </>
    )

};
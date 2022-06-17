import { useState } from 'react';
import User from 'entities/user';
import TextInput from 'components/TextInput';
import RoomAPI from 'api/room';

export default function AskNameDialog(props) {
  const { role, pin, onSubmit } = props;
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [inputPin, setInputPin] = useState(pin);
  const [disabled, setDisabled] = useState(false);

  const styles = {
    container: {
      width: "100%", height: "100%", display: "flex",
      alignItems: "center", justifyContent: "center"
    }
  }

  async function validateUserName(name) {
    const { participants } = await RoomAPI.getParticipants(room);
    if (participants && participants.find((participant) => participant.name === name)) {
      setDisabled(false);
      return alert("Name already in use, please use another name");
    }
    const user = new User(name, role);
    onSubmit(user, room);
  }

  function handleSubmit(e) {
      e.preventDefault();
      if(!name || !room) alert("Please fill in all fields");
      else if(onSubmit && inputPin === pin) {
        setDisabled(true);
        validateUserName(name);
      }else if(inputPin !== pin) alert("Wrong PIN");
  }

  return (
    <form style={styles.container}>
      <div className="Vlt-card Vlt-bg-white" style={{ maxWidth: 500 }}>
        <div className="Vlt-card__header">
          <h3>Join Main Room</h3>
          <p>Please make sure you enter the same room name as all other users who are testing with you</p>
        </div>
        <div className="Vlt-card__content">
          <TextInput label="Room Name*" text={room} onChange={setRoom} placeholder="Please enter a room name"/>
          <TextInput label="Name*" text={name} onChange={setName} placeholder="Please enter your name"/>
          <TextInput label="Password*" type="password" text={inputPin} onChange={setInputPin} placeholder="PIN" autocomplete="on"/>
          <p>Password for {role} is {pin}</p>
        </div>
        <button style={{ marginTop: 16 }} type="submit" disabled={disabled} className="Vlt-btn Vlt-btn--primary Vlt-btn--app" onClick={handleSubmit}>Join</button>
      </div>
    </form>
  )
}
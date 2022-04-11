import { useState } from 'react';
import User from 'entities/user';
import TextInput from 'components/TextInput';

export default function AskNameDialog(props) {
  const { role, pin, onSubmit } = props;
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [inputPin, setInputPin] = useState('');

  const styles = {
    container: {
      width: "100%", height: "100%", display: "flex",
      alignItems: "center", justifyContent: "center"
    }
  }

  function handleSubmit(e) {
      e.preventDefault();
      if(!name || !room) alert("Please fill in all fields");
      else if(onSubmit && inputPin === pin) {
        const user = new User(name, role);
        onSubmit(user, room);
      }else if(inputPin !== pin) alert("Wrong PIN");
  }

  return (
    <form style={styles.container}>
      <div className="Vlt-card Vlt-bg-white" style={{ maxWidth: 500 }}>
        <div className="Vlt-card__header">
          <h3>Join Main Room</h3>
        </div>
        <div className="Vlt-card__content">
          <TextInput label="Room Name*" text={room} onChange={setRoom} placeholder="Please enter a room name"/>
          <TextInput label="Name*" text={name} onChange={setName} placeholder="Please enter your name"/>
          <TextInput label="Password*" type="password" text={inputPin} onChange={setInputPin} placeholder="PIN" autocomplete="on"/>
        </div>
        <div className="Vlt-card__footer Vlt-card__footer--noborder">
          <button type="submit" className="Vlt-btn Vlt-btn--primary Vlt-btn--app" onClick={handleSubmit}>Join</button>
        </div>
      </div>
    </form>
  )
}
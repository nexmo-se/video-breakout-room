import React, { useEffect, useState } from 'react';
import { Modal, Form, InputNumber, Radio, Input } from 'antd';
import useRoom from 'hooks/room';
import useSession from 'hooks/session';
import useMessage from 'hooks/message';
import RoomAPI from 'api/room';

export default function PromptCreateRooms(props) {
  const [form] = Form.useForm();
  const mRoom = useRoom();
  const mSession = useSession();
  const mMessage = useMessage();


  const { when, onOK, onCancel, title, okText, cancelText } = props;
  const [ numberOfParticipants, setNumberOfParticipants] = useState(mSession.participants.length);
  const [ numberOfRooms, setNumberOfRooms] = useState(1);

    useEffect(() => {
      setNumberOfParticipants(mSession.participants.length);
    }, [mSession.participants.length])

    function handleRoomChange(value) {
      setNumberOfRooms(value);
    }

    function handleConfirm() {
      onOK();
      const formValue = form.getFieldsValue();
      let data =  [];
      for (let i = 0; i < formValue.roomCount; i++) {
        let roomName = formValue[`roomName ${i + 1}`];
        let maxParticipants = formValue[`maxParticipants ${i + 1}`]
        data.push({name: roomName, maxParticipants: maxParticipants})
      }

      return mRoom.handleRoomCreate(data).then((response) => {
        const participants = mSession.participants.filter((p) => (p.role !== "moderator" && !mMessage.cohosts.includes(p.name))).map((p) => p.name);
        if (formValue.modifier === "automatic" && participants.length !== 0) {
          participants.sort(()=> { return 0.5 - Math.random()});
          response.forEach((data) => {
              data["memberAssigned"] = participants.splice(0, data["maxParticipants"]);
          })
        }

        const message = {
          "message": "roomCreated (" + formValue.modifier + ")",
          "breakoutRooms": response
        }
        RoomAPI.sendBreakoutRoomUpdate(mSession.mainSession, message)
      });

    }


  return when ? (
    <Modal
      title={title}
      visible={when}
      onOk={handleConfirm}
      okText={okText}
      onCancel={onCancel}
      cancelText={cancelText}
      closable={true}
    >
      <Form
        form={form}
        layout="vertical"
        name="form_in_modal"
        initialValues={{ modifier: 'automatic', roomCount: numberOfRooms }}
      >
        <div>Assign {numberOfParticipants} participants into <Form.Item
          name="roomCount"
          rules={[{ required: true, message: 'Missing input: number of breakout rooms' }]}
          style={{width: "92px", display: "inline-block"}}
        >
          <InputNumber min={1} onChange={handleRoomChange}/>
        </Form.Item> Breakout rooms. </div>
        {[...Array(numberOfRooms)].map((x, i) =>
              <Input.Group compact key={`room ${i+1}`}>
              <Form.Item
              label="Room Name"
              name={`roomName ${i+1}`}
              rules={[{ required: true, message: 'Missing input: Room name' }]}
              style={{marginRight: "24px"}}
              initialValue={`Room ${i+1}`}
            >
              <Input/>
            </Form.Item>
              <Form.Item
              label="Max Participants"
              name={`maxParticipants ${i+1}`}
              rules={[{ required: true, message: 'Missing input: Max participants' }]}
              initialValue={1}
            >
              <InputNumber min={1}/>
            </Form.Item>
            </Input.Group>
        )}
        <Form.Item name="modifier" className="collection-create-form_last-form-item">
          <Radio.Group>
            <Radio style={{display: 'block'}} value="automatic">Assign automatically</Radio>
            <Radio style={{display: 'block'}} value="chooseroom">Let participants choose room</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  ) : null;
}
import React, { useEffect, useState } from 'react';
import { Modal, Form, InputNumber, Radio, Input } from 'antd';
import useRoom from 'hooks/room';
import useMessage from 'hooks/message';
import MessageAPI from 'api/message';

export default function PromptCreateRooms(props) {
  const [form] = Form.useForm();
  const mRoom = useRoom();
  const mMessage = useMessage();


  const { when, onOK, onCancel, title, okText, cancelText } = props;
  const [ numberOfParticipants, setNumberOfParticipants] = useState(mMessage.participants.length);
  const [ numberOfRooms, setNumberOfRooms] = useState(1);

    useEffect(() => {
      // exclude co-hosts and moderator
      const numberOfParticipants = mMessage.participants.filter((p) => !p.isCohost)
      setNumberOfParticipants(numberOfParticipants.length - 1); // exclude moderator
    }, [mMessage.participants])

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

      return mRoom.handleRoomCreate("roomCreated (" + formValue.modifier + ")" , data)
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
        <div styles={{overflowY: "scroll"}}>
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
        )}</div>
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
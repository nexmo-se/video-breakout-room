import React, { useCallback, useEffect, useState } from "react";
import { Modal, Form, InputNumber, Radio, Input } from "antd";
import useRoom from "hooks/room";
import useSession from "hooks/session";
import Room from "entities/room";
import RoomAPI from "api/room"


export default function PromptCreateRooms(props) {
  const [form] = Form.useForm();
  const mRoom = useRoom();
  const mSession = useSession();


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
      let p = [];
      const formValue = form.getFieldsValue();
      for (let i = 0; i < formValue.roomCount; i++) {
        let roomName = formValue[`roomName ${i + 1}`];
        let maxMamber = formValue[`maxMember ${i + 1}`]
        p.push(mRoom.handleRoomCreation(roomName, maxMamber));
      }
      Promise.all(p).then((response) => {
        // add empty member list
        response.map((data) => {
          data["member"] = [];
        })
        RoomAPI.sendBreakoutRoom(mSession.userSessions[0], response)
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
      getContainer={false}
      forceRender
    >
     <Form
        form={form}
        layout="vertical"
        name="form_in_modal"
        initialValues={{ modifier: 'automatic', roomCount: numberOfRooms }}
      >
        <div>Assign {numberOfParticipants} participants into <Form.Item
          name="roomCount"
          rules={[{ required: true, message: 'Please input the number of breakout rooms!' }]}
          style={{width: "92px", display: "inline-block"}}
        >
          <InputNumber min={1} onChange={handleRoomChange}/>
        </Form.Item> Breakout rooms. </div>
        {[...Array(numberOfRooms)].map((x, i) =>
              <Input.Group compact key={`room ${i+1}`}>
              <Form.Item
              label="Room Name"
              name={`roomName ${i+1}`}
              rules={[{ required: true, message: 'Please input a room name!' }]}
              style={{marginRight: "24px"}}
              initialValue={`Room ${i+1}`}
            >
              <Input/>
            </Form.Item>
              <Form.Item
              label="Max Participants"
              name={`maxMember ${i+1}`}
              rules={[{ required: true, message: 'Please input max participants!' }]}
              initialValue={1}
            >
              <InputNumber min={1} value={1}/>
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
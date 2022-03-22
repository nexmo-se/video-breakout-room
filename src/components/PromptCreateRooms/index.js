import React, { useCallback, useEffect, useState } from "react";
import { Modal, Form, InputNumber, Radio } from "antd";
import useRoom from "hooks/room";
import useSession from "hooks/session";
import Room from "entities/room";


export default function PromptCreateRooms(props) {
  const [form] = Form.useForm();
  const mroom = useRoom();
  const mSession = useSession();


  const { when, onOK, onCancel, title, okText, cancelText } = props;
  const [ numberOfParticipants, setNumberOfParticipants] = useState(mSession.participants.length);
  const [ numberOfRooms, setNumberOfRooms] = useState(1);

    useEffect(() => {
      setNumberOfParticipants(mSession.participants.length);
    }, [mSession.participants.length])

    useEffect(() => {
        if (when) {
          form.setFieldsValue({
            roomCount: numberOfRooms,
            modifier: "automatic"
         });
        }
    }, [when])

    function handleRoomChange(value) {
      setNumberOfRooms(value);
    }

    function handleConfirm() {
      onOK();
      let p = [];
      for (let i = 0; i < numberOfRooms; i++) {
        let roomName = `Room ${i+1}`;
        p.push(mroom.handleRoomCreation(roomName));
      }
      Promise.all(p).then((response) => {
        // add maxmember and empty member list
        response.map((data) => {
          data["member"] = [];
          data["maxMember"] = numberOfParticipants/numberOfRooms
        })
        mSession.session.signal({
          type: "breakout-room",
          data: JSON.stringify(response)
        }); 
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
        initialValues={{ modifier: 'public' }}
      >
        <div>Assign {numberOfParticipants} participants into <Form.Item
          name="roomCount"
          rules={[{ required: true, message: 'Please input the number of breakout rooms!' }]}
          style={{width: "92px", display: "inline-block"}}
        >
          <InputNumber min={1} onChange={handleRoomChange}/>
        </Form.Item> Breakout rooms. </div>
        <Form.Item name="modifier" className="collection-create-form_last-form-item">
          <Radio.Group>
            <Radio style={{display: 'block'}} value="automatic">Assign automatically</Radio>
            <Radio style={{display: 'block'}} value="chooseroom">Let participants choose room</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
      <p>Maximum {Math.ceil(numberOfParticipants/numberOfRooms)} participants per room</p>
    </Modal>
  ) : null;
}
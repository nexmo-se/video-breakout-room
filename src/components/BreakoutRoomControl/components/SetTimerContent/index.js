
import { useState } from 'react';
import { InputNumber, Checkbox } from 'antd';
import Button from 'components/Button';
import MessageAPI from 'api/message';
import useRoom from 'hooks/room';
import useMessage from 'hooks/message';

export default function SetTimerContent({setShowSetTimer}) {

    const [ isManualReturn, setIsManualReturn ] = useState(false);
    const [ period, setPeriod ] = useState(10);
    const [ countDownTimer , setCountDownTimer ] = useState(30);
    const mRoom = useRoom();
    const mMessage = useMessage();

    function handleSetTimer() {
        setShowSetTimer(null);
        MessageAPI.broadcastMsg(mRoom.currentRoom.id, 'count-down-timer', {
            endTime: (new Date().getTime()) + (period * 60 * 1000),
            period,
            countDownTimer,
            isManualReturn

        });
    }
    return (
        <>
        <div style={{marginBottom: "24px"}}>
            Auto close breakout rooms after <InputNumber min={1} value={period} onChange={(value) => setPeriod(value)}/> minutes
        </div>
        <div style={{marginBottom: "24px"}}>
            Count down after <InputNumber min={10} value={countDownTimer} onChange={(value) => setCountDownTimer(value)}/> seconds. 
        </div>
        <p>
        <Checkbox
            checked={isManualReturn}
            onChange={(e) => setIsManualReturn(e.target.checked)}
        >Allow participants to return to main session at any time
        </Checkbox>
        </p>
        <Button text="Set Timer" onClick={handleSetTimer}></Button>
        </>
    )
}
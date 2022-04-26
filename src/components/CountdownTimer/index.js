
import { useEffect, useState } from 'react';
import Alarm from '@material-ui/icons/Alarm';
import useMessage from 'hooks/message';
import useRoom from 'hooks/room';
import useSession from 'hooks/session';
import useNotification from 'hooks/notification';

export default function CountDownTimer({handleChangeRoom}) {
    const [ showCountDownTimer, setShowCountDownTimer ] = useState(false);
    const [ countDown, setCountDown ] = useState(null);
    const [ triggeredTimer, setTriggeredTimer ] = useState();
    const mMessage = useMessage();
    const mRoom = useRoom();
    const mSession = useSession();
    const mNotification = useNotification();

    useEffect(() => {
        if (mMessage.timer && mMessage.timer.endTime > new Date().getTime()) {
            if (triggeredTimer) {
            clearInterval(triggeredTimer);
            }
            const interval = setInterval(() => {
                setCountDown(Math.floor((mMessage.timer.endTime - new Date().getTime())/1000));
            }, 1000);
            setTriggeredTimer(interval)
        }

    }, [mMessage.timer, mRoom.inBreakoutRoom]);

    useEffect(() => {
        if (mSession.user.role === "participant" && !mRoom.inBreakoutRoom && triggeredTimer) {
            return resetTimer();
        }
        if (countDown !== null && countDown <= mMessage.timer.countDownTimer && !showCountDownTimer) {
            setShowCountDownTimer(true);
        }
        if (countDown === 0) {
            resetTimer();
            exitBreakoutRoom();
        }
    }, [countDown])

    function resetTimer() {
        if (triggeredTimer) clearInterval(triggeredTimer);
        setShowCountDownTimer(false);
        setCountDown(null);
        setTriggeredTimer(null);
    }
    function exitBreakoutRoom() {
        if (!mMessage.timer || !mRoom.inBreakoutRoom) return; 
        if (mMessage.timer.isManualReturn) {
            mNotification.openNotification("Breakout Room Session Ended", `Please return to Main Room.`, () => {})
        }
        else if (!mMessage.timer.isManualReturn) {
            mNotification.openNotification("Breakout Room Session Ended", `You will be redirected to main session in 5 seconds.`, () => {handleChangeRoom()})
        }
    }

    if (!showCountDownTimer) {
        return (null)
    }
    return (
        <div style={{position: "absolute", left: "16px", bottom: "16px", color: "white"}}>
            <Alarm style={{fontSize: "32px", verticalAlign: "bottom"}}></Alarm>
        <span  style={{fontSize:"20px"}}> {countDown}s</span></div>
     );
}
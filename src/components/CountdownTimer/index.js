
import { useEffect, useState } from "react"
import Alarm from "@material-ui/icons/Alarm"
import useMessage from "hooks/message";
import useRoom from "hooks/room";
import useSession from "hooks/session";
import useNotification from "hooks/notification";

export default function CountDownTimer({handleChangeRoom}) {
    const [ showCountDownTimer, setShowCountDownTimer ] = useState(false);
    const [ countDown, setCountDown ] = useState(null);
    const [ triggeredTimer, setTriggeredTimer ] = useState();
    const mMessage = useMessage();
    const mRoom = useRoom();
    const mSession = useSession();
    const mNotification = useNotification();

    useEffect(() => {
        if (mMessage.timer && 
            (mSession.user.role === "moderator" || mMessage.cohosts.includes(mSession.user.name) ||(mSession.user.role === "participant" && mRoom.inBreakoutRoom)) && 
            mMessage.timer.endTime > new Date().getTime()) {
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
        if (countDown !== null && countDown <= mMessage.timer.countDownTimer && !showCountDownTimer) {
            setShowCountDownTimer(true);
        }
        if (countDown === 0) {
            setShowCountDownTimer(false);
            clearInterval(triggeredTimer);
            setCountDown(null);
            setTriggeredTimer(null);
            exitBreakoutRoom();
        }
    }, [countDown])

    function exitBreakoutRoom() {
        if (mMessage.timer && mMessage.timer.isManualReturn && mRoom.inBreakoutRoom) {
            mNotification.openNotification("Breakout Room Session Ended", `Please return to Main Room`, () => {})
        }
        else if (mMessage.timer && !mMessage.timer.isManualReturn && mRoom.inBreakoutRoom) {
            mNotification.openNotification("Breakout Room Session Ended", `Please return to Main Room`, () => {handleChangeRoom()})
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
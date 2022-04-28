// @flow
import { useState } from 'react';
import GridView from '@mui/icons-material/GridView';
import ControlButton from 'components/ControlButton';
import PromptCreateRooms from 'components/PromptCreateRooms';

export default function BreakoutRoomButton({...props }){

  const [openPrompt, setOpenPrompt] = useState(false);
  const { isBreakout, setIsBreakout } = props

  function onBreakoutRoomClicked() {
    if (isBreakout) return;  
      setOpenPrompt(true);
    }

  function handleConfirm() {
    setIsBreakout(true);
    setOpenPrompt(false);
    return;
  }

  function handleCancel() {
    setIsBreakout(false);
    setOpenPrompt(false);
      return;
  }
  return (
      <>
    <ControlButton
      active={isBreakout}
      onClick={onBreakoutRoomClicked}
      tooltip="Breakout Room"
      style={{ marginLeft: 8 }}
    >
    <GridView fontSize="inherit"/>
    </ControlButton>
    <PromptCreateRooms
        when={openPrompt}
        onOK={handleConfirm}
        okText="Confirm"
        onCancel={handleCancel}
        cancelText="Cancel"
        title="Create Breakout Rooms"
    />
    </>
  )
}

BreakoutRoomButton.defaultProps = { size: 50, fontSize: 24 }
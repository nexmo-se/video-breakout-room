// @flow

import People from '@mui/icons-material/People';
import ControlButton from "components/ControlButton";
import LiveParticipantList from "components/LiveParticipantList"

export default function ManagePeopleButton({...props }){

  const { isManagePeople, setIsManagePeople } = props

  function onManagePeopleButtonClicked() {
    setIsManagePeople(true);
  }
  
  function onDrawerClose() {
    setIsManagePeople(false);
  }

  return (
      <>
    <ControlButton
      active={isManagePeople}
      onClick={onManagePeopleButtonClicked}
      style={{ marginLeft: 8 }}
    >
    <People fontSize="inherit"/>
    </ControlButton>
    <LiveParticipantList
        onClose={onDrawerClose}
        visible={isManagePeople}
    >
    </LiveParticipantList>
    </>
  )
}

ManagePeopleButton.defaultProps = { size: 50, fontSize: 24 }
import PhoneDisabledIcon from '@material-ui/icons/PhoneDisabled';
import ControlButton from 'components/ControlButton';

function HangupButton(props){

  return (
    <ControlButton
    {...props}
    tooltip="Hang Up"
    >
      <PhoneDisabledIcon fontSize="inherit"/>
    </ControlButton>
  )
}

HangupButton.defaultProps = { size: 50, fontSize: 24 }
export default HangupButton;
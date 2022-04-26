// @flow
import ControlButton from 'components/ControlButton';
import ShareScreenIcon from '@material-ui/icons/ScreenShare';

function ShareScreenButton({ isSharing, ...props }){    
  return (
    <ControlButton 
      {...props}
      active={isSharing}
      tooltip="Share Screen"
    >
      <ShareScreenIcon fontSize="inherit"/>
    </ControlButton>
  )
}

ShareScreenButton.defaultProps = { size: 50, fontSize: 24 }
export default ShareScreenButton;
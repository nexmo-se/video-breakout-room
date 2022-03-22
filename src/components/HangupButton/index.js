import { useState } from "react";
import { motion } from "framer-motion";

import PhoneDisabledIcon from '@material-ui/icons/PhoneDisabled';

function HangupButton(props){
  const { size, fontSize } = props;
  const [ isBig, setIsBig ] = useState(false);

  const styles = { 
    hangup: Object.assign(props.style,{ 
      width: size, height: size, borderRadius: "50%", cursor: "pointer",
      fontSize: fontSize, display: "flex", alignItems: "center", justifyContent: "center"
    })
  }


  const handleMouseEnter = () => setIsBig(true);
  const handleMouseLeave = () => setIsBig(false);
  const handleClick = () => {
    if(props.onClick) props.onClick()
  }

  return (
    <motion.div 
    animate={{scale: isBig? 1.1 : 1}}
    className="Vlt-bg-red Vlt-white" style={styles.hangup}
      onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={handleClick}>
      <PhoneDisabledIcon fontSize="inherit"/>
    </motion.div>
  )
}

HangupButton.defaultProps = { size: 50, fontSize: 24 }
export default HangupButton;
// @flow
import { useState } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import useStyles from './styles';
import { default as Loader } from 'react-spinners/BounceLoader';
import { Tooltip } from 'antd';

function ControlButton({ size=50, fontSize=24, loading, active, onClick, tooltip, className, children, ...props }){
  
  const [ isBig, setIsBig ] = useState(false);
  const mStyles = useStyles({ size, fontSize });

  const handleMouseEnter = () => setIsBig(true);
  const handleMouseLeave = () => setIsBig(false);
  const handleClick = () => {
    if(onClick) onClick();
  }

  return (
    <motion.div 
      {...props}
      animate={{scale: isBig? 1.1 : 1}}
      className={clsx(
        "Vlt-white",
        active && !loading? "Vlt-bg-green": !active && !loading? "Vlt-bg-red": "",
        loading? "Vlt-bg-grey": "",
        mStyles.icon
      )}
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave} 
      onClick={handleClick}
      disabled={loading}
    >
      {loading? <Loader size={fontSize} color="white" />: (
          <Tooltip title={tooltip}>
            <div style={{ zIndex: 99999 }}>
              {children}
            </div>
          </Tooltip>
        )}
    </motion.div>
  )
}

export default ControlButton;
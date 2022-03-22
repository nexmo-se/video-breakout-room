// @flow
import { useState, useEffect } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";


function LiveBadge({ style, className }){
  const [ isVisible, setIsVisible ] = useState(true);

  useEffect(() => {
    function toggleVisible(){
      setIsVisible((isVisible) => !isVisible);
    }

    const intervalID = setInterval(toggleVisible, 1000);
    return function cleanup(){
      clearInterval(intervalID);
    }
  }, [])

  return (
    <div 
      className={clsx(
        "Vlt-badge",
        "Vlt-bg-red",
        "Vlt-badge--large",
        "Vlt-white",
        className
      )}
      style={{ ...style }}
    >
      <motion.span animate={{opacity: isVisible ? 1 : 0}}>⚬</motion.span>&nbsp;LIVE
    </div>
  )
}
export default LiveBadge;
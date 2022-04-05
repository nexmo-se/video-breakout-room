// @flow
import { useState, useEffect } from "react";

import clsx from "clsx";
import useStyles from "./styles";


function LayoutContainer({ id, size, hidden, screen }){
  const [ isBig, setIsBig ] = useState<boolean>(true);
  const mStyles = useStyles();

  useEffect(() => {
    setIsBig(size === "big");
  }, [ size ]);

  return (
    <div id={id} className={clsx(
      mStyles.container,
      mStyles.black,
      (isBig)? mStyles.big: {},
      (hidden)? mStyles.hidden: {},
      (screen)? mStyles.screen: {}
    )}/>
  );
}
export default LayoutContainer;
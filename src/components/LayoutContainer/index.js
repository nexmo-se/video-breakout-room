// @flow
import React from "react";

import clsx from "clsx";
import useStyles from "./styles";


function LayoutContainer({ id, size, hidden, screen }){
  const [ isBig, setIsBig ] = React.useState<boolean>(true);
  const mStyles = useStyles();

  React.useEffect(() => {
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
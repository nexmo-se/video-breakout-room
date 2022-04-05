// @flow
import React from "react";
import useStyles from "./styles";
import CallEnd from '@material-ui/icons/CallEnd'; 

function ThankYouPage () {
  const mStyles = useStyles();

  return (
    <div className={mStyles.container}>
      <div className="Vlt-card">
        <div className="Vlt-card__content">
          <CallEnd className={mStyles.icon}></CallEnd>
          <h1>Call Ended</h1>
        </div>
      </div>
    </div>
  )
}

export default ThankYouPage;
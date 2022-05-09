// @flow
import React from "react";
import { useNavigate } from "react-router-dom";
import useStyles from "./styles";
import CallEnd from '@material-ui/icons/CallEnd'; 
import Button from "components/Button";

function ThankYouPage () {
  const mStyles = useStyles();
  const navigate = useNavigate();

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
import React from 'react';

export default function VonageLogo(props){
    const { style } = props;
    const styles = {
        default: { display: "flex", flexDireciton: "Column", backgroundColor: "rgba(0,0,0,0.3)", padding: "8px"},
        logo: {
            background: `url(${process.env.PUBLIC_URL}/assets/vonage.png)`,
            backgroundPosition: "center", backgroundSize: "contain", height: 50, width: 100,
            backgroundRepeat: "no-repeat"
        }
    }
  return (
    <div style={{ ...styles.default, ...style }}>
      <small style={{ color: "white" }}>Powered By</small>
      <div style={styles.logo}/>
    </div>
  )
}

import React from 'react';

function FullPageLoading(){
  const styles = { 
    default: {
      display: "flex", position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
      alignItems: "center", justifyContent: "center", zIndex: 99, backgroundColor: "rgba(255,255,255,0.5)"
    }
  }
  return(
    <div style={styles.default}>
      <div className="Vlt-spinner"/>
    </div>
  )
}

export default FullPageLoading
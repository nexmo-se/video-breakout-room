// @flow
import { makeStyles } from "@material-ui/styles";
export default makeStyles(() => ({
  visible: { display: "inherit" },
  black: { backgroundColor: "black" }, 
  hidden: { display: "none !important" },
  container: { 
    width: "100vw", 
    height: "100vh", 
    display: "flex", 
    flexDirection: "row" 
  },
  videoControl: { marginTop: 16 },
  leftContainer: { 
    flex: 3, 
    display: "flex",
    position: "relative" 
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 2,
    backgroundColor: "rgba(255, 249, 222,0.8)",
    width: "100%",
    height: "32px",
    paddingLeft: "16px",
    lineHeight: "32px",
  },
  logoContainer: { 
    display: "flex", 
    flexDirection: "column", 
    position: "absolute", 
    top: 32, 
    right: 32, 
    zIndex: 2, 
    justifyContent: "center", 
    alignItems: "flex-end"
  },
  rightContainer: { 
    flex: 1, 
    borderLeft: "1px solid #e7ebee",
    display: "flex", 
    flexDirection: "column"
  },
  layoutContainer: { 
    width: "100%", 
    height: "100%", 
    zIndex: 0
  },
  chatContainer: { 
    flex: 3, 
    display: "flex", 
    flexDirection: "column", 
    padding: 16, 
    overflowY: "scroll" 
  },
  smallVideoContainer: {
    height: "20%",
    width: "70%",
    position: "absolute",
    bottom: 0,
    "& div": {
      marginLeft: 8,
      marginRight: 8,
      borderRadius: "25%",
      height: "150px !important",
      width: "150px !important",
      overflow: "none",
      flexGrow: 0,
      flexBasis: "unset"
    },
    "& div > .OT_bar": { display: "none" },
    "& div > .OT_name": { display: "none" }
  }
}))
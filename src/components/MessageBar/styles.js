// @flow
import { makeStyles } from "@material-ui/styles";
export default makeStyles(() => ({
  container: {
    position: "absolute",
    top: 32, 
    left: 32,
    zIndex: 2,
    minWidth: 256,
    maxHeight: 256,
    padding: 0,
    overflowX: "auto"
  }
}));
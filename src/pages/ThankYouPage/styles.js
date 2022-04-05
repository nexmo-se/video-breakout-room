import { makeStyles } from "@material-ui/core";
export default makeStyles(
  (theme) => ({
    container: {
      margin: "0 auto",
      width: "40vw",
      textAlign: "center",
      marginTop: theme.spacing(10)
    },
    icon: {
        fontSize: "80px"
    }
  }),
  { index: 1 }
)
import { makeStyles } from "@material-ui/styles";
export default makeStyles(() => ({
    root: {
        position: "absolute",
        top: 150,
        left: 520,
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "16px",
        minWidth: "200px",
        minHeight: "100px",
        zIndex: 5,
        boxShadow: "4px 4px rgba(0,0,0,0.1)"
    },
    header: {
        textAlign: "center"
    }
}))
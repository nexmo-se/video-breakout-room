import VonageLogo from "components/VonageLogo";
import Button from "components/Button";
import { useNavigate } from "react-router-dom";
import useStyles from "./styles"

export default function IndexPage() {
    const mStyles = useStyles();
    const navigate = useNavigate();

    return (
        <>
            <div className={mStyles.container}>
                <VonageLogo
                style={{
                    position: "absolute",
                    bottom: 32,
                    right: 32,
                    zIndex: 2,
                }}
                />
                <br />
                <h4>
                Please use the links below to get to the pages for the appropriate
                roles.
                </h4>
                <br />
                <Button         
                    text="Moderator"
                    onClick={() => {
                    navigate("/moderator");
                }}/>
                <Button         
                    text="Participant"
                    onClick={() => {
                    navigate("/participant");
                }}/>
             </div>        
        </>
    )


}

import clsx from "clsx";

export default function Button(props){
    const { text, style, hierarchy } = props;
  
    const handleClick = (e) => {
      e.preventDefault();
      if(props.onClick) props.onClick();
    }
    const buttonType =  hierarchy? hierarchy : "primary";
    return <button className={clsx("Vlt-btn Vlt-btn--app" , "Vlt-btn--" + buttonType)} style={style} onClick={handleClick} type="submit">{text}</button>
}
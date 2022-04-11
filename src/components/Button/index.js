
import clsx from 'clsx';

export default function Button(props){
    const { text, style, hierarchy, value} = props;
  
    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if(props.onClick) props.onClick(e);
    }
    const buttonType =  hierarchy? hierarchy : "primary";
    return <button className={clsx("Vlt-btn Vlt-btn--app" , "Vlt-btn--" + buttonType)} value={value} style={style} onClick={handleClick} type="submit">{text}</button>
}
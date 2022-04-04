import React from "react";

export default function TextInput(props){
  const { text, placeholder, style, type="text", label } = props;

  const handleChange = (e) => {
    if(props.onChange) props.onChange(e.target.value);
  }

  return(
    <div className="Vlt-form__element" style={style}>
      <div className="Vlt-input">
        {label? 
        <label>{label}</label>
        : null}
        <input value={text} onChange={handleChange} type={type} placeholder={placeholder} id="ex-input"/>
      </div>
    </div>  
  )
}

TextInput.defaultProps = { placeholder: "Say something..." }

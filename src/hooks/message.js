// @flow
import { useContext } from "react";
import { MessageContext } from "contexts/message";

export default function useMessage(){
  return useContext(MessageContext);
}
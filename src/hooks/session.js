// @flow
import { useContext } from "react";
import { SessionContext } from "contexts/session";

export default function useSession(){
  return useContext(SessionContext);
}
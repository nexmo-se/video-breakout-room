// @flow
import { useContext } from "react";
import { RoomContext } from "contexts/room";

export default function useRoom(){
  return useContext(RoomContext);
}
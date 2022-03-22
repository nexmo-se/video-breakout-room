// @flow
import React from "react";
import { RoomContext } from "contexts/room";

export default function useRoom(){
  return React.useContext(RoomContext);
}
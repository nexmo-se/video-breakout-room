// @flow
import Room from "entities/room";

export default class RoomAPI{
  static async generateSession(roomName="room", data={}){
    const url = new URL(window.location.href);
    // const apiURL = `${url.protocol}//${url.hostname}:${url.port}/room/${config.roomName}/info`; // TODO:!
    const apiURL = `http://localhost:3002/room/${roomName}/createSession`;
    const jsonResult = await (await fetch(apiURL, {
      method: "POST", headers: { "Content-Type": "application/JSON" },
      body: JSON.stringify({ data })
    })).json();
    const room = new Room(jsonResult.apiKey, jsonResult.name, jsonResult.sessionId);
    return room;
  }
}
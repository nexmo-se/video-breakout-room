// @flow
import Room from "entities/room";

const url = new URL(window.location.href);
const serverPath = process.env.REACT_APP_API_URL || `${url.protocol}//${url.hostname}:${url.port}`;

export default class RoomAPI{

  static async getRoomInfo(roomId, data={}){

    const apiURL = `${serverPath}/room/${roomId}/info`;
    const jsonResult = await (await fetch(apiURL, {
      method: "GET", headers: { "Content-Type": "application/JSON" },
    })).json();

    return jsonResult;
  }

  static async getParticipants(roomId){

    const apiURL = `${serverPath}/room/${roomId}/participants`;

    const jsonResult = await (await fetch(apiURL, {
      method: "GET", headers: { "Content-Type": "application/JSON" },
    })).json();

    return jsonResult;
  }

  static async getBreakoutRooms(roomId){

    const apiURL = `${serverPath}/room/${roomId}/getBreakoutRooms`;

    const jsonResult = await (await fetch(apiURL, {
      method: "GET", headers: { "Content-Type": "application/JSON" },
    })).json();

    return jsonResult;
  }

  static async generateSession(mainRoom, data){

    const apiURL = `${serverPath}/room/${mainRoom}/createSession`;
    const jsonResult = await (await fetch(apiURL, {
      method: "POST", headers: { "Content-Type": "application/JSON" },
      body: JSON.stringify(data)
    })).json();
    let breakoutRoomList = [];
    breakoutRoomList.push(new Room(mainRoom, mainRoom, jsonResult.sessionId, null))
    jsonResult.breakoutRooms.forEach((room) => {
      breakoutRoomList.push(new Room(room.id, room.name, room.sessionId, room.maxParticipants))
    });
    return breakoutRoomList;
  }

  static async removeAllBreakoutRooms(roomId){

    const apiURL = `${serverPath}/room/${roomId}/breakoutrooms`;
    const jsonResult = await (await fetch(apiURL, {
      method: "DELETE", headers: { "Content-Type": "application/JSON" },
    })).json();
    const removedRoom = new Room(jsonResult.id, jsonResult.name, jsonResult.sessionId)
    return removedRoom;
  }

  static async removeBreakoutRoom(roomId){

    const apiURL = `${serverPath}/room/${roomId}`;

    const jsonResult = await (await fetch(apiURL, {
      method: "DELETE", headers: { "Content-Type": "application/JSON" },
    })).json();
    return jsonResult;
  }

  static async renameRoom(roomId, newRoomName){

    const apiURL = `${serverPath}/room/${roomId}/renameRoom`;
    const jsonResult = await (await fetch(apiURL, {
      method: "POST", headers: { "Content-Type": "application/JSON" },
      body: JSON.stringify({ data: {name: newRoomName} })
    })).json();
    const room = new Room(jsonResult.id, jsonResult.name, jsonResult.sessionId, jsonResult.maxParticipants);
    return Promise.resolve(room);
  }

  static async updateRoom(roomId, maxParticipants){

    const apiURL = `${serverPath}/room/${roomId}/update`;
    const jsonResult = await (await fetch(apiURL, {
      method: "POST", headers: { "Content-Type": "application/JSON" },
      body: JSON.stringify({ data: {maxParticipants} })
    })).json();
    const room = new Room(jsonResult.id, jsonResult.name, jsonResult.sessionId, jsonResult.maxParticipants);
    return Promise.resolve(room);
  };

  static async updateParticipant(roomId, data= {}) {
    if (undefined === roomId) return null;

    const apiURL = `${serverPath}/room/${roomId}/updateParticipant`;

    return fetch(apiURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      keepalive: true
    })
    .then(res => res.json())
    .then(res => {
      return Promise.resolve(res);
    })
    .catch(error => {
        console.error(`HTTP error!!`, this.url, error);
        return Promise.resolve(null);
    });
  }

  static async moveParticipant(roomId, type, data= {}) {
    if (undefined === roomId) return null;

    const apiURL = `${serverPath}/room/${roomId}/moveParticipant`;
    data.type = type;
    const jsonResult = await (await fetch(apiURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })).json();

    return jsonResult;
  }

}
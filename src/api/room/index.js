// @flow
import Room from "entities/room";

export default class RoomAPI{

  static async getRoomInfo(roomId, data={}){
    const url = new URL(window.location.href);
    const apiURL = `${url.protocol}//${url.hostname}:${url.port}/room/${roomId}/info`;

    const jsonResult = await (await fetch(apiURL, {
      method: "GET", headers: { "Content-Type": "application/JSON" },
    })).json();

    return jsonResult;
  }

  static async getParticipants(roomId){
    const url = new URL(window.location.href);
    const apiURL = `${url.protocol}//${url.hostname}:${url.port}/room/${roomId}/participants`;

    const jsonResult = await (await fetch(apiURL, {
      method: "GET", headers: { "Content-Type": "application/JSON" },
    })).json();

    return jsonResult;
  }

  static async generateSession(mainRoom, data){
    const url = new URL(window.location.href);
    const apiURL = `${url.protocol}//${url.hostname}:${url.port}/room/${mainRoom}/createSession`;

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
    const url = new URL(window.location.href);
    const apiURL = `${url.protocol}//${url.hostname}:${url.port}/room/${roomId}/breakoutrooms`;

    const jsonResult = await (await fetch(apiURL, {
      method: "DELETE", headers: { "Content-Type": "application/JSON" },
    })).json();
    const removedRoom = new Room(jsonResult.id, jsonResult.name, jsonResult.sessionId)
    return removedRoom;
  }

  static async removeBreakoutRoom(roomId){
    const url = new URL(window.location.href);
    const apiURL = `${url.protocol}//${url.hostname}:${url.port}/room/${roomId}`;

    const jsonResult = await (await fetch(apiURL, {
      method: "DELETE", headers: { "Content-Type": "application/JSON" },
    })).json();
    return jsonResult;
  }

  static async renameRoom(roomId, newRoomName){
    const url = new URL(window.location.href);
    const apiURL = `${url.protocol}//${url.hostname}:${url.port}/room/${roomId}/renameRoom`;

    const jsonResult = await (await fetch(apiURL, {
      method: "POST", headers: { "Content-Type": "application/JSON" },
      body: JSON.stringify({ data: {name: newRoomName} })
    })).json();
    const room = new Room(jsonResult.id, jsonResult.name, jsonResult.sessionId, jsonResult.maxParticipants);
    return Promise.resolve(room);
  }

  static async updateRoom(roomId, maxParticipants){
    const url = new URL(window.location.href);
    const apiURL = `${url.protocol}//${url.hostname}:${url.port}/room/${roomId}/update`;

    const jsonResult = await (await fetch(apiURL, {
      method: "POST", headers: { "Content-Type": "application/JSON" },
      body: JSON.stringify({ data: {maxParticipants} })
    })).json();
    const room = new Room(jsonResult.id, jsonResult.name, jsonResult.sessionId, jsonResult.maxParticipants);
    return Promise.resolve(room);
  };

  static async updateParticipant(roomId, data= {}) {
    if (undefined === roomId) return null;

    const url = new URL(window.location.href);
    const apiURL = `${url.protocol}//${url.hostname}:${url.port}/room/${roomId}/updateParticipant`;

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

  static async joinBreakoutRoom(roomId, type, data= {}) {
    if (undefined === roomId) return null;

    const url = new URL(window.location.href);
    const apiURL = `${url.protocol}//${url.hostname}:${url.port}/room/${roomId}/joinBreakoutRoom`;
    data.type = type;
    const jsonResult = await (await fetch(apiURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })).json();

    return jsonResult;
  }

  static async moveParticipant(roomId, type, data= {}) {
    if (undefined === roomId) return null;

    const url = new URL(window.location.href);
    const apiURL = `${url.protocol}//${url.hostname}:${url.port}/room/${roomId}/moveParticipant`;
    data.type = type;
    const jsonResult = await (await fetch(apiURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })).json();

    return jsonResult;
  }

}
// @flow
import Room from "entities/room";

export default class RoomAPI{

  static async getRoomInfo(roomId, data={}){
    // const url = new URL(window.location.href);
    // const apiURL = `${url.protocol}//${url.hostname}:${url.port}/room/${config.roomName}/info`; // TODO:!
    const apiURL = `http://localhost:3002/room/${roomId}/info`;
    const jsonResult = await (await fetch(apiURL, {
      method: "GET", headers: { "Content-Type": "application/JSON" },
    })).json();
    const mainRoom = new Room(jsonResult.apiKey, jsonResult.id, jsonResult.name, jsonResult.sessionId)
    let breakoutRooms = [];
    if ( jsonResult.breakoutRooms) jsonResult.breakoutRooms.forEach((room) => {
      breakoutRooms.push(new Room(jsonResult.apiKey, room.id, room.name, room.sessionId, room.maxParticipants))
    });
    return {mainRoom, breakoutRooms};
  }

  static async generateSession(mainRoom, breakoutRooms=[]){
    // const url = new URL(window.location.href);
    // const apiURL = `${url.protocol}//${url.hostname}:${url.port}/room/${config.roomName}/info`; // TODO:!
    const apiURL = `http://localhost:3002/room/${mainRoom}/createSession`;
    const jsonResult = await (await fetch(apiURL, {
      method: "POST", headers: { "Content-Type": "application/JSON" },
      body: JSON.stringify(breakoutRooms)
    })).json();
    let breakoutRoomList = [];
    jsonResult.breakoutRooms.forEach((room) => {
      breakoutRoomList.push(new Room(jsonResult.apiKey, room.id, room.name, room.sessionId, room.maxParticipants))
    });
    return breakoutRoomList;
  }

  static async removeAllBreakoutRooms(roomId){
    // const url = new URL(window.location.href);
    // const apiURL = `${url.protocol}//${url.hostname}:${url.port}/room/${config.roomName}/info`; // TODO:!
    const apiURL = `http://localhost:3002/room/${roomId}/breakoutrooms`;
    const jsonResult = await (await fetch(apiURL, {
      method: "DELETE", headers: { "Content-Type": "application/JSON" },
    })).json();
    const removedRoom = new Room(jsonResult.apiKey, jsonResult.id, jsonResult.name, jsonResult.sessionId)
    return removedRoom;
  }

  static async removeBreakoutRoom(roomId){
    // const url = new URL(window.location.href);
    // const apiURL = `${url.protocol}//${url.hostname}:${url.port}/room/${config.roomName}/info`; // TODO:!
    const apiURL = `http://localhost:3002/room/${roomId}`;
    const jsonResult = await (await fetch(apiURL, {
      method: "DELETE", headers: { "Content-Type": "application/JSON" },
    })).json();
    return jsonResult;
  }

  static async renameRoom(roomId, newRoomName){
    // const url = new URL(window.location.href);
    // const apiURL = `${url.protocol}//${url.hostname}:${url.port}/room/${config.roomName}/info`; // TODO:!
    const apiURL = `http://localhost:3002/room/${roomId}/renameRoom`;
    const jsonResult = await (await fetch(apiURL, {
      method: "POST", headers: { "Content-Type": "application/JSON" },
      body: JSON.stringify({ data: {name: newRoomName} })
    })).json();
    const room = new Room(jsonResult.apiKey, jsonResult.id, jsonResult.name, jsonResult.sessionId, jsonResult.maxParticipants);
    return Promise.resolve(room);
  }

  static async updateRoom(roomId, maxParticipants){
    // const url = new URL(window.location.href);
    // const apiURL = `${url.protocol}//${url.hostname}:${url.port}/room/${config.roomName}/info`; // TODO:!
    const apiURL = `http://localhost:3002/room/${roomId}/update`;
    const jsonResult = await (await fetch(apiURL, {
      method: "POST", headers: { "Content-Type": "application/JSON" },
      body: JSON.stringify({ data: {maxParticipants} })
    })).json();
    const room = new Room(jsonResult.apiKey, jsonResult.id, jsonResult.name, jsonResult.sessionId, jsonResult.maxParticipants);
    return Promise.resolve(room);
  }

  static async sendBreakoutRoom(session, breakoutRoom){
    await new Promise((resolve, reject) => {
      session.signal({
        type: "breakout-room",
        data: JSON.stringify(breakoutRoom)
      }, (err) => {
        if(err) reject(err);
        else resolve();
      });
    })
  };

  static async sendCountDownTimer(session, timer){
    await new Promise((resolve, reject) => {
      session.signal({
        type: "count-down-timer",
        data: JSON.stringify(timer)
      }, (err) => {
        if(err) reject(err);
        else resolve();
      });
    })
  };
}
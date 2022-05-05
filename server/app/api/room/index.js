const OT = require("@app/entities/ot");
const Room = require("@app/entities/room");
const CustomError = require("@app/entities/error");
const DatabaseAPI = require("@app/api/database");

class RoomAPI{

  static parseQueryResponse(queryResponse){
    return queryResponse.rows.map((response) => Room.fromDatabase(response))
  }

  /**
   * 
   * @param {Room} room 
   */
  static async createRoom(room){
    await DatabaseAPI.query(async (client) => {
      var { id, name, sessionId, mainRoomId, maxParticipants } = room;
      await client.query("INSERT INTO rooms(id, name, session_id, main_room_id, max_participants) " 
                                  + "VALUES($1, $2, $3, $4, $5)", 
                                           [ id, name, sessionId, mainRoomId, maxParticipants ]);
    });
  }

  static async renameRoom(room, newRoomName){
    try {
      await DatabaseAPI.query(async (client) => {
        await client.query("UPDATE rooms SET name = $1 WHERE id = $2 ", [ newRoomName, room.id ]);
      });
      const [ selectedRoom ] = await RoomAPI.getDetailById(room);
      return Promise.resolve(selectedRoom);
    } catch(err) {
      throw err;
    }
  }

   static async updateRoom(room, newMaxParticipants){
    try {
      await DatabaseAPI.query(async (client) => {
        await client.query("UPDATE rooms SET max_participants = $1 WHERE id = $2 ", [ newMaxParticipants, room.id ]);
      });
      const [ selectedRoom ] = await RoomAPI.getDetailById(room);
      return Promise.resolve(selectedRoom);
    } catch(err) {
      throw err;
    }
  }

  static async generateSession(room){
    const isExists = await RoomAPI.isExistsById(room);
    if(!isExists){
      return new Promise((resolve, reject) => {
        OT.opentok.createSession({ mediaMode: "routed" }, async (err, session) => {
          if(err) reject(new CustomError("room/err", err.message));
          else {
            room.name = room.name ?? room.id;
            room.sessionId = session.sessionId;
            await RoomAPI.createRoom(room);
            const [ newRoom ] = await RoomAPI.getDetailById(room);
            resolve(newRoom);
          }
        });
      });
    }else{
      const [ selectedRoom ] = await RoomAPI.getDetailById(room);
      return Promise.resolve(selectedRoom);
    }
  }

  static async getDetailById(room){
    return await DatabaseAPI.query(async (client) => {
      const queryResponse = await client.query("SELECT * FROM rooms WHERE id = $1", [ room.id ]);
      if(queryResponse.rowCount === 0) throw new CustomError("room/not-found", "Cannot find room");
      else return Promise.resolve(RoomAPI.parseQueryResponse(queryResponse));
    })
  }

  static async isExistsById(room){
    try{
      await RoomAPI.getDetailById(room);
      return Promise.resolve(true);
    }catch(err){
      if(err.code === "room/not-found") return Promise.resolve(false);
      else throw err;
    }
  }

  static async sendingSignal(sessionId, payload) {
    return new Promise((resolve, reject) => {
      return OT.opentok.signal(sessionId, null, payload, async function (error) {
        // --- do not throw out error
        // if (error) reject(new CustomError("room/error-signal", error.message));
        if (error) resolve(error.message);
        else resolve(true);
      });
    });
  }

  static async getBreakoutRooms(room) {
    return await DatabaseAPI.query(async (client) => {
      const queryResponse = await client.query("SELECT * FROM rooms WHERE main_room_id = $1", [ room.id ]);
      if (queryResponse.rowCount === 0) return null;
      else return Promise.resolve(RoomAPI.parseQueryResponse(queryResponse));
    })
  }

  static async deleteRoom(room) {
    try {
      await DatabaseAPI.query(async (client) => {
        await client.query("DELETE FROM rooms WHERE id = $1 ", [ room.id ]);
      });
      return Promise.resolve(true);
    } catch(err) {
      throw err;
    }
  }

  static async delBreakoutRooms(room) {
    try {
      await DatabaseAPI.query(async (client) => {
        await client.query("DELETE FROM rooms WHERE main_room_id = $1 ", [ room.id ]);
      });
      const [ selectedRoom ] = await RoomAPI.getDetailById(room);
      selectedRoom.breakoutRooms = await RoomAPI.getBreakoutRooms(room);
      return Promise.resolve(selectedRoom);
    } catch(err) {
      throw err;
    }
  }

  static async getAllMainRooms() {
    return await DatabaseAPI.query(async (client) => {
      const queryResponse = await client.query("SELECT * FROM rooms WHERE main_room_id ISNULL");
      if (queryResponse.rowCount === 0) return null;
      else return Promise.resolve(RoomAPI.parseQueryResponse(queryResponse));
    })
  }

  static async getRoomBySessionId(sessionId) {
    return await DatabaseAPI.query(async (client) => {
      const queryResponse = await client.query("SELECT * FROM rooms WHERE session_id = $1", [ sessionId ]);
      if (queryResponse.rowCount === 0) return null;
      else return Promise.resolve(RoomAPI.parseQueryResponse(queryResponse));
    })
  }

  static async generateSessionBreakoutRoom(breakoutRooms, mainRoom) {
    try {
      for (var i = 0; i < breakoutRooms.length; i++) {
        let _id = breakoutRooms[i].id ?? breakoutRooms[i].name.replace(/[^a-zA-Z0-9]/g, '');
        _id = mainRoom.id + "-" + _id.slice(0, 1).toLowerCase().concat(_id.slice(1));
        let _roomSub = new Room({
            id: _id,
            name: breakoutRooms[i].name,
            mainRoomId: mainRoom.id,
            maxParticipants: breakoutRooms[i].maxParticipants
        });
        await RoomAPI.generateSession(_roomSub);
      }
      return Promise.resolve(true);
    }
    catch(err) {
      console.error(err);
      return Promise.resolve(false);
    }
  }

  static async getRelatedSessions(room) {
    try {
      const sessions = [];

      if (room.mainRoomId !== null) {
        let _room = new Room(room.mainRoomId);
        [ room ] =  await RoomAPI.getDetailById(_room);
      }
      room.breakoutRooms = await RoomAPI.getBreakoutRooms(room);

      sessions.push(room.sessionId);

      if (room.breakoutRooms) {
        room.breakoutRooms.forEach(e => {
          sessions.push(e.sessionId)
        });
      }
      return Promise.resolve(sessions);
    }
    catch(err) {
      console.error(err);
      return Promise.resolve(false);
    }
  }

  static async broadcastMsg(sessions, type = 'raise-hand', data = 'Hello') {
    try {
      const res = [];
      for (var i = 0; i < sessions.length; i++) {
        let payload = {
          type: type,
          data: JSON.stringify(data)
        }
        let _res = await RoomAPI.sendingSignal(sessions[i], payload);
        res.push([_res, sessions[i], payload])
        // break;
      }
      return Promise.resolve(res);
    }
    catch(err) {
      console.error(err);
      return Promise.resolve(false);
    }
  }
}

module.exports = RoomAPI;
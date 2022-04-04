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

  /**
   * Update first, then Select again
   */
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

  static async generateSessionBreakoutRoom(breakoutRooms, mainRoom) {
    try {
      for (var i = 0; i < breakoutRooms.length; i++) {
        let _id = breakoutRooms[i].id ?? breakoutRooms[i].name.replace(/[^a-zA-Z0-9]/g, '');
        _id = mainRoom.id + "-" + _id.slice(0, 1).toLowerCase().concat(_id.slice(1));
        let _roomSub = new Room({id: _id, name: breakoutRooms[i].name, mainRoomId: mainRoom.id, maxParticipants: breakoutRooms[i].maxParticipants });
        await RoomAPI.generateSession(_roomSub);
      }
      return Promise.resolve(true);
    }
    catch(err) {
      console.error(err);
      return Promise.resolve(false);
    }
  }

}

module.exports = RoomAPI;
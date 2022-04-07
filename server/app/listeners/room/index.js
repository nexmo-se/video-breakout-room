const RoomAPI = require("@app/api/room");
const UserAPI = require("@app/api/user");
const User = require("@app/entities/user");
const Room = require("@app/entities/room");

class RoomListener{
  static async info(req, res){
    try{
      const { roomId } = req.params ?? 'demoRoom';
      // const { role } = req.body ?? "publisher";
      // const { data } = req.body ?? {};

      //const user = new User(role);
      const room = new Room(roomId);
      
      const generatedRoom = await RoomAPI.generateSession(room);
      //const generatedUser = await UserAPI.generateToken(generatedRoom, user, data);
      
      generatedRoom.breakoutRooms = await RoomAPI.getBreakoutRooms(room);

      if (generatedRoom.breakoutRooms) {
        generatedRoom.breakoutRooms.sort((a,b) =>  {
        let fa = a.name.toLowerCase(),
        fb = b.name.toLowerCase();

        if (fa < fb) {
            return -1;
        }
        if (fa > fb) {
            return 1;
        }
        return 0;
      });
    }

      res.json({ 
        apiKey: process.env.API_KEY, 
        //token: generatedUser.token, 
        ...generatedRoom
      });
    }catch(err){
      console.error(err.stack);
      res.status(500).end(err.message);
    }
  }

  /**
   * create sessions for a main room
   */
  static async createSession(req, res) {
    try {
      const { roomId } = req.params ?? "demoRoom";
      const { roomName } = req.body ?? roomId;
      const { breakoutRooms } = req.body ?? [];
      
      const room = new Room({ id: roomId, name: roomName });
      const generatedRoom = await RoomAPI.generateSession(room);
      // ---
      await RoomAPI.generateSessionBreakoutRoom(breakoutRooms, generatedRoom);
      generatedRoom.breakoutRooms = await RoomAPI.getBreakoutRooms(generatedRoom);

      return res.json({ 
        apiKey: process.env.API_KEY, ...generatedRoom
      });
    } catch(err) {
      console.error(err.stack);
      res.status(500).end(err.message);
    }
  }

  static async generateToken(req, res){
    try{
      const { roomId } = req.params;
      const { role } = req.body ?? "publisher";
      const { data } = req.body ?? {};

      if ( undefined === roomId ) throw new Error("Empty params");

      const user = new User(role);
      const room = new Room(roomId);

      const [ selectedRoom ] = await RoomAPI.getDetailById(room);
      const generatedUser = await UserAPI.generateToken(selectedRoom, user, data);

      res.json({ 
        token: generatedUser.token,
        apiKey: process.env.API_KEY, ...selectedRoom
      });
    }catch(err){
      console.error(err.stack);
      res.status(500).end(err.message);
    }
  }

  static async renameRoom(req, res) {
    try {
      const { roomId } = req.params;
      const { data } = req.body;
      const { name:newRoomName } = data;

      if ( undefined === roomId ) throw new Error("Empty params");

      if ( !newRoomName ) throw new Error( "You need to set a new name" )

      const room = new Room(roomId);

      const updatedRoom = await RoomAPI.renameRoom(room, newRoomName);

      res.json({
        apiKey: process.env.API_KEY, ...updatedRoom
      });
    } catch(err) {
      console.error(err.stack);
      res.status(500).end(err.message);
    }
  }

  static async updateRoom(req, res) {
    try {
      const { roomId } = req.params;
      const { data } = req.body;
      const { maxParticipants:newMaxParticipants } = data;

      const room = new Room(roomId);

      const updatedRoom = await RoomAPI.updateRoom(room, newMaxParticipants);

      res.json({
        apiKey: process.env.API_KEY, ...updatedRoom
      });
    } catch(err) {
      console.error(err.stack);
      res.status(500).end(err.message);
    }
  }


  static async deleteRoom(req, res, next) { 
    try {
      const { roomId } = req.params;

      const room = new Room(roomId);

      await RoomAPI.deleteRoom(room);
      
      res.json(["Room is deleted"]);
    } catch(err) {
      console.error(err.stack);
      res.status(500).end(err.message);
    }
  }
  
  static async delBreakoutRooms(req, res, next) { 
    try {
      const { roomId } = req.params;

      const room = new Room(roomId);

      const updatedRoom = await RoomAPI.delBreakoutRooms(room);
      
      res.json({
        apiKey: process.env.API_KEY, ...updatedRoom
      });
    } catch(err) {
      console.error(err.stack);
      res.status(500).end(err.message);
    }
  }

  static async getAllMainRooms(req, res, next) { 
    try {
      const rooms = await RoomAPI.getAllMainRooms();

      res.json({
        apiKey: process.env.API_KEY, 
        rooms: rooms
      });
    } catch(err) {
      console.error(err.stack);
      res.status(500).end(err.message);
    }
  }

  static async broadcast(req, res, next) {
    try {
      const { roomId } = req.params;
      const { data } = req.body;
      const { type } = data ?? "raise-hand";

      if ( undefined === roomId ) throw new Error("Empty params");

      var room = new Room(roomId);
      var [ selectedRoom ] = await RoomAPI.getDetailById(room);

      data.fromRoom = {
        id: selectedRoom.id,
        name: selectedRoom.name ?? selectedRoom.id
      };

      var relatedSessions = await RoomAPI.getRelatedSessions(selectedRoom);
      var tempRes = await RoomAPI.broadcastMsg(relatedSessions, type, data);

      // console.log(tempRes)
      
      res.json({
        apiKey: process.env.API_KEY,
        tempRes
      });
    } catch(err) {
      console.error(err.stack);
      res.status(500).end(err.message);
    }
  }

}
module.exports = RoomListener;
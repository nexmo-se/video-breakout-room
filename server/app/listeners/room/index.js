const RoomAPI = require("@app/api/room");
const UserAPI = require("@app/api/user");
const User = require("@app/entities/user");
const Room = require("@app/entities/room");

class RoomListener{
  static async info(req, res){
    try{
      const { roomId } = req.params;
      const { role } = req.body ?? "publisher";
      const { data } = req.body ?? {};

      //const user = new User(role);
      const room = new Room(roomId);
      
      const generatedRoom = await RoomAPI.generateSession(room);
      //const generatedUser = await UserAPI.generateToken(generatedRoom, user, data);
      generatedRoom.breakoutRooms = await RoomAPI.getBreakoutRooms(room);

      res.json({ 
        apiKey: process.env.API_KEY, 
        //token: generatedUser.token, 
        id: generatedRoom.id,
        name: generatedRoom.name,
        sessionId: generatedRoom.sessionId,
        breakoutRooms: generatedRoom.breakoutRooms
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
        apiKey: process.env.API_KEY, 
        id: generatedRoom.id, 
        name: generatedRoom.name, 
        sessionId: generatedRoom.sessionId,
        breakoutRooms: generatedRoom.breakoutRooms
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

      const user = new User(role);
      const room = new Room(roomId);

      const [ selectedRoom ] = await RoomAPI.getDetailById(room);
      const generatedUser = await UserAPI.generateToken(selectedRoom, user, data);

      res.json({ 
        token: generatedUser.token,
        apiKey: process.env.API_KEY, 
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
        sessionId: selectedRoom.sessionId
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

      if (!newRoomName) throw new Error( "You need to set a new name" )

      const room = new Room(roomId);

      const updatedRoom = await RoomAPI.renameRoom(room, newRoomName);

      res.json({
        apiKey: process.env.API_KEY, 
        id: updatedRoom.id,
        name: updatedRoom.name,
        sessionId: updatedRoom.sessionId
      });
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
        apiKey: process.env.API_KEY, 
        id: updatedRoom.id,
        name: updatedRoom.name,
        breakoutRooms: updatedRoom.breakoutRooms
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

}
module.exports = RoomListener;
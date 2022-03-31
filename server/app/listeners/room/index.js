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

      const user = new User(role);
      const room = new Room(roomId);
      
      const generatedRoom = await RoomAPI.generateSession(room);
      const generatedUser = await UserAPI.generateToken(generatedRoom, user, data);
      const breakoutRooms = await RoomAPI.getBreakoutRooms(room);

      res.json({ 
        apiKey: process.env.API_KEY, 
        token: generatedUser.token, 
        sessionId: generatedRoom.sessionId,
        id: room.id,
        name: room.name,
        breakoutRooms: breakoutRooms
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
      
      const roomMain = new Room({ id: roomId, name: roomName });
      const sessionMain = await RoomAPI.generateSession(roomMain);

      for (var i = 0; i < breakoutRooms.length; i++) {
        let _roomSub = new Room({ name: breakoutRooms[i].name, mainRoomId: roomMain.id });
        await RoomAPI.generateSession(_roomSub);
      }
      
      const newBreakoutRooms = await RoomAPI.getBreakoutRooms(roomMain);

      return res.json({ 
        apiKey: process.env.API_KEY, 
        id: roomMain.id, 
        name: roomMain.name, 
        sessionId: sessionMain.sessionId,
        breakoutRooms: newBreakoutRooms
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

      const newRoom = await RoomAPI.renameRoom(room, newRoomName);

      res.json({
        apiKey: process.env.API_KEY, 
        id: newRoom.name,
        name: newRoom.id,
        sessionId: newRoom.sessionId
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

      const newRoom = await RoomAPI.delBreakoutRooms(room);
      
      res.json({
        apiKey: process.env.API_KEY, 
        id: newRoom.id,
        name: newRoom.name,
        breakoutRooms: newRoom.breakoutRooms
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
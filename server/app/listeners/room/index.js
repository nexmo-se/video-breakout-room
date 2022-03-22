const RoomAPI = require("@app/api/room");
const UserAPI = require("@app/api/user");
const User = require("@app/entities/user");
const Room = require("@app/entities/room");

class RoomListener{
  static async info(req, res){
    try{
      const { roomId } = req.params;
      const { role } = req.body;
      const data = (req.body.data)? req.body.data: {};

      const user = new User(role);
      const room = new Room(roomId);
      
      const generatedRoom = await RoomAPI.generateSession(room);
      const generatedUser = await UserAPI.generateToken(generatedRoom, user, data);
      res.json({ apiKey: process.env.API_KEY, token: generatedUser.token, sessionId: generatedRoom.sessionId});
    }catch(err){
      console.log(err.stack);
      res.status(500).end();
    }
  }

  static async createSession(req, res){
    try{
      const { roomId } = req.params;
      const room = new Room(roomId);
      const generatedRoom = await RoomAPI.generateSession(room);
      res.json({ apiKey: process.env.API_KEY, name: roomId, sessionId: generatedRoom.sessionId});
    }catch(err){
      console.log(err.stack);
      res.status(500).end();
    }
  }

  static async generateToken(req, res){
    try{
      const { roomId } = req.params;
      const { role } = req.body;
      const data = (req.body.data)? req.body.data: {};

      const user = new User(role);
      const room = new Room(roomId);
      const [ selectedRoom ] = await RoomAPI.getDetailById(room);
      
      const generatedUser = await UserAPI.generateToken(selectedRoom, user, data);
      res.json({ apiKey: process.env.API_KEY, token: generatedUser.token});
    }catch(err){
      console.log(err.stack);
      res.status(500).end();
    }
  }
}
module.exports = RoomListener;
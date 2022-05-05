const RoomAPI = require("@app/api/room");
const UserAPI = require("@app/api/user");
const User = require("@app/entities/user");
const Room = require("@app/entities/room");

let breakoutRoomsByMainRoom = {};
let participantsByMainRoom = {};

class RoomListener{
  static async info(req, res){
    try{
      const { roomId } = req.params ?? 'demoRoom';
      const room = new Room(roomId);
      
      const generatedRoom = await RoomAPI.generateSession(room);      
      generatedRoom.breakoutRooms = await RoomAPI.getBreakoutRooms(room);

      await RoomListener.generateBreakoutRoomsList(generatedRoom);

      res.json({ 
        mainRoom: {id: generatedRoom.id, name: generatedRoom.name, sessionId: generatedRoom.sessionId},
        breakoutRooms: breakoutRoomsByMainRoom[roomId]
      });
    }catch(err){
      console.error(err.stack);
      res.status(500).end(err.message);
    }
  }

  static async getParticipants(req, res){
    try{
      const { roomId } = req.params ?? 'demoRoom';
    
      res.json({ 
        participants: participantsByMainRoom[roomId]
      });
    }catch(err){
      console.error(err.stack);
      res.status(500).end(err.message);
    }
  }

  static async getBreakoutRooms(req, res){
    try{
      const { roomId } = req.params ?? 'demoRoom';
    
      res.json({ 
        breakoutRooms: breakoutRoomsByMainRoom[roomId]
      });
    }catch(err){
      console.error(err.stack);
      res.status(500).end(err.message);
    }
  }

  static generateBreakoutRoomsList(generatedRoom) {
    let breakoutRooms = [];
    const mainRoomId = generatedRoom.id;
    let member = [];
    if (participantsByMainRoom[mainRoomId]) member = participantsByMainRoom[mainRoomId].map(p => p.name);
    if (generatedRoom.breakoutRooms && (!breakoutRoomsByMainRoom[mainRoomId] || breakoutRoomsByMainRoom[mainRoomId].length === 0)) {
      breakoutRooms.push(new Room(generatedRoom.id, generatedRoom.name, generatedRoom.sessionId, null, null, member))
      generatedRoom.breakoutRooms.forEach((room) => {
      breakoutRooms.push(new Room(room.id, room.name, room.sessionId, room.mainRoomId, room.maxParticipants))
      });
      breakoutRoomsByMainRoom[mainRoomId] = breakoutRooms;
    }
    else if (generatedRoom.breakoutRooms && breakoutRoomsByMainRoom[mainRoomId]) {
      generatedRoom.breakoutRooms.forEach((room) => {
        if (!breakoutRoomsByMainRoom[mainRoomId].find((t_room) => t_room.id === room.id)) breakoutRoomsByMainRoom[mainRoomId].push(new Room(room.id, room.name, room.sessionId, room.mainRoomId, room.maxParticipants))
      })
    }
    return Promise.resolve(breakoutRoomsByMainRoom);
  }

  /**
   * create sessions for a main room
   */
  static async createSession(req, res) {
    try {
      const { roomId } = req.params ?? "demoRoom";
      const { roomName } = req.body ?? roomId;
      const { type } = req.body ?? null;
      const { breakoutRooms } = req.body ?? [];
      
      const room = new Room({ id: roomId, name: roomName });
      const generatedRoom = await RoomAPI.generateSession(room);

      await RoomAPI.generateSessionBreakoutRoom(breakoutRooms, generatedRoom);
      generatedRoom.breakoutRooms = await RoomAPI.getBreakoutRooms(generatedRoom);

      await RoomListener.generateBreakoutRoomsList(generatedRoom);

      if (type.includes("automatic")) {
        const participants = [];
        const moderatorAndCoHost = [];

        [...participantsByMainRoom[generatedRoom.id]].forEach((p) => {
          if (p.role === "moderator" || p.isCohost) {
            moderatorAndCoHost.push(p.name)
          }
          else {
            participants.push(p.name);
          }
        });

        if (participants.length !== 0) {
          participants.sort(()=> { return 0.5 - Math.random()});
          breakoutRoomsByMainRoom[generatedRoom.id].forEach((room) => {
              if (room.name === roomId) return;
              room["memberAssigned"] = participants.splice(0, room["maxParticipants"]);
          });
          const mainRoom = breakoutRoomsByMainRoom[generatedRoom.id].find((room) => room.id === roomId);
          mainRoom["member"] = participants.concat(moderatorAndCoHost)
        }
      }

      let relatedSessions = await RoomAPI.getRelatedSessions(generatedRoom);
      await RoomAPI.broadcastMsg(relatedSessions, 'breakout-room', {"message": type, "breakoutRooms": breakoutRoomsByMainRoom[generatedRoom.id]});

      return res.json({ 
        ...generatedRoom
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
      res.json({ 
        token: null
      });
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

      const targetedBreakoutRoom = breakoutRoomsByMainRoom[updatedRoom.mainRoomId].find((t_room) => t_room.id === room.id);
      targetedBreakoutRoom.name = updatedRoom.name;

      let relatedSessions = await RoomAPI.getRelatedSessions(updatedRoom);
      await RoomAPI.broadcastMsg(relatedSessions, 'breakout-room', {"message": "roomEdited", "breakoutRooms": breakoutRoomsByMainRoom[updatedRoom.mainRoomId]});

      res.json({
        ...updatedRoom
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

      const targetedBreakoutRoom = breakoutRoomsByMainRoom[updatedRoom.mainRoomId].find((t_room) => t_room.id === room.id);
      targetedBreakoutRoom.maxParticipants = updatedRoom.maxParticipants;

      let relatedSessions = await RoomAPI.getRelatedSessions(updatedRoom);
      await RoomAPI.broadcastMsg(relatedSessions, 'breakout-room', {"message": "roomEdited", "breakoutRooms": breakoutRoomsByMainRoom[updatedRoom.mainRoomId]});

      res.json({
        ...updatedRoom
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
      const [ selectedRoom ] = await RoomAPI.getDetailById(room);

      breakoutRoomsByMainRoom[selectedRoom.mainRoomId] = breakoutRoomsByMainRoom[selectedRoom.mainRoomId].filter((t_room) => t_room.name !== selectedRoom.name);

      let relatedSessions = await RoomAPI.getRelatedSessions(selectedRoom);
      await RoomAPI.broadcastMsg(relatedSessions, 'breakout-room', {"message": "roomRemoved", "breakoutRooms": breakoutRoomsByMainRoom[selectedRoom.mainRoomId]});

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
      const [ selectedRoom ] = await RoomAPI.getDetailById(room);
      breakoutRoomsByMainRoom[selectedRoom.id]= [];

      let relatedSessions = await RoomAPI.getRelatedSessions(selectedRoom);
      await RoomAPI.broadcastMsg(relatedSessions, 'breakout-room', {"message": "allRoomRemoved", "breakoutRooms": breakoutRoomsByMainRoom[selectedRoom.id]});
      
      const updatedRoom = await RoomAPI.delBreakoutRooms(room);

      res.json({
        ...updatedRoom
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
        rooms: rooms
      });
    } catch(err) {
      console.error(err.stack);
      res.status(500).end(err.message);
    }
  }

  static async updateParticipant(req, res) {
    try {
      const { roomId } = req.params;
      const { type, participant } = req.body;

      if ( undefined === roomId ) throw new Error("Empty params");

      let room = new Room(roomId);
      let [ selectedRoom ] = await RoomAPI.getDetailById(room);

      let relatedSessions = await RoomAPI.getRelatedSessions(selectedRoom);

      let tempRes = []
      if (type === 'update-participant') {
        const targetedParticipant = participantsByMainRoom[roomId].find((p) => p.name === participant)
        if (targetedParticipant.isCohost) targetedParticipant.isCohost = false;
        else targetedParticipant.isCohost = true;
      }
  
      tempRes.push(await RoomAPI.broadcastMsg(relatedSessions, "update-participant", participantsByMainRoom[roomId]));

      res.json({tempRes});
    } catch(err) {
      console.error(err.stack);
      res.json({
        error: err.message
      });
    }
  }

  static async moveParticipant(req, res) {
    try {
      const { roomId } = req.params;

      const { type, fromRoom, toRoom, participant } = req.body;

      if ( undefined === roomId ) throw new Error("Empty params");

      if (fromRoom)  {
        const prevRoom = breakoutRoomsByMainRoom[roomId].find((room) => room.name === fromRoom)
        prevRoom["member"] = prevRoom["member"].filter((a) => a !== participant);
      }
      if (toRoom) {
        const nextRoom = breakoutRoomsByMainRoom[roomId].find((room) => room.name === toRoom)
        nextRoom["memberAssigned"].push(participant);
      }

      let room = new Room(roomId);
      let [ selectedRoom ] = await RoomAPI.getDetailById(room);

      let relatedSessions = await RoomAPI.getRelatedSessions(selectedRoom);

      let tempRes = await RoomAPI.broadcastMsg(relatedSessions, 'breakout-room', {"message": type, "breakoutRooms": breakoutRoomsByMainRoom[roomId]});
 
      res.json({
        tempRes
      });
    } catch(err) {
      console.error(err.stack);
      res.json({
        error: err.message
      });
    }
  }

  static async broadcast(req, res, next) {
    try {
      const { roomId } = req.params;
      const { data, type, toRoomId } = req.body;

      if ( undefined === roomId ) throw new Error("Empty params");

      let room = new Room(roomId);
      let [ selectedRoom ] = await RoomAPI.getDetailById(room);

      data.fromRoom = {
        id: selectedRoom.id,
        name: selectedRoom.name ?? selectedRoom.id
      };

      let tempRes;
      if (toRoomId) {
        let toRoom = new Room(toRoomId);
        let [ selectedToRoom ] = await RoomAPI.getDetailById(toRoom);  
        tempRes = await RoomAPI.broadcastMsg([selectedToRoom.sessionId], type ?? 'message', data);
      }
      else {
        let relatedSessions = await RoomAPI.getRelatedSessions(selectedRoom);
        tempRes = await RoomAPI.broadcastMsg(relatedSessions, type ?? 'raise-hand', data);
      }
   
      res.json({
        tempRes
      });
    } catch(err) {
      console.error(err.stack);
      res.json({
        error: err.message
      });
    }
  }

  static async sessionMonitoring(req, res) {
    try {
      const { event, sessionId, connection } = req.body;

      if (event !== "streamCreated" && event !==  "streamDestroyed") {
        return res.sendStatus(200);
      }

      // get Room by sessionId
      const [ room ] = await RoomAPI.getRoomBySessionId(sessionId);
      const mainRoomId = room.mainRoomId ?? room.id;
      const participant = JSON.parse(connection.data);

      let relatedSessions = await RoomAPI.getRelatedSessions(room);

      if (event === "streamCreated") {
        if (!participantsByMainRoom[mainRoomId]) { participantsByMainRoom[mainRoomId] = [participant];}
        else if (!participantsByMainRoom[mainRoomId].find((p) => p.name === participant.name))  { participantsByMainRoom[mainRoomId].push(participant);}
        if (!breakoutRoomsByMainRoom[mainRoomId]) breakoutRoomsByMainRoom[mainRoomId] = [];
        else {
          const targetRoom = breakoutRoomsByMainRoom[mainRoomId].find((t_room) => t_room.id === room.id);
          if (targetRoom && !targetRoom["member"].includes(participant.name)) targetRoom["member"].push(participant.name);
        }
      }
      if (event === "streamDestroyed" && participantsByMainRoom[mainRoomId]) {
        breakoutRoomsByMainRoom[mainRoomId].forEach((p) => {
          p["member"] = p["member"].filter((p) => p !==participant.name)
          p["memberAssigned"] = p["memberAssigned"].filter((p) => p !==participant.name)
        })
        participantsByMainRoom[mainRoomId] = participantsByMainRoom[mainRoomId].filter((p) => p.name !== participant.name);
      }

      if (participantsByMainRoom[mainRoomId]) {
        await RoomAPI.broadcastMsg(relatedSessions, "update-participant", participantsByMainRoom[mainRoomId]);
      }
      
     if (breakoutRoomsByMainRoom[mainRoomId]) {
        RoomAPI.broadcastMsg(relatedSessions, 'breakout-room', {"message": "updateBreakoutRoom", "breakoutRooms": breakoutRoomsByMainRoom[mainRoomId]});
     }

     res.sendStatus(200);
    } catch(err) {
      console.error(err.stack);
      res.json({
        error: err.message
      });
    }
  }

}
module.exports = RoomListener;
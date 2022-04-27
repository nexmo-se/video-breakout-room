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
    if (generatedRoom.breakoutRooms && (!breakoutRoomsByMainRoom[mainRoomId] || breakoutRoomsByMainRoom[mainRoomId].length === 0)) {
      breakoutRooms.push(new Room(generatedRoom.id, generatedRoom.name, generatedRoom.sessionId, null))
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
        const participants = [...participantsByMainRoom[generatedRoom.id].filter((p) => (p.role !== "moderator" && !p.isCohost)).map((p) => p.name)];
        if (participants.length !== 0) {
          participants.sort(()=> { return 0.5 - Math.random()});
          breakoutRoomsByMainRoom[generatedRoom.id].forEach((room) => {
              if (room.name === roomId) return;
              room["memberAssigned"] = participants.splice(0, room["maxParticipants"]);
          })
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
      if (type === "participant-leaved" && participantsByMainRoom[roomId]) {
        participantsByMainRoom[roomId] = participantsByMainRoom[roomId].filter((p) => p.name !== participant);

        // if no moderator
        if (!participantsByMainRoom[roomId].find((user) => user.role === "moderator")) {
          participantsByMainRoom[roomId].forEach((p) => p.isCohost = false);
          breakoutRoomsByMainRoom[roomId].forEach((room) => {
            if (room.id !== roomId) { room.member = []; room.memberAssigned = []} 
          })
        }
        else {
          breakoutRoomsByMainRoom[roomId].forEach((p) => {
            p["member"] = p["member"].filter((p) => p !== participant)
            p["memberAssigned"] = p["memberAssigned"].filter((p) => p !==participant)
          }) 
        }
        tempRes.push(await RoomAPI.broadcastMsg(relatedSessions, 'breakout-room', {"message": "participantMoved", "breakoutRooms": breakoutRoomsByMainRoom[roomId]}));
      }
      if (type === "participant-joined" && !selectedRoom.mainRoomId) {
          if (!participantsByMainRoom[selectedRoom.id]) { participantsByMainRoom[selectedRoom.id] = [participant];}
          else if (!participantsByMainRoom[selectedRoom.id].find((p) => p.name === participant.name))  { participantsByMainRoom[selectedRoom.id].push(participant);}
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

  static async joinBreakoutRoom(req, res) {
    try {
      const { roomId } = req.params;
      const { type, fromRoom, toRoom, participant } = req.body;

      if ( undefined === roomId ) throw new Error("Empty params");

      if (fromRoom)  {
        const prevRoom = breakoutRoomsByMainRoom[roomId].find((room) => room.name === fromRoom)
        if (prevRoom) prevRoom["member"] = prevRoom["member"].filter((a) => a !== participant);
      }
      if (toRoom) {
        const nextRoom = breakoutRoomsByMainRoom[roomId].find((room) => room.name === toRoom)
        if (nextRoom && !nextRoom["member"].includes(participant)) nextRoom["member"].push(participant);
        if (nextRoom && nextRoom["memberAssigned"].includes(participant)) nextRoom["memberAssigned"] = nextRoom["memberAssigned"].filter((a) => a !== participant);
      }

      let room = new Room(roomId);
      let [ selectedRoom ] = await RoomAPI.getDetailById(room);

      let relatedSessions = await RoomAPI.getRelatedSessions(selectedRoom);

      let tempRes = await RoomAPI.broadcastMsg(relatedSessions, type, breakoutRoomsByMainRoom[roomId]);

      res.json({
        breakoutRooms: breakoutRoomsByMainRoom[roomId],
        participants: participantsByMainRoom[roomId]
      });
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

  static async crossRoomMsg(req, res, next) {
    try {
      const { roomId } = req.params;
      const { data, type, toRoomId } = req.body;

      if ( undefined === roomId ) throw new Error("Empty params");

      let room = new Room(roomId);
      let [ selectedRoom ] = await RoomAPI.getDetailById(room);

      let toRoom = new Room(toRoomId);
      let [ selectedToRoom ] = await RoomAPI.getDetailById(toRoom);

      data.fromRoom = {
        id: selectedRoom.id,
        name: selectedRoom.name ?? selectedRoom.id
      };

      let tempRes = await RoomAPI.sendCrossRoomMsg(selectedToRoom.sessionId, type ?? 'message', data);

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

}
module.exports = RoomListener;
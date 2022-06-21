const RoomAPI = require("@app/api/room");
const UserAPI = require("@app/api/user");
const User = require("@app/entities/user");
const Room = require("@app/entities/room");
const { ConstructionOutlined } = require("@mui/icons-material");

let breakoutRoomsByMainRoom = {};
let participantsByMainRoom = {};
let sessionMonitoring = {};

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

  static generateParticipantList(mainRoomId) {
    if (!participantsByMainRoom[mainRoomId]) return [];
    let participants = Object.keys(participantsByMainRoom[mainRoomId]).reduce(function(res, p) {
      return res.concat(participantsByMainRoom[mainRoomId][p]);
    }, []);
    return  participants;
  }

  static async getParticipants(req, res){
    try{
      const { roomId } = req.params ?? 'demoRoom';
    
      const participants = RoomListener.generateParticipantList(roomId);

      res.json({ 
        participants: participants
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
    if (participantsByMainRoom[mainRoomId]) {
      const participants = RoomListener.generateParticipantList(mainRoomId);
      member = participants.map(p => p.name);
    }
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

        const allParticipants = RoomListener.generateParticipantList(generatedRoom.id);
        allParticipants.forEach((p) => {
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
      delete participantsByMainRoom[selectedRoom.mainRoomId][room.id];

      let relatedSessions = await RoomAPI.getRelatedSessions(selectedRoom);
      await RoomAPI.broadcastMsg(relatedSessions, 'breakout-room', {"message": "roomRemoved", "breakoutRooms": breakoutRoomsByMainRoom[selectedRoom.mainRoomId]});
      
      const participants = RoomListener.generateParticipantList(selectedRoom.mainRoomId)
      await RoomAPI.broadcastMsg(relatedSessions, 'update-participant', participants );


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
      const newParticipantList = Object.entries(participantsByMainRoom[selectedRoom.id]).filter(([key, value]) => key === selectedRoom.id);

      participantsByMainRoom[selectedRoom.id] = Object.fromEntries(newParticipantList);
      let relatedSessions = await RoomAPI.getRelatedSessions(selectedRoom);
      await RoomAPI.broadcastMsg(relatedSessions, 'breakout-room', {"message": "allRoomRemoved", "breakoutRooms": breakoutRoomsByMainRoom[selectedRoom.id]});
      
      const participants = RoomListener.generateParticipantList(selectedRoom.id)
      await RoomAPI.broadcastMsg(relatedSessions, 'update-participant', participants );

      const updatedRoom = await RoomAPI.delBreakoutRooms(room);
      sessionMonitoring[selectedRoom.id] = [];

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
         Object.entries(participantsByMainRoom[roomId]).map(([key, value]) => {
          let targetParticipant = value.find((p)=> p.name === participant);
          if (targetParticipant) {
            targetParticipant.isCohost = !targetParticipant.isCohost;
          }
          return [key, value]
        }) 
      }

      const participants = RoomListener.generateParticipantList(selectedRoom.mainRoomId ?? selectedRoom.id)
      
      tempRes.push(await RoomAPI.broadcastMsg(relatedSessions, "update-participant", participants));

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
      const { event, sessionId, connection, stream, reason } = req.body;

      if ((event !== "streamCreated" 
            && event !==  "streamDestroyed" 
            && event !==  "connectionDestroyed" 
          ) || (stream && stream.videoType === "screen")) {
        return res.sendStatus(200);
      }

      // get Room by sessionId
      const [ room ] = await RoomAPI.getRoomBySessionId(sessionId);

      if (!room) return res.sendStatus(200);

      const mainRoomId = room.mainRoomId ?? room.id;

      if (sessionMonitoring[mainRoomId] && sessionMonitoring[mainRoomId].includes(JSON.stringify(req.body))) {
        return res.sendStatus(200);
      }
      else if (sessionMonitoring[mainRoomId]){
        sessionMonitoring[mainRoomId].push(JSON.stringify(req.body));
      }
      else {
        sessionMonitoring[mainRoomId] = [JSON.stringify(req.body)]
      }

      const participant = JSON.parse(connection.data);

      let relatedSessions = await RoomAPI.getRelatedSessions(room);

      if (event === "streamCreated") {
        if (!participantsByMainRoom[mainRoomId]) { participantsByMainRoom[mainRoomId] = []; participantsByMainRoom[mainRoomId][mainRoomId] = [participant];}
        else if (!participantsByMainRoom[mainRoomId][room.id]) { participantsByMainRoom[mainRoomId][room.id]= [participant];}
        else if (!participantsByMainRoom[mainRoomId][room.id].find((p) => p.name === participant.name))  { 
          participantsByMainRoom[mainRoomId][room.id].push(participant);
        }
        if (!breakoutRoomsByMainRoom[mainRoomId]) breakoutRoomsByMainRoom[mainRoomId] = [];
        else {
          const targetRoom = breakoutRoomsByMainRoom[mainRoomId].find((t_room) => t_room.id === room.id);
          if (targetRoom && !targetRoom["member"].includes(participant.name)) targetRoom["member"].push(participant.name);
        }
      }
      if (event === "streamDestroyed" && reason != "forceUnpublished"
          || event === "connectionDestroyed" ) {
        if (breakoutRoomsByMainRoom[mainRoomId]) {
        breakoutRoomsByMainRoom[mainRoomId].forEach((p) => {
          if (p.id === room.id) {
            p["member"] = p["member"].filter((p) => p !==participant.name)
          }
          p["memberAssigned"] = p["memberAssigned"].filter((p) => p !==participant.name)
        })
        }
        if (participantsByMainRoom[mainRoomId] && participantsByMainRoom[mainRoomId][room.id]) {
          participantsByMainRoom[mainRoomId][room.id] = participantsByMainRoom[mainRoomId][room.id].filter((p) => p.name !== participant.name);
        }
      }
      
      const tempRes = await RoomAPI.broadcastMsg(relatedSessions, 'data-refreshed', mainRoomId);

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
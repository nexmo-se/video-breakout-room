const { v4: uuidv4 } = require('uuid');

class Room {
  constructor(id = null, sessionId = null, name = null, mainRoomId = null, maxParticipants = 0) {
    if (typeof arguments[0] === 'object') {
      id = arguments[0].id ?? null;
      name = arguments[0].name ?? null;
      sessionId = arguments[0].sessionId ?? null;
      mainRoomId = arguments[0].mainRoomId ?? null;
      maxParticipants = arguments[0].maxParticipants ?? 0;
    }
    this.id = id;
    this.name = name;
    this.sessionId = sessionId;
    this.mainRoomId = mainRoomId;
    this.maxParticipants = maxParticipants;
  }
  
  static fromDatabase(row) {
    return new Room ({
      id: row.id,
      name: row.name,
      sessionId: row.session_id,
      mainRoomId: row.main_room_id,
      maxParticipants: row.max_participants
    })
  }
}
module.exports = Room;
class Room {
  constructor(id = null, name = null, sessionId = null, mainRoomId = null, maxParticipants = 0, member=[], memberAssigned = []) {
    if (typeof arguments[0] === 'object') {
      id = arguments[0].id ?? null;
      name = arguments[0].name ?? null;
      sessionId = arguments[0].sessionId ?? null;
      mainRoomId = arguments[0].mainRoomId ?? null;
      maxParticipants = arguments[0].maxParticipants ?? 0;
      member = arguments[0].member ?? [];
      memberAssigned = arguments[0].memberAssigned ?? [];  
    }
    this.id = id;
    this.name = name;
    this.sessionId = sessionId;
    this.mainRoomId = mainRoomId;
    this.maxParticipants = maxParticipants;
    this.member = member;
    this.memberAssigned = memberAssigned;
  }
  
  static fromDatabase(row) {
    return new Room ({
      id: row.id,
      name: row.name,
      sessionId: row.session_id,
      mainRoomId: row.main_room_id,
      maxParticipants: row.max_participants,
    })
  }
}
module.exports = Room;
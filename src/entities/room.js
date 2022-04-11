// @flow
class Room{
  
    constructor(apiKey = '', id= '', name = '', sessionId = '',  maxParticipants='', member=[], memberAssigned=[]){
      this.apiKey = apiKey;
      this.id = id;
      this.name = name;
      this.sessionId = sessionId;
      this.member = member;
      this.memberAssigned = memberAssigned
      this.maxParticipants = maxParticipants;
    }

    toJSON() {
      const jsonData = {
        apiKey: this.apiKey,
        id: this.id,
        name: this.name,
        sessionId: this.sessionId,
        member: this.member,
        memberAssigned: this.memberAssigned,
        maxParticipants: this.maxParticipants
      }
      return JSON.parse(JSON.stringify(jsonData));
    }
  
    static fromJSON(data){
      const breakoutRoom = new Room(data.apiKey, data.id, data.name, data.sessionId, data.maxParticipants, data.member, data.memberAssigned);
      return breakoutRoom;
    }
  }
  export default Room;
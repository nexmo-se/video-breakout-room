// @flow
class Room{
  
    constructor(apiKey = '', name = '', sessionId = '', member=[], maxMember=''){
      this.apiKey = apiKey;
      this.name = name;
      this.sessionId = sessionId;
      this.member = member;
      this.maxMember = maxMember;
    }

    toJSON() {
      const jsonData = {
        apiKey: this.apiKey,
        name: this.name,
        sessionId: this.sessionId,
        member: this.member,
        maxMember: this.maxMember
      }
      return JSON.parse(JSON.stringify(jsonData));
    }
  
    static fromJSON(data){
      const breakoutRoom = new Room(data.apiKey, data.name, data.sessionId, data.member, data.maxMember);
      return breakoutRoom;
    }
  }
  export default Room;
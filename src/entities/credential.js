// @flow
class Credential{
  
    constructor(apiKey = '', sessionId = '', token = '', roomId=''){
      this.apiKey = apiKey;
      this.sessionId = sessionId;
      this.token = token;
      this.roomId = roomId;
    }
  }
  export default Credential;
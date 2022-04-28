// @flow
import Credential from "entities/credential";
import config from "config";

export default class CredentialAPI{
  static async generateCredential({roomId = config.roomName, role="publisher", data={}}){
    const url = new URL(window.location.href);
    const serverPath = process.env.REACT_APP_API_URL || `${url.protocol}//${url.hostname}:${url.port}`;
    const apiURL = `${serverPath}/room/${roomId}/generateToken`;
    const jsonResult = await (await fetch(apiURL, {
      method: "POST", headers: { "Content-Type": "application/JSON" },
      body: JSON.stringify({ role, data })
    })).json();
    
    if (!jsonResult.token) return null;
    const credential = new Credential(jsonResult.apiKey, jsonResult.sessionId, jsonResult.token, jsonResult.roomId);
    return credential;
  }
}
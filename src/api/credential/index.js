// @flow
import Credential from "entities/credential";
import config from "config";

export default class CredentialAPI{
  static async generateCredential({roomName = config.roomName, role="publisher", data={}}){
    const url = new URL(window.location.href);
    // const apiURL = `${url.protocol}//${url.hostname}:${url.port}/room/${config.roomName}/info`; // TODO:!
    const apiURL = `http://localhost:3002/room/${roomName}/info`;
    const jsonResult = await (await fetch(apiURL, {
      method: "POST", headers: { "Content-Type": "application/JSON" },
      body: JSON.stringify({ role, data })
    })).json();
    const credential = new Credential(jsonResult.apiKey, jsonResult.sessionId, jsonResult.token);
    return credential;
  }
}
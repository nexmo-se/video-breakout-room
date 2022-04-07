// @flow
const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

export default class MessageAPI{

  static async sendMessage(session, message){
    await new Promise((resolve, reject) => {
      session.signal({
        type: "message",
        data: JSON.stringify(message.toJSON())
      }, (err) => {
        if(err) reject(err);
        else resolve();
      });
    })
  };

  static async broadcastMsg(roomId, type, data) {
    if (undefined === roomId) return null;
    data.type = type ?? 'raise-hand';
    const apiURL = `${REACT_APP_API_URL}/room/${roomId}/broadcast`;
    return fetch(apiURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: data })
    })
    .then(res => res.json())
    .then(res => {
      return Promise.resolve(res);
    })
    .catch(error => {
        console.error(`HTTP error!!`, this.url, error);
        return Promise.resolve(null);
    });
  }

}
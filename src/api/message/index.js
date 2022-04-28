// @flow
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

  static async broadcastMsg(mainRoomId, type, data, toRoomId = null) {
    if (undefined === mainRoomId) return null;

    if (!type) { type = 'raise-hand'};
    const url = new URL(window.location.href);
    const serverPath = process.env.REACT_APP_API_URL || `${url.protocol}//${url.hostname}:${url.port}`;

    const apiURL = `${serverPath}/room/${mainRoomId}/broadcast`;

    return fetch(apiURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ type, data, toRoomId})
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
// @flow

const url = new URL(window.location.href);

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

    if (!type) { type = 'raise-hand'};
    const apiURL = `${url.protocol}//${url.hostname}:${url.port}/room/${roomId}/broadcast`;

    return fetch(apiURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ type, data})
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

  static async crossRoomMsg(roomId, toRoomId, type, data) {
    if (undefined === roomId || undefined === toRoomId) return null;

    if (!type) { type = 'message'};
    const apiURL = `${url.protocol}//${url.hostname}:${url.port}/room/${roomId}/crossRoomMsg`;

    return fetch(apiURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, toRoomId, data})
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
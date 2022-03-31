import User from "entities/user";
import { v4 as uuid } from "uuid";

export default class Message{

  /**
   * 
   * @param {User} sender 
   * @param {string} text 
   * @param {boolean} isApproved 
   * @param {string} roomName 

   */
  constructor(roomName, sender, text, isApproved, id){
    this.id = !id? uuid(): id;
    this.sender = sender;
    this.text = text;
    this.isApproved = text;
    this.roomName = roomName
  }

  set isApproved(value){
    if(value.toLowerCase().includes("fuck")) this._isApproved = false;
    else if(value.toLowerCase().includes("fck")) this._isApproved = false;
    else if(value.toLowerCase().includes("shit")) this._isApproved = false;
    else if(value.toLowerCase().includes("shhiitt")) this._isApproved = false;
    else this._isApproved = true;
  }

  get isApproved(){ return this._isApproved; }

  toJSON() {
    const jsonData = {
      id: this.id,
      sender: this.sender.toJSON(),
      text: this.text,
      isApproved: this.isApproved,
      roomName: this.roomName
    }
    return JSON.parse(JSON.stringify(jsonData));
  }

  static fromJSON(data){
    const sender = User.fromJSON(data.sender);
    const message = new Message(data.roomName, sender, data.text, data.isApproved, data.id);
    return message;
  }

}
// @flow
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

require('module-alias/register')

const express = require("express");
const cors = require("cors");
const DatabaseAPI = require("@app/api/database");
const RoomListener = require("@app/listeners/room");

(async () => {
  await DatabaseAPI.initialize();
  await DatabaseAPI.migrate();

  const app = express();
  app.use(express.json());
  app.use(cors());

  app.use(express.static(path.join(__dirname, "../build")));

  const PORT = process.env.PORT_SERVER || 8080;
  // app.use((req, res, next) => {
  //   console.log("\n>>>", `${req.method} ${req.url}`)
  //   if ("POST" == req.method) console.log(">>>>>>", JSON.stringify(req.body))
  //   next()
  // });

  app.get("/room/:roomId/info", RoomListener.info);

  app.post("/room/:roomId/createSession", RoomListener.createSession);

  app.post("/room/:roomId/generateToken", RoomListener.generateToken);

  app.post("/room/:roomId/renameRoom", RoomListener.renameRoom);
  
  app.post("/room/:roomId/update", RoomListener.updateRoom);

  app.delete("/room/:roomId", RoomListener.deleteRoom);

  app.delete("/room/:roomId/breakoutrooms", RoomListener.delBreakoutRooms);

  app.get("/rooms", RoomListener.getAllMainRooms);

  app.get("/room/:roomId/participants", RoomListener.getParticipants);

  app.get("/room/:roomId/getBreakoutRooms", RoomListener.getBreakoutRooms);

  app.post("/room/:roomId/broadcast", RoomListener.broadcast);

  app.post("/room/:roomId/updateParticipant", RoomListener.updateParticipant);

  app.post("/room/:roomId/joinBreakoutRoom", RoomListener.joinBreakoutRoom);

  app.post("/room/:roomId/moveParticipant", RoomListener.moveParticipant);


  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../build/index.html"));
  });

  app.listen(PORT, () => console.log(`Express is listening to ${PORT}`));
})();

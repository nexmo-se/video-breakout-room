// @flow
// require("dotenv").config(); // TODO

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

//   app.use(express.static(path.join(__dirname, "../build")));
  app.post("/room/:roomId/info", RoomListener.info);

  app.post("/room/:roomId/createSession", RoomListener.createSession);

  app.post("/room/:roomId/generateToken", RoomListener.generateToken);


//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "../build/index.html"));
//   });

  app.listen(process.env.PORT, () => console.log(`Express is listening to ${process.env.PORT}`));
})();

const port = process.env.PORT || 5000;
const dbConnection = require("./config/db");
const app = require("./app");
require("dotenv").config();
const socketIo = require("socket.io");
const socketController = require("./controllers/socket.controller");

dbConnection(process.env.DB_URL);
const server = app.listen(port, "192.168.10.116", () => {
  console.log("Application running on port", `192.168.10.116:` + port);
});

const io = socketIo(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*",
  },
});
socketController(io);
global.io = io;

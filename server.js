const port = process.env.PORT || 5000;
const app = require("./app");

const socketIo = require("socket.io");
const socketController = require("./controllers/socket.controller");
const { default: mongoose } = require("mongoose");

async function main() {
  await mongoose.connect(process.env.DB_URL);
  console.log("Database connected successfully");

  const server = app.listen(port,  () => {
    console.log("Application running on port", `167.172.249.13:` + port);
  });

  // const server = app.listen(port, "167.172.249.13", () => {
  //   console.log("Application running on port", `167.172.249.13:` + port);
  // });

  const io = socketIo(server, {
    pingTimeout: 60000,
    cors: {
      origin: "*",
    },
  });
  socketController(io);
  // global.io = io;
  app.set("io", io);
}

main();

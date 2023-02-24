const app = require("./app");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User  = require("./models/user")
const { Server } = require("socket.io");

dotenv.config({ path: "./config.env" });

process.on("uncaughtException", (err) => {
  console.log(err);
  process.exit(1);
});

const http = require("http");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", async (socket) => {
    // console.log(socket,'socket')
    const user_id = socket.handshake.query['user_id ']

    const socket_id = socket.id;
    console.log(`User conneccted ${socket_id} !!!`)

    if(user_id){
        await User.findByIdAndUpdate(user_id,{socket_id})
    }
    socket.on("friend_request", async(data) => {
        console.log(data.to);

        const to = await User.findById(data.to)

        io.to(to.socket_id).emit("new_friend_request",{
            
        })
         
    })
});

const DB = process.env.DBURI.replace("<PASSWORD>", process.env.DBPASSWORD);

mongoose
  .connect(DB)
  .then((prop) => {
    console.log("Boo yeah Mongo Connecteddd !");
  })
  .catch((err) => {
    console.log(err);
  });
const port = process.env.PORT || 8000;

server.listen(port, () => {
  console.log(`App is running on port ${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});

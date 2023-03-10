const app = require("./app");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("./models/user");
const { Server } = require("socket.io");
const FriendRequest = require("./models/friendRequest");
const OneToOneMessage = require("./models/OneToOneMessage");

const path = require("path");

dotenv.config({ path: "./config.env" });

process.on("uncaughtException", (err) => {
  console.log(err);
  console.log("UNCAUGHT Exception! Shutting down ...");
  process.exit(1); // Exit Code 1 indicates that a container shut down, either because of an application failure.
});

const http = require("http");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
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

// Add this
// Listen for when the client connects via socket.io-client
io.on("connection", async (socket) => {
  console.log(
    JSON.stringify(socket.handshake.query),
    "JSON Stringify socket.handshake.query"
  );
  const user_id = socket.handshake.query["user_id"];

  console.log(`User connected ${socket.id}`);
  const socket_id = socket.id;
  console.log(Boolean(user_id), user_id);

  if (Boolean(user_id)) {
    console.log(user_id, "enter if loop");
    await User.findByIdAndUpdate(user_id, { socket_id, status: "Online" });
  }

  // We can write our socket event listeners in here...
  socket.on("friend_request", async (data) => {
    console.log(data.to, "data. to");

    const to = await User.findById(data.to).select("socket_id");
    const from = await User.findById(data.from).select("socket_id");

    // create a friend request
    await FriendRequest.create({
      sender: data.from,
      recipient: data.to,
    });
    // emit event request received to recipient
    io.to(to.socket_id).emit("new_friend_request", {
      message: "New friend request received",
    });
    io.to(from.socket_id).emit("request_sent", {
      message: "Request Sent successfully!",
    });
  });

  socket.on("accept_request", async (data) => {
    // accept friend request => add ref of each other in friends array
    console.log(data);
    const request_doc = await FriendRequest.findById(data.request_id);

    console.log(request_doc);

    const sender = await User.findById(request_doc.sender);
    const receiver = await User.findById(request_doc.recipient);

    sender.friends.push(request_doc.recipient);
    receiver.friends.push(request_doc.sender);

    await receiver.save({ new: true, validateModifiedOnly: true });
    await sender.save({ new: true, validateModifiedOnly: true });

    await FriendRequest.findByIdAndDelete(data.request_id);

    // delete this request doc
    // emit event to both of them

    // emit event request accepted to both
    io.to(sender.socket_id).emit("request_accepted", {
      message: "Friend Request Accepted",
    });
    io.to(receiver.socket_id).emit("request_accepted", {
      message: "Friend Request Accepted",
    });
  });

  socket.on("get_direct_conversations", async ({ user_id }, callback) => {
    const existing_conversation = await OneToOneMessage.find({
      participants: { $all: { user_id } },
    }).populate("User", "firstName lastName _id email status");

    console.log(existing_conversation, "existing conversation");

    callback(existing_conversation);
  });

  socket.on("start_conversation", async (data) => {
    // data: {to, from}
    const { to, from } = data;

    //  check if there is any existing conversation between these two

    const existing_conversation = await OneToOneMessage.find({
      participants: {
        $size: 2,
        $all: { to, from },
      },
    }).populate("participants", "firstName lastName _id email status");

    console.log(existing_conversation[0], "Existing conversation");

    // if no conver
    if (existing_conversation.length === 0) {
      let new_chat = await OneToOneMessage.create({
        participants: [to, from],
      });

      new_chat = await OneToOneMessage.findById(new_chat._id).populate(
        "particpants",
        "firstName lastName _id email status"
      );

      console.log(new_chat, "new chat");
      socket.emit("start_chat", new_chat);
    }
    // if there is existing convo
    else {
      socket.emit("start_chat", existing_conversation[0]);
    }
  });

  socket.on("get_messages", async (data, callback) => {
    const { messages } = await OneToOneMessage.findById(
      data.conversation._id
    ).select("messages");
    callback(messages);
  });
  // handle text and link  message

  socket.on("text_message", async (data) => {
    console.log("Received Message", data);

    // data {to, from, next}
    const { to, from, message, conversation_id, type } = data;

    const to_user = await User.findById(to);
    const from_user = await User.findById(from);


    const new_message = {
      to,
      from,
      type,
      text: message,
      created_at : Date.now(),
    };
    // create a new conversation if it doesn't exist yet and add new message to the message list
    const chat = await OneToOneMessage.findById(conversation_id)
    chat.messages.push(new_message);

    // save to db
    await chat.save({})

    // emit new_message -> to user
    io.to(to_user.socket_id).emit("new_message",{
      conversation_id,
      message: new_message,
    })

    // emit new_message -> from user
    io.to(from_user.socket_id).emit("new_message",{
      conversation_id,
      message: new_message,
    })
  });

  socket.on("file_message", (data) => {
    console.log("Received Message", data);

    // data: {to, from, text, file}

    // get the file extention

    const fileExtension = path.extname(data.file.name);

    // generate a unique filename
    const fileName = `${Date.now()}_${Math.floor(
      Math.random() * 10000
    )}${fileExtension}`;

    // upload to AWS S3

    // create a new conversation if it doesn't exist yet and add new message to the message list

    // save to db

    // emit incoming_message -> to user

    // emit outgoing message -> from user
  });

  socket.on("end", async (data) => {
    //Find user by _id and set status offline
    if (data.user_id) {
      await User.findByIdAndUpdate(data.user_id, { status: "Offline" });
    }

    // TODO => broadcast user disconnected
    console.log("closing connection");
    socket.disconnect(0);
  });
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  console.log("UNHANDLED REJECTION! Shutting down ...");
  server.close(() => {
    process.exit(1); //  Exit Code 1 indicates that a container shut down, either because of an application failure.
  });
});

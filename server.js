const app = require("./app"); 
const dotenv = require('dotenv');
const mongoose = require("mongoose");

dotenv.config({path: "./.env"});

process.on('uncaughtException', (err) => {
    console.log(err);
    process.exit(1);
})

const http = require("http");

const server = http.createServer(app);
const DB = process.env.DBURI.replace("<PASSWORD>", process.env.DBPASSWORD)

mongoose.connect(DB,{
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedToplogy: true,
}).then((prop) => {
    console.log("Boo yeah !")
}).catch((err) => {
    console.log(err)
})
const port = process.env.PORT || 8000

server.listen(port, () => {
    console.log(`App is running on port ${port}`)
})

process.on("unhandledRejection", (err) => {
    console.log(err);
    server.close(() => {
        process.exit(1);
    })
})
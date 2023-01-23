const app = require("./app")

const http = require("http");

const server = http.createServer(app);

server.listen(port, () => {
    console.log("Boo Yeah!")
})
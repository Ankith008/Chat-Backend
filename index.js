const express = require("express");
const cors = require("cors");
const app = express();
const connectToMongo = require("./db");
require("dotenv").config({ path: "backend.env" });
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const cookieParser = require("cookie-parser");
connectToMongo();
app.use(cors());
app.use(cookieParser());
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/auth", require("./routes/auth"));
app.use("/message", require("./routes/message"));
app.listen(5000);

io.on("connection", (socket) => {
  socket.on("send_message", () => {
    io.emit("receive_message");
  });
});

server.listen(3001, () => {
  console.log("Server Is running");
});

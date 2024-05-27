require("dotenv").config();
const express = require("express");
const { join } = require("node:path");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const app = express();
app.use(cookieParser());
const server = createServer(app);
const io = new Server(server);

app.use((req, res, next) => {
  const cookieValue = req.cookies["session"];
  const expectedValue = process.env.PASSWORD;

  if (cookieValue === expectedValue && req.path === "/") {
    res.redirect("/dashboard");
  } else if (cookieValue === expectedValue || req.path === "/") {
    next();
  } else {
    res.redirect("/");
  }
});

let programs = [
  {
    name: "Process 1",
    port: 8080,
    uuid: "8dfb0b15-6c32-480a-a14f-78c5a98d1f03",
    status: "Offline",
    autostart: true,
  },
  {
    name: "Process 2",
    port: 3000,
    uuid: "16324fa6-315c-436b-a95a-ce35af59de95",
    status: "Offline",
    autostart: true,
  },
  {
    name: "Process 3",
    port: 5000,
    uuid: "1c6507ca-da15-439b-b3f9-5042b33042ef",
    status: "Offline",
    autostart: true,
  },
];

app.use(express.static(join(__dirname, "public")));

app.get("/inspect/:slug", (req, res) => {
  res.sendFile(join(__dirname, "public/inspect.html"));
});

io.on("connection", (socket) => {
  io.emit("programs", programs);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

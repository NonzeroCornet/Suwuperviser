require("dotenv").config();
const express = require("express");
const { join, extname } = require("node:path");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const { isText } = require("istextorbinary");
const crypto = require("node:crypto");
const unzipper = require("unzipper");

const app = express();
app.use(cookieParser());
const server = createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e8,
});

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

const dbPath = join(__dirname, "db.json");

let programs = [];

fs.readFile(dbPath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
  } else {
    try {
      const jsonData = JSON.parse(data);
      for (let i = 0; i < jsonData.programs.length; i++) {
        const program = jsonData.programs[i];
        programs.push({
          name: program.name,
          port: program.port,
          uuid: program.uuid,
          status: "Offline",
          autostart: program.autostart,
        });
      }
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
    }
  }
});

function saveDb() {
  let jsonData = { programs: [] };
  for (let i = 0; i < programs.length; i++) {
    const program = programs[i];
    jsonData.programs.push({
      name: program.name,
      port: program.port,
      uuid: program.uuid,
      autostart: program.autostart,
    });
  }
  const dataString = JSON.stringify(jsonData, null, 2);
  fs.writeFile(dbPath, dataString, "utf8", (err) => {
    if (err) {
      console.error("Error writing file:", err);
    }
  });
}

app.use(express.static(join(__dirname, "public")));

app.get("/inspect/:slug", (req, res) => {
  res.sendFile(join(__dirname, "public/inspect.html"));
});

const ignoredFiles = ["node_modules", ".git", ".gitignore"];

const findTextFiles = (dir, textFiles, callback) => {
  fs.readdir(dir, { withFileTypes: true }, (err, files) => {
    if (err) {
      return console.error(`Error reading directory: ${err.message}`);
    }

    let pending = files.length;
    if (!pending) return callback(textFiles);

    files.forEach((file) => {
      const filePath = join(dir, file.name);

      if (file.isDirectory() && ignoredFiles.indexOf(file.name) == -1) {
        findTextFiles(filePath, textFiles, () => {
          if (!--pending) callback(textFiles);
        });
      } else if (
        file.isFile() &&
        ignoredFiles.indexOf(file.name) == -1 &&
        extname(filePath).toLowerCase() != "suwut" &&
        isText(filePath)
      ) {
        textFiles.push(filePath.split("\\").slice(2).join("/"));
        if (!--pending) callback(textFiles);
      } else {
        if (!--pending) callback(textFiles);
      }
    });
  });
};

io.on("connection", (socket) => {
  socket.emit("programs", programs);
  socket.on("inspect", (uuid) => {
    let out = [];

    findTextFiles("./programs/" + uuid, out, () => {
      socket.emit("inspectr", [out]);
    });
  });
  socket.on("readFile", (dir) => {
    fs.readFile("./programs/" + dir, (err, data) => {
      if (err) {
        console.error(`Error reading file: ${err.message}`);
      } else {
        socket.emit("sendFile", data.toString());
      }
    });
  });

  socket.on("upload", (data) => {
    let newId = crypto.randomUUID();
    const buffer = Buffer.from(new Uint8Array(data.file));
    const filename = `${newId}.zip`;
    const filepath = join(__dirname, "programs", filename);

    fs.writeFile(filepath, buffer, (err) => {
      if (err) {
        console.error("File upload error:", err);
        socket.emit("uploadResult", false);
      } else {
        fs.createReadStream(filepath)
          .pipe(unzipper.Extract({ path: "./programs/" + newId }))
          .on("close", () => {
            programs.push({
              name: data.name,
              port: data.port,
              uuid: newId,
              status: "Offline",
              autostart: false,
            });
            saveDb();
            fs.unlink(filepath, () => {
              socket.emit("uploadResult", true);
            });
          })
          .on("error", (err) => {
            console.error("Unzipping error:", err);
            socket.emit("uploadResult", false);
          });
      }
    });
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});

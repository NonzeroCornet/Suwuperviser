const fs = require("fs");
if (!fs.existsSync("./programs")) {
  fs.mkdirSync("./programs");
}
if (!fs.existsSync(".env")) {
  fs.writeFileSync(".env", "PASSWORD=enter_a_sha256_hash_here\nPORT=8080");
}
if (!fs.existsSync("db.json")) {
  fs.writeFileSync("db.json", "{'programs': []}");
}

require("dotenv").config();
const express = require("express");
const { join, extname } = require("node:path");
const { createServer, get } = require("node:http");
const http = require("isomorphic-git/http/node");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const { isText } = require("istextorbinary");
const crypto = require("node:crypto");
const unzipper = require("unzipper");
const os = require("os");
const { exec } = require("child_process");
const git = require("isomorphic-git");
const getSystemUsage = require("./systemUsage.js");
const FastSpeedtest = require("fast-speedtest-api");

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
        if (program.autostart) {
          runProgram(program.uuid);
        }
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

async function downloadGitRepo(repoUrl, targetDir) {
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    await git.clone({
      fs,
      http,
      dir: targetDir,
      url: repoUrl,
      depth: 1,
    });

    const gitFolderPath = join(targetDir, ".git");
    if (fs.existsSync(gitFolderPath)) {
      fs.rmSync(gitFolderPath, { recursive: true });
    }

    return true;
  } catch (error) {
    return false;
  }
}

io.on("connection", (socket) => {
  socket.emit("programs", programs);
  socket.on("inspect", (uuid) => {
    let out = [];

    findTextFiles("./programs/" + uuid, out, () => {
      fs.readFile("./programs/" + uuid + "/.suwut", (err, data) => {
        if (err) {
          console.error(`Error reading terminal: ${err.message}`);
          socket.emit("inspectr", [out, "Error reading terminal."]);
        } else {
          socket.emit("inspectr", [out, data.toString()]);
        }
      });
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
            fs.writeFileSync("./programs/" + newId + "/.suwut", "");
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

  socket.on("github", (data) => {
    let newId = crypto.randomUUID();
    downloadGitRepo(
      data.url.slice(-4) == ".git" ? data.url : data.url + ".git",
      join(__dirname, "programs", newId)
    ).then((v) => {
      if (v) {
        programs.push({
          name: data.name,
          port: data.port,
          uuid: newId,
          status: "Offline",
          autostart: false,
        });
        saveDb();
        fs.writeFileSync("./programs/" + newId + "/.suwut", "");
        socket.emit("uploadResult", true);
      } else {
        socket.emit("uploadResult", false);
      }
    });
  });

  socket.on("run", (uuid) => {
    runProgram(uuid);
    setTimeout(() => {
      for (let i = 0; i < programs.length; i++) {
        isOnline(programs[i].port, (online) => {
          programs[i].status = online ? "Online" : "Offline";
        });
      }
    }, 2000);
  });

  socket.on("autostart", (v) => {
    programs.find((el) => el.uuid == v[0]).autostart = v[1];
    saveDb();
  });
});

const isWindows = os.platform() === "win32";
const script = isWindows ? "start.bat" : "start.sh";

function runProgram(uuid) {
  const outputFilePath = join(__dirname + "/programs/" + uuid, ".suwut");
  const scriptPath = join(
    'C:\\"' + __dirname.slice(3) + '"/programs/' + uuid,
    script
  );
  const command = isWindows ? `cmd.exe /c ${scriptPath}` : scriptPath;

  const child = exec(
    command,
    { cwd: join(__dirname, "programs", uuid) },
    (error, stdout, stderr) => {
      if (error) {
        return;
      }
    }
  );

  const outputStream = fs.createWriteStream(outputFilePath);
  child.stdout.pipe(outputStream);
  child.stderr.pipe(outputStream);

  child.on("exit", (code) => {
    outputStream.end();
  });
}

function isOnline(port, callback) {
  get("http://127.0.0.1:" + port, (res) => {
    const { statusCode } = res;

    if (statusCode >= 200 && statusCode < 400) {
      callback(true);
    } else {
      callback(false);
    }
  }).on("error", (err) => {
    callback(false);
  });
}

setTimeout(() => {
  for (let i = 0; i < programs.length; i++) {
    isOnline(programs[i].port, (online) => {
      programs[i].status = online ? "Online" : "Offline";
    });
  }
}, 2000);

setInterval(() => {
  for (let i = 0; i < programs.length; i++) {
    isOnline(programs[i].port, (online) => {
      programs[i].status = online ? "Online" : "Offline";
    });
  }

  let speedtest = new FastSpeedtest({
    token: process.env.FASTCOMTOKEN,
    verbose: false,
    timeout: 1000,
    https: true,
    urlCount: 5,
    bufferSize: 8,
    unit: FastSpeedtest.UNITS.Mbps,
  });

  getSystemUsage().then((usage) => {
    speedtest
      .getSpeed()
      .then((s) => {
        io.emit("hardware", [usage.cpuUsage, usage.ramAvailability, s]);
      })
      .catch((e) => {
        console.error(e.message);
      });
  });
}, 3000);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});

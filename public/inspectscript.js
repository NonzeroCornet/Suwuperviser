const socket = io();

let programList = [];

let programId =
  window.location.href.split("/")[window.location.href.split("/").length - 1];

socket.on("programs", (programs) => {
  programList = programs;
  updateProcessDetails();
});

function getProcessDetails() {
  const processDetails = programList.find((el) => el.uuid == programId);
  return processDetails;
}

function updateProcessDetails() {
  const processDetails = getProcessDetails();

  const processName = document.getElementById("process-name");
  const processPort = document.getElementById("process-port");
  const processStatus = document.getElementById("process-status");
  const autostartSwitch = document.getElementById("autostart");

  processName.textContent = processDetails.name;
  processPort.textContent = processDetails.port;
  processStatus.textContent = processDetails.status;
  processDetails.status == "Online"
    ? (processStatus.style.background = "lime")
    : (processStatus.style.background = "red");
  autostartSwitch.checked = processDetails.autostart;
}

const autostartSwitch = document.getElementById("autostart");
autostartSwitch.addEventListener("change", () => {
  console.log(`Autostart: ${autostartSwitch.checked}`);
});

const terminalOutput = document.querySelector(".terminal-output");

socket.emit("inspect", programId);

socket.on("inspectr", (data) => {
  for (let i = 0; i < data[0].length; i++) {
    document.getElementById("file-tree").innerHTML +=
      "<span onclick='getFile(this)' class='pointer'>" +
      data[0][i] +
      "</span><br><br>";
  }
});

function getFile(el) {
  document.getElementById("file-content").innerText = "READING...";
  socket.emit("readFile", programId + "/" + el.innerHTML);
}

socket.on("sendFile", (data) => {
  console.log([data]);
  document.getElementById("file-content").innerHTML = data
    .replace(/[\u00A0-\u9999<>\&]/g, (i) => "&#" + i.charCodeAt(0) + ";")
    .replaceAll("\r\n", "<br>")
    .replaceAll(" ", "&nbsp;&nbsp;");
});

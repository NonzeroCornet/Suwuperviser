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

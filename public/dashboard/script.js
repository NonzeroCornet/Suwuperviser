const socket = io();

let programList = [];

socket.on("programs", (programs) => {
  programList = programs;
  updateProcessList();
});

function getProcessInfo() {
  return programList;
}

function updateProcessList() {
  const processList = document.getElementById("process-list-body");
  processList.innerHTML = "";

  const processes = getProcessInfo();

  processes.forEach((process) => {
    const row = document.createElement("tr");
    row.innerHTML = `
          <td>${process.name}</td>
          <td>${process.port}</td>
          <td><button class="inspect-btn">Inspect</button></td>
      `;
    processList.appendChild(row);

    const inspectButton = row.querySelector(".inspect-btn");
    inspectButton.addEventListener("click", () => {
      window.location.href = "/inspect/" + process.uuid;
    });
  });
}
const addProcessForm = document.querySelector(".add-process form");

addProcessForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const processName = document.getElementById("process-name").value;
  const processGitHub = document.getElementById("process-github").value;
  const processZip = document.getElementById("process-zip").files[0];
  const processPort = document.getElementById("process-port").value;
  if (processGitHub) {
    console.log(
      `Adding process ${processName} from GitHub: ${processGitHub} on port ${processPort}`
    );
  } else if (processZip) {
    console.log(
      `Adding process ${processName} from ZIP file on port ${processPort}`
    );
    handleZipUpload(processZip);
  }
  addProcessForm.reset();
});

function handleZipUpload(zipFile) {
  const reader = new FileReader();
  reader.onload = () => {
    const zipData = reader.result;
    console.log("ZIP file data:", zipData);
  };
  reader.readAsArrayBuffer(zipFile);
}

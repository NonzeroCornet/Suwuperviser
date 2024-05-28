const socket = io();

socket.emit("getOpenPorts");

socket.on("openPorts", (ports) => {
  document.querySelector(".terminal-output").innerHTML = ports.join("<br>");
});

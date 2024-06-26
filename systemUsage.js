const util = require("util");
const exec = util.promisify(require("child_process").exec);

async function getSystemUsage() {
  try {
    const cpuUsage = await getCPUUsage();

    const ramAvailability = await getramAvailability();

    return { cpuUsage, ramAvailability };
  } catch (error) {
    console.error("Error:", error);
    return { cpuUsage: "N/A", ramAvailability: "N/A" };
  }
}

async function getCPUUsage() {
  const isWindows = process.platform === "win32";

  if (isWindows) {
    const { stdout } = await exec("wmic cpu get loadpercentage");
    const cpuUsage = parseFloat(stdout.split("\n")[1].trim());
    return isNaN(cpuUsage) ? "N/A" : cpuUsage;
  } else {
    const { stdout } = await exec(
      "top -bn1 | grep \"Cpu(s)\" | awk '{print $2 + $4}'"
    );
    const cpuUsage = parseFloat(stdout.trim());
    return isNaN(cpuUsage) ? "N/A" : cpuUsage;
  }
}

async function getramAvailability() {
  const isWindows = process.platform === "win32";

  if (isWindows) {
    const { stdout } = await exec(
      `systeminfo |find "Available Physical Memory"`
    );
    const ramAvailability =
      parseFloat(stdout.split(": ")[1].split(" ")[0].replace(",", "")) / 1000;
    return isNaN(ramAvailability) ? "N/A" : ramAvailability;
  } else {
    const { stdout } = await exec("free -m | awk '/^Mem/ {print $4 / 1024}'");
    const ramAvailability = parseFloat(stdout.trim());
    return isNaN(ramAvailability) ? "N/A" : ramAvailability;
  }
}

module.exports = getSystemUsage;

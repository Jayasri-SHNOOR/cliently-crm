
const mongoose = require("mongoose");
const os = require("os");

const getSystemHealth = async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;

    const databaseStatus =
      {
        0: "Disconnected",
        1: "Connected",
        2: "Connecting",
        3: "Disconnecting",
      }[dbState] || "Unknown";

    const databaseConnected = dbState === 1;

    const data = {
      server: {
        status: databaseConnected ? "Healthy" : "Degraded",
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform,
      },
      database: {
        status: databaseStatus,
        connected: databaseConnected,
      },
      system: {
        totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
        freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
        processMemoryMB: Math.round(
          process.memoryUsage().rss / 1024 / 1024
        ),
      },
      checkedAt: new Date().toISOString(),
    };

    return res.status(databaseConnected ? 200 : 503).json({
      success: databaseConnected,
      status: databaseConnected ? "Healthy" : "Degraded",
      data,
    });
  } catch (error) {
    console.error("System health error:", error.message);

    return res.status(500).json({
      success: false,
      status: "Error",
      message: "Unable to retrieve system health",
    });
  }
};

module.exports = { getSystemHealth };

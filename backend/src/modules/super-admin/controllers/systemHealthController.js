
const mongoose = require("mongoose");
const os = require("os");

const getSystemHealth = async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;

    const databaseStatus = {
      0: "Disconnected",
      1: "Connected",
      2: "Connecting",
      3: "Disconnecting",
    }[dbState] || "Unknown";

    const data = {
      server: {
        status: "Healthy",
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform,
      },
      database: {
        status: databaseStatus,
        connected: dbState === 1,
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

    const overallHealthy = data.database.connected;

    res.status(overallHealthy ? 200 : 503).json({
      success: true,
      status: overallHealthy ? "Healthy" : "Degraded",
      data,
    });
  } catch (error) {
    console.error("System health error:", error.message);

    res.status(500).json({
      success: false,
      status: "Error",
      message: "Unable to retrieve system health",
    });
  }
};

module.exports = { getSystemHealth };

// src/routes/adminRoutes.js
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGS_DIR = path.join(__dirname, "../../logs");

// ─── Helper: parse log line ───────────────────────────────────────────────────
function parseLine(line) {
  // Format: 2026-06-07 15:48:31 [HTTP]: POST /api/... 201 5756ms
  // Format: 2026-06-07 15:48:31 [INFO]: ⚖️ Smart answer generated
  // Format: 2026-06-07 15:48:31 [ERROR]: 500 - message - /path - METHOD - IP
  const clean = line.replace(/\x1b\[[0-9;]*m/g, "").trim(); // strip ANSI colors
  if (!clean) return null;

  const dateMatch = clean.match(
    /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[(\w+)\]: (.+)$/
  );
  if (!dateMatch) return null;

  const [, timestamp, level, message] = dateMatch;

  // Parse HTTP lines
  const httpMatch = message.match(/^(\w+) (\S+) (\d{3}) ([\d.]+) ms/);
  if (httpMatch) {
    return {
      timestamp,
      level: "HTTP",
      method: httpMatch[1],
      path: httpMatch[2],
      status: parseInt(httpMatch[3]),
      duration: parseFloat(httpMatch[4]),
      message,
    };
  }

  // Parse ERROR lines
  if (level === "ERROR") {
    const errMatch = message.match(
      /^(\d{3}) - (.+?) - (\/\S+) - (\w+) - (.+)$/
    );
    if (errMatch) {
      return {
        timestamp,
        level: "ERROR",
        status: parseInt(errMatch[1]),
        message: errMatch[2],
        path: errMatch[3],
        method: errMatch[4],
        ip: errMatch[5],
      };
    }
  }

  return { timestamp, level, message };
}

function readLogFile(filename) {
  const filePath = path.join(LOGS_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  return content
    .split("\n")
    .map(parseLine)
    .filter(Boolean)
    .reverse(); // newest first
}

// ─── GET /api/admin/logs ──────────────────────────────────────────────────────
router.get("/logs", (req, res) => {
  try {
    const { type = "all", limit = 100, page = 1 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let logs = [];

    if (type === "error") {
      logs = readLogFile("error.log");
    } else if (type === "combined") {
      logs = readLogFile("combined.log");
    } else {
      // all: merge both files
      const combined = readLogFile("combined.log");
      const errors = readLogFile("error.log");
      // deduplicate by timestamp+message
      const seen = new Set();
      for (const entry of [...combined, ...errors]) {
        const key = entry.timestamp + entry.message;
        if (!seen.has(key)) {
          seen.add(key);
          logs.push(entry);
        }
      }
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    const total = logs.length;
    const start = (pageNum - 1) * limitNum;
    const paginated = logs.slice(start, start + limitNum);

    res.json({
      success: true,
      data: {
        logs: paginated,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get("/stats", (req, res) => {
  try {
    const combined = readLogFile("combined.log");
    const errors = readLogFile("error.log");

    // Count by level
    const levelCounts = { HTTP: 0, INFO: 0, ERROR: 0, WARN: 0 };
    for (const log of combined) {
      if (levelCounts[log.level] !== undefined) levelCounts[log.level]++;
    }

    // HTTP stats
    const httpLogs = combined.filter((l) => l.level === "HTTP");
    const avgDuration =
      httpLogs.length > 0
        ? Math.round(
            httpLogs.reduce((s, l) => s + (l.duration || 0), 0) /
              httpLogs.length
          )
        : 0;

    const statusCodes = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 };
    for (const log of httpLogs) {
      if (log.status >= 200 && log.status < 300) statusCodes["2xx"]++;
      else if (log.status >= 300 && log.status < 400) statusCodes["3xx"]++;
      else if (log.status >= 400 && log.status < 500) statusCodes["4xx"]++;
      else if (log.status >= 500) statusCodes["5xx"]++;
    }

    // Most hit endpoints
    const endpointMap = {};
    for (const log of httpLogs) {
      const key = `${log.method} ${log.path}`;
      endpointMap[key] = (endpointMap[key] || 0) + 1;
    }
    const topEndpoints = Object.entries(endpointMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([endpoint, count]) => ({ endpoint, count }));

    // Last 7 days activity
    const dailyMap = {};
    for (const log of combined) {
      const day = log.timestamp.split(" ")[0];
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    }
    const dailyActivity = Object.entries(dailyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7)
      .map(([date, count]) => ({ date, count }));

    res.json({
      success: true,
      data: {
        totalLogs: combined.length,
        totalErrors: errors.length,
        levelCounts,
        avgDuration,
        statusCodes,
        topEndpoints,
        dailyActivity,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
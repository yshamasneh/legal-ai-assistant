import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";

// الحصول على المسار الحالي (ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// مسار مجلد logs
const logsDir = path.join(__dirname, "../../logs");

// ═══════════════════════════════════════════════
// المستويات (Levels)
// ═══════════════════════════════════════════════
const levels = {
  error: 0,    // 🔴 أعلى أولوية
  warn: 1,     // 🟡
  info: 2,     // 🟢
  http: 3,     // 🔵
  debug: 4,    // ⚪ أقل أولوية
};

// ═══════════════════════════════════════════════
// الألوان لكل مستوى
// ═══════════════════════════════════════════════
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// ═══════════════════════════════════════════════
// تنسيق الـ logs في الـ console
// ═══════════════════════════════════════════════
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

// ═══════════════════════════════════════════════
// تنسيق الـ logs في الملفات (بدون ألوان)
// ═══════════════════════════════════════════════
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`
  )
);

// ═══════════════════════════════════════════════
// أماكن حفظ الـ logs
// ═══════════════════════════════════════════════
const transports = [
  // 1️⃣ طباعة في الـ console
  new winston.transports.Console({
    format: consoleFormat,
  }),

  // 2️⃣ حفظ الأخطاء فقط في error.log
  new winston.transports.File({
    filename: path.join(logsDir, "error.log"),
    level: "error",
    format: fileFormat,
    maxsize: 5242880, // 5 MB
    maxFiles: 5,
  }),

  // 3️⃣ حفظ كل شي في combined.log
  new winston.transports.File({
    filename: path.join(logsDir, "combined.log"),
    format: fileFormat,
    maxsize: 5242880, // 5 MB
    maxFiles: 5,
  }),
];

// ═══════════════════════════════════════════════
// إنشاء الـ Logger
// ═══════════════════════════════════════════════
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "debug",
  levels,
  transports,
});

// ═══════════════════════════════════════════════
// Stream لاستخدامه مع morgan
// ═══════════════════════════════════════════════
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

export default logger;
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

import connectDB from "./config/db.js";
import logger from "./config/logger.js";
import errorHandler from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

// ═══════════════════════════════════════════════
// 1️⃣ تحميل المتغيرات من .env
// ═══════════════════════════════════════════════
dotenv.config();

// ═══════════════════════════════════════════════
// 2️⃣ الاتصال بقاعدة البيانات
// ═══════════════════════════════════════════════
connectDB();

// ═══════════════════════════════════════════════
// 3️⃣ إنشاء التطبيق
// ═══════════════════════════════════════════════
const app = express();

// ═══════════════════════════════════════════════
// 4️⃣ Trust Proxy
// ═══════════════════════════════════════════════
app.set("trust proxy", 1);

// ═══════════════════════════════════════════════
// 5️⃣ Security Middleware 🛡️
// ═══════════════════════════════════════════════

// Helmet - يضيف 11 HTTP header أمني
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

// ═══════════════════════════════════════════════
// 6️⃣ Body Parsers 📦
// ═══════════════════════════════════════════════
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ═══════════════════════════════════════════════
// 7️⃣ Data Sanitization 🧼 (حل يدوي متوافق مع Express 5)
// ═══════════════════════════════════════════════

// يمنع NoSQL Injection (يحذف $ و . من المفاتيح)
const sanitizeData = (obj) => {
  if (!obj || typeof obj !== "object") return;
  for (const key in obj) {
    if (/^\$/.test(key) || /\./.test(key)) {
      delete obj[key];
    } else if (typeof obj[key] === "object") {
      sanitizeData(obj[key]);
    }
  }
};

app.use((req, res, next) => {
  sanitizeData(req.body);
  sanitizeData(req.params);
  // ملاحظة: ما نعدّل req.query في Express 5 (read-only)
  next();
});

// يمنع HTTP Parameter Pollution
app.use(hpp());

// ═══════════════════════════════════════════════
// 8️⃣ Performance ⚡
// ═══════════════════════════════════════════════
app.use(compression());

// ═══════════════════════════════════════════════
// 9️⃣ Rate Limiting 🚦
// ═══════════════════════════════════════════════
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    statusCode: 429,
    message: "تجاوزت عدد الطلبات المسموح، حاول بعد 15 دقيقة",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    statusCode: 429,
    message: "تجاوزت عدد محاولات تسجيل الدخول، حاول بعد 15 دقيقة",
  },
  skipSuccessfulRequests: true,
});

app.use("/api", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);

// ═══════════════════════════════════════════════
// 🔟 HTTP Logging (Morgan) 📝
// ═══════════════════════════════════════════════
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";

app.use(
  morgan(morganFormat, {
    stream: logger.stream,
    skip: (req) => req.url === "/api/health",
  })
);

// ═══════════════════════════════════════════════
// 1️⃣1️⃣ Routes 🛣️
// ═══════════════════════════════════════════════

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🎯 Legal AI Backend is running!",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "✅ Server is healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
// Auth Routes
app.use("/api/auth", authRoutes);
// Chat Routes
app.use("/api/chats", chatRoutes);



// app.use("/api/auth", authRoutes);
// app.use("/api/chats", chatRoutes);

// ═══════════════════════════════════════════════
// 1️⃣2️⃣ Error Handling 🚨
// ═══════════════════════════════════════════════
app.use(notFound);
app.use(errorHandler);

// ═══════════════════════════════════════════════
// 1️⃣3️⃣ Start Server 🚀
// ═══════════════════════════════════════════════
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📦 Environment: ${process.env.NODE_ENV}`);
});

// ═══════════════════════════════════════════════
// 1️⃣4️⃣ Graceful Shutdown 🛑
// ═══════════════════════════════════════════════
process.on("unhandledRejection", (err) => {
  logger.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  logger.error(`❌ Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on("SIGTERM", () => {
  logger.info("👋 SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    logger.info("💤 Process terminated");
  });
});
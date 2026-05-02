import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";

// ═══════════════════════════════════════════════
// 🎫 Token Service
// ═══════════════════════════════════════════════

/**
 * إنشاء Access Token (للاستخدام اليومي)
 * مدة الصلاحية: 7 أيام
 */
export const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId, type: "access" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/**
 * إنشاء Refresh Token (لتجديد Access Token)
 * مدة الصلاحية: 30 يوم
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: "refresh" },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

/**
 * التحقق من Token وفك تشفيره
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw ApiError.unauthorized("انتهت صلاحية رمز الدخول");
    }
    if (error.name === "JsonWebTokenError") {
      throw ApiError.unauthorized("رمز الدخول غير صحيح");
    }
    throw ApiError.unauthorized("فشل التحقق من رمز الدخول");
  }
};

/**
 * استخراج Token من الطلب
 * يبحث في: Authorization header أو Cookie
 */
export const extractToken = (req) => {
  // 1. من Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  // 2. من Cookies (اختياري)
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

/**
 * إنشاء كلا النوعين من الـ tokens
 */
export const generateTokenPair = (userId) => {
  return {
    accessToken: generateAccessToken(userId),
    refreshToken: generateRefreshToken(userId),
  };
};
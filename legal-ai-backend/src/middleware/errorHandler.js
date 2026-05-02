import logger from "../config/logger.js";
import ApiError from "../utils/ApiError.js";

/**
 * Error Handler Middleware
 * يستقبل كل الأخطاء ويرد بشكل موحّد
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // إذا الخطأ مش من نوع ApiError → حوّله لـ ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "خطأ في السيرفر";
    error = new ApiError(statusCode, message, [], err.stack);
  }

  // ═══════════════════════════════════════════════
  // معالجة أخطاء Mongoose الشائعة
  // ═══════════════════════════════════════════════

  // 1️⃣ خطأ ID غير صحيح (CastError)
  if (err.name === "CastError") {
    const message = `مورد غير موجود. ID غير صحيح: ${err.path}`;
    error = new ApiError(400, message);
  }

  // 2️⃣ خطأ Validation (حقل مفقود أو غلط)
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((val) => val.message);
    const message = "فشل التحقق من البيانات";
    error = new ApiError(400, message, errors);
  }

  // 3️⃣ خطأ مفتاح مكرّر (duplicate key - مثل إيميل موجود)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `القيمة '${value}' للحقل '${field}' مستخدمة مسبقاً`;
    error = new ApiError(409, message);
  }

  // ═══════════════════════════════════════════════
  // معالجة أخطاء JWT
  // ═══════════════════════════════════════════════

  // 4️⃣ Token غير صحيح
  if (err.name === "JsonWebTokenError") {
    const message = "رمز الدخول غير صحيح";
    error = new ApiError(401, message);
  }

  // 5️⃣ Token منتهي الصلاحية
  if (err.name === "TokenExpiredError") {
    const message = "انتهت صلاحية رمز الدخول، يرجى تسجيل الدخول من جديد";
    error = new ApiError(401, message);
  }

  // ═══════════════════════════════════════════════
  // تسجيل الخطأ في الـ logs
  // ═══════════════════════════════════════════════
  logger.error(
    `${error.statusCode} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
  );

  // ═══════════════════════════════════════════════
  // إرسال الرد الموحّد
  // ═══════════════════════════════════════════════
  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    // إظهار الـ stack فقط في التطوير
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  };

  res.status(error.statusCode).json(response);
};

export default errorHandler;
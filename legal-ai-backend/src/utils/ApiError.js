/**
 * Class مخصص لإنشاء أخطاء API موحّدة
 *
 * الاستخدام:
 * throw new ApiError(404, "المستخدم غير موجود");
 * throw new ApiError(400, "البيانات غير صحيحة", ["email is required"]);
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = [], stack = "") {
    super(message);

    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.isOperational = true; // خطأ متوقع (مش crash)

    // حفظ الـ stack trace (لتتبع الخطأ)
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // ═══════════════════════════════════════════════
  // دوال ثابتة لأخطاء شائعة (اختيارية للسهولة)
  // ═══════════════════════════════════════════════

  static badRequest(message = "طلب غير صحيح", errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "غير مصرّح") {
    return new ApiError(401, message);
  }

  static forbidden(message = "ممنوع الوصول") {
    return new ApiError(403, message);
  }

  static notFound(message = "المورد غير موجود") {
    return new ApiError(404, message);
  }

  static conflict(message = "تعارض في البيانات") {
    return new ApiError(409, message);
  }

  static tooManyRequests(message = "عدد الطلبات تجاوز الحد المسموح") {
    return new ApiError(429, message);
  }

  static internal(message = "خطأ في السيرفر") {
    return new ApiError(500, message);
  }
}

export default ApiError;
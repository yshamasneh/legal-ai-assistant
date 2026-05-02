import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import logger from "../config/logger.js";
import { verifyToken, extractToken } from "../services/tokenService.js";

// ═══════════════════════════════════════════════
// 🛡️ 1. PROTECT - حماية الـ routes
// يتحقق من تسجيل الدخول ويحفظ المستخدم في req.user
// ═══════════════════════════════════════════════
export const protect = asyncHandler(async (req, res, next) => {
  // 1. استخراج الـ token من الطلب
  const token = extractToken(req);

  if (!token) {
    throw ApiError.unauthorized("يرجى تسجيل الدخول للوصول إلى هذا المورد");
  }

  // 2. التحقق من صحة الـ token
  const decoded = verifyToken(token);

  // 3. التأكد أن الـ token من نوع access (مش refresh)
  if (decoded.type !== "access") {
    throw ApiError.unauthorized("نوع رمز الدخول غير صحيح");
  }

  // 4. البحث عن المستخدم في الداتابيز
  const user = await User.findById(decoded.userId).select(
    "+passwordChangedAt"
  );

  if (!user) {
    throw ApiError.unauthorized("المستخدم المرتبط بهذا الرمز غير موجود");
  }

  // 5. التحقق من حالة الحساب
  if (user.status === "suspended") {
    throw ApiError.forbidden("تم تعليق حسابك");
  }

  if (user.status === "deleted" || user.deletedAt) {
    throw ApiError.forbidden("هذا الحساب غير متاح");
  }

  // 6. التحقق من أن كلمة المرور لم تُغيّر بعد إصدار الـ token
  if (user.changedPasswordAfter(decoded.iat)) {
    throw ApiError.unauthorized(
      "تم تغيير كلمة المرور مؤخراً، يرجى تسجيل الدخول من جديد"
    );
  }

  // 7. حفظ المستخدم في الـ request للاستخدام في الـ controllers
  req.user = user;
  req.token = token;

  next();
});

// ═══════════════════════════════════════════════
// 👑 2. REQUIRE ROLE - التحقق من الصلاحية
// استخدامه: router.get("/admin", protect, requireRole("admin"), ...)
// ═══════════════════════════════════════════════
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized("يرجى تسجيل الدخول أولاً");
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        `🚫 Unauthorized access attempt: ${req.user.email} (role: ${req.user.role}) tried to access ${req.originalUrl}`
      );
      throw ApiError.forbidden(
        `ليس لديك صلاحية للوصول إلى هذا المورد (المطلوب: ${allowedRoles.join(" أو ")})`
      );
    }

    next();
  };
};

// ═══════════════════════════════════════════════
// 🔓 3. OPTIONAL AUTH - authentication اختياري
// يحاول جلب المستخدم لكن ما يفشل إذا ما كان مسجّل دخول
// مفيد لـ endpoints تعمل للمسجّلين والزوار
// ═══════════════════════════════════════════════
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  // لو ما في token، كمّل بدون مستخدم
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyToken(token);

    if (decoded.type !== "access") {
      req.user = null;
      return next();
    }

    const user = await User.findById(decoded.userId);

    if (!user || user.status !== "active") {
      req.user = null;
      return next();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    // إذا الـ token غلط، كمّل بدون مستخدم (ما نرمي خطأ)
    req.user = null;
    next();
  }
});

// ═══════════════════════════════════════════════
// ✅ 4. REQUIRE VERIFIED EMAIL
// يتأكد أن المستخدم قام بتأكيد البريد الإلكتروني
// ═══════════════════════════════════════════════
export const requireVerifiedEmail = (req, res, next) => {
  if (!req.user) {
    throw ApiError.unauthorized("يرجى تسجيل الدخول أولاً");
  }

  if (!req.user.emailVerified) {
    throw ApiError.forbidden(
      "يرجى تأكيد بريدك الإلكتروني للوصول إلى هذا المورد"
    );
  }

  next();
};

// ═══════════════════════════════════════════════
// 🔐 5. IS OWNER OR ADMIN
// يتحقق إذا المستخدم هو صاحب المورد أو أدمن
// مفيد للـ resources الشخصية
// ═══════════════════════════════════════════════
export const isOwnerOrAdmin = (resourceUserIdField = "user") => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized("يرجى تسجيل الدخول أولاً");
    }

    // Admin يقدر يوصل لأي مورد
    if (req.user.role === "admin") {
      return next();
    }

    // التحقق من أن المستخدم هو صاحب المورد
    const resourceUserId =
      req[resourceUserIdField]?._id?.toString() ||
      req[resourceUserIdField]?.toString();

    if (resourceUserId !== req.user._id.toString()) {
      logger.warn(
        `🚫 Ownership violation: ${req.user.email} tried to access resource of ${resourceUserId}`
      );
      throw ApiError.forbidden("ليس لديك صلاحية للوصول إلى هذا المورد");
    }

    next();
  };
};
    import crypto from "crypto";
import { validationResult } from "express-validator";

import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import logger from "../config/logger.js";
import {
  generateTokenPair,
  generateAccessToken,
} from "../services/tokenService.js";

// ═══════════════════════════════════════════════
// 🔧 Helper: معالجة أخطاء Validator
// ═══════════════════════════════════════════════
const checkValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    throw ApiError.badRequest("فشل التحقق من البيانات", errorMessages);
  }
};

// ═══════════════════════════════════════════════
// 🔧 Helper: إعدادات Cookie للـ refresh token
// ═══════════════════════════════════════════════
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 يوم
};

// ═══════════════════════════════════════════════
// 📝 1. SIGNUP - تسجيل حساب جديد
// POST /api/auth/signup
// ═══════════════════════════════════════════════
export const signup = asyncHandler(async (req, res) => {
  checkValidation(req);

  const { fullName, email, password, phoneNumber } = req.body;

  // 1. التحقق من عدم وجود مستخدم بنفس الإيميل
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw ApiError.conflict("البريد الإلكتروني مسجّل مسبقاً");
  }

  // 2. إنشاء المستخدم (الباسورد يتشفّر تلقائياً في User Model)
  const user = await User.create({
    fullName,
    email,
    password,
    phoneNumber: phoneNumber || null,
  });

  // 3. إنشاء Tokens
  const { accessToken, refreshToken } = generateTokenPair(user._id);

  // 4. حفظ refresh token في cookie
  res.cookie("refreshToken", refreshToken, cookieOptions);

  // 5. تسجيل الحدث
  logger.info(`🎉 User registered: ${user.email} (ID: ${user._id})`);

  // 6. إرسال الرد
  res.status(201).json({
    success: true,
    message: "تم إنشاء الحساب بنجاح",
    data: {
      user,
      accessToken,
    },
  });
});

// ═══════════════════════════════════════════════
// 🔐 2. LOGIN - تسجيل دخول
// POST /api/auth/login
// ═══════════════════════════════════════════════
export const login = asyncHandler(async (req, res) => {
  checkValidation(req);

  const { email, password } = req.body;

  // 1. البحث عن المستخدم (مع كلمة المرور ومحاولات الدخول)
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password +loginAttempts +lockUntil"
  );

  if (!user) {
    logger.warn(`⚠️ Login failed: Email not found - ${email}`);
    throw ApiError.unauthorized("البريد الإلكتروني أو كلمة المرور غير صحيحة");
  }

  // 2. التحقق من إذا كان الحساب مقفول
  if (user.isLocked) {
    const minutesLeft = Math.ceil(
      (user.lockUntil - Date.now()) / (60 * 1000)
    );
    logger.warn(`🔒 Login attempt on locked account: ${email}`);
    throw ApiError.unauthorized(
      `الحساب مقفول مؤقتاً. حاول بعد ${minutesLeft} دقيقة`
    );
  }

  // 3. التحقق من حالة الحساب
  if (user.status === "suspended") {
    throw ApiError.forbidden("تم تعليق حسابك. تواصل مع الدعم");
  }

  if (user.status === "deleted") {
    throw ApiError.forbidden("هذا الحساب غير متاح");
  }

  // 4. مقارنة كلمة المرور
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    // زيادة محاولات الدخول الفاشلة
    await user.incrementLoginAttempts();

    logger.warn(
      `⚠️ Login failed: Wrong password - ${email} (attempts: ${user.loginAttempts + 1})`
    );

    throw ApiError.unauthorized("البريد الإلكتروني أو كلمة المرور غير صحيحة");
  }

  // 5. إعادة تعيين محاولات الدخول وتحديث آخر دخول
  await user.resetLoginAttempts();
  user.lastLoginIP = req.ip;
  await user.save({ validateBeforeSave: false });

  // 6. إنشاء Tokens
  const { accessToken, refreshToken } = generateTokenPair(user._id);

  // 7. حفظ refresh token في cookie
  res.cookie("refreshToken", refreshToken, cookieOptions);

  logger.info(`✅ User logged in: ${user.email}`);

  // 8. إرسال الرد (بدون كلمة المرور)
  user.password = undefined;
  user.loginAttempts = undefined;
  user.lockUntil = undefined;

  res.status(200).json({
    success: true,
    message: "تم تسجيل الدخول بنجاح",
    data: {
      user,
      accessToken,
    },
  });
});

// ═══════════════════════════════════════════════
// 👤 3. GET ME - بيانات المستخدم الحالي
// GET /api/auth/me
// ═══════════════════════════════════════════════
export const getMe = asyncHandler(async (req, res) => {
  // req.user يأتي من authMiddleware
  const user = await User.findById(req.user._id);

  if (!user) {
    throw ApiError.notFound("المستخدم غير موجود");
  }

  res.status(200).json({
    success: true,
    data: { user },
  });
});

// ═══════════════════════════════════════════════
// 🚪 4. LOGOUT - تسجيل خروج
// POST /api/auth/logout
// ═══════════════════════════════════════════════
export const logout = asyncHandler(async (req, res) => {
  // مسح الـ refresh token cookie
  res.clearCookie("refreshToken", cookieOptions);

  if (req.user) {
    logger.info(`👋 User logged out: ${req.user.email}`);
  }

  res.status(200).json({
    success: true,
    message: "تم تسجيل الخروج بنجاح",
  });
});

// ═══════════════════════════════════════════════
// ✏️ 5. UPDATE PROFILE - تحديث الملف الشخصي
// PUT /api/auth/profile
// ═══════════════════════════════════════════════
export const updateProfile = asyncHandler(async (req, res) => {
  checkValidation(req);

  const { fullName, phoneNumber, preferredLanguage, avatar } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    throw ApiError.notFound("المستخدم غير موجود");
  }

  // تحديث الحقول المسموح بها فقط
  if (fullName !== undefined) user.fullName = fullName;
  if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
  if (preferredLanguage !== undefined)
    user.preferredLanguage = preferredLanguage;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();

  logger.info(`✏️ Profile updated: ${user.email}`);

  res.status(200).json({
    success: true,
    message: "تم تحديث الملف الشخصي بنجاح",
    data: { user },
  });
});

// ═══════════════════════════════════════════════
// 🔑 6. CHANGE PASSWORD - تغيير كلمة المرور
// PUT /api/auth/password
// ═══════════════════════════════════════════════
export const changePassword = asyncHandler(async (req, res) => {
  checkValidation(req);

  const { currentPassword, newPassword } = req.body;

  // جلب المستخدم مع كلمة المرور
  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    throw ApiError.notFound("المستخدم غير موجود");
  }

  // التحقق من كلمة المرور الحالية
  const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);

  if (!isCurrentPasswordCorrect) {
    logger.warn(`⚠️ Failed password change attempt: ${user.email}`);
    throw ApiError.unauthorized("كلمة المرور الحالية غير صحيحة");
  }

  // تحديث كلمة المرور (ستُشفّر تلقائياً)
  user.password = newPassword;
  await user.save();

  // إنشاء access token جديد (لأن passwordChangedAt تغيّر)
  const accessToken = generateAccessToken(user._id);

  logger.info(`🔑 Password changed: ${user.email}`);

  res.status(200).json({
    success: true,
    message: "تم تغيير كلمة المرور بنجاح",
    data: { accessToken },
  });
});

// ═══════════════════════════════════════════════
// 📧 7. FORGOT PASSWORD - نسيت كلمة المرور
// POST /api/auth/forgot-password
// ═══════════════════════════════════════════════
export const forgotPassword = asyncHandler(async (req, res) => {
  checkValidation(req);

  const { email } = req.body;

  const user = await User.findByEmail(email);

  if (!user) {
    // لا نكشف أن الإيميل غير موجود (أمان)
    return res.status(200).json({
      success: true,
      message: "إذا كان البريد الإلكتروني مسجّلاً، ستصلك رسالة إعادة التعيين",
    });
  }

  // إنشاء token لإعادة التعيين
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  logger.info(`🔐 Password reset requested: ${user.email}`);

  // TODO: إرسال إيميل مع الـ token (في الإنتاج)
  // الآن نرد بالـ token مباشرة للاختبار
  res.status(200).json({
    success: true,
    message: "تم إنشاء رابط إعادة التعيين",
    // ⚠️ في الإنتاج: لا ترجع الـ token، ابعته بالإيميل
    data: {
      resetToken,
      note: "في الإنتاج، سيُرسل هذا عبر البريد الإلكتروني",
    },
  });
});

// ═══════════════════════════════════════════════
// 🔓 8. RESET PASSWORD - إعادة تعيين كلمة المرور
// POST /api/auth/reset-password/:token
// ═══════════════════════════════════════════════
export const resetPassword = asyncHandler(async (req, res) => {
  checkValidation(req);

  const { token } = req.params;
  const { password } = req.body;

  // تشفير الـ token للمقارنة
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // البحث عن المستخدم بالـ token (مع التحقق من الصلاحية)
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    throw ApiError.badRequest(
      "رابط إعادة التعيين غير صحيح أو منتهي الصلاحية"
    );
  }

  // تحديث كلمة المرور
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  logger.info(`🔓 Password reset successful: ${user.email}`);

  // إنشاء access token جديد
  const accessToken = generateAccessToken(user._id);

  res.status(200).json({
    success: true,
    message: "تم إعادة تعيين كلمة المرور بنجاح",
    data: { accessToken },
  });
});     
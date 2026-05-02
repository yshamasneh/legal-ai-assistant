import express from "express";

import * as authController from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  signupValidator,
  loginValidator,
  updateProfileValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from "../validators/authValidator.js";

const router = express.Router();

// ═══════════════════════════════════════════════
// 🟢 Public Routes (لا تحتاج تسجيل دخول)
// ═══════════════════════════════════════════════

/**
 * @route   POST /api/auth/signup
 * @desc    تسجيل حساب جديد
 * @access  Public
 */
router.post("/signup", signupValidator, authController.signup);

/**
 * @route   POST /api/auth/login
 * @desc    تسجيل دخول
 * @access  Public
 */
router.post("/login", loginValidator, authController.login);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    طلب إعادة تعيين كلمة المرور
 * @access  Public
 */
router.post(
  "/forgot-password",
  forgotPasswordValidator,
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    إعادة تعيين كلمة المرور باستخدام الـ token
 * @access  Public
 */
router.post(
  "/reset-password/:token",
  resetPasswordValidator,
  authController.resetPassword
);

// ═══════════════════════════════════════════════
// 🔒 Protected Routes (تحتاج تسجيل دخول)
// ═══════════════════════════════════════════════

/**
 * @route   GET /api/auth/me
 * @desc    جلب بيانات المستخدم الحالي
 * @access  Private
 */
router.get("/me", protect, authController.getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    تسجيل خروج
 * @access  Private
 */
router.post("/logout", protect, authController.logout);

/**
 * @route   PUT /api/auth/profile
 * @desc    تحديث الملف الشخصي
 * @access  Private
 */
router.put(
  "/profile",
  protect,
  updateProfileValidator,
  authController.updateProfile
);

/**
 * @route   PUT /api/auth/password
 * @desc    تغيير كلمة المرور
 * @access  Private
 */
router.put(
  "/password",
  protect,
  changePasswordValidator,
  authController.changePassword
);

export default router;
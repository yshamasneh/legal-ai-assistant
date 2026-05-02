import { body } from "express-validator";

// ═══════════════════════════════════════════════
// ✅ Auth Validators
// ═══════════════════════════════════════════════

/**
 * قواعد التحقق من بيانات التسجيل (Signup)
 */
export const signupValidator = [
  // الاسم الكامل
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("الاسم الكامل مطلوب")
    .isLength({ min: 3, max: 50 })
    .withMessage("الاسم يجب أن يكون بين 3 و 50 حرفاً")
    .matches(/^[\u0600-\u06FFa-zA-Z\s]+$/)
    .withMessage("الاسم يجب أن يحتوي على حروف فقط"),

  // البريد الإلكتروني
  body("email")
    .trim()
    .notEmpty()
    .withMessage("البريد الإلكتروني مطلوب")
    .isEmail()
    .withMessage("صيغة البريد الإلكتروني غير صحيحة")
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage("البريد الإلكتروني طويل جداً"),

  // كلمة المرور
  body("password")
    .notEmpty()
    .withMessage("كلمة المرور مطلوبة")
    .isLength({ min: 8, max: 128 })
    .withMessage("كلمة المرور يجب أن تكون بين 8 و 128 حرفاً")
    .matches(/[A-Z]/)
    .withMessage("كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل")
    .matches(/[a-z]/)
    .withMessage("كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل")
    .matches(/[0-9]/)
    .withMessage("كلمة المرور يجب أن تحتوي على رقم واحد على الأقل"),

  // تأكيد كلمة المرور
  body("confirmPassword")
    .notEmpty()
    .withMessage("تأكيد كلمة المرور مطلوب")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("كلمتا المرور غير متطابقتين");
      }
      return true;
    }),

  // رقم الهاتف (اختياري)
  body("phoneNumber")
    .optional()
    .trim()
    .matches(/^\+?[0-9]{9,15}$/)
    .withMessage("رقم الهاتف غير صحيح"),
];

/**
 * قواعد التحقق من بيانات تسجيل الدخول (Login)
 */
export const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("البريد الإلكتروني مطلوب")
    .isEmail()
    .withMessage("صيغة البريد الإلكتروني غير صحيحة")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("كلمة المرور مطلوبة"),
];

/**
 * قواعد التحقق من تحديث الملف الشخصي
 */
export const updateProfileValidator = [
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("الاسم يجب أن يكون بين 3 و 50 حرفاً")
    .matches(/^[\u0600-\u06FFa-zA-Z\s]+$/)
    .withMessage("الاسم يجب أن يحتوي على حروف فقط"),

  body("phoneNumber")
    .optional()
    .trim()
    .matches(/^\+?[0-9]{9,15}$/)
    .withMessage("رقم الهاتف غير صحيح"),

  body("preferredLanguage")
    .optional()
    .isIn(["ar", "en"])
    .withMessage("اللغة يجب أن تكون ar أو en"),

  body("avatar")
    .optional()
    .isURL()
    .withMessage("رابط الصورة غير صحيح"),
];

/**
 * قواعد التحقق من تغيير كلمة المرور
 */
export const changePasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("كلمة المرور الحالية مطلوبة"),

  body("newPassword")
    .notEmpty()
    .withMessage("كلمة المرور الجديدة مطلوبة")
    .isLength({ min: 8, max: 128 })
    .withMessage("كلمة المرور يجب أن تكون بين 8 و 128 حرفاً")
    .matches(/[A-Z]/)
    .withMessage("يجب أن تحتوي على حرف كبير واحد على الأقل")
    .matches(/[a-z]/)
    .withMessage("يجب أن تحتوي على حرف صغير واحد على الأقل")
    .matches(/[0-9]/)
    .withMessage("يجب أن تحتوي على رقم واحد على الأقل")
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error("كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية");
      }
      return true;
    }),

  body("confirmNewPassword")
    .notEmpty()
    .withMessage("تأكيد كلمة المرور الجديدة مطلوب")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("كلمتا المرور غير متطابقتين");
      }
      return true;
    }),
];

/**
 * قواعد التحقق من نسيت كلمة المرور
 */
export const forgotPasswordValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("البريد الإلكتروني مطلوب")
    .isEmail()
    .withMessage("صيغة البريد الإلكتروني غير صحيحة")
    .normalizeEmail(),
];

/**
 * قواعد التحقق من إعادة تعيين كلمة المرور
 */
export const resetPasswordValidator = [
  body("password")
    .notEmpty()
    .withMessage("كلمة المرور مطلوبة")
    .isLength({ min: 8, max: 128 })
    .withMessage("كلمة المرور يجب أن تكون بين 8 و 128 حرفاً")
    .matches(/[A-Z]/)
    .withMessage("يجب أن تحتوي على حرف كبير")
    .matches(/[0-9]/)
    .withMessage("يجب أن تحتوي على رقم"),

  body("confirmPassword")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("كلمتا المرور غير متطابقتين");
      }
      return true;
    }),
];
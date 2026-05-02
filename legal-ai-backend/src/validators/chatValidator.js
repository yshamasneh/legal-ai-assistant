import { body, param, query } from "express-validator";

// ═══════════════════════════════════════════════
// ✅ Chat Validators
// ═══════════════════════════════════════════════

/**
 * التحقق من بيانات إنشاء محادثة جديدة
 */
export const createChatValidator = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("العنوان يجب أن يكون بين 1 و 100 حرف"),

  body("category")
    .optional()
    .isIn([
      "general",
      "labor",
      "family",
      "criminal",
      "civil",
      "commercial",
      "real_estate",
      "consumer",
      "other",
    ])
    .withMessage("التصنيف غير صحيح"),

  body("tags")
    .optional()
    .isArray({ max: 10 })
    .withMessage("الحد الأقصى 10 كلمات مفتاحية")
    .custom((tags) => {
      if (!tags.every((tag) => typeof tag === "string" && tag.length <= 30)) {
        throw new Error("كل كلمة مفتاحية يجب أن تكون نصاً لا يتجاوز 30 حرف");
      }
      return true;
    }),
];

/**
 * التحقق من تحديث محادثة
 */
export const updateChatValidator = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("العنوان يجب أن يكون بين 1 و 100 حرف"),

  body("category")
    .optional()
    .isIn([
      "general",
      "labor",
      "family",
      "criminal",
      "civil",
      "commercial",
      "real_estate",
      "consumer",
      "other",
    ])
    .withMessage("التصنيف غير صحيح"),

  body("tags")
    .optional()
    .isArray({ max: 10 })
    .withMessage("الحد الأقصى 10 كلمات مفتاحية"),

  body("aiModel")
    .optional()
    .isIn(["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"])
    .withMessage("نموذج الذكاء الاصطناعي غير صحيح"),
];

/**
 * التحقق من ID المحادثة
 */
export const chatIdValidator = [
  param("id")
    .isMongoId()
    .withMessage("معرّف المحادثة غير صحيح"),
];

/**
 * التحقق من query parameters لجلب المحادثات
 */
export const getChatsValidator = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("الحد الأقصى يجب أن يكون بين 1 و 100"),

  query("skip")
    .optional()
    .isInt({ min: 0 })
    .withMessage("التخطي يجب أن يكون رقم موجب"),

  query("includeArchived")
    .optional()
    .isBoolean()
    .withMessage("includeArchived يجب أن يكون true أو false"),

  query("category")
    .optional()
    .isIn([
      "general",
      "labor",
      "family",
      "criminal",
      "civil",
      "commercial",
      "real_estate",
      "consumer",
      "other",
    ])
    .withMessage("التصنيف غير صحيح"),
];
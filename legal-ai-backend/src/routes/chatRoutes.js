import express from "express";

import * as chatController from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  createChatValidator,
  updateChatValidator,
  chatIdValidator,
  getChatsValidator,
} from "../validators/chatValidator.js";

const router = express.Router();

// ═══════════════════════════════════════════════
// 🔒 كل الـ routes محمية - تحتاج تسجيل دخول
// ═══════════════════════════════════════════════
router.use(protect);

// ═══════════════════════════════════════════════
// 📊 Stats Route (مهم: يجب أن يكون قبل /:id)
// ═══════════════════════════════════════════════

/**
 * @route   GET /api/chats/stats
 * @desc    إحصائيات محادثات المستخدم
 * @access  Private
 */
router.get("/stats", chatController.getStats);

// ═══════════════════════════════════════════════
// 💬 Main Chat Routes
// ═══════════════════════════════════════════════

/**
 * @route   POST /api/chats
 * @desc    إنشاء محادثة جديدة
 * @access  Private
 */
router.post("/", createChatValidator, chatController.createChat);

/**
 * @route   GET /api/chats
 * @desc    جلب كل محادثات المستخدم
 * @access  Private
 */
router.get("/", getChatsValidator, chatController.getChats);

/**
 * @route   GET /api/chats/:id
 * @desc    جلب محادثة واحدة
 * @access  Private
 */
router.get("/:id", chatIdValidator, chatController.getChat);

/**
 * @route   PUT /api/chats/:id
 * @desc    تحديث محادثة
 * @access  Private
 */
router.put(
  "/:id",
  chatIdValidator,
  updateChatValidator,
  chatController.updateChat
);

/**
 * @route   DELETE /api/chats/:id
 * @desc    حذف محادثة (soft delete)
 * @access  Private
 */
router.delete("/:id", chatIdValidator, chatController.deleteChat);

// ═══════════════════════════════════════════════
// 🎛️ Toggle Routes
// ═══════════════════════════════════════════════

/**
 * @route   PATCH /api/chats/:id/pin
 * @desc    تثبيت/إلغاء تثبيت محادثة
 * @access  Private
 */
router.patch("/:id/pin", chatIdValidator, chatController.togglePin);

/**
 * @route   PATCH /api/chats/:id/archive
 * @desc    أرشفة/إلغاء أرشفة محادثة
 * @access  Private
 */
router.patch("/:id/archive", chatIdValidator, chatController.toggleArchive);

export default router;
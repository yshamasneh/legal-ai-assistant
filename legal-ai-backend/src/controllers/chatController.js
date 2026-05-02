import { validationResult } from "express-validator";

import Chat from "../models/Chat.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import logger from "../config/logger.js";

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
// 🔧 Helper: جلب محادثة والتحقق من الملكية
// ═══════════════════════════════════════════════
const findChatAndCheckOwnership = async (chatId, userId) => {
  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw ApiError.notFound("المحادثة غير موجودة");
  }

  if (chat.user.toString() !== userId.toString()) {
    throw ApiError.forbidden("ليس لديك صلاحية للوصول لهذه المحادثة");
  }

  return chat;
};

// ═══════════════════════════════════════════════
// 📝 1. CREATE CHAT - إنشاء محادثة جديدة
// POST /api/chats
// ═══════════════════════════════════════════════
export const createChat = asyncHandler(async (req, res) => {
  checkValidation(req);

  const { title, category, tags, aiModel } = req.body;

  // إنشاء المحادثة
  const chat = await Chat.create({
    user: req.user._id,
    title: title || "محادثة جديدة",
    category: category || "general",
    tags: tags || [],
    aiModel: aiModel || "gpt-3.5-turbo",
  });

  // تحديث عداد المحادثات للمستخدم
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { totalChats: 1 },
  });

  logger.info(`💬 Chat created: ${chat._id} by ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: "تم إنشاء المحادثة بنجاح",
    data: { chat },
  });
});

// ═══════════════════════════════════════════════
// 📋 2. GET ALL CHATS - جلب كل محادثات المستخدم
// GET /api/chats?limit=50&skip=0&includeArchived=false&category=labor
// ═══════════════════════════════════════════════
export const getChats = asyncHandler(async (req, res) => {
  checkValidation(req);

  const {
    limit = 50,
    skip = 0,
    includeArchived = false,
    category,
  } = req.query;

  // بناء الـ query
  const query = { user: req.user._id };

  if (includeArchived !== "true") {
    query.isArchived = false;
  }

  if (category) {
    query.category = category;
  }

  // جلب المحادثات
  const chats = await Chat.find(query)
    .sort({ isPinned: -1, updatedAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

  // العدد الإجمالي
  const total = await Chat.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      chats,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: parseInt(skip) + chats.length < total,
      },
    },
  });
});

// ═══════════════════════════════════════════════
// 🔍 3. GET SINGLE CHAT - جلب محادثة واحدة
// GET /api/chats/:id
// ═══════════════════════════════════════════════
export const getChat = asyncHandler(async (req, res) => {
  checkValidation(req);

  const chat = await findChatAndCheckOwnership(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    data: { chat },
  });
});

// ═══════════════════════════════════════════════
// ✏️ 4. UPDATE CHAT - تحديث محادثة
// PUT /api/chats/:id
// ═══════════════════════════════════════════════
export const updateChat = asyncHandler(async (req, res) => {
  checkValidation(req);

  const chat = await findChatAndCheckOwnership(req.params.id, req.user._id);

  const { title, category, tags, aiModel } = req.body;

  // تحديث الحقول المسموح بها
  if (title !== undefined) chat.title = title;
  if (category !== undefined) chat.category = category;
  if (tags !== undefined) chat.tags = tags;
  if (aiModel !== undefined) chat.aiModel = aiModel;

  await chat.save();

  logger.info(`✏️ Chat updated: ${chat._id} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: "تم تحديث المحادثة بنجاح",
    data: { chat },
  });
});

// ═══════════════════════════════════════════════
// 🗑️ 5. DELETE CHAT - حذف محادثة (soft delete)
// DELETE /api/chats/:id
// ═══════════════════════════════════════════════
export const deleteChat = asyncHandler(async (req, res) => {
  checkValidation(req);

  const chat = await findChatAndCheckOwnership(req.params.id, req.user._id);

  await chat.softDelete();

  // تحديث عداد المحادثات للمستخدم
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { totalChats: -1 },
  });

  logger.info(`🗑️ Chat deleted: ${chat._id} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: "تم حذف المحادثة بنجاح",
  });
});

// ═══════════════════════════════════════════════
// 📌 6. TOGGLE PIN - تثبيت/إلغاء تثبيت
// PATCH /api/chats/:id/pin
// ═══════════════════════════════════════════════
export const togglePin = asyncHandler(async (req, res) => {
  checkValidation(req);

  const chat = await findChatAndCheckOwnership(req.params.id, req.user._id);

  if (chat.isPinned) {
    await chat.unpin();
  } else {
    await chat.pin();
  }

  logger.info(
    `📌 Chat ${chat.isPinned ? "pinned" : "unpinned"}: ${chat._id} by ${req.user.email}`
  );

  res.status(200).json({
    success: true,
    message: chat.isPinned
      ? "تم تثبيت المحادثة"
      : "تم إلغاء تثبيت المحادثة",
    data: { chat },
  });
});

// ═══════════════════════════════════════════════
// 📦 7. TOGGLE ARCHIVE - أرشفة/إلغاء أرشفة
// PATCH /api/chats/:id/archive
// ═══════════════════════════════════════════════
export const toggleArchive = asyncHandler(async (req, res) => {
  checkValidation(req);

  const chat = await findChatAndCheckOwnership(req.params.id, req.user._id);

  if (chat.isArchived) {
    await chat.unarchive();
  } else {
    await chat.archive();
  }

  logger.info(
    `📦 Chat ${chat.isArchived ? "archived" : "unarchived"}: ${chat._id} by ${req.user.email}`
  );

  res.status(200).json({
    success: true,
    message: chat.isArchived
      ? "تم أرشفة المحادثة"
      : "تم إلغاء أرشفة المحادثة",
    data: { chat },
  });
});

// ═══════════════════════════════════════════════
// 📊 8. GET STATS - إحصائيات المحادثات
// GET /api/chats/stats
// ═══════════════════════════════════════════════
export const getStats = asyncHandler(async (req, res) => {
  const stats = await Chat.getUserStats(req.user._id);

  res.status(200).json({
    success: true,
    data: { stats },
  });
});
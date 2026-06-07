import { validationResult } from "express-validator";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import logger from "../config/logger.js";
import { askLegalQuestion, generateChatTitle } from "../services/ragService.js";

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
// 💬 SEND MESSAGE - إرسال سؤال وأخذ رد من الـ RAG
// POST /api/chats/:id/messages
// ═══════════════════════════════════════════════
export const sendMessage = asyncHandler(async (req, res) => {
  checkValidation(req);

  // 1. نتأكد إن المحادثة موجودة وملك المستخدم
  const chat = await findChatAndCheckOwnership(req.params.id, req.user._id);

  const { content } = req.body;

  // 2. نخزّن رسالة المستخدم
  const userMessage = await Message.create({
    chat: chat._id,
    user: req.user._id,
    role: "user",
    content: content,
    status: "sent",
  });

  // 3. نجيب آخر رسائل المحادثة (الذاكرة)
  const previousMessages = await Message.find({ chat: chat._id })
    .sort({ createdAt: -1 })
    .limit(7)
    .lean();

  // نرتّبهم زمنياً (الأقدم أولاً) ونحوّلهم لصيغة الـ LLM
  const history = previousMessages
    .reverse()
    .filter((m) => m._id.toString() !== userMessage._id.toString())
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

  // 4. ننادي الـ RAG مع الذاكرة
  const ragResult = await askLegalQuestion(content, history);

  // 5. نحوّل المواد القانونية لصيغة الموديل
  const articles = (ragResult.topMatches || []).map((match) => ({
    lawName: match.law || "",
    articleNumber: match.article || "",
    text: match.article_text || "",
    relevanceScore: match.score || 0,
  }));

  // 6. نخزّن رد المساعد
  const assistantMessage = await Message.create({
    chat: chat._id,
    user: req.user._id,
    role: "assistant",
    content: ragResult.answer,
    status: ragResult.success ? "sent" : "failed",
    aiMetadata: {
      model: "none",
      responseTime: ragResult.responseTime,
    },
    legalContext: {
      articles: articles,
      ragUsed: ragResult.success,
    },
  });

  // 7. 🏷️ توليد عنوان ذكي (بعد أول إجابة فقط)
  const messageCount = await Message.countDocuments({
    chat: chat._id,
    deletedAt: null,
  });

  // إذا كانت أول رسالتين (سؤال واحد + إجابة واحدة)، ولّد عنوان
  if (messageCount === 2) {
    try {
      const smartTitle = await generateChatTitle(content, ragResult.answer);
      chat.title = smartTitle;
      logger.info(`🏷️ Generated smart title: ${smartTitle}`);
    } catch (titleError) {
      logger.error(`⚠️ Title generation failed: ${titleError.message}`);
    }
  }

  // 8. نحدّث وقت آخر نشاط للمحادثة
  chat.updatedAt = Date.now();
  await chat.save();

  logger.info(`💬 Message sent in chat ${chat._id} by ${req.user.email}`);

  // 9. نرجّع الرسالتين للواجهة
  res.status(201).json({
    success: true,
    message: "تم إرسال الرسالة بنجاح",
    data: {
      userMessage,
      assistantMessage,
      chatTitle: chat.title,
      disclaimer: ragResult.disclaimer,
    },
  });
});

// ═══════════════════════════════════════════════
// 📝 1. CREATE CHAT - إنشاء محادثة جديدة
// POST /api/chats
// ═══════════════════════════════════════════════
export const createChat = asyncHandler(async (req, res) => {
  checkValidation(req);

  const { title, category, tags, aiModel } = req.body;

  const chat = await Chat.create({
    user: req.user._id,
    title: title || "محادثة جديدة",
    category: category || "general",
    tags: tags || [],
    aiModel: aiModel || "gpt-3.5-turbo",
  });

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
// ═══════════════════════════════════════════════
export const getChats = asyncHandler(async (req, res) => {
  checkValidation(req);

  const {
    limit = 50,
    skip = 0,
    includeArchived = false,
    category,
  } = req.query;

  const query = { user: req.user._id };

  if (includeArchived !== "true") {
    query.isArchived = false;
  }

  if (category) {
    query.category = category;
  }

  const chats = await Chat.find(query)
    .sort({ isPinned: -1, updatedAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

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
// 🔍 3. GET SINGLE CHAT - جلب محادثة واحدة مع رسائلها
// ═══════════════════════════════════════════════
export const getChat = asyncHandler(async (req, res) => {
  checkValidation(req);

  const chat = await findChatAndCheckOwnership(req.params.id, req.user._id);

  const messages = await Message.find({ chat: chat._id })
    .sort({ createdAt: 1 })
    .lean();

  res.status(200).json({
    success: true,
    data: {
      chat: {
        ...chat.toObject(),
        messages,
      },
    },
  });
});

// ═══════════════════════════════════════════════
// ✏️ 4. UPDATE CHAT - تحديث محادثة
// ═══════════════════════════════════════════════
export const updateChat = asyncHandler(async (req, res) => {
  checkValidation(req);

  const chat = await findChatAndCheckOwnership(req.params.id, req.user._id);

  const { title, category, tags, aiModel } = req.body;

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
// ═══════════════════════════════════════════════
export const deleteChat = asyncHandler(async (req, res) => {
  checkValidation(req);

  const chat = await findChatAndCheckOwnership(req.params.id, req.user._id);

  await chat.softDelete();

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
// 📌 6. TOGGLE PIN
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
// 📦 7. TOGGLE ARCHIVE
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
// 📊 8. GET STATS
// ═══════════════════════════════════════════════
export const getStats = asyncHandler(async (req, res) => {
  const stats = await Chat.getUserStats(req.user._id);

  res.status(200).json({
    success: true,
    data: { stats },
  });
});
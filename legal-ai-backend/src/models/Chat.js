import mongoose from "mongoose";

// ═══════════════════════════════════════════════
// 💬 Chat Schema
// ═══════════════════════════════════════════════

const chatSchema = new mongoose.Schema(
  {
    // ─────────────────────────────────────
    // 🔗 صاحب المحادثة (ربط مع User)
    // ─────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "المستخدم مطلوب"],
      index: true,
    },

    // ─────────────────────────────────────
    // 📝 عنوان المحادثة
    // ─────────────────────────────────────
    title: {
      type: String,
      required: [true, "عنوان المحادثة مطلوب"],
      trim: true,
      minlength: [1, "العنوان لا يمكن أن يكون فارغاً"],
      maxlength: [100, "العنوان يجب أن لا يتجاوز 100 حرف"],
      default: "محادثة جديدة",
    },

    // ─────────────────────────────────────
    // 🏷️ التصنيف
    // ─────────────────────────────────────
    category: {
      type: String,
      enum: [
        "general",        // عام
        "labor",          // قانون العمل
        "family",         // الأحوال الشخصية
        "criminal",       // الجنائي
        "civil",          // المدني
        "commercial",     // التجاري
        "real_estate",    // العقارات
        "consumer",       // حقوق المستهلك
        "other",          // أخرى
      ],
      default: "general",
    },

    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags) {
          return tags.length <= 10;
        },
        message: "الحد الأقصى 10 كلمات مفتاحية",
      },
    },

    // ─────────────────────────────────────
    // 📊 الإحصائيات
    // ─────────────────────────────────────
    messageCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },

    lastMessagePreview: {
      type: String,
      default: "",
      maxlength: 200,
    },

    // ─────────────────────────────────────
    // 📌 الحالة
    // ─────────────────────────────────────
    isPinned: {
      type: Boolean,
      default: false,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    // ─────────────────────────────────────
    // 🤖 إعدادات AI
    // ─────────────────────────────────────
    aiModel: {
      type: String,
      enum: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"],
      default: "gpt-3.5-turbo",
    },

    // ─────────────────────────────────────
    // 🗑️ Soft Delete
    // ─────────────────────────────────────
    deletedAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ═══════════════════════════════════════════════
// 📇 Indexes (للأداء)
// ═══════════════════════════════════════════════

// البحث السريع عن محادثات المستخدم
chatSchema.index({ user: 1, updatedAt: -1 });
chatSchema.index({ user: 1, isArchived: 1 });
chatSchema.index({ user: 1, isPinned: -1, updatedAt: -1 });
chatSchema.index({ category: 1 });
chatSchema.index({ deletedAt: 1 });

// ═══════════════════════════════════════════════
// 🔗 Virtuals
// ═══════════════════════════════════════════════

// عدد الأيام منذ آخر نشاط
chatSchema.virtual("daysSinceLastActivity").get(function () {
  if (!this.lastMessageAt) return 0;
  return Math.floor((Date.now() - this.lastMessageAt) / (1000 * 60 * 60 * 24));
});

// هل المحادثة نشطة (خلال آخر 7 أيام)؟
chatSchema.virtual("isRecent").get(function () {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return this.lastMessageAt && this.lastMessageAt > sevenDaysAgo;
});

// Populate للرسائل (علاقة افتراضية)
chatSchema.virtual("messages", {
  ref: "Message",
  localField: "_id",
  foreignField: "chat",
});

// ═══════════════════════════════════════════════
// 🪝 Middleware
// ═══════════════════════════════════════════════

// إخفاء المحادثات المحذوفة من Queries
chatSchema.pre(/^find/, function () {
  if (!this.getFilter().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

// ═══════════════════════════════════════════════
// ⚙️ Instance Methods
// ═══════════════════════════════════════════════

// تحديث معاينة آخر رسالة
chatSchema.methods.updateLastMessage = async function (messageText) {
  this.lastMessageAt = Date.now();
  this.lastMessagePreview = messageText.substring(0, 200);
  this.messageCount += 1;
  return await this.save();
};

// تثبيت المحادثة
chatSchema.methods.pin = async function () {
  this.isPinned = true;
  return await this.save();
};

// إلغاء التثبيت
chatSchema.methods.unpin = async function () {
  this.isPinned = false;
  return await this.save();
};

// أرشفة
chatSchema.methods.archive = async function () {
  this.isArchived = true;
  this.isPinned = false;
  return await this.save();
};

// إلغاء الأرشفة
chatSchema.methods.unarchive = async function () {
  this.isArchived = false;
  return await this.save();
};

// حذف آمن
chatSchema.methods.softDelete = async function () {
  this.deletedAt = Date.now();
  return await this.save();
};

// ═══════════════════════════════════════════════
// 📊 Static Methods
// ═══════════════════════════════════════════════

// جلب محادثات المستخدم مرتبة
chatSchema.statics.findByUser = function (userId, options = {}) {
  const {
    includeArchived = false,
    limit = 50,
    skip = 0,
  } = options;

  const query = { user: userId };
  if (!includeArchived) query.isArchived = false;

  return this.find(query)
    .sort({ isPinned: -1, updatedAt: -1 })
    .limit(limit)
    .skip(skip);
};

// إحصائيات المستخدم
chatSchema.statics.getUserStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), deletedAt: null } },
    {
      $group: {
        _id: null,
        totalChats: { $sum: 1 },
        totalMessages: { $sum: "$messageCount" },
        archivedChats: {
          $sum: { $cond: [{ $eq: ["$isArchived", true] }, 1, 0] },
        },
        pinnedChats: {
          $sum: { $cond: [{ $eq: ["$isPinned", true] }, 1, 0] },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalChats: 0,
      totalMessages: 0,
      archivedChats: 0,
      pinnedChats: 0,
    }
  );
};

// ═══════════════════════════════════════════════
// 🎯 Create and Export
// ═══════════════════════════════════════════════
const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
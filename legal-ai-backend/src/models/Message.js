import mongoose from "mongoose";

// ═══════════════════════════════════════════════
// 📝 Message Schema
// ═══════════════════════════════════════════════

const messageSchema = new mongoose.Schema(
  {
    // ─────────────────────────────────────
    // 🔗 الربط مع Chat
    // ─────────────────────────────────────
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: [true, "معرّف المحادثة مطلوب"],
      index: true,
    },

    // ─────────────────────────────────────
    // 🔗 الربط مع User
    // ─────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "المستخدم مطلوب"],
      index: true,
    },

    // ─────────────────────────────────────
    // 👤 دور الرسالة (من المستخدم أم من البوت؟)
    // ─────────────────────────────────────
    role: {
      type: String,
      enum: {
        values: ["user", "assistant", "system"],
        message: "الدور يجب أن يكون user أو assistant أو system",
      },
      required: [true, "دور الرسالة مطلوب"],
      index: true,
    },

    // ─────────────────────────────────────
    // 💬 محتوى الرسالة
    // ─────────────────────────────────────
    content: {
      type: String,
      required: [true, "محتوى الرسالة مطلوب"],
      trim: true,
      minlength: [1, "الرسالة لا يمكن أن تكون فارغة"],
      maxlength: [10000, "الرسالة طويلة جداً"],
    },

    // ─────────────────────────────────────
    // 🤖 بيانات AI (فقط لرسائل المساعد)
    // ─────────────────────────────────────
    aiMetadata: {
      model: {
        type: String,
        enum: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "none"],
        default: "none",
      },
      promptTokens: {
        type: Number,
        default: 0,
      },
      completionTokens: {
        type: Number,
        default: 0,
      },
      totalTokens: {
        type: Number,
        default: 0,
      },
      responseTime: {
        type: Number, // بالميلي ثانية
        default: 0,
      },
    },

    // ─────────────────────────────────────
    // ⚖️ المراجع القانونية (من صاحبك)
    // ─────────────────────────────────────
    legalContext: {
      articles: [
        {
          lawName: {
            type: String,
            trim: true,
          },
          articleNumber: {
            type: String,
            trim: true,
          },
          text: {
            type: String,
            trim: true,
          },
          relevanceScore: {
            type: Number,
            min: 0,
            max: 1,
          },
        },
      ],
      ragUsed: {
        type: Boolean,
        default: false,
      },
    },

    // ─────────────────────────────────────
    // 📊 الحالة
    // ─────────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed"],
      default: "sent",
    },

    errorMessage: {
      type: String,
      default: null,
    },

    // ─────────────────────────────────────
    // ✏️ التعديل
    // ─────────────────────────────────────
    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    editHistory: [
      {
        content: String,
        editedAt: { type: Date, default: Date.now },
      },
    ],

    // ─────────────────────────────────────
    // 💡 تفاعل المستخدم
    // ─────────────────────────────────────
    reaction: {
      type: String,
      enum: ["like", "dislike", null],
      default: null,
    },

    feedback: {
      type: String,
      maxlength: 500,
      default: null,
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
// 📇 Indexes
// ═══════════════════════════════════════════════

// جلب رسائل محادثة مرتبة زمنياً
messageSchema.index({ chat: 1, createdAt: 1 });

// البحث عن رسائل المستخدم
messageSchema.index({ user: 1, createdAt: -1 });

// فلترة حسب الدور
messageSchema.index({ chat: 1, role: 1 });

// البحث النصي في المحتوى (full-text search)
messageSchema.index({ content: "text" });

// ═══════════════════════════════════════════════
// 🔗 Virtuals
// ═══════════════════════════════════════════════

// طول الرسالة
messageSchema.virtual("wordCount").get(function () {
  return this.content ? this.content.split(/\s+/).length : 0;
});

// هل الرسالة من AI؟
messageSchema.virtual("isFromAI").get(function () {
  return this.role === "assistant";
});

// ═══════════════════════════════════════════════
// 🪝 Middleware
// ═══════════════════════════════════════════════

// إخفاء الرسائل المحذوفة
messageSchema.pre(/^find/, function () {
  if (!this.getFilter().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

// حساب totalTokens تلقائياً
messageSchema.pre("save", function () {
  if (this.aiMetadata && this.aiMetadata.promptTokens !== undefined) {
    this.aiMetadata.totalTokens =
      (this.aiMetadata.promptTokens || 0) +
      (this.aiMetadata.completionTokens || 0);
  }
});

// ═══════════════════════════════════════════════
// ⚙️ Instance Methods
// ═══════════════════════════════════════════════

// تعديل الرسالة (مع حفظ التاريخ)
messageSchema.methods.editContent = async function (newContent) {
  // حفظ النسخة القديمة
  this.editHistory.push({
    content: this.content,
    editedAt: Date.now(),
  });

  this.content = newContent;
  this.isEdited = true;
  this.editedAt = Date.now();

  return await this.save();
};

// إضافة رد فعل
messageSchema.methods.addReaction = async function (reactionType) {
  if (!["like", "dislike", null].includes(reactionType)) {
    throw new Error("رد الفعل غير صالح");
  }
  this.reaction = reactionType;
  return await this.save();
};

// إضافة ملاحظة
messageSchema.methods.addFeedback = async function (feedback) {
  this.feedback = feedback;
  return await this.save();
};

// حذف آمن
messageSchema.methods.softDelete = async function () {
  this.deletedAt = Date.now();
  return await this.save();
};

// ═══════════════════════════════════════════════
// 📊 Static Methods
// ═══════════════════════════════════════════════

// جلب رسائل محادثة مع pagination
messageSchema.statics.findByChat = function (chatId, options = {}) {
  const { limit = 50, skip = 0, sortOrder = 1 } = options;

  return this.find({ chat: chatId })
    .sort({ createdAt: sortOrder })
    .limit(limit)
    .skip(skip);
};

// إحصائيات الرسائل لمحادثة
messageSchema.statics.getChatStats = async function (chatId) {
  const stats = await this.aggregate([
    { $match: { chat: new mongoose.Types.ObjectId(chatId), deletedAt: null } },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        userMessages: {
          $sum: { $cond: [{ $eq: ["$role", "user"] }, 1, 0] },
        },
        aiMessages: {
          $sum: { $cond: [{ $eq: ["$role", "assistant"] }, 1, 0] },
        },
        totalTokens: { $sum: "$aiMetadata.totalTokens" },
        avgResponseTime: { $avg: "$aiMetadata.responseTime" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalMessages: 0,
      userMessages: 0,
      aiMessages: 0,
      totalTokens: 0,
      avgResponseTime: 0,
    }
  );
};

// البحث النصي في رسائل المستخدم
messageSchema.statics.searchUserMessages = function (userId, searchText) {
  return this.find({
    user: userId,
    $text: { $search: searchText },
  })
    .sort({ score: { $meta: "textScore" } })
    .limit(20);
};

// ═══════════════════════════════════════════════
// 🎯 Create and Export
// ═══════════════════════════════════════════════
const Message = mongoose.model("Message", messageSchema);

export default Message;
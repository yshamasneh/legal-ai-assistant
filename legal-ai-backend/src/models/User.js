import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// ═══════════════════════════════════════════════
// 📦 User Schema
// ═══════════════════════════════════════════════

const userSchema = new mongoose.Schema(
  {
    // ─────────────────────────────────────
    // 🧑 البيانات الأساسية
    // ─────────────────────────────────────
    fullName: {
      type: String,
      required: [true, "الاسم الكامل مطلوب"],
      trim: true,
      minlength: [3, "الاسم يجب أن يكون 3 أحرف على الأقل"],
      maxlength: [50, "الاسم يجب أن لا يتجاوز 50 حرفاً"],
    },

    email: {
      type: String,
      required: [true, "البريد الإلكتروني مطلوب"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: "صيغة البريد الإلكتروني غير صحيحة",
      },
    },

    password: {
      type: String,
      required: [true, "كلمة المرور مطلوبة"],
      minlength: [8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"],
      select: false,
    },

    phoneNumber: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function (value) {
          if (!value) return true;
          return /^\+?[0-9]{9,15}$/.test(value);
        },
        message: "رقم الهاتف غير صحيح",
      },
    },

    // ─────────────────────────────────────
    // 🖼️ الملف الشخصي
    // ─────────────────────────────────────
    avatar: {
      type: String,
      default: null,
    },

    preferredLanguage: {
      type: String,
      enum: ["ar", "en"],
      default: "ar",
    },

    // ─────────────────────────────────────
    // 🔐 الصلاحيات والحالة
    // ─────────────────────────────────────
    role: {
      type: String,
      enum: ["user", "admin", "lawyer"],
      default: "user",
    },

    status: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
    },

    // ─────────────────────────────────────
    // 📧 التحقق من البريد الإلكتروني
    // ─────────────────────────────────────
    emailVerified: {
      type: Boolean,
      default: false,
    },

    verificationToken: {
      type: String,
      select: false,
    },

    verificationTokenExpires: {
      type: Date,
      select: false,
    },

    // ─────────────────────────────────────
    // 🔑 إعادة تعيين كلمة المرور
    // ─────────────────────────────────────
    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },

    passwordChangedAt: {
      type: Date,
      select: false,
    },

    // ─────────────────────────────────────
    // 🛡️ حماية من Brute Force
    // ─────────────────────────────────────
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },

    // ─────────────────────────────────────
    // 📊 تتبع النشاط
    // ─────────────────────────────────────
    lastLogin: {
      type: Date,
      default: null,
    },

    lastLoginIP: {
      type: String,
      default: null,
      select: false,
    },

    totalChats: {
      type: Number,
      default: 0,
    },

    totalMessages: {
      type: Number,
      default: 0,
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
        delete ret.password;
        delete ret.verificationToken;
        delete ret.passwordResetToken;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ═══════════════════════════════════════════════
// 📇 Indexes
// ═══════════════════════════════════════════════

userSchema.index({ createdAt: -1 });
userSchema.index({ status: 1, deletedAt: 1 });
userSchema.index({ role: 1 });

// ═══════════════════════════════════════════════
// 🔗 Virtuals
// ═══════════════════════════════════════════════
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.virtual("daysSinceSignup").get(function () {
  if (!this.createdAt) return 0;
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// ═══════════════════════════════════════════════
// 🪝 Middleware (Pre-save hooks)
// ═══════════════════════════════════════════════
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }
});

userSchema.pre(/^find/, function () {
  if (!this.getFilter().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

// ═══════════════════════════════════════════════
// ⚙️ Instance Methods
// ═══════════════════════════════════════════════
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.methods.createVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.verificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;

  return verificationToken;
};

userSchema.methods.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME = 60 * 60 * 1000;

  if (this.loginAttempts + 1 >= MAX_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }

  return await this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function () {
  return await this.updateOne({
    $set: { loginAttempts: 0, lastLogin: Date.now() },
    $unset: { lockUntil: 1 },
  });
};

userSchema.methods.softDelete = async function () {
  this.deletedAt = Date.now();
  this.status = "deleted";
  return await this.save();
};

// ═══════════════════════════════════════════════
// 📊 Static Methods
// ═══════════════════════════════════════════════
userSchema.statics.findActive = function () {
  return this.find({ status: "active", deletedAt: null });
};

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// ═══════════════════════════════════════════════
// 🎯 Create and Export
// ═══════════════════════════════════════════════
const User = mongoose.model("User", userSchema);

export default User;
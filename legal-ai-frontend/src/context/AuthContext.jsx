import { createContext, useState, useEffect } from "react";
import * as authAPI from "../api/authAPI.js";

// ═══════════════════════════════════════════════
// 🌐 إنشاء الـ Context
// ═══════════════════════════════════════════════
export const AuthContext = createContext(null);

// ═══════════════════════════════════════════════
// 🔐 AuthProvider - يلفّ التطبيق ويوفّر الحالة
// ═══════════════════════════════════════════════
export const AuthProvider = ({ children }) => {
  // ─────────────────────────────────────
  // الحالة (State)
  // ─────────────────────────────────────
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─────────────────────────────────────
  // 🚀 عند تحميل التطبيق: تحقق من تسجيل الدخول
  // ─────────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      const savedUser = localStorage.getItem("user");

      if (token && savedUser) {
        try {
          // التحقق من صلاحية الـ token عبر API
          const response = await authAPI.getMe();
          setUser(response.data.user);
        } catch (err) {
          // الـ token منتهي أو غير صحيح
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          setUser(null);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // ─────────────────────────────────────
  // 📝 تسجيل حساب جديد
  // ─────────────────────────────────────
  const signup = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.signup(userData);

      // حفظ الـ token والمستخدم
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      setUser(response.data.user);

      return { success: true, user: response.data.user };
    } catch (err) {
      setError(err.message);
      return {
        success: false,
        message: err.message,
        errors: err.errors,
      };
    }
  };

  // ─────────────────────────────────────
  // 🔐 تسجيل دخول
  // ─────────────────────────────────────
  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authAPI.login(credentials);

      // حفظ الـ token والمستخدم
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      setUser(response.data.user);

      return { success: true, user: response.data.user };
    } catch (err) {
      setError(err.message);
      return {
        success: false,
        message: err.message,
        errors: err.errors,
      };
    }
  };

  // ─────────────────────────────────────
  // 🚪 تسجيل خروج
  // ─────────────────────────────────────
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      // حتى لو فشل الطلب، امسح البيانات المحلية
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  // ─────────────────────────────────────
  // ✏️ تحديث الملف الشخصي
  // ─────────────────────────────────────
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await authAPI.updateProfile(profileData);

      // تحديث المستخدم في الذاكرة و localStorage
      const updatedUser = response.data.user;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (err) {
      setError(err.message);
      return {
        success: false,
        message: err.message,
        errors: err.errors,
      };
    }
  };

  // ─────────────────────────────────────
  // 🎯 القيم اللي رح يوفّرها Context
  // ─────────────────────────────────────
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    signup,
    login,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};
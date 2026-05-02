import api from "./axios.js";

// ═══════════════════════════════════════════════
// 🔐 Auth API Functions
// ═══════════════════════════════════════════════

/**
 * تسجيل حساب جديد
 */
export const signup = async (userData) => {
  const response = await api.post("/auth/signup", userData);
  return response.data;
};

/**
 * تسجيل دخول
 */
export const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

/**
 * تسجيل خروج
 */
export const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

/**
 * جلب بيانات المستخدم الحالي
 */
export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

/**
 * تحديث الملف الشخصي
 */
export const updateProfile = async (profileData) => {
  const response = await api.put("/auth/profile", profileData);
  return response.data;
};

/**
 * تغيير كلمة المرور
 */
export const changePassword = async (passwordData) => {
  const response = await api.put("/auth/password", passwordData);
  return response.data;
};

/**
 * طلب إعادة تعيين كلمة المرور
 */
export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

/**
 * إعادة تعيين كلمة المرور
 */
export const resetPassword = async (token, password, confirmPassword) => {
  const response = await api.post(`/auth/reset-password/${token}`, {
    password,
    confirmPassword,
  });
  return response.data;
};
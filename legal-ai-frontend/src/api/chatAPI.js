import api from "./axios.js";

// ═══════════════════════════════════════════════
// 💬 Chat API Functions
// ═══════════════════════════════════════════════


/**
 * إنشاء محادثة جديدة
 */
export const createChat = async (chatData = {}) => {
  const response = await api.post("/chats", chatData);
  return response.data;
};

/**
 * جلب كل محادثات المستخدم
 */
/**
 * جلب محادثة واحدة مع رسائلها
 */
export const getChat = async (chatId) => {
  const response = await api.get(`/chats/${chatId}`);
  return response.data;
};


/**
 /**
 * جلب كل محادثات المستخدم
 */
export const getChats = async (params = {}) => {
  const response = await api.get("/chats", { params });
  return response.data;
};

/**
 * إرسال سؤال وأخذ رد قانوني من الـ RAG
 */
export const sendMessage = async (chatId, content) => {
  const response = await api.post(`/chats/${chatId}/messages`, { content });
  return response.data;
};

/**
 * تحديث محادثة
 */
export const updateChat = async (chatId, updateData) => {
  const response = await api.put(`/chats/${chatId}`, updateData);
  return response.data;
};

/**
 * حذف محادثة
 */
export const deleteChat = async (chatId) => {
  const response = await api.delete(`/chats/${chatId}`);
  return response.data;
};


/**
 * تثبيت/إلغاء تثبيت محادثة
 */
export const togglePin = async (chatId) => {
  const response = await api.patch(`/chats/${chatId}/pin`);
  return response.data;
};

/**
 * أرشفة/إلغاء أرشفة محادثة
 */
export const toggleArchive = async (chatId) => {
  const response = await api.patch(`/chats/${chatId}/archive`);
  return response.data;
};

/**
 * إحصائيات المحادثات
 */
export const getChatStats = async () => {
  const response = await api.get("/chats/stats");
  return response.data;
};
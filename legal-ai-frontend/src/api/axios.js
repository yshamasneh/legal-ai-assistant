import axios from "axios";

// ═══════════════════════════════════════════════
// 🔧 إعدادات Axios الأساسية
// ═══════════════════════════════════════════════

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // لإرسال cookies (refresh token)
  timeout: 30000, // 30 ثانية
  headers: {
    "Content-Type": "application/json",
  },
});

// ═══════════════════════════════════════════════
// 🎫 Request Interceptor - يضيف Token تلقائياً
// ═══════════════════════════════════════════════

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════
// 📥 Response Interceptor - يعالج الأخطاء
// ═══════════════════════════════════════════════

api.interceptors.response.use(
  (response) => {
    // الرد ناجح، رجّعه كما هو
    return response;
  },
  (error) => {
    // معالجة الأخطاء العامة
    if (error.response) {
      const { status, data } = error.response;

      // 401: المستخدم غير مصرّح
      if (status === 401) {
        // مسح الـ token المنتهي
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        // إعادة توجيه لصفحة الدخول (لاحقاً)
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
      }

      // إرجاع رسالة الخطأ من الـ API
      return Promise.reject({
        status,
        message: data.message || "حدث خطأ غير متوقع",
        errors: data.errors || [],
      });
    } else if (error.request) {
      // الطلب أُرسل لكن لم يأت رد
      return Promise.reject({
        status: 0,
        message: "لا يمكن الاتصال بالسيرفر، تأكد من اتصالك بالإنترنت",
        errors: [],
      });
    } else {
      // خطأ آخر
      return Promise.reject({
        status: 0,
        message: error.message || "حدث خطأ غير متوقع",
        errors: [],
      });
    }
  }
);

export default api;
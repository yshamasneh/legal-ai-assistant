import { useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";

function LoginForm({ onSwitchToSignup }) {
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ─────────────────────────────────────
  // Validation
  // ─────────────────────────────────────
  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "صيغة البريد الإلكتروني غير صحيحة";
    }

    if (!formData.password) {
      newErrors.password = "كلمة المرور مطلوبة";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─────────────────────────────────────
  // Submit
  // ─────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setIsLoading(true);
    const result = await login(formData);

    if (!result.success) {
      setServerError(result.message);
      if (result.errors && result.errors.length > 0) {
        setServerError(result.errors.join(" | "));
      }
    }

    setIsLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (serverError) setServerError("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
      {/* ═══════════════════════════════════ */}
      {/* Header                              */}
      {/* ═══════════════════════════════════ */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
          مرحباً بعودتك
        </h2>
        <p className="text-sm text-slate-400">
          سجّل دخولك للوصول إلى استشاراتك القانونية
        </p>
      </div>

      {/* ═══════════════════════════════════ */}
      {/* Server Error                        */}
      {/* ═══════════════════════════════════ */}
      {serverError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm animate-slide-down">
          <svg
            className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-red-300 leading-relaxed">{serverError}</p>
        </div>
      )}

      {/* ═══════════════════════════════════ */}
      {/* Email Input                         */}
      {/* ═══════════════════════════════════ */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-300 tracking-wide">
          البريد الإلكتروني
        </label>
        <div className="relative group">
          {/* Icon */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@email.com"
            dir="ltr"
            className={`w-full pl-4 pr-12 py-3.5 glass-input rounded-xl text-white placeholder:text-slate-500 text-sm ${
              errors.email
                ? "border-red-500/50 focus:border-red-500/50"
                : ""
            }`}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-red-400 flex items-center gap-1.5 animate-slide-down">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.email}
          </p>
        )}
      </div>

      {/* ═══════════════════════════════════ */}
      {/* Password Input                      */}
      {/* ═══════════════════════════════════ */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-300 tracking-wide">
          كلمة المرور
        </label>
        <div className="relative group">
          {/* Lock Icon */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            dir="ltr"
            className={`w-full pl-12 pr-12 py-3.5 glass-input rounded-xl text-white placeholder:text-slate-500 text-sm ${
              errors.password
                ? "border-red-500/50 focus:border-red-500/50"
                : ""
            }`}
          />

          {/* Show/Hide Password */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-400 flex items-center gap-1.5 animate-slide-down">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.password}
          </p>
        )}
      </div>

      {/* ═══════════════════════════════════ */}
      {/* Submit Button                       */}
      {/* ═══════════════════════════════════ */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full btn-primary py-3.5 rounded-xl text-sm tracking-wide disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-2"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            جارٍ تسجيل الدخول...
          </span>
        ) : (
          "تسجيل الدخول"
        )}
      </button>

      {/* ═══════════════════════════════════ */}
      {/* Switch to Signup                    */}
      {/* ═══════════════════════════════════ */}
      <div className="text-center text-sm text-slate-400 pt-2">
        ليس لديك حساب؟{" "}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
        >
          سجّل الآن
        </button>
      </div>
    </form>
  );
}

export default LoginForm;
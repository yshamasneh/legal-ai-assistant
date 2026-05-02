import { useState } from "react";
import Scene3D from "../Scene3D";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

function AuthPage() {
  const [mode, setMode] = useState("login");

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* ═══════════════════════════════════════ */}
      {/* 🌌 Background Orbs (Glowing Effects)    */}
      {/* ═══════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top-right blue orb */}
        <div
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-30 blur-[120px]"
          style={{
            background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
          }}
        />
        {/* Bottom-left purple orb */}
        <div
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full opacity-30 blur-[120px]"
          style={{
            background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
          }}
        />
        {/* Center cyan glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-20 blur-[100px]"
          style={{
            background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* 🎨 Left Side - Hero Section             */}
      {/* ═══════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative z-10">
        {/* 3D Scene Container */}
        <div className="w-full max-w-md h-80 mb-12 relative animate-fade-in">
          {/* Subtle glow behind 3D scene */}
          <div className="absolute inset-0 bg-gradient-radial from-blue-500/20 via-transparent to-transparent blur-2xl" />
          <div className="relative h-full">
            <Scene3D isTyping={false} />
          </div>
        </div>

        {/* Brand Section */}
        <div className="text-center max-w-md animate-slide-up">
          {/* Brand Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-300 tracking-wider">
              مدعوم بالذكاء الاصطناعي
            </span>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold mb-4 tracking-tight">
            <span className="text-gradient">Legal AI</span>
            <br />
            <span className="text-white">Assistant</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-slate-400 mb-8 leading-relaxed">
            مساعدك القانوني الذكي للوصول الفوري إلى المعرفة القانونية
            الفلسطينية
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "⚡ ردود فورية",
              "🔒 آمن ومحمي",
              "📚 مرجعية موثقة",
            ].map((feature, i) => (
              <div
                key={i}
                className="px-3 py-1.5 rounded-full glass text-xs text-slate-300 font-medium"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* 🔐 Right Side - Auth Form               */}
      {/* ═══════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md animate-scale-in">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass mb-4 text-4xl">
              ⚖️
            </div>
            <h1 className="text-3xl font-bold">
              <span className="text-gradient">Legal AI</span>
            </h1>
          </div>

          {/* Glass Card Container */}
          <div className="glass-card rounded-3xl p-8 shadow-2xl">
            {/* Tabs Switcher */}
            <div className="relative flex glass rounded-2xl p-1.5 mb-8">
              {/* Sliding Indicator */}
              <div
                className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out shadow-lg shadow-blue-500/50"
                style={{
                  right: mode === "login" ? "6px" : "calc(50% + 0px)",
                }}
              />

              {/* Login Tab */}
              <button
                onClick={() => setMode("login")}
                className={`relative flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors duration-300 ${
                  mode === "login"
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                تسجيل الدخول
              </button>

              {/* Signup Tab */}
              <button
                onClick={() => setMode("signup")}
                className={`relative flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors duration-300 ${
                  mode === "signup"
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                حساب جديد
              </button>
            </div>

            {/* Form Container with Animation */}
            <div key={mode} className="animate-fade-in">
              {mode === "login" ? (
                <LoginForm onSwitchToSignup={() => setMode("signup")} />
              ) : (
                <SignupForm onSwitchToLogin={() => setMode("login")} />
              )}
            </div>
          </div>

          {/* Footer Text */}
          <p className="text-center text-xs text-slate-500 mt-6">
            © 2026 Legal AI Assistant. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
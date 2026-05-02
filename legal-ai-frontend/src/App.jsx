import { useState } from "react";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ChatArea from "./components/ChatArea.jsx";
import ChatInput from "./components/ChatInput.jsx";
import AuthPage from "./components/auth/AuthPage.jsx";
import { useAuth } from "./hooks/useAuth.js";

function App() {
  const { user, isAuthenticated, loading, logout } = useAuth();

  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  // ─────────────────────────────────────
  // ⏳ Loading Screen (Premium)
  // ─────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-30 blur-[100px]"
            style={{
              background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="relative text-center animate-fade-in">
          {/* Animated Logo */}
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-5xl shadow-2xl shadow-blue-500/50">
              ⚖️
            </div>
          </div>

          {/* Title */}
          <div className="text-2xl font-bold text-gradient mb-2">
            Legal AI Assistant
          </div>

          {/* Loading text with dots */}
          <div className="text-sm text-slate-400 flex items-center justify-center gap-1">
            <span>جارٍ التحقق</span>
            <span className="flex gap-0.5">
              <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────
  // 🔐 Auth Page
  // ─────────────────────────────────────
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // ─────────────────────────────────────
  // 💬 Send Message (Mock)
  // ─────────────────────────────────────
  const handleSendMessage = async (text) => {
    const userMessage = {
      id: Date.now(),
      role: "user",
      text,
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsTyping(true);

    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: "شكراً لسؤالك. ميزة الذكاء الاصطناعي قيد التطوير حالياً 🤖⚖️\n\nسيتم ربطها قريباً مع نظام RAG للقانون الفلسطيني.",
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  // ─────────────────────────────────────
  // ✅ Main App
  // ─────────────────────────────────────
  return (
    <div className="h-screen flex flex-col relative overflow-hidden" dir="rtl">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]"
          style={{
            background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]"
          style={{
            background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Header */}
      <Header user={user} onLogout={logout} />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Sidebar */}
        <Sidebar />

        {/* Chat Section */}
        <div className="flex-1 flex flex-col">
          <ChatArea messages={messages} isTyping={isTyping} />
          <ChatInput onSend={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}

export default App;
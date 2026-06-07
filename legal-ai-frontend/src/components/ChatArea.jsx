import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

function ChatArea({ messages, isTyping }) {
  const messagesEndRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (messages.length === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center p-6 ${isDark ? "bg-transparent" : "bg-slate-50"}`}>
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚖️</div>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? "text-slate-100" : "text-slate-800"}`}>
            مرحباً بك في المساعد القانوني
          </h2>
          <p className={isDark ? "text-slate-400" : "text-slate-500"}>
            اسأل أي سؤال قانوني وسأحاول مساعدتك
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${isDark ? "bg-transparent" : "bg-slate-50"}`}>
      {messages.map((msg) => (
        <ChatMessage key={msg.id} role={msg.role} text={msg.text} />
      ))}

      {isTyping && (
        <div className={`flex items-center gap-2 px-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          <div className="flex gap-1">
            {[0, 150, 300].map((delay) => (
              <div
                key={delay}
                className={`w-2 h-2 rounded-full animate-bounce ${isDark ? "bg-slate-400" : "bg-slate-400"}`}
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
          <span className="text-sm">جاري الكتابة...</span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatArea;
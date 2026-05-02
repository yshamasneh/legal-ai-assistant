import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage.jsx";

function ChatArea({ messages, isTyping }) {
  const messagesEndRef = useRef(null);

  // Auto-scroll لآخر رسالة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // إذا ما في رسائل، اعرض شاشة الترحيب
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚖️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            مرحباً بك في المساعد القانوني
          </h2>
          <p className="text-gray-500">
            اسأل أي سؤال قانوني وسأحاول مساعدتك
          </p>
        </div>
      </div>
    );
  }

  // عرض الرسائل
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} role={msg.role} text={msg.text} />
      ))}

      {/* مؤشر "جاري الكتابة" */}
      {isTyping && (
        <div className="flex items-center gap-2 text-gray-500 px-4">
          <div className="flex gap-1">
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
          <span className="text-sm">جاري الكتابة...</span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatArea;
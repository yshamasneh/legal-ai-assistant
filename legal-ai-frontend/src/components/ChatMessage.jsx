import { useTheme } from "../context/ThemeContext.jsx";

function ChatMessage({ role, text }) {
  const isUser = role === "user";
  const { isDark } = useTheme();

  return (
    <div
      className={`flex gap-3 mb-6 animate-slide-up ${isUser ? "flex-row" : "flex-row-reverse"}`}
      dir="rtl"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-md opacity-40" />
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/30 ring-2 ring-white/10">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full blur-md opacity-40" />
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-base shadow-lg shadow-emerald-500/30 ring-2 ring-white/10">
              ⚖️
            </div>
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col max-w-[85%] md:max-w-[78%] ${isUser ? "items-start" : "items-end"}`}>
        {/* Label */}
        <div className={`text-xs font-semibold mb-1.5 px-1 ${isUser ? "text-blue-400" : "text-emerald-500"}`}>
          {isUser ? "أنت" : "المساعد القانوني"}
        </div>

        {/* Bubble */}
        <div className={`relative px-6 py-4 rounded-2xl shadow-md ${
          isUser
            ? isDark
              ? "bg-gradient-to-br from-blue-600/25 to-indigo-700/25 border border-blue-500/25 rounded-tr-sm shadow-lg shadow-blue-900/30"
              : "bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-tr-sm"
            : isDark
              ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/10 rounded-tl-sm shadow-lg shadow-black/30"
              : "bg-white border border-slate-200 rounded-tl-sm shadow-sm"
        }`}>
          <p className={`relative text-lg md:text-[19px] leading-[2] whitespace-pre-wrap tracking-wide ${
            isDark ? "text-slate-100" : "text-slate-800"
          }`}>
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
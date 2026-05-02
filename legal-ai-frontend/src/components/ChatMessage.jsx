function ChatMessage({ role, text }) {
  const isUser = role === "user";

  return (
    <div
      className={`flex gap-3 mb-6 animate-slide-up ${
        isUser ? "flex-row" : "flex-row-reverse"
      }`}
      dir="rtl"
    >
      {/* ═══════════════════════════════════ */}
      {/* Avatar                              */}
      {/* ═══════════════════════════════════ */}
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          // User Avatar
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-md opacity-40" />
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/30 ring-2 ring-white/10">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
        ) : (
          // AI Avatar
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full blur-md opacity-40" />
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-base shadow-lg shadow-emerald-500/30 ring-2 ring-white/10">
              ⚖️
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════ */}
      {/* Message Bubble                      */}
      {/* ═══════════════════════════════════ */}
      <div
        className={`flex flex-col max-w-[75%] ${
          isUser ? "items-start" : "items-end"
        }`}
      >
        {/* Sender Label */}
        <div
          className={`text-xs font-semibold mb-1.5 px-1 ${
            isUser ? "text-blue-400" : "text-emerald-400"
          }`}
        >
          {isUser ? "أنت" : "المساعد القانوني"}
        </div>

        {/* Bubble */}
        <div
          className={`relative px-5 py-3.5 rounded-2xl ${
            isUser
              ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-tr-sm shadow-lg shadow-blue-500/10"
              : "glass-card border border-white/10 rounded-tl-sm shadow-lg"
          }`}
        >
          {/* Subtle glow on hover */}
          <div
            className={`absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity ${
              isUser
                ? "bg-gradient-to-br from-blue-500/5 to-purple-500/5"
                : "bg-white/5"
            }`}
          />

          {/* Message text */}
          <p className="relative text-sm leading-relaxed text-slate-100 whitespace-pre-wrap">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
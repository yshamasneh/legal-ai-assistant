import Scene3D from "./Scene3D";
import { useTheme } from "../context/ThemeContext.jsx";

function Sidebar({ onNewChat, activeChatId, onSelectChat, onDeleteChat, isTyping, chats = [], loading = false }) {
  const { isDark } = useTheme();

  const getCategoryStyle = (category) => {
    const styles = {
      labor:       { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>, bg: "from-blue-500/20 to-blue-600/20", text: "text-blue-400" },
      real_estate: { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>, bg: "from-emerald-500/20 to-emerald-600/20", text: "text-emerald-400" },
      consumer:    { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>, bg: "from-orange-500/20 to-orange-600/20", text: "text-orange-400" },
      family:      { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>, bg: "from-pink-500/20 to-pink-600/20", text: "text-pink-400" },
    };
    return styles[category] || styles.labor;
  };

  return (
    <aside className={`w-72 flex flex-col flex-shrink-0 ${
      isDark
        ? "glass border-l border-white/5 backdrop-blur-2xl"
        : "bg-white border-l border-slate-200 shadow-sm"
    }`}>
      {/* 3D Scene */}
      <div className="p-4 flex-shrink-0">
        <div className={`relative rounded-2xl overflow-hidden border shadow-2xl ${isDark ? "border-white/5" : "border-slate-100"}`}>
          <Scene3D isTyping={isTyping} />
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-4 pb-4 flex-shrink-0">
        <button onClick={onNewChat} className="group relative w-full overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-50 blur-xl group-hover:opacity-75 transition-opacity" />
          <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 py-3 px-4 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 group-hover:scale-[1.02]">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-white font-semibold text-sm">محادثة جديدة</span>
          </div>
        </button>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="flex items-center justify-between px-2 py-3">
          <p className={`text-xs font-semibold tracking-wider uppercase ${isDark ? "text-slate-500" : "text-slate-400"}`}>المحادثات</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isDark ? "text-slate-600 bg-white/5 border-white/5" : "text-slate-400 bg-slate-50 border-slate-200"}`}>{chats.length}</span>
        </div>

        {chats.length === 0 && (
          <div className="text-center py-8 px-4">
            <div className="text-4xl mb-3 opacity-50">💬</div>
            <p className={`text-sm font-medium mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>لا توجد محادثات بعد</p>
            <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>ابدأ محادثة جديدة الآن</p>
          </div>
        )}

        <div className="space-y-1.5">
          {chats.map((chat) => {
            const isActive = chat._id === activeChatId;
            const style = getCategoryStyle(chat.category);
            return (
              <div
                key={chat._id}
                onClick={() => onSelectChat?.(chat._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectChat?.(chat._id); } }}
                className={`group relative w-full text-right px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? isDark
                      ? "bg-gradient-to-r from-blue-500/15 to-purple-500/15 border border-blue-500/30"
                      : "bg-blue-50 border border-blue-200"
                    : isDark
                      ? "hover:bg-white/5 border border-transparent hover:border-white/5"
                      : "hover:bg-slate-50 border border-transparent hover:border-slate-200"
                }`}
              >
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-l-full" />
                )}
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${style.bg} ${style.text} flex items-center justify-center border ${isDark ? "border-white/5" : "border-slate-200"}`}>
                    {style.icon}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h3 className={`text-sm font-semibold truncate flex-1 ${isActive ? isDark ? "text-white" : "text-blue-700" : isDark ? "text-slate-200" : "text-slate-700"}`}>
                        {chat.title}
                      </h3>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteChat?.(chat._id); }}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 p-1.5 rounded-md transition-all duration-200"
                      >
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3" />
                        </svg>
                      </button>
                    </div>
                    <p className={`text-xs truncate leading-tight mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{chat.lastMessagePreview || "لا توجد رسائل بعد"}</p>
                    <p className={`text-[10px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>{new Date(chat.updatedAt).toLocaleDateString("ar-EG")}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className={`px-4 py-3 border-t flex-shrink-0 ${isDark ? "border-white/5" : "border-slate-200"}`}>
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs">⚖️</div>
          <p className={`text-[11px] font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>Legal AI © 2026</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
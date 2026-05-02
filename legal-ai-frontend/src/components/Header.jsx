import UserMenu from "./UserMenu/UserMenu.jsx";

function Header({ user, onLogout }) {
  return (
    <header className="relative z-50 glass border-b border-white/5 backdrop-blur-2xl flex-shrink-0">
      <div
        className="px-6 py-4 flex items-center justify-between gap-4"
        dir="rtl"
      >
        {/* ═══════════════════════════════════ */}
        {/* Logo Section (يمين)                 */}
        {/* ═══════════════════════════════════ */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Animated Logo Icon */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl blur-md opacity-50" />
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-2xl">⚖️</span>
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-white tracking-tight leading-tight">
              المساعد القانوني الذكي
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                Legal AI Assistant
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════ */}
        {/* User Menu (شمال)                    */}
        {/* ═══════════════════════════════════ */}
        {user && (
          <div className="flex-shrink-0">
            <UserMenu
              user={user}
              onLogout={onLogout}
              onProfileClick={() => console.log("Profile clicked")}
              onPasswordClick={() => console.log("Password clicked")}
              onSettingsClick={() => console.log("Settings clicked")}
            />
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
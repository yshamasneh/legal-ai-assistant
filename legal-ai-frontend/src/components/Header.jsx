import UserMenu from "./UserMenu/UserMenu.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

function Header({ user, onLogout, onAdminClick }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="relative z-50 glass border-b border-white/5 backdrop-blur-2xl flex-shrink-0">
      <div
        className="px-6 py-4 flex items-center justify-between gap-4"
        dir="rtl"
      >
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl blur-md opacity-50" />

            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-2xl">⚖️</span>
            </div>
          </div>

          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-white tracking-tight leading-tight">
              palllaw
            </h1>

            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />

              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                              المساعد القانوني الذكي

              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* زر الثيم */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {/* زر الأدمن */}
          {user?.role === "admin" && (
            <button
              onClick={onAdminClick}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-sm transition-all"
            >
              🛡️ لوحة التحكم
            </button>
          )}

          {/* القائمة */}
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
      </div>
    </header>
  );
}

export default Header;
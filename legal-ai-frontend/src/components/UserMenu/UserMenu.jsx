import { useState, useRef, useEffect } from "react";

function UserMenu({ user, onLogout, onProfileClick, onPasswordClick, onSettingsClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // ─────────────────────────────────────
  // Close on click outside
  // ─────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // ─────────────────────────────────────
  // Close on Escape key
  // ─────────────────────────────────────
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // ─────────────────────────────────────
  // Menu Items
  // ─────────────────────────────────────
  const menuItems = [
    {
      group: "account",
      items: [
        {
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
          label: "الملف الشخصي",
          onClick: onProfileClick,
        },
        {
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ),
          label: "تغيير كلمة المرور",
          onClick: onPasswordClick,
        },
        {
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
          label: "الإعدادات",
          onClick: onSettingsClick,
        },
      ],
    },
    {
      group: "help",
      items: [
        {
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          label: "الدعم والمساعدة",
          onClick: () => {},
        },
        {
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          label: "عن المنصة",
          onClick: () => {},
        },
      ],
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* ═══════════════════════════════════ */}
      {/* Avatar Trigger Button               */}
      {/* ═══════════════════════════════════ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group flex-shrink-0"
        aria-label="User menu"
      >
        {/* Glow effect */}
        <div
          className={`absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-md transition-opacity ${
            isOpen ? "opacity-75" : "opacity-50 group-hover:opacity-75"
          }`}
        />
        {/* Avatar circle */}
        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30 ring-2 ring-white/10 transition-transform group-hover:scale-105">
          {user?.fullName?.charAt(0) || "U"}
        </div>
        {/* Online indicator */}
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-[#070918]" />
      </button>

      {/* ═══════════════════════════════════ */}
      {/* Dropdown Menu                       */}
      {/* ═══════════════════════════════════ */}
      {isOpen && (
        <>
          {/* Backdrop overlay (subtle) */}
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div
            className="absolute left-0 top-full mt-3 w-72 z-40 animate-slide-down origin-top-left"
            dir="rtl"
          >
            <div className="glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              {/* ─────────────────────────────── */}
              {/* User Info Header                */}
              {/* ─────────────────────────────── */}
              <div className="p-5 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent border-b border-white/5">
                <div className="flex items-center gap-3">
                  {/* Large Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-md opacity-50" />
                    <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30 ring-2 ring-white/10">
                      {user?.fullName?.charAt(0) || "U"}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full ring-2 ring-[#0e1120]" />
                  </div>

                  {/* User details */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {user?.fullName}
                    </div>
                    <div className="text-xs text-slate-400 truncate mt-0.5">
                      {user?.email}
                    </div>
                    <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-emerald-400 font-medium">
                        نشط الآن
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─────────────────────────────── */}
              {/* Menu Items                      */}
              {/* ─────────────────────────────── */}
              <div className="py-2">
                {menuItems.map((group, groupIndex) => (
                  <div key={group.group}>
                    {group.items.map((item, itemIndex) => (
                      <button
                        key={itemIndex}
                        onClick={() => {
                          item.onClick?.();
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-right"
                      >
                        <span className="text-slate-500 group-hover:text-blue-400 transition-colors">
                          {item.icon}
                        </span>
                        <span className="text-sm font-medium flex-1">
                          {item.label}
                        </span>
                        <svg
                          className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                    ))}

                    {/* Divider between groups */}
                    {groupIndex < menuItems.length - 1 && (
                      <div className="my-2 mx-5 h-px bg-white/5" />
                    )}
                  </div>
                ))}
              </div>

              {/* ─────────────────────────────── */}
              {/* Logout Section                  */}
              {/* ─────────────────────────────── */}
              <div className="border-t border-white/5 p-2">
                <button
                  onClick={() => {
                    onLogout?.();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-right group"
                >
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
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="text-sm font-medium flex-1">
                    تسجيل الخروج
                  </span>
                </button>
              </div>
            </div>

            {/* Footer hint */}
            <p className="text-center text-[10px] text-slate-600 mt-2">
              اضغط ESC للإغلاق
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default UserMenu;
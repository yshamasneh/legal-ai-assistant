import { useEffect } from "react";

function ConfirmModal({ isOpen, title, message, confirmText = "تأكيد", cancelText = "إلغاء", onConfirm, onCancel, danger = false }) {
  // إغلاق بـ Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      dir="rtl"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-md animate-slide-up">
        {/* Glow effect */}
        <div
          className={`absolute -inset-0.5 rounded-2xl blur-lg opacity-30 ${
            danger
              ? "bg-gradient-to-r from-red-500 to-rose-500"
              : "bg-gradient-to-r from-blue-500 to-purple-500"
          }`}
        />

        {/* Content */}
        <div className="relative glass-card rounded-2xl border border-white/10 p-6 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center ${
                danger
                  ? "bg-red-500/15 border border-red-500/30"
                  : "bg-blue-500/15 border border-blue-500/30"
              }`}
            >
              <svg
                className={`w-7 h-7 ${danger ? "text-red-400" : "text-blue-400"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    danger
                      ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      : "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  }
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-white text-center mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-sm text-slate-400 text-center leading-relaxed mb-6">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            {/* Cancel */}
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-sm transition-all duration-200"
            >
              {cancelText}
            </button>

            {/* Confirm */}
            <button
              onClick={onConfirm}
              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm text-white shadow-lg transition-all duration-200 ${
                danger
                  ? "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-red-500/30"
                  : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-blue-500/30"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
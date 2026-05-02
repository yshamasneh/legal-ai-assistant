import { useState, useRef, useEffect } from "react";

function ChatInput({ onSend, disabled = false }) {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  // ─────────────────────────────────────
  // Auto-resize textarea
  // ─────────────────────────────────────
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [text]);

  // ─────────────────────────────────────
  // Send Message
  // ─────────────────────────────────────
  const handleSend = () => {
    if (text.trim() === "" || disabled) return;
    onSend(text.trim());
    setText("");

    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // ─────────────────────────────────────
  // Keyboard Handlers
  // ─────────────────────────────────────
  const handleKeyDown = (e) => {
    // Enter to send (Shift+Enter for new line)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = text.trim() === "";
  const charCount = text.length;
  const maxChars = 2000;

  return (
    <div className="px-6 py-4 relative z-10 flex-shrink-0">
      <div className="max-w-4xl mx-auto">
        {/* ═══════════════════════════════════ */}
        {/* Input Container                     */}
        {/* ═══════════════════════════════════ */}
        <div
          className={`relative group transition-all duration-300 ${
            isFocused ? "scale-[1.01]" : ""
          }`}
        >
          {/* Glow effect on focus */}
          <div
            className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 blur-lg transition-opacity duration-500 ${
              isFocused ? "opacity-30" : ""
            }`}
          />

          {/* Main container */}
          <div
            className={`relative glass-card rounded-2xl border transition-all duration-300 ${
              isFocused
                ? "border-blue-500/40 shadow-lg shadow-blue-500/10"
                : "border-white/10"
            }`}
          >
            <div className="flex items-end gap-3 p-3" dir="rtl">
              {/* ═══════════════════════════════════ */}
              {/* Textarea                            */}
              {/* ═══════════════════════════════════ */}
              <div className="flex-1 min-w-0">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="اكتب سؤالك القانوني هنا..."
                  rows={1}
                  maxLength={maxChars}
                  disabled={disabled}
                  className="w-full bg-transparent text-white placeholder:text-slate-500 text-sm leading-relaxed resize-none focus:outline-none px-3 py-2 max-h-[150px] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ minHeight: "40px" }}
                />
              </div>

              {/* ═══════════════════════════════════ */}
              {/* Send Button                         */}
              {/* ═══════════════════════════════════ */}
              <button
                onClick={handleSend}
                disabled={isEmpty || disabled}
                className={`group/btn relative flex-shrink-0 transition-all duration-300 ${
                  isEmpty || disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-105"
                }`}
                aria-label="إرسال"
              >
                {/* Glow effect */}
                {!isEmpty && !disabled && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl blur-md opacity-50 group-hover/btn:opacity-75 transition-opacity" />
                )}

                {/* Button content */}
                <div
                  className={`relative w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-all ${
                    isEmpty || disabled
                      ? "bg-white/5 border border-white/10"
                      : "bg-gradient-to-br from-blue-500 to-purple-500 shadow-blue-500/30 group-hover/btn:shadow-blue-500/50"
                  }`}
                >
                  {disabled ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className={`w-5 h-5 transition-colors ${
                        isEmpty ? "text-slate-500" : "text-white"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  )}
                </div>
              </button>
            </div>

            {/* ═══════════════════════════════════ */}
            {/* Footer Bar                          */}
            {/* ═══════════════════════════════════ */}
            <div
              className="flex items-center justify-between px-5 py-2 border-t border-white/5"
              dir="rtl"
            >
              {/* Hint */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-mono text-[10px]">
                  Enter
                </kbd>
                <span>للإرسال</span>
                <span className="text-slate-700 mx-1">·</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-mono text-[10px]">
                  Shift+Enter
                </kbd>
                <span>سطر جديد</span>
              </div>

              {/* Character Counter */}
              {charCount > 0 && (
                <div
                  className={`text-[11px] font-mono transition-colors ${
                    charCount > maxChars * 0.9
                      ? "text-orange-400"
                      : "text-slate-500"
                  }`}
                >
                  {charCount} / {maxChars}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-[10px] text-slate-600 mt-3">
          المساعد القانوني قد يقدم معلومات غير دقيقة. تحقق دائماً من المعلومات
          الحساسة.
        </p>
      </div>
    </div>
  );
}

export default ChatInput;
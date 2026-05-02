import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

// ═══════════════════════════════════════════════
// 🪝 useAuth Hook - للوصول السريع لـ AuthContext
// ═══════════════════════════════════════════════
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
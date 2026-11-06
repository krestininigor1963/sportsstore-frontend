"use client";

import { adminLogout } from "@/lib/api";
import { useState } from "react";

// Кнопка «Выйти» в шапке админки. После выхода делает полную перезагрузку
// на /admin, чтобы AdminAuthGuard заново проверил сессию и показал форму входа.
export default function AdminLogoutButton() {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await adminLogout();
    } catch {
      // Даже если запрос не удался — перезагружаем страницу и проверяем сессию заново
    } finally {
      window.location.assign("/admin");
    }
  };

  return (
    <button type="button" className="admin-logout" onClick={handleLogout} disabled={loggingOut}>
      {loggingOut ? "Выход…" : "Выйти"}
    </button>
  );
}

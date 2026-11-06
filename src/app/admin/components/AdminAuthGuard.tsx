"use client";

import { ApiError, adminCheckAuth } from "@/lib/api";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import AdminLoginForm from "./AdminLoginForm";

type AuthState = "loading" | "authorized" | "unauthorized" | "error";

// Проверяет админ-сессию сразу при заходе в админку (GET /api/auth/me).
// При отсутствии сессии (401) показывает форму входа вместо содержимого страницы.
export default function AdminAuthGuard({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>("loading");

  useEffect(() => {
    let ignore = false;

    adminCheckAuth()
      .then(() => {
        if (!ignore) setState("authorized");
      })
      .catch((err: unknown) => {
        if (ignore) return;
        setState(err instanceof ApiError && err.status === 401 ? "unauthorized" : "error");
      });

    return () => {
      ignore = true;
    };
  }, []);

  if (state === "loading") {
    return <div className="empty">Проверка авторизации…</div>;
  }

  if (state === "unauthorized") {
    return <AdminLoginForm onSuccess={() => setState("authorized")} />;
  }

  if (state === "error") {
    return <div className="alert alert-error">Не удалось проверить авторизацию. Попробуйте ещё раз.</div>;
  }

  return <>{children}</>;
}

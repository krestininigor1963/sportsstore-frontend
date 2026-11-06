"use client";

import { adminLogin } from "@/lib/api";
import { FormEvent, useState } from "react";

interface AdminLoginFormProps {
  onSuccess: () => void;
}

// Форма входа в админ-панель. Показывается вместо содержимого,
// когда у пользователя нет валидной админ-сессии (GET /api/auth/me → 401).
export default function AdminLoginForm({ onSuccess }: AdminLoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    const result = await adminLogin(username.trim(), password);
    setSubmitting(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.message ?? "Не удалось войти");
    }
  };

  return (
    <div className="admin-login-wrap">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <h1 className="admin-login-title">Вход в админ-панель</h1>
        <p className="admin-login-subtitle">Введите учётные данные администратора</p>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="field">
          <label htmlFor="admin-username">Логин</label>
          <input
            id="admin-username"
            className="input"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="field">
          <label htmlFor="admin-password">Пароль</label>
          <input
            id="admin-password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? "Вход…" : "Войти"}
        </button>
      </form>
    </div>
  );
}

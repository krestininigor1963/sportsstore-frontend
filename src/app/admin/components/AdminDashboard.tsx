"use client";

import Link from "next/link";
import { ApiError, fetchAdminResetDb, fetchAdminSummary } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { ISummaryResponse } from "@/types/store";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [data, setData] = useState<ISummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | undefined>("");

  useEffect(() => {
    fetchAdminSummary()
      .then((summary) => setData(summary))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setError("Вы не авторизованы. Пожалуйста, войдите в админ-панель.");
        } else {
          setError(err instanceof Error ? err.message : "Не удалось загрузить метрики");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleClick = () => {
    if (!confirm("Сбросить БД и заново наполнить товарами?")) return;
    setBusy(true);
    setMsg("Сброс…");

    fetchAdminResetDb()
      .then((res) => setMsg(res.message ?? "Готово"))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setError("Вы не авторизованы. Пожалуйста, войдите в админ-панель.");
        } else {
          setError(err instanceof Error ? err.message : "Не удалось загрузить метрики");
        }
      })
      .finally(() => setBusy(false));
  };

  return (
    <>
      <header
        className="admin-page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}
      >
        <h1>Обзор магазина</h1>
        <div className="admin-quick-actions">
          <Link href="/admin/products/create" className="btn btn-primary">
            ➕ Добавить товар
          </Link>
          <Link href="/admin/products" className="btn">
            Все товары
          </Link>
          <Link href="/admin/orders" className="btn">
            Все заказы
          </Link>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <div className="empty">Загрузка метрик…</div>
      ) : (
        data && (
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-label">Всего заказов</span>
              <span className="metric-value">{data.ordersTotal}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Ожидают отправки</span>
              <span className="metric-value">{data.ordersPending}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Отправлено</span>
              <span className="metric-value">{data.ordersShipped}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Выручка</span>
              <span className="metric-value">{formatPrice(data.revenueTotal)}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Товаров в каталоге</span>
              <span className="metric-value">{data.productsTotal}</span>
            </div>
            <button className="btn" onClick={handleClick} disabled={busy}>
              {busy ? "Сброс…" : "♻️ Сбросить БД"}
            </button>
          </div>
        )
      )}

      {msg && (
        <div className="alert alert-info" role="status">
          {msg}
        </div>
      )}
    </>
  );
}

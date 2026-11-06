"use client";

import { ApiError, fetchAdminOrdersTable } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { IOrder } from "@/types/store";
import { useEffect, useState } from "react";
import OrderRow from "./OrderRow";

export default function AdminOrdersPage() {
  const [data, setData] = useState<IOrder[] | null>(null);
  const total = (data ?? []).reduce(
    (sum, order) => sum + order.selections.reduce((t, s) => t + s.price * s.quantity, 0),
    0,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminOrdersTable()
      .then((data) => setData(data))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setError("Вы не авторизованы. Пожалуйста, войдите в админ-панель.");
        } else {
          setError(err instanceof Error ? err.message : "Не удалось загрузить заказы");
        }
        setLoading(false);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <header
        className="admin-page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}
      >
        <h1>Панель ордеров администратора</h1>
      </header>
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <div className="empty">Загрузка ордеров…</div>
      ) : (
        data && (
          <>
            {data.length === 0 ? (
              <div className="empty">Ничего не найдено. Попробуйте изменить параметры поиска.</div>
            ) : (
              <div className="product-list product-list--orders">
                <div className="product-list-header" aria-hidden="true">
                  <span className="header-cell header-category">customer</span>
                  <span className="header-cell header-supplier">zip</span>
                  <span className="header-cell header-name">product</span>
                  <span className="header-cell header-description">quantity</span>
                  <span className="header-cell header-price">Price</span>
                  <span className="header-cell header-actions">ship order</span>
                </div>
                {data.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </div>
            )}
            {total > 0 && <div className="total">Total: {formatPrice(total)}</div>}
          </>
        )
      )}
    </>
  );
}

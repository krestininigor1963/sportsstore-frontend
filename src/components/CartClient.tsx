"use client";

import type { ICartDetail } from "@/types/store";
import { useEffect, useState } from "react";
import { fetchCart } from "../lib/api";
import Link from "next/link";
import { formatPrice } from "../lib/format";

export default function CartClient() {
  const [cart, setCart] = useState<ICartDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;

    fetchCart()
      .then((data) => {
        if (ignore) return;
        setCart(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (ignore) return;
        setError(err instanceof Error ? err.message : "Не удалось загрузить корзину");
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) return <div className="empty">загрузка корзины...</div>;

  if (error)
    return (
      <div className="alert alert-error">
        {error}. Убедитесь, что бэкенд запущен на <code>http://localhost:5000</code>.
      </div>
    );

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="empty">
        <p>Ваша корзина пуста.</p>
        <Link href={"/"} className="btn btn-primary">
          Перейти в каталог
        </Link>
      </div>
    );
  }

  const handleRemove = async (productId: number) => {
    setBusyId(productId);
    setError(null);

    try {
      await fetch(`/api/cart/remove/${productId}`, { method: "POST" });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <header className="page-header">
        <h1>Корзина</h1>
        <p className="subtitle">Позиций в корзине: {cart.lines.length}</p>
      </header>
      <div className="cart-list">
        {cart.lines.map((line) => (
          <div className="cart-row" key={line.product.id}>
            <div>
              <div className="product-name">{line.product.name}</div>
              <div className="product-meta">
                {line.product.Category?.name ?? "Без категории"} · {formatPrice(line.product.price)} за шт.
              </div>
            </div>
            <div className="num">× {line.quantity}</div>
            <div className="num">{formatPrice(line.subtotal)}</div>
            <button
              className="btn btn-danger"
              disabled={busyId === line.product.id}
              onClick={() => handleRemove(line.product.id)}
            >
              {busyId === line.product.id ? "Удаляем" : "Удалить"}
            </button>
          </div>
        ))}

        <div className="cart-total">
          <span>Итого:</span>
          <span>{formatPrice(cart.total)}</span>
        </div>
      </div>

      <div className="cart-actions">
        <Link href={"/"} className="btn btn-primary">
          Продолжить покупки
        </Link>
        <Link href={"/checkout"} className="btn btn-secondary">
          Оформить заказ
        </Link>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchCart } from "../lib/api";
import { CART_UPDATED_EVENT } from "../lib/cartEvents";

export default function CartBadge() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    const load = async () => {
      try {
        const cart = await fetchCart();
        setCount(cart.lines.reduce((sum, line) => sum + line.quantity, 0));
      } catch {
        setCount(0);
      }
    };

    load();
    window.addEventListener(CART_UPDATED_EVENT, load);
    return () => window.removeEventListener(CART_UPDATED_EVENT, load);
  }, []);

  return (
    <Link href="/cart" className="cart-badge" aria-label="Корзина">
      🛒 Корзина
      {count !== null && count > 0 && <span className="count">{count}</span>}
    </Link>
  );
}

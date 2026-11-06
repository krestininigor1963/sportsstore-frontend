import { useState } from "react";
import { formatCategoryName, formatPrice } from "../lib/format";
import { IProduct } from "../types/store";
import { addToCart } from "../lib/api";
import { notifyCartUpdated } from "../lib/cartEvents";

const CATEGORY_EMOJI: Record<number, string> = {
  1: "🚤", // Watersports
  2: "⚽", // Soccer
  3: "♟️", // Chess
};

export default function ProductCard({ product }: { product: IProduct }) {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const category = product.Category;
  const emoji = CATEGORY_EMOJI[category?.id ?? 0] ?? "🏷️";

  const handleAdd = async () => {
    setError(null);
    setStatus("busy");
    try {
      await addToCart(product.id, quantity);

      notifyCartUpdated();
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось добавить товар");
      setStatus("idle");
    }
  };

  return (
    <article className="card">
      <div className="card-top">
        {category && (
          <span className="category-chip">
            {emoji} {formatCategoryName(category)}
          </span>
        )}
        <span className="price">{formatPrice(product.price)}</span>
      </div>
      <h3>{product.name}</h3>
      <p className="description">{product.description || "Описание отсутствует"}</p>
      <div className="card-actions">
        <input
          className="input qty-input"
          type="number"
          min={1}
          max={99}
          value={quantity}
          aria-label={`Количество: ${product.name}`}
          onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
        />
        <button className="btn btn-primary" onClick={handleAdd} disabled={status === "busy"}>
          {status === "busy" ? "Добавляем" : status === "done" ? "Добавлено ✓" : "в корзину"}
        </button>
      </div>
      <p className="add-feedback">{status === "done" ? "товар добавлен в корзину" : "\u00A0"}</p>
      {error && <p className="card-error">{error}</p>}
    </article>
  );
}

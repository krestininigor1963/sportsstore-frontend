import { shipOrder } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { IOrder } from "@/types/store";
import { useState } from "react";

export default function OrderRow({ order }: { order: IOrder }) {
  const [shipped, setShipped] = useState(order.shipped);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quantity = order.selections.reduce((total, selection) => total + selection.quantity, 0);
  const productNames = order.selections.map((s) => s.product?.name ?? `#${s.productId}`).join(", ") || "—";
  const subtotal = order.selections.reduce((total, selection) => total + selection.price * selection.quantity, 0);

  const handleShip = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await shipOrder(order.id, !shipped);
      setShipped(res.shipped);
    } catch {
      setError("Не удалось обновить статус заказа");
    } finally {
      setBusy(false);
    }
  };
  return (
    <article className="product-row">
      <div className="product-row-cell category-cell">
        <span className="category-chip">
          {order.customer?.name ?? "—"} ({order.customer?.email ?? "—"})
        </span>
      </div>
      <div className="product-row-cell supplier-cell">{order.address?.zip ?? "—"}</div>
      <h3 className="product-row-name name-cell">{productNames}</h3>
      <p className="product-row-description description-cell">{quantity} шт.</p>
      <span className="price product-row-price price-cell">{formatPrice(subtotal)}</span>
      <div className="product-row-actions actions-cell">
        <button
          onClick={handleShip}
          disabled={busy}
          style={{
            padding: "8px 16px",
            borderRadius: "25px",
            border: "none",
            fontWeight: "bold",
            color: "white",
            backgroundColor: shipped ? "#78d694" : "#c9c9c9",
            cursor: busy ? "wait" : "pointer",
          }}
        >
          {shipped ? "Shipped ✓" : "Unshipped"}
        </button>
      </div>
    </article>
  );
}

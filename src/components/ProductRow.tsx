import Link from "next/link";
import { formatCategoryName, formatPrice } from "../lib/format";
import { IProduct } from "../types/store";

const CATEGORY_EMOJI: Record<number, string> = {
  1: "🚤", // Watersports
  2: "⚽", // Soccer
  3: "♟️", // Chess
};

/**
 * Горизонтальная карточка товара (в строку):
 */
export default function ProductRow({ product }: { product: IProduct }) {
  const category = product.Category;
  const supply = product.Supplier;
  const emoji = CATEGORY_EMOJI[category?.id ?? 0] ?? "🏷️";

  return (
    <article className="product-row">
      <div className="product-row-cell category-cell">
        {category && (
          <span className="category-chip">
            {emoji} {formatCategoryName(category)}
          </span>
        )}
      </div>
      <div className="product-row-cell supplier-cell">
        {supply && <span className="category-chip">{supply.name}</span>}
      </div>
      <h3 className="product-row-name name-cell">{product.name}</h3>
      <p className="product-row-description description-cell">{product.description || "Описание отсутствует"}</p>
      <span className="price product-row-price price-cell">{formatPrice(product.price)}</span>

      <div className="product-row-actions actions-cell">
        <Link
          href={`/admin/products/edit/${product.id}`}
          className="btn-edit"
          style={{
            padding: "10px 18px",
            backgroundColor: "#78d694",
            color: "white",
            borderRadius: "25px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Edit
        </Link>
        <Link
          href={`/admin/products/delete/${product.id}`}
          className="btn-delete"
          style={{
            padding: "10px 18px",
            backgroundColor: "#e69688",
            color: "white",
            borderRadius: "25px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Del
        </Link>
      </div>
    </article>
  );
}

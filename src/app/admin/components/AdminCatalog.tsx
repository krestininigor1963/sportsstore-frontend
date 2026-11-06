"use client";

import Pagination from "@/components/Pagination";
import ProductRow from "@/components/ProductRow";
import { ApiError, fetchAdminProductsTable, fetchProducts } from "@/lib/api";
import { IProductsResponse } from "@/types/store";
import Link from "next/link";
import { useEffect, useState } from "react";

// Варианты отображения количества товаров: 3, 6, 9 или "all" (все)
const PAGE_SIZES: { value: number | "all"; label: string }[] = [
  { value: 3, label: "по 3" },
  { value: 6, label: "по 6" },
  { value: 9, label: "по 9" },
  { value: "all", label: "Все" },
];

export default function AdminStorePage() {
  const [data, setData] = useState<IProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">("all");
  const [category, setCategory] = useState<number>(0);

  const [appliedSearch, setAppliedSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    fetchAdminProductsTable({ page, pageSize, searchTerm: appliedSearch || undefined, category: category || undefined })
      .then((res) => {
        if (ignore) return;
        setData(res);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (ignore) return;
        if (err instanceof ApiError && err.status === 401) {
          setError("Вы не авторизованы. Пожалуйста, войдите в админ-панель.");
        } else {
          setError(err instanceof Error ? err.message : "Не удалось загрузить каталог");
        }
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [page, pageSize, appliedSearch, category]);

  return (
    <>
      <header
        className="admin-page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}
      >
        <h1>Панель товаров администратора</h1>
        <Link
          href="/admin/products/create"
          className="btn-create"
          style={{
            padding: "10px 15px",
            backgroundColor: "#10b981",
            color: "white",
            borderRadius: "5px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          ➕ Создать новый товар
        </Link>
      </header>
      <div className="toolbar">
        <select
          className="select"
          value={pageSize}
          aria-label="Товаров на странице"
          onChange={(e) => {
            const value = e.target.value;
            setPageSize(value === "all" ? "all" : Number(value));
            setPage(1);
          }}
        >
          {PAGE_SIZES.map((size) => (
            <option key={String(size.value)} value={String(size.value)}>
              {size.label}
            </option>
          ))}
        </select>
        {data && <span className="pagination-info">Всего товаров: {data.result.totalCount}</span>}
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <div className="empty">Загрузка каталога…</div>
      ) : (
        data && (
          <>
            {data.result.products.length === 0 ? (
              <div className="empty">Ничего не найдено. Попробуйте изменить параметры поиска.</div>
            ) : (
              <div className="product-list">
                <div className="product-list-header" aria-hidden="true">
                  <span className="header-cell header-category">Category</span>
                  <span className="header-cell header-supplier">Supplier</span>
                  <span className="header-cell header-name">Name</span>
                  <span className="header-cell header-description">Description</span>
                  <span className="header-cell header-price">Price</span>
                  <span className="header-cell header-actions">Actions</span>
                </div>
                {data.result.products.map((product) => (
                  <ProductRow key={product.id} product={product} />
                ))}
              </div>
            )}
            <Pagination page={data.page} pageCount={data.pageCount} onPageChange={setPage} />
          </>
        )
      )}
    </>
  );
}

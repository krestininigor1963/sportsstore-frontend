"use client";

import { FormEvent, useEffect, useState } from "react";
import { fetchProducts } from "@/lib/api";
import { IProductsResponse } from "@/types/store";
import Pagination from "./Pagination";
import ProductCard from "./ProductCard";

// Варианты отображения количества товаров: 3, 6, 9 или "all" (все)
const PAGE_SIZES: { value: number | "all"; label: string }[] = [
  { value: 3, label: "по 3" },
  { value: 6, label: "по 6" },
  { value: 9, label: "по 9" },
  { value: "all", label: "Все" },
];

export default function StorePage() {
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

    fetchProducts({
      page,
      pageSize,
      searchTerm: appliedSearch || undefined,
      category: category || undefined,
    })
      .then((res) => {
        if (ignore) return;
        setData(res);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (ignore) return;
        setError(err instanceof Error ? err.message : "Не удалось загрузить каталог");
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [page, pageSize, appliedSearch, category]);

  const applySearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const clearFilters = () => {
    setSearchInput("");
    setAppliedSearch("");
    setCategory(0);
    setPage(1);
  };

  // выбор категорий с сервера данных
  const categories = data?.result.categories ?? [];
  const hasFilters = Boolean(appliedSearch) || category !== 0;

  return (
    <div className="container">
      <header className="page-header">
        <h1>Каталог товаров</h1>
        <p className="subtitle">{data ? `Найдено товаров: ${data.result.totalCount}` : "Загрузка каталога…"}</p>
      </header>
      <form className="toolbar" onSubmit={applySearch}>
        <input
          className="input search-input"
          type="text"
          placeholder="Поиск по названию или описанию (например: Ball)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">
          Найти
        </button>
        <select
          className="select"
          value={category}
          aria-label="Категория"
          onChange={(e) => {
            setCategory(Number(e.target.value) || 0);
            setPage(1);
          }}
        >
          <option value={0}>Все категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
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
        {hasFilters && (
          <button className="btn" type="button" onClick={clearFilters}>
            Сбросить
          </button>
        )}
      </form>
      {error && (
        <div className="alert alert-error">
          {error}. Убедитесь, что бэкенд запущен на <code>http://localhost:5000</code> (npm run dev в папке backend).
        </div>
      )}
      {loading ? (
        <div className="grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="skeleton" key={i} />
          ))}
        </div>
      ) : (
        data && (
          <>
            {data.result.products.length === 0 ? (
              <div className="empty">Ничего не найдено. Попробуйте изменить параметры поиска.</div>
            ) : (
              <div className="grid">
                {data.result.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
            <Pagination page={data.page} pageCount={data.pageCount} onPageChange={setPage} />
          </>
        )
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createProduct, fetchProductCreateData } from "@/lib/api";
import type { ICategory, ISupplier, IValidationFieldMap } from "@/types/store";

// Бэкенд сериализует ValidationStatus как { value, messages }:
// берём value для предзаполнения, а ошибки определяем по messages.
const fieldMessages = (map?: IValidationFieldMap): Record<string, string[]> => {
  const out: Record<string, string[]> = {};
  if (!map) return out;
  for (const [key, status] of Object.entries(map)) {
    out[key] = status?.messages ?? [];
  }
  return out;
};

interface FieldProps {
  label: string;
  hint?: string;
  name: string;
  type?: string;
  value: string;
  messages?: string[];
  placeholder?: string;
  onChange: (value: string) => void;
}

const Field = ({ label, hint, name, type = "text", value, messages = [], placeholder, onChange }: FieldProps) => {
  const id = `product-${name}`;
  const invalid = messages.length > 0;

  return (
    <div className="field">
      <label htmlFor={id}>
        {label} {hint && <span className="hint">{hint}</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        className={invalid ? "input input-error" : "input"}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {invalid && (
        <ul className="field-errors">
          {messages.map((message, i) => (
            <li key={i}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

interface TextAreaFieldProps {
  label: string;
  hint?: string;
  name: string;
  value: string;
  messages?: string[];
  placeholder?: string;
  onChange: (value: string) => void;
}

const TextAreaField = ({ label, hint, name, value, messages = [], placeholder, onChange }: TextAreaFieldProps) => {
  const id = `product-${name}`;
  const invalid = messages.length > 0;

  return (
    <div className="field">
      <label htmlFor={id}>
        {label} {hint && <span className="hint">{hint}</span>}
      </label>
      <textarea
        id={id}
        name={name}
        rows={4}
        className={invalid ? "input input-error" : "input"}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {invalid && (
        <ul className="field-errors">
          {messages.map((message, i) => (
            <li key={i}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  messages?: string[];
  options: { id: number; name: string }[];
  placeholder?: string;
  onChange: (value: string) => void;
}

const SelectField = ({
  label,
  name,
  value,
  messages = [],
  options,
  placeholder = "— выберите —",
  onChange,
}: SelectFieldProps) => {
  const id = `product-${name}`;
  const invalid = messages.length > 0;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        name={name}
        className={invalid ? "select input-error" : "select"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      {invalid && (
        <ul className="field-errors">
          {messages.map((message, i) => (
            <li key={i}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Форма создания нового товара. GET /api/auth/products/create отдаёт списки
// категорий и поставщиков; POST /api/auth/products/create сохраняет товар
// и возвращает 400 с ошибками валидации полей (подсвечиваем их красным).
export default function ProductCreateForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [price, setPrice] = useState("");

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;

    fetchProductCreateData()
      .then((data) => {
        if (ignore) return;
        setCategories(data.categories);
        setSuppliers(data.suppliers);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (ignore) return;
        setLoadError(err instanceof Error ? err.message : "Не удалось загрузить данные для формы");
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setGeneralError(null);
    setErrors({});

    try {
      const result = await createProduct({
        name,
        description,
        categoryId: Number(categoryId),
        supplierId: Number(supplierId),
        price: Number(price),
      });

      if (result.ok) {
        // Товар создан — возвращаемся в каталог админки
        router.push("/admin/products");
        return;
      }

      setGeneralError(result.message ?? "Не удалось создать товар");
      if (result.errors) {
        setErrors(fieldMessages(result.errors));
      }
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : "Не удалось создать товар. Проверьте соединение с сервером");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header
        className="admin-page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h1>Создание нового товара</h1>
        <Link
          href="/admin/products"
          className="btn"
          style={{
            textDecoration: "none",
          }}
        >
          ← Назад к товарам
        </Link>
      </header>

      {loading && <div className="empty">Загрузка формы…</div>}

      {loadError && <div className="alert alert-error">{loadError}</div>}

      {!loading && !loadError && (
        <form className="panel" onSubmit={handleSubmit} noValidate>
          {generalError && <div className="alert alert-error">{generalError}</div>}

          <Field
            label="Название"
            hint="(минимум 3 символа)"
            name="name"
            value={name}
            messages={errors.name}
            placeholder="Футбольный мяч"
            onChange={setName}
          />

          <TextAreaField
            label="Описание"
            name="description"
            value={description}
            messages={errors.description}
            placeholder="Подробное описание товара"
            onChange={setDescription}
          />

          <SelectField
            label="Категория"
            name="categoryId"
            value={categoryId}
            messages={errors.categoryId}
            options={categories}
            onChange={setCategoryId}
          />

          <SelectField
            label="Поставщик"
            name="supplierId"
            value={supplierId}
            messages={errors.supplierId}
            options={suppliers}
            onChange={setSupplierId}
          />

          <Field
            label="Цена"
            hint="(в долларах)"
            name="price"
            type="number"
            value={price}
            messages={errors.price}
            placeholder="1999"
            onChange={setPrice}
          />

          <div className="form-actions">
            <Link href="/admin/products" className="btn">
              Отмена
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Сохранение…" : "💾 Создать товар"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

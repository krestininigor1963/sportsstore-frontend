"use client";

import { fetchProductEditData, saveProduct } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { ICategory, ISupplier, IValidationFieldMap } from "@/types/store";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

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
  // Форматированное превью значения (например, цена "$1,999.00") —
  // показывается под полем и не мешает вводу "сырого" значения.
  preview?: string;
  onChange: (value: string) => void;
}

const Field = ({
  label,
  hint,
  name,
  type = "text",
  value,
  messages = [],
  placeholder,
  preview,
  onChange,
}: FieldProps) => {
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
      {preview && <div className="hint">{preview}</div>}
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

export default function ProductEditForm() {
  const params = useParams(); // ИСПРАВЛЕНО: Извлекаем параметры через useParams

  const productId = Number(params?.id); // Предполагается динамический роут [id]/page.tsx
  //console.log("productId---", productId); // Выводим значение productId в консоль(

  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState<string>("");
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
    if (!productId || isNaN(productId) || productId <= 0) {
      setLoadError("Неверный идентификатор товара");
      setLoading(false);
      return;
    }

    let ignore = false;
    // value в IValidationStatusDto имеет тип unknown — сужаем до string
    const toString = (value: unknown): string =>
      typeof value === "string" ? value : value == null ? "" : String(value);

    setLoading(true);

    fetchProductEditData(productId)
      .then((data) => {
        if (ignore) return;
        setName(toString(data.product.name?.value));
        setDescription(toString(data.product.description?.value));
        setCategoryId(toString(data.product.categoryId?.value));
        setSupplierId(toString(data.product.supplierId?.value));
        setPrice(toString(data.product.price?.value));
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
  }, [productId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setGeneralError(null);
    setErrors({});

    try {
      const result = await saveProduct(productId, {
        name,
        description,
        categoryId: Number(categoryId),
        supplierId: Number(supplierId),
        price: Number(price),
      });

      if (result.ok) {
        // Товар сохранён — возвращаемся в каталог админки
        router.push("/admin/products");
        return;
      }

      // PUT вернул 400 с картой ошибок валидации — подсвечиваем поля и показываем сообщение
      setGeneralError(result.message ?? "Не удалось отредактировать товар");
      if (result.errors) {
        setErrors(fieldMessages(result.errors));
      }
    } catch (err: unknown) {
      setGeneralError(
        err instanceof Error ? err.message : "Не удалось отредактировать товар. Проверьте соединение с сервером",
      );
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
        <h1>Редактирование товара</h1>
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
            preview={price !== "" && !isNaN(Number(price)) ? formatPrice(Number(price)) : undefined}
            onChange={setPrice}
          />

          <div className="form-actions">
            <Link href="/admin/products" className="btn">
              Отмена
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Сохранение…" : "💾 Сохранить товар"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

import { deleteProduct, fetchAdminProductById } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { IValidationFieldMap } from "@/types/store";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  readOnly?: boolean;
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
  readOnly = false,
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
        readOnly={readOnly}
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

export default function ProductDelForm() {
  const params = useParams();

  const productId = Number(params?.id);
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState<string>("");
  const [categoryName, setCategoryName] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [price, setPrice] = useState("");

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

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
    fetchAdminProductById(productId)
      .then((data) => {
        if (ignore) return;
        setName(toString(data.name?.valueOf()));
        setDescription(toString(data.description?.valueOf()));
        setCategoryName(toString(data.Category?.name?.valueOf()));
        setSupplierName(toString(data.Supplier?.name?.valueOf()));
        setPrice(toString(data.price?.valueOf()));
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;

        setLoadError(err instanceof Error ? err.message : "Не удалось загрузить данные продукта");
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    setGeneralError(null);
    setErrors({});

    try {
      const result = await deleteProduct(productId);
      if (result.ok) {
        // Товар удалён — возвращаемся в каталог админки
        router.push("/admin/products");
        return;
      }
      setGeneralError(result.message ?? "Не удалось удалить товар");
      if (result.errors) {
        setErrors(fieldMessages(result.errors));
      }
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : "Не удалось удалить товар. Проверьте соединение с сервером");
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
        <h1>Удаление товара</h1>
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
            placeholder="Soccer Ball"
            onChange={setName}
          />

          <Field
            label="Описание"
            name="description"
            value={description}
            messages={errors.description}
            placeholder="FIFA-approved size and weight"
            onChange={setDescription}
          />

          <Field
            label="Категория"
            name="category"
            value={categoryName}
            messages={errors.category}
            placeholder="Soccer"
            onChange={setCategoryName}
          />

          <Field
            label="Поставщик"
            name="supplier"
            value={supplierName}
            messages={errors.supplier}
            placeholder="Acme Industries"
            onChange={setSupplierName}
          />

          <Field
            label="Цена"
            name="price"
            value={price === "" ? "" : formatPrice(Number(price))}
            messages={errors.price}
            placeholder="0.0 $"
            readOnly
            onChange={setPrice}
          />

          <div className="form-actions">
            <Link href="/admin/products" className="btn">
              Отмена
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Удаление…" : "🗑 Удалить товар"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ICartDetail, IAddress, ICustomer, IValidationFieldMap } from "@/types/store";
import { fetchCart, fetchCheckoutSession, submitCheckout } from "@/lib/api";
import { formatPrice } from "@/lib/format";

// Бэкенд сериализует ValidationStatus как { value, messages }:
// берём value для предзаполнения, а ошибки определяем по messages.
const fieldValue = (status?: { value?: unknown }): string => {
  if (!status || status.value == null) return "";
  return typeof status.value === "string" ? status.value : String(status.value);
};

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
  const id = `checkout-${name}`;
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

export default function CheckoutForm() {
  const router = useRouter();

  const [customer, setCustomer] = useState<ICustomer>({ name: "", email: "" });
  const [address, setAddress] = useState<IAddress>({
    street: "",
    city: "",
    state: "",
    zip: "",
  });

  const [customerErrors, setCustomerErrors] = useState<Record<string, string[]>>({});
  const [addressErrors, setAddressErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cart, setCart] = useState<ICartDetail | null>(null);

  // Загружаем корзину и предзаполняем форму данными валидации из сессии (GET /api/checkout)
  useEffect(() => {
    let ignore = false;

    fetchCheckoutSession()
      .then((data) => {
        if (ignore || !data.order) return;
        setCustomer({
          name: fieldValue(data.order.customer?.name),
          email: fieldValue(data.order.customer?.email),
        });
        setAddress({
          street: fieldValue(data.order.address?.street),
          city: fieldValue(data.order.address?.city),
          state: fieldValue(data.order.address?.state),
          zip: fieldValue(data.order.address?.zip),
        });
        setCustomerErrors(fieldMessages(data.order.customer));
        setAddressErrors(fieldMessages(data.order.address));
      })
      .catch(() => {
        // Бэкенд недоступен: начинаем с пустой формы
      });

    fetchCart()
      .then((data) => {
        if (!ignore) setCart(data);
      })
      .catch(() => {
        if (!ignore) setCart(null);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setGeneralError(null);
    setCustomerErrors({});
    setAddressErrors({});

    try {
      const result = await submitCheckout(customer, address);

      if (result.ok && result.orderId != null) {
        router.replace(`/checkout/${result.orderId}`);
        return;
      }

      setGeneralError(result.message ?? "Не удалось оформить заказ");
      if (result.errors) {
        setCustomerErrors(fieldMessages(result.errors.customer));
        setAddressErrors(fieldMessages(result.errors.address));
      }
    } catch (err: unknown) {
      // submitCheckout использует fetch напрямую — сетевые ошибки/CORS
      // приводят к reject, который раньше не обрабатывался (кнопка зависала).
      setGeneralError(
        err instanceof Error ? err.message : "Не удалось оформить заказ. Проверьте соединение с сервером",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const cartEmpty = !cart || cart.lines.length === 0;

  return (
    <div>
      <header className="page-header">
        <h1>Оформление заказа</h1>
        <p className="subtitle">Заполните данные покупателя и адрес доставки</p>
      </header>

      <div className="checkout-grid">
        <form className="panel" onSubmit={handleSubmit} noValidate>
          <h2>Покупатель</h2>
          <Field
            label="Имя и фамилия"
            hint="(минимум 6 символов)"
            name="name"
            value={customer.name}
            messages={customerErrors.name}
            placeholder="Иван Иванов"
            onChange={(value) => setCustomer({ ...customer, name: value })}
          />
          <Field
            label="Email"
            name="email"
            type="email"
            value={customer.email}
            messages={customerErrors.email}
            placeholder="ivan@example.com"
            onChange={(value) => setCustomer({ ...customer, email: value })}
          />

          <hr className="section-divider" />

          <h2>Адрес доставки</h2>
          <Field
            label="Улица"
            name="street"
            value={address.street}
            messages={addressErrors.street}
            placeholder="Ленина 15"
            onChange={(value) => setAddress({ ...address, street: value })}
          />
          <Field
            label="Город"
            name="city"
            value={address.city}
            messages={addressErrors.city}
            placeholder="Москва"
            onChange={(value) => setAddress({ ...address, city: value })}
          />
          <Field
            label="Регион / Штат"
            name="state"
            value={address.state}
            messages={addressErrors.state}
            placeholder="Московская область"
            onChange={(value) => setAddress({ ...address, state: value })}
          />
          <Field
            label="Почтовый индекс"
            name="zip"
            value={address.zip}
            messages={addressErrors.zip}
            placeholder="101000"
            onChange={(value) => setAddress({ ...address, zip: value })}
          />

          {generalError && (
            <div className="alert alert-error">
              {generalError} {generalError.includes("Корзина") && <Link href="/">Перейти в каталог</Link>}
            </div>
          )}

          <div className="form-actions">
            <Link href="/cart" className="btn">
              ← Назад в корзину
            </Link>
            <button className="btn btn-primary" type="submit" disabled={submitting || cartEmpty}>
              {submitting ? "Оформляем…" : "Оформить заказ"}
            </button>
          </div>
        </form>

        <aside className="panel">
          <h2>Ваш заказ</h2>
          {cart && cart.lines.length > 0 ? (
            <>
              <ul className="order-lines">
                {cart.lines.map((line) => (
                  <li key={line.product.id} className="order-line">
                    <span className="order-line-name">
                      {line.product.name} × {line.quantity}
                    </span>
                    <span className="order-line-subtotal">{formatPrice(line.subtotal)}</span>
                  </li>
                ))}
              </ul>
              <p className="order-total">
                Итого: <strong>{formatPrice(cart.total)}</strong>
              </p>
            </>
          ) : (
            <p className="order-empty">Корзина пуста</p>
          )}
        </aside>
      </div>
    </div>
  );
}

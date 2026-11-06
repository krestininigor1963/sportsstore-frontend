// ============================================================
// УНИВЕРСАЛЬНАЯ ОБЁРТКА ЗАПРОСОВ
// ============================================================
// Базовый URL бэкенда. Можно переопределить в .env.local
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

import type {
  ICartDetail,
  ICartLineDetail,
  IAddress,
  ICustomer,
  IProductsResponse,
  ICheckoutSessionResponse,
  ICheckoutValidationErrors,
  ICheckoutSuccessResponse,
  ICheckoutDetailResponse,
  IProduct,
  IProductCreateDto,
  IProductCreateSessionDto,
  IValidationFieldMap,
  ISupplier,
  ICategory,
  IProductEditSessionDto,
  IProductCreateResult,
  IOrder,
  IShipOrderResponse,
  ISummaryResponse,
} from "@/types/store";

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, payload: unknown) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error: unknown }).error === "string"
        ? (payload as { error: string }).error
        : `Запрос завершился с ошибкой (${status})`;
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

interface requestOptions {
  method: "GET" | "POST";
  body: unknown;
}

// Общая обёртка над fetch. credentials: "include" обязателен:
// корзина и сессия живут в cookies бэкенда (localhost:5000).
async function request<T>(
  path: string,
  options: requestOptions = {
    method: "GET",
    body: undefined,
  },
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    credentials: "include",
    cache: "no-store",
    // options.body Превращаем в строку перед отправкой
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new ApiError(res.status, payload);
  }
  return res.json() as Promise<T>;
}

// --- Каталог ---

export interface IProductQuery {
  page?: number;
  // "all" = показать все товары одной страницей (без пагинации)
  pageSize?: number | "all";
  searchTerm?: string;
  category?: number;
}

export const fetchProducts = (query: IProductQuery): Promise<IProductsResponse> => {
  const params = new URLSearchParams();

  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  if (query.searchTerm) params.set("searchTerm", query.searchTerm);
  if (query.category) params.set("category", String(query.category));

  const qs = params.toString();
  return request<IProductsResponse>(`/api/products${qs ? `?${qs}` : ""}`);
};

// --- Корзина ---

export const fetchCart = (): Promise<ICartDetail> => {
  return request<ICartDetail>("/api/cart");
};

export const addToCart = (productId: number, quantity: number): Promise<ICartDetail> =>
  request<ICartDetail>("/api/cart/add", {
    method: "POST",
    body: { productId, quantity },
  });

export const removeFromCart = (productId: number): Promise<ICartDetail> =>
  request<ICartDetail>(`/api/cart/remove/${productId}`, {
    method: "POST",
    body: { productId },
  });

// --- Оформление заказа ---

export const fetchCheckoutSession = (): Promise<ICheckoutSessionResponse> =>
  request<ICheckoutSessionResponse>("/api/checkout");

export interface ICheckoutSubmitResult {
  ok: boolean;
  orderId?: number;
  message?: string;
  errors?: ICheckoutValidationErrors;
}

// POST /api/checkout возвращает 400 с результатами валидации —
// поэтому обрабатываем ответ вручную, а не через request().
export const submitCheckout = async (customer: ICustomer, address: IAddress): Promise<ICheckoutSubmitResult> => {
  const res = await fetch(`${API_BASE_URL}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify({ customer, address }),
  });

  const body: unknown = await res.json().catch(() => ({}));

  if (res.status === 201 && (body as ICheckoutSuccessResponse).success) {
    return { ok: true, orderId: (body as ICheckoutSuccessResponse).orderId };
  }

  const errBody = body as {
    success: false;
    message?: string;
    errors?: ICheckoutValidationErrors;
  };
  return {
    ok: false,
    message: errBody.message ?? "Не удалось оформить заказ",
    errors: errBody.errors,
  };
};

export const fetchCheckoutDetail = (id: string): Promise<ICheckoutDetailResponse> =>
  request<ICheckoutDetailResponse>(`/api/checkout/${id}`);

////////////////////////////////////
// --- АДМИНКА: ---
////////////////////////////////////

// Проверка текущей админ-сессии: 200 при валидной сессии, 401 — если не авторизован.
export const adminCheckAuth = (): Promise<{ success: true; username?: string }> =>
  request<{ success: true; username?: string }>("/api/auth/me");

export interface IAdminLoginResult {
  success: boolean;
  message?: string;
}

// POST /api/auth/login: при неверных данных бэкенд возвращает 401 с полем error,
// поэтому обрабатываем ответ вручную, а не через request().
export const adminLogin = async (username: string, password: string): Promise<IAdminLoginResult> => {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify({ username, password }),
  });

  const body: unknown = await res.json().catch(() => ({}));

  if (res.ok) {
    return { success: true };
  }

  const errBody = body as { success?: false; error?: string; message?: string };
  return {
    success: false,
    message: errBody.error ?? errBody.message ?? "Неверный логин или пароль",
  };
};

// Выход из админ-панели: уничтожает сессию на бэкенде и очищает куку.
export const adminLogout = (): Promise<{ success: boolean }> =>
  request<{ success: boolean }>("/api/auth/logout", {
    method: "POST",
    body: {},
  });

// --- АДМИНКА: получение товара, товаров ---

export const fetchAdminProductsTable = (query: IProductQuery): Promise<IProductsResponse> => {
  const params = new URLSearchParams();

  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  if (query.searchTerm) params.set("searchTerm", query.searchTerm);
  if (query.category) params.set("category", String(query.category));

  const qs = params.toString();
  return request<IProductsResponse>(`/api/auth/products/table${qs ? `?${qs}` : ""}`);
};

export const fetchAdminProductById = (id: number): Promise<IProduct> => request<IProduct>(`/api/auth/products/${id}`);

// --- АДМИНКА: создание товара ---

// GET /api/auth/products/create: отдаёт списки поставщиков и категорий для формы.
export const fetchProductCreateData = (): Promise<IProductCreateSessionDto> =>
  request<IProductCreateSessionDto>("/api/auth/products/create");

// POST /api/auth/products/create: при невалидных данных бэкенд возвращает 400
// с полем errors (карта валидации { поле: { value, messages } }) — обрабатываем
// ответ вручную, как в submitCheckout, чтобы подсветить поля с ошибками.
export const createProduct = async (dto: IProductCreateDto): Promise<IProductCreateResult> => {
  const res = await fetch(`${API_BASE_URL}/api/auth/products/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(dto),
  });

  const body: unknown = await res.json().catch(() => ({}));

  if (res.status === 201) {
    return { ok: true, product: body as IProduct };
  }

  const errBody = body as { message?: string; errors?: IValidationFieldMap };
  return {
    ok: false,
    message: errBody.message ?? "Не удалось создать товар",
    errors: errBody.errors,
  };
};

// --- АДМИНКА: редактирование товара ---

// GET /api/auth/products/:id/edit: отдаёт карту валидации товара
// ({ поле: { value, messages } }) и списки поставщиков и категорий для формы.
export const fetchProductEditData = (id: number): Promise<IProductEditSessionDto> =>
  request<IProductEditSessionDto>(`/api/auth/products/${id}/edit`);

// PUT /api/auth/products/:id — сохранение изменений
export const saveProduct = async (id: number, dto: IProductCreateDto): Promise<IProductCreateResult> => {
  const res = await fetch(`${API_BASE_URL}/api/auth/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(dto),
  });

  const body: unknown = await res.json().catch(() => ({}));

  if (res.ok) {
    return { ok: true, message: (body as { message?: string }).message };
  }

  const errBody = body as { message?: string; errors?: IValidationFieldMap };
  return {
    ok: false,
    message: errBody.message ?? "Не удалось отредактировать товар",
    errors: errBody.errors,
  };
};

// --- АДМИНКА: Удаление Продукта ---

// DELETE /api/auth/products/:id — удаление товара
export const deleteProduct = async (id: number): Promise<IProductCreateResult> => {
  const res = await fetch(`${API_BASE_URL}/api/auth/products/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
  });

  const body: unknown = await res.json().catch(() => ({}));

  if (res.ok) {
    return { ok: true, message: (body as { message?: string }).message };
  }

  const errBody = body as { message?: string; errors?: IValidationFieldMap };
  return {
    ok: false,
    message: errBody.message ?? "Не удалось удалить товар",
    errors: errBody.errors,
  };
};

// --- АДМИНКА: Получить таблицу заказов(Orders) ---

//  GET /api/auth/orders/table: отдает таблицу заказов
export const fetchAdminOrdersTable = () => {
  return request<IOrder[]>("/api/auth/orders/table");
};

export const shipOrder = (id: number, shipped: boolean): Promise<IShipOrderResponse> =>
  request<IShipOrderResponse>("/api/auth/orders/ship", {
    method: "POST",
    body: { id, shipped },
  });

// --- АДМИНКА: сводные метрики для дашборда ---

// GET /api/auth/orders/summary: агрегированные метрики одним запросом
// (всего заказов, отправлено/не отправлено, выручка, количество товаров).
export const fetchAdminSummary = (): Promise<ISummaryResponse> => request<ISummaryResponse>("/api/auth/orders/summary");

// --- АДМИНКА: сброс базы данных ---
export const fetchAdminResetDb = (): Promise<{ success: boolean; message?: string }> =>
  request<{ success: boolean; message?: string }>("/api/auth/db/reset", {
    method: "POST",
    body: {},
  });

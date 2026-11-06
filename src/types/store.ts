// Типы данных, повторяющие модели бэкенда (src/data/*, src/routes/*).
// Держите их синхронизированными с серверной частью.

export interface ICategory {
  id: number;
  name: string;
}

export interface ISupplier {
  id: number;
  name: string;
}

export interface IProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  Category?: ICategory;
  Supplier?: ISupplier;
}

export interface IProductQueryResult {
  products: IProduct[];
  totalCount: number;
  categories: ICategory[];
}

// Ответ GET /api/products
export interface IProductsResponse {
  result: IProductQueryResult;
  page: number;
  // "all" = все товары на одной странице (pageCount будет равен 1)
  pageSize: number | "all";
  pageCount: number;
  searchTerm?: string;
  category?: number;
}

// --- Корзина (src/data/cart_helpers.ts) ---

export interface ICartLineDetail {
  product: IProduct;
  quantity: number;
  subtotal: number;
}

export interface ICartDetail {
  lines: ICartLineDetail[];
  total: number;
}

// --- Заказ / Оформление (src/data/customer_interfaces.ts, src/data/order_interfaces.ts) ---

export interface ICustomer {
  name: string;
  email: string;
}

export interface IAddress {
  id?: number;
  street: string;
  city: string;
  state: string;
  zip: string;
}

// ValidationStatus сериализуется бэкендом в JSON как { value, messages }.
// Флаг isInvalid не попадает в JSON (геттер класса), поэтому ошибочность
// поля определяется по наличию сообщений в массиве messages.
export interface IValidationStatusDto {
  value: unknown;
  messages: string[];
}

export type IValidationFieldMap = Record<string, IValidationStatusDto>;

export interface ICheckoutSessionDto {
  customer?: IValidationFieldMap;
  address?: IValidationFieldMap;
}

export interface ICheckoutValidationErrors {
  customer?: IValidationFieldMap;
  address?: IValidationFieldMap;
}

// Ответ GET /api/checkout (предзаполнение формы данными сессии)
export interface ICheckoutSessionResponse {
  order: {
    customer?: IValidationFieldMap;
    address?: IValidationFieldMap;
  } | null;
  pageSize: string;
}

export interface ICheckoutSuccessResponse {
  success: true;
  orderId: number;
}

// Ответ GET /api/checkout/:id (подтверждение заказа)
export interface ICheckoutDetailResponse {
  success: boolean;
  id: string;
  pageSize: number | "all";
}

// --- Создание товара (АДМИНКА, /api/auth/products/create) ---

// Тело POST /api/auth/products/create (поля продукта + FK)
export interface IProductCreateDto {
  name: string;
  description: string;
  categoryId: number;
  supplierId: number;
  price: number;
}

// Ответ GET /api/auth/products/create: данные для формы создания товара
export interface IProductCreateSessionDto {
  product: Record<string, never>;
  suppliers: ISupplier[];
  categories: ICategory[];
  create: true;
}

// Успешный ответ POST /api/auth/products/create: бэкенд возвращает (201) сам товар
export type IProductCreateSuccess = IProduct;

// Ответ POST /api/auth/products/create: результат создания товара
export interface IProductCreateResult {
  ok: boolean;
  product?: IProduct;
  message?: string;
  errors?: IValidationFieldMap;
}

// Ответ GET /api/auth/products/:id/edit: данные для формы редактирования
export interface IProductEditSessionDto {
  product: IValidationFieldMap; // { поле: { value, messages } }
  suppliers: ISupplier[];
  categories: ICategory[];
}

// --- Заказы (АДМИНКА, /api/auth/orders/table) ---

// Вложенный объект customer из ответа OrderModel.toJSON()
// (у бэкендового ICustomer из customer_interfaces.ts есть id).
export interface IOrderCustomer {
  id: number;
  name: string;
  email: string;
}

// Позиция заказа: ProductSelectionModel + вложенный товар из include.
// product может отсутствовать, если в запросе не было include: [{ model: ProductModel, as: "product" }].
export interface IOrderSelection {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  product?: IProduct;
}

// Зеркало backend/src/data/order_interfaces.ts, приведённое к форме
// JSON-ответа GET /api/auth/orders/table (OrderModel.toJSON() с eager loading).
// FK-поля (customerId, addressId) Sequelize тоже сериализует, поэтому они здесь опциональны.
export interface IOrder {
  id: number;
  shipped: boolean;
  customerId?: number;
  addressId?: number;
  customer: IOrderCustomer;
  address: IAddress;
  selections: IOrderSelection[];
}

export interface IShipOrderResponse {
  success: true;
  message: string;
  id: number;
  shipped: boolean;
}

// Зеркало ответа GET /api/auth/orders/summary — сводные метрики для дашборда.
export interface ISummaryResponse {
  ordersTotal: number;
  ordersShipped: number;
  ordersPending: number;
  revenueTotal: number;
  productsTotal: number;
}

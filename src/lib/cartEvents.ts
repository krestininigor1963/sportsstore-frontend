// Простая шина событий, чтобы оповещать NavBar (CartBadge)
// об изменениях корзины на любой странице.
export const CART_UPDATED_EVENT = "cart:updated";

export const notifyCartUpdated = (): void => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
};

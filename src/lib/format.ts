import type { ICategory } from "@/types/store";

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const formatPrice = (value: number): string => usdFormatter.format(value);

const DEFAULT_CATEGORY_LABEL = "без категории";

export const formatCategoryName = (category?: ICategory): string => {
  const name = category?.name?.trim();
  return name ? name : DEFAULT_CATEGORY_LABEL;
};

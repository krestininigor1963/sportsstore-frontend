import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sports Store — каталог и заказы",
  description: "Фронтенд для API Sports Store: каталог товаров, корзина и оформление заказов",
};

// Корневой layout — только каркас документа.
// Магазинный NavBar/футер живут в route group (store),
// а админка имеет собственный полноэкранный каркас (app/admin/layout.tsx).
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

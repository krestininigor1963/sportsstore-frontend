import type { Metadata } from "next";
import Link from "next/link";
import AdminLogoutButton from "./components/AdminLogoutButton";

export const metadata: Metadata = {
  title: "Sports Store — администрирование",
  description: "Админ-панель: управление товарами и заказами",
};

// Полноэкранный каркас админки: собственный навбар и футер.
// Магазинный NavBar/футер (route group (store)) сюда не попадают.
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-inner">
          <Link href="/admin" className="admin-brand-link">
            <span className="admin-brand">⚙️ Sports Store Admin</span>
          </Link>

          <nav className="admin-links">
            <Link href="/admin/products">Товары</Link>
            <Link href="/admin/orders">Заказы</Link>
          </nav>
          <Link href="/" className="admin-back">
            ← Магазин
          </Link>
          <AdminLogoutButton />
        </div>
      </header>
      <main className="admin-main">{children}</main>
      <footer className="admin-footer">Админ-панель Sports Store</footer>
    </div>
  );
}

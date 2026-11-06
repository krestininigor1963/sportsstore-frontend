import Link from "next/link";
import CartBadge from "./CartBadge";

export default function NavBar() {
  return (
    <header className="nabar">
      <div className="container navbar-inner">
        <Link href="/" className="navbar-brand">
          ⚽ Sports Store
        </Link>
        <nav className="navbar-links">
          <Link href="/">Каталог</Link>
          <Link href="/cart">Корзина</Link>
          <Link href="/checkout">Оформление</Link>
        </nav>
        <CartBadge />
      </div>
    </header>
  );
}

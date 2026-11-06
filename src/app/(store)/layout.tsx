import Navbar from "@/components/NavBar";

// Route group (store): оборачивает только клиентскую часть магазина
// (/, /cart, /checkout) — NavBar и футер магазина не попадают в /admin.
export default function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <div className="container">{children}</div>
      <footer className="footer">Sports Store — Next.js frontend + Express API (localhost:5000)</footer>
    </>
  );
}

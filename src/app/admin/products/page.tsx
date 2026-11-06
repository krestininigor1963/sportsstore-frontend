import AdminAuthGuard from "../components/AdminAuthGuard";
import AdminCatalog from "../components/AdminCatalog";

export default function AdminCatalogPage() {
  return (
    <AdminAuthGuard>
      <AdminCatalog />
    </AdminAuthGuard>
  );
}

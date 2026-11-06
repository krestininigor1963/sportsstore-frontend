import AdminAuthGuard from "../../components/AdminAuthGuard";
import ProductCreateForm from "../../components/ProductCreateForm";

export default function AdminProductCreatePage() {
  return (
    <AdminAuthGuard>
      <ProductCreateForm />
    </AdminAuthGuard>
  );
}

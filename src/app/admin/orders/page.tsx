import AdminAuthGuard from "../components/AdminAuthGuard";
import AdminOrders from "../components/AdminOrders";

export default function OrdersPage() {
  return (
    <AdminAuthGuard>
      <AdminOrders />
    </AdminAuthGuard>
  );
}

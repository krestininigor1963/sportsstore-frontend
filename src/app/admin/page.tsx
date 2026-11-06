import AdminAuthGuard from "./components/AdminAuthGuard";
import AdminDashboard from "./components/AdminDashboard";

export default function DashboardPage() {
  return (
    <AdminAuthGuard>
      <AdminDashboard />
    </AdminAuthGuard>
  );
}

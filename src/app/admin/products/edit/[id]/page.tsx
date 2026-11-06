"use client";

import AdminAuthGuard from "../../../components/AdminAuthGuard";
import ProductEditForm from "../../../components/ProductEditForm";

export default function AdminProductDel() {
  return (
    <AdminAuthGuard>
      <ProductEditForm />
    </AdminAuthGuard>
  );
}

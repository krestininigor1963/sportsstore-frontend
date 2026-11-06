"use client";

import AdminAuthGuard from "../../../components/AdminAuthGuard";
import ProductDelForm from "../../../components/ProductDelForm";

export default function AdminProductDel() {
  return (
    <AdminAuthGuard>
      <ProductDelForm />
    </AdminAuthGuard>
  );
}

"use client";

import React from "react";
import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { fetchCheckoutDetail } from "@/lib/api";

interface SuccessDetail {
  id: string;
  pageSize: number | "all";
}

export default function CheckoutSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [detail, setDetail] = useState<SuccessDetail | null>(null);

  useEffect(() => {
    let ignore = false;
    fetchCheckoutDetail(id)
      .then((data) => {
        if (ignore) return;
        setDetail({ id: data.id, pageSize: data.pageSize });
      })
      .catch(() => {
        if (ignore) return;
        setDetail({ id, pageSize: 3 });
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  return (
    <div className="success-panel">
      <div className="success-icon">✅</div>
      <h1>Заказ успешно оформлен!</h1>
      <p>Номер вашего заказа:</p>
      <p className="order-id">#{id}</p>
      <p className="muted small">
        {detail ? `Размер страницы каталога: ${detail.pageSize === "all" ? "все товары" : detail.pageSize}` : "\u00A0"}
      </p>
      <Link href="/" className="btn btn-primary">
        Вернуться в каталог
      </Link>
    </div>
  );
}

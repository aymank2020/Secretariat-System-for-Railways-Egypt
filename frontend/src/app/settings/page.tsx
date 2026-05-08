"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, [router]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#1a365d] dark:text-white">
        الإعدادات
      </h1>
      <p className="text-gray-500 mt-2">صفحة الإعدادات (قيد الإنشاء)</p>
    </div>
  );
}

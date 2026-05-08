"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getStatistics,
  getWaridList,
  getSadirList,
  isAuthenticated,
  type Statistics,
  type WaridRecord,
  type SadirRecord,
} from "@/lib/api";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [recent, setRecent] = useState<(WaridRecord | SadirRecord)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [s, warids, sadirs] = await Promise.all([
        getStatistics(),
        getWaridList({ limit: "5" }),
        getSadirList({ limit: "5" }),
      ]);
      setStats(s);
      // Merge and sort by created_at
      const merged = [
        ...warids,
        ...sadirs,
      ].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRecent(merged.slice(0, 5));
    } catch (err) {
      console.error("Failed to load dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#1a365d] text-xl">جاري التحميل...</div>
      </div>
    );
  }

  const cards = [
    {
      label: "إجمالي الوارد",
      value: stats?.warid_count ?? 0,
      icon: "📨",
      color: "bg-blue-100 dark:bg-blue-900",
    },
    {
      label: "إجمالي الصادر",
      value: stats?.sadir_count ?? 0,
      icon: "📤",
      color: "bg-amber-100 dark:bg-amber-900",
    },
    {
      label: "متابعات معلقة",
      value: stats?.pending_followups ?? 0,
      icon: "⏳",
      color: "bg-red-100 dark:bg-red-900",
    },
    {
      label: "هذا الشهر",
      value: (stats?.monthly_counts.warid ?? 0) + (stats?.monthly_counts.sadir ?? 0),
      icon: "📅",
      color: "bg-green-100 dark:bg-green-900",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a365d] dark:text-white">
            لوحة التحكم
          </h1>
          <p className="text-gray-500 text-sm">نظام إدارة المراسلات</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/warid?action=create")}
            className="btn-gold"
          >
            + وارد جديد
          </button>
          <button
            onClick={() => router.push("/sadir?action=create")}
            className="btn-primary"
          >
            + صادر جديد
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`card flex items-center gap-4 ${card.color}`}
          >
            <span className="text-4xl">{card.icon}</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {card.label}
              </p>
              <p className="text-3xl font-bold text-[#1a365d] dark:text-white">
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-bold text-[#1a365d] dark:text-white mb-4">
          آخر النشاطات
        </h2>
        {recent.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            لا توجد مراسلات بعد
          </p>
        ) : (
          <div className="space-y-3">
            {recent.map((item, idx) => (
              <div
                key={`item-${idx}`}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {"destination_administration" in item ? "📤" : "📨"}
                  </span>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {item.subject}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.qaid_number} —{" "}
                      {"source_administration" in item
                        ? (item as WaridRecord).source_administration
                        : ""}
                      {"destination_administration" in item
                        ? (item as SadirRecord).destination_administration
                        : ""}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(item.created_at).toLocaleDateString("ar-EG")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

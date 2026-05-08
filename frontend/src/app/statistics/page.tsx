"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isAuthenticated,
  getStatistics,
  getWaridList,
  getSadirList,
  type Statistics,
  type WaridRecord,
  type SadirRecord,
} from "@/lib/api";

const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export default function StatisticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [warids, setWarids] = useState<WaridRecord[]>([]);
  const [sadirs, setSadirRecord] = useState<SadirRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [s, w, sa] = await Promise.all([
        getStatistics(),
        getWaridList({ limit: "10000" }),
        getSadirList({ limit: "10000" }),
      ]);
      setStats(s);
      setWarids(w);
      setSadirRecord(sa);
    } catch { /* */ } finally { setLoading(false); }
  };

  if (loading) return <div className="p-6 text-center text-gray-400">جاري التحميل...</div>;

  // Monthly data for chart
  const now = new Date();
  const monthlyData: { month: string; warid: number; sadir: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = MONTHS[d.getMonth()];
    monthlyData.push({
      month: monthLabel,
      warid: warids.filter((w) => w.created_at?.startsWith(monthKey)).length,
      sadir: sadirs.filter((s) => s.created_at?.startsWith(monthKey)).length,
    });
  }

  const maxMonthly = Math.max(...monthlyData.map((m) => Math.max(m.warid, m.sadir)), 1);

  // Classification counts
  const ministryCount = warids.filter((w) => w.is_ministry).length;
  const authorityCount = warids.filter((w) => w.is_authority).length;
  const otherCount = warids.filter((w) => w.is_other).length;
  const totalClassified = ministryCount + authorityCount + otherCount || 1;

  // Followup status
  const waitingWarids = warids.filter((w) => w.needs_followup && w.followup_status === "waiting_reply").length;
  const completedWarids = warids.filter((w) => w.needs_followup && w.followup_status === "completed").length;
  const waitingSadirs = sadirs.filter((s) => s.needs_followup && s.followup_status === "waiting_reply").length;
  const completedSadirs = sadirs.filter((s) => s.needs_followup && s.followup_status === "completed").length;
  const totalFollowup = waitingWarids + completedWarids + waitingSadirs + completedSadirs || 1;

  const cards = [
    { label: "إجمالي الوارد", value: stats?.warid_count ?? 0, icon: "📨", color: "from-blue-500 to-blue-600" },
    { label: "إجمالي الصادر", value: stats?.sadir_count ?? 0, icon: "📤", color: "from-amber-500 to-amber-600" },
    { label: "متابعات معلقة", value: stats?.pending_followups ?? 0, icon: "⏳", color: "from-red-500 to-red-600" },
    { label: "هذا الشهر", value: (stats?.monthly_counts.warid ?? 0) + (stats?.monthly_counts.sadir ?? 0), icon: "📅", color: "from-green-500 to-green-600" },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[#1a365d] dark:text-white">الإحصائيات والتقارير</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`bg-gradient-to-br ${c.color} rounded-xl p-5 text-white shadow-lg`}>
            <div className="text-3xl mb-2">{c.icon}</div>
            <p className="text-white/80 text-sm">{c.label}</p>
            <p className="text-3xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly Bar Chart */}
      <div className="card">
        <h2 className="text-lg font-bold text-[#1a365d] dark:text-white mb-4">المراسلات الشهرية</h2>
        <div className="space-y-3">
          {monthlyData.map((m) => (
            <div key={m.month}>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{m.month}</span>
                <span>وارد: {m.warid} | صادر: {m.sadir}</span>
              </div>
              <div className="flex gap-1 h-6 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                <div className="bg-blue-500 transition-all" style={{ width: `${(m.warid / maxMonthly) * 100}%` }} title={`وارد: ${m.warid}`} />
                <div className="bg-amber-500 transition-all" style={{ width: `${(m.sadir / maxMonthly) * 100}%` }} title={`صادر: ${m.sadir}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" /> وارد</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500" /> صادر</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Classification pie (CSS) */}
        <div className="card">
          <h2 className="text-lg font-bold text-[#1a365d] dark:text-white mb-4">تصنيف الجهات (الوارد)</h2>
          <div className="space-y-3">
            <BarRow label="وزارة" count={ministryCount} total={totalClassified} color="bg-blue-500" />
            <BarRow label="هيئة" count={authorityCount} total={totalClassified} color="bg-green-500" />
            <BarRow label="أخرى" count={otherCount} total={totalClassified} color="bg-purple-500" />
          </div>
        </div>

        {/* Follow-up status */}
        <div className="card">
          <h2 className="text-lg font-bold text-[#1a365d] dark:text-white mb-4">حالة المتابعة</h2>
          <div className="space-y-3">
            <BarRow label="بانتظار الرد" count={waitingWarids + waitingSadirs} total={totalFollowup} color="bg-yellow-500" />
            <BarRow label="مكتمل" count={completedWarids + completedSadirs} total={totalFollowup} color="bg-green-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BarRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-500">{count} ({pct}%)</span>
      </div>
      <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
        <div className={`h-full ${color} rounded transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

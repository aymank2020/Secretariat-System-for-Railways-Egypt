"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isAuthenticated,
  getDeletedRecords,
  restoreDeleted,
  type DeletedRecord,
} from "@/lib/api";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function DeletedPage() {
  const router = useRouter();
  const [records, setRecords] = useState<DeletedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [restoreTarget, setRestoreTarget] = useState<number | null>(null);
  const [viewPayload, setViewPayload] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
  }, []);

  const loadData = async () => {
    try { setRecords(await getDeletedRecords(filter || undefined)); }
    catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [filter]);

  const handleRestore = async () => {
    if (restoreTarget === null) return;
    try {
      await restoreDeleted(restoreTarget);
      setRestoreTarget(null);
      loadData();
    } catch { /* */ }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a365d] dark:text-white">المحذوفات</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input w-48">
          <option value="">جميع الأنواع</option>
          <option value="warid">وارد</option>
          <option value="sadir">صادر</option>
        </select>
      </div>

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <th className="p-3 text-right">#</th>
              <th className="p-3 text-right">النوع</th>
              <th className="p-3 text-right">الرقم الأصلي</th>
              <th className="p-3 text-right">تاريخ الحذف</th>
              <th className="p-3 text-right">تم بواسطة</th>
              <th className="p-3 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">جاري التحميل...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">لا توجد سجلات محذوفة</td></tr>
            ) : records.map((r) => (
              <tr key={r.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-3 font-medium">{r.id}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.document_type === "warid" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>{r.document_type === "warid" ? "وارد" : "صادر"}</span></td>
                <td className="p-3">{r.original_record_id}</td>
                <td className="p-3 text-gray-500">{r.deleted_at ? new Date(r.deleted_at).toLocaleString("ar-EG") : "-"}</td>
                <td className="p-3">{r.deleted_by_name || "-"}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => setRestoreTarget(r.id)} className="text-green-600 hover:text-green-800 text-xs font-medium">استعادة</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog open={restoreTarget !== null} onConfirm={handleRestore} onCancel={() => setRestoreTarget(null)}
        title="استعادة السجل" message="هل أنت متأكد من استعادة هذا السجل؟" confirmText="استعادة" />
    </div>
  );
}

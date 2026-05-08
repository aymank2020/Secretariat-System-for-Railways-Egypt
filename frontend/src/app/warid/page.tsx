"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  isAuthenticated,
  getWaridList,
  deleteWarid,
  batchDeleteWarid,
  createWarid,
  type WaridRecord,
} from "@/lib/api";
import ConfirmDialog from "@/components/ConfirmDialog";

const PAGE_SIZE = 20;

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  waiting_reply: { label: "بانتظار الرد", color: "bg-yellow-100 text-yellow-800" },
  completed: { label: "مكتمل", color: "bg-green-100 text-green-800" },
  in_progress: { label: "قيد المتابعة", color: "bg-blue-100 text-blue-800" },
};

export default function WaridPageWrapper() {
  return <Suspense><WaridPageInner /></Suspense>;
}

function WaridPageInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const [records, setRecords] = useState<WaridRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [batchMode, setBatchMode] = useState(false);

  // Filters
  const [fSubject, setFSubject] = useState(sp.get("subject") || "");
  const [fSource, setFSource] = useState(sp.get("source") || "");
  const [fDateFrom, setFDateFrom] = useState(sp.get("date_from") || "");
  const [fDateTo, setFDateTo] = useState(sp.get("date_to") || "");
  const [fFollowup, setFFollowup] = useState(sp.get("followup_status") || "");

  const [createdMsg, setCreatedMsg] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    if (sp.get("action") === "create") setCreatedMsg("تم إنشاء الوارد بنجاح ✓");
    loadData();
  }, [page, sp]);

  const buildFilters = useCallback(() => {
    const f: Record<string, string> = { limit: String(PAGE_SIZE), skip: String(page * PAGE_SIZE) };
    if (fSubject) f.subject = fSubject;
    if (fSource) f.source_administration = fSource;
    if (fDateFrom) f.date_from = fDateFrom;
    if (fDateTo) f.date_to = fDateTo;
    if (fFollowup) f.followup_status = fFollowup;
    return f;
  }, [page, fSubject, fSource, fDateFrom, fDateTo, fFollowup]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getWaridList(buildFilters());
      setRecords(data);
    } catch { /* */ } finally { setLoading(false); }
  };

  // Refs for initial load
  const loaded = useRef(false);
  useEffect(() => {
    if (!loaded.current) { loaded.current = true; return; }
    loadData();
  }, [fSubject, fSource, fDateFrom, fDateTo, fFollowup]);

  const handleDelete = async () => {
    if (deleteTarget === null) return;
    try {
      await deleteWarid(deleteTarget);
      setDeleteTarget(null);
      loadData();
    } catch { /* */ }
  };

  const handleBatchDelete = async () => {
    if (selected.size === 0) return;
    try {
      await batchDeleteWarid(Array.from(selected));
      setSelected(new Set());
      setBatchMode(false);
      loadData();
    } catch { /* */ }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === records.length) setSelected(new Set());
    else setSelected(new Set(records.map((r) => r.id)));
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a365d] dark:text-white">المراسلات الواردة</h1>
          <p className="text-gray-500 text-sm">إدارة وعرض جميع المراسلات الواردة</p>
        </div>
        <button onClick={() => router.push("/warid/new")} className="btn-gold">+ وارد جديد</button>
      </div>

      {createdMsg && <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-3 rounded-lg text-sm">{createdMsg}</div>}

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input placeholder="رقم القيد أو الموضوع" value={fSubject} onChange={(e) => setFSubject(e.target.value)} className="input" />
          <input placeholder="جهة الوارد" value={fSource} onChange={(e) => setFSource(e.target.value)} className="input" />
          <input type="date" value={fDateFrom} onChange={(e) => setFDateFrom(e.target.value)} className="input" />
          <input type="date" value={fDateTo} onChange={(e) => setFDateTo(e.target.value)} className="input" />
          <select value={fFollowup} onChange={(e) => setFFollowup(e.target.value)} className="input">
            <option value="">كل المتابعات</option>
            <option value="waiting_reply">بانتظار الرد</option>
            <option value="completed">مكتمل</option>
            <option value="in_progress">قيد المتابعة</option>
          </select>
        </div>
      </div>

      {/* Batch actions */}
      {selected.size > 0 && (
        <div className="bg-[#1a365d] text-white p-3 rounded-lg flex items-center justify-between">
          <span>تم اختيار {selected.size} سجل</span>
          <button onClick={handleBatchDelete} className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded">حذف المحدد</button>
        </div>
      )}

      {/* Table */}
      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <th className="p-3 text-right"><input type="checkbox" onChange={toggleAll} checked={selected.size === records.length && records.length > 0} /></th>
              <th className="p-3 text-right">رقم القيد</th>
              <th className="p-3 text-right">تاريخ القيد</th>
              <th className="p-3 text-right">جهة الوارد</th>
              <th className="p-3 text-right">الموضوع</th>
              <th className="p-3 text-right">المرفقات</th>
              <th className="p-3 text-right">حالة المتابعة</th>
              <th className="p-3 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-8 text-center text-gray-400">جاري التحميل...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-gray-400">لا توجد مراسلات</td></tr>
            ) : records.map((r) => {
              const st = STATUS_MAP[r.followup_status] || STATUS_MAP.waiting_reply;
              return (
                <tr key={r.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-3"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} /></td>
                  <td className="p-3 font-medium">{r.qaid_number}</td>
                  <td className="p-3 text-gray-500">{r.qaid_date ? new Date(r.qaid_date).toLocaleDateString("ar-EG") : "-"}</td>
                  <td className="p-3">{r.source_administration}</td>
                  <td className="p-3 max-w-[200px] truncate">{r.subject}</td>
                  <td className="p-3 text-center">{Number(r.attachment_count ?? 0)}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span></td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => router.push(`/warid/new?edit=${r.id}`)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">تعديل</button>
                      <button onClick={() => setDeleteTarget(r.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">حذف</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-3">
        <button disabled={page === 0} onClick={() => setPage(page - 1)} className="btn-primary !py-1 !px-3 disabled:opacity-30">السابق</button>
        <span className="text-sm text-gray-600 dark:text-gray-400">صفحة {page + 1}</span>
        <button disabled={records.length < PAGE_SIZE} onClick={() => setPage(page + 1)} className="btn-primary !py-1 !px-3 disabled:opacity-30">التالي</button>
      </div>

      <ConfirmDialog open={deleteTarget !== null} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)}
        title="حذف المراسلة" message="هل أنت متأكد من حذف هذه المراسلة؟ يمكن استعادتها لاحقًا من المحذوفات." confirmText="حذف" danger />
    </div>
  );
}

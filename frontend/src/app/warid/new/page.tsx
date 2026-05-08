"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  isAuthenticated,
  createWarid,
  getWaridById,
  updateWarid,
} from "@/lib/api";

interface FormData {
  qaid_number: string; qaid_date: string; source_administration: string;
  letter_number: string; letter_date: string;
  chairman_incoming_number: string; chairman_incoming_date: string;
  chairman_return_number: string; chairman_return_date: string;
  subject: string; notes: string; attachment_count: number;
  is_ministry: boolean; is_authority: boolean; is_other: boolean; other_details: string;
  recipient1_name: string; recipient1_delivery_date: string;
  recipient2_name: string; recipient2_delivery_date: string;
  recipient3_name: string; recipient3_delivery_date: string;
  needs_followup: boolean; followup_notes: string; followup_status: string;
}

const EMPTY: FormData = {
  qaid_number: "", qaid_date: "", source_administration: "",
  letter_number: "", letter_date: "",
  chairman_incoming_number: "", chairman_incoming_date: "",
  chairman_return_number: "", chairman_return_date: "",
  subject: "", notes: "", attachment_count: 0,
  is_ministry: false, is_authority: false, is_other: false, other_details: "",
  recipient1_name: "", recipient1_delivery_date: "",
  recipient2_name: "", recipient2_delivery_date: "",
  recipient3_name: "", recipient3_delivery_date: "",
  needs_followup: false, followup_notes: "", followup_status: "waiting_reply",
};

export default function WaridFormWrapper() {
  return <Suspense><WaridForm /></Suspense>;
}

function WaridForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const editId = sp.get("edit");
  const isEdit = !!editId;

  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    if (editId) loadEdit(parseInt(editId));
  }, [editId]);

  const loadEdit = async (id: number) => {
    try {
      const data = (await getWaridById(id)) as Record<string,unknown>;
      const s = (v: unknown) => (v ? String(v).slice(0, 10) : "");
      setForm({
        qaid_number: String(data.qaid_number || ""),
        qaid_date: s(data.qaid_date),
        source_administration: String(data.source_administration || ""),
        letter_number: String(data.letter_number || ""),
        letter_date: s(data.letter_date),
        chairman_incoming_number: String(data.chairman_incoming_number || ""),
        chairman_incoming_date: s(data.chairman_incoming_date),
        chairman_return_number: String(data.chairman_return_number || ""),
        chairman_return_date: s(data.chairman_return_date),
        subject: String(data.subject || ""),
        notes: String(data.notes || ""),
        attachment_count: Number(data.attachment_count || 0),
        is_ministry: Boolean(data.is_ministry),
        is_authority: Boolean(data.is_authority),
        is_other: Boolean(data.is_other),
        other_details: String(data.other_details || ""),
        recipient1_name: String(data.recipient1_name || ""),
        recipient1_delivery_date: s(data.recipient1_delivery_date),
        recipient2_name: String(data.recipient2_name || ""),
        recipient2_delivery_date: s(data.recipient2_delivery_date),
        recipient3_name: String(data.recipient3_name || ""),
        recipient3_delivery_date: s(data.recipient3_delivery_date),
        needs_followup: Boolean(data.needs_followup),
        followup_notes: String(data.followup_notes || ""),
        followup_status: String(data.followup_status || "waiting_reply"),
      });
    } catch { setError("فشل تحميل بيانات المراسلة"); }
  };

  const update = (field: keyof FormData, value: unknown) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload: Record<string, unknown> = {
      ...form,
      qaid_date: form.qaid_date ? `${form.qaid_date}T00:00:00` : null,
      letter_date: form.letter_date ? `${form.letter_date}T00:00:00` : null,
      chairman_incoming_date: form.chairman_incoming_date ? `${form.chairman_incoming_date}T00:00:00` : null,
      chairman_return_date: form.chairman_return_date ? `${form.chairman_return_date}T00:00:00` : null,
      recipient1_delivery_date: form.recipient1_delivery_date ? `${form.recipient1_delivery_date}T00:00:00` : null,
      recipient2_delivery_date: form.recipient2_delivery_date ? `${form.recipient2_delivery_date}T00:00:00` : null,
      recipient3_delivery_date: form.recipient3_delivery_date ? `${form.recipient3_delivery_date}T00:00:00` : null,
    };
    // Clean empty strings
    for (const k of Object.keys(payload)) {
      if (payload[k] === "") payload[k] = null;
    }

    try {
      if (isEdit) {
        await updateWarid(parseInt(editId!), payload);
        router.push("/warid");
      } else {
        await createWarid(payload);
        router.push("/warid?action=create");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="card">
      <h3 className="text-md font-bold text-[#1a365d] dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">{title}</h3>
      {children}
    </div>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a365d] dark:text-white">{isEdit ? "تعديل وارد" : "وارد جديد"}</h1>
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">رجوع</button>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section 1: Qaid */}
        <Section title="بيانات القيد">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="رقم القيد *"><input required value={form.qaid_number} onChange={(e) => update("qaid_number", e.target.value)} className="input" /></Field>
            <Field label="تاريخ القيد *"><input required type="date" value={form.qaid_date} onChange={(e) => update("qaid_date", e.target.value)} className="input" /></Field>
            <Field label="جهة الوارد *"><input required value={form.source_administration} onChange={(e) => update("source_administration", e.target.value)} className="input" /></Field>
          </div>
        </Section>

        {/* Section 2: Letter */}
        <Section title="بيانات الكتاب">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="رقم الكتاب"><input value={form.letter_number} onChange={(e) => update("letter_number", e.target.value)} className="input" /></Field>
            <Field label="تاريخ الكتاب"><input type="date" value={form.letter_date} onChange={(e) => update("letter_date", e.target.value)} className="input" /></Field>
          </div>
        </Section>

        {/* Section 3: Chairman */}
        <Section title="بيانات رئيس مجلس الإدارة">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="رقم الوارد رئيس المجلس"><input value={form.chairman_incoming_number} onChange={(e) => update("chairman_incoming_number", e.target.value)} className="input" /></Field>
            <Field label="تاريخ الوارد رئيس المجلس"><input type="date" value={form.chairman_incoming_date} onChange={(e) => update("chairman_incoming_date", e.target.value)} className="input" /></Field>
            <Field label="رقم العودة من رئيس المجلس"><input value={form.chairman_return_number} onChange={(e) => update("chairman_return_number", e.target.value)} className="input" /></Field>
            <Field label="تاريخ العودة من رئيس المجلس"><input type="date" value={form.chairman_return_date} onChange={(e) => update("chairman_return_date", e.target.value)} className="input" /></Field>
          </div>
        </Section>

        {/* Section 4: Subject */}
        <Section title="الموضوع والملاحظات">
          <div className="grid grid-cols-1 gap-4">
            <Field label="الموضوع *"><textarea required rows={3} value={form.subject} onChange={(e) => update("subject", e.target.value)} className="input" /></Field>
            <Field label="ملاحظات"><textarea rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} className="input" /></Field>
            <Field label="عدد المرفقات"><input type="number" min={0} value={form.attachment_count} onChange={(e) => update("attachment_count", parseInt(e.target.value) || 0)} className="input w-32" /></Field>
          </div>
        </Section>

        {/* Section 5: Classification */}
        <Section title="تصنيف الجهة">
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_ministry} onChange={(e) => update("is_ministry", e.target.checked)} className="w-4 h-4" /> وزارة</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_authority} onChange={(e) => update("is_authority", e.target.checked)} className="w-4 h-4" /> هيئة</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_other} onChange={(e) => update("is_other", e.target.checked)} className="w-4 h-4" /> أخرى</label>
          </div>
          {form.is_other && (
            <input placeholder="تفاصيل أخرى" value={form.other_details} onChange={(e) => update("other_details", e.target.value)} className="input mt-3" />
          )}
        </Section>

        {/* Section 6: Recipients */}
        <Section title="المستلمون">
          {[1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <Field label={`المستلم ${i}`}><input value={form[`recipient${i}_name` as keyof FormData] as string} onChange={(e) => { const k = `recipient${i}_name` as keyof FormData; update(k, e.target.value); }} className="input" /></Field>
              <Field label={`تاريخ التسليم ${i}`}><input type="date" value={form[`recipient${i}_delivery_date` as keyof FormData] as string} onChange={(e) => { const k = `recipient${i}_delivery_date` as keyof FormData; update(k, e.target.value); }} className="input" /></Field>
            </div>
          ))}
        </Section>

        {/* Section 8: Follow-up */}
        <Section title="المتابعة">
          <label className="flex items-center gap-2 mb-3">
            <input type="checkbox" checked={form.needs_followup} onChange={(e) => update("needs_followup", e.target.checked)} className="w-4 h-4" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">يحتاج متابعة</span>
          </label>
          {form.needs_followup && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="ملاحظات المتابعة"><textarea rows={2} value={form.followup_notes} onChange={(e) => update("followup_notes", e.target.value)} className="input" /></Field>
              <Field label="حالة المتابعة">
                <select value={form.followup_status} onChange={(e) => update("followup_status", e.target.value)} className="input">
                  <option value="waiting_reply">بانتظار الرد</option>
                  <option value="in_progress">قيد المتابعة</option>
                  <option value="completed">مكتمل</option>
                </select>
              </Field>
            </div>
          )}
        </Section>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">إلغاء</button>
          <button type="submit" disabled={loading} className="btn-gold px-8 disabled:opacity-50">
            {loading ? "جاري الحفظ..." : isEdit ? "تحديث" : "حفظ"}
          </button>
        </div>
      </form>
    </div>
  );
}

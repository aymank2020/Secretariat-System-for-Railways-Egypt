"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  isAuthenticated,
  createSadir,
  getSadirById,
  updateSadir,
} from "@/lib/api";

interface FormData {
  qaid_number: string; qaid_date: string; destination_administration: string;
  letter_number: string; letter_date: string;
  chairman_incoming_number: string; chairman_incoming_date: string;
  chairman_return_number: string; chairman_return_date: string;
  subject: string; notes: string; attachment_count: number;
  is_ministry: boolean; is_authority: boolean; is_other: boolean; other_details: string;
  sent_to1_name: string; sent_to1_delivery_date: string;
  sent_to2_name: string; sent_to2_delivery_date: string;
  sent_to3_name: string; sent_to3_delivery_date: string;
  needs_followup: boolean; followup_notes: string; followup_status: string;
  signature_status: string; signature_date: string;
}

const EMPTY: FormData = {
  qaid_number: "", qaid_date: "", destination_administration: "",
  letter_number: "", letter_date: "",
  chairman_incoming_number: "", chairman_incoming_date: "",
  chairman_return_number: "", chairman_return_date: "",
  subject: "", notes: "", attachment_count: 0,
  is_ministry: false, is_authority: false, is_other: false, other_details: "",
  sent_to1_name: "", sent_to1_delivery_date: "",
  sent_to2_name: "", sent_to2_delivery_date: "",
  sent_to3_name: "", sent_to3_delivery_date: "",
  needs_followup: false, followup_notes: "", followup_status: "waiting_reply",
  signature_status: "pending", signature_date: "",
};

export default function SadirFormWrapper() {
  return <Suspense><SadirForm /></Suspense>;
}

function SadirForm() {
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
      const data = (await getSadirById(id)) as Record<string,unknown>;
      const s = (v: unknown) => (v ? String(v).slice(0, 10) : "");
      setForm({
        qaid_number: String(data.qaid_number || ""),
        qaid_date: s(data.qaid_date),
        destination_administration: String(data.destination_administration || ""),
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
        sent_to1_name: String(data.sent_to1_name || ""),
        sent_to1_delivery_date: s(data.sent_to1_delivery_date),
        sent_to2_name: String(data.sent_to2_name || ""),
        sent_to2_delivery_date: s(data.sent_to2_delivery_date),
        sent_to3_name: String(data.sent_to3_name || ""),
        sent_to3_delivery_date: s(data.sent_to3_delivery_date),
        needs_followup: Boolean(data.needs_followup),
        followup_notes: String(data.followup_notes || ""),
        followup_status: String(data.followup_status || "waiting_reply"),
        signature_status: String(data.signature_status || "pending"),
        signature_date: s(data.signature_date),
      });
    } catch { setError("فشل تحميل البيانات"); }
  };

  const update = (field: keyof FormData, value: unknown) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");

    const payload: Record<string, unknown> = {
      ...form,
      qaid_date: form.qaid_date ? `${form.qaid_date}T00:00:00` : null,
      letter_date: form.letter_date ? `${form.letter_date}T00:00:00` : null,
      chairman_incoming_date: form.chairman_incoming_date ? `${form.chairman_incoming_date}T00:00:00` : null,
      chairman_return_date: form.chairman_return_date ? `${form.chairman_return_date}T00:00:00` : null,
      sent_to1_delivery_date: form.sent_to1_delivery_date ? `${form.sent_to1_delivery_date}T00:00:00` : null,
      sent_to2_delivery_date: form.sent_to2_delivery_date ? `${form.sent_to2_delivery_date}T00:00:00` : null,
      sent_to3_delivery_date: form.sent_to3_delivery_date ? `${form.sent_to3_delivery_date}T00:00:00` : null,
      signature_date: form.signature_date ? `${form.signature_date}T00:00:00` : null,
    };
    for (const k of Object.keys(payload)) { if (payload[k] === "") payload[k] = null; }

    try {
      if (isEdit) { await updateSadir(parseInt(editId!), payload); router.push("/sadir"); }
      else { await createSadir(payload); router.push("/sadir"); }
    } catch (err) { setError(err instanceof Error ? err.message : "حدث خطأ"); }
    finally { setLoading(false); }
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="card"><h3 className="text-md font-bold text-[#1a365d] dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">{title}</h3>{children}</div>
  );
  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1"><label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>{children}</div>
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a365d] dark:text-white">{isEdit ? "تعديل صادر" : "صادر جديد"}</h1>
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">رجوع</button>
      </div>
      {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Section title="بيانات القيد">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="رقم القيد *"><input required value={form.qaid_number} onChange={(e) => update("qaid_number", e.target.value)} className="input" /></Field>
            <Field label="تاريخ القيد *"><input required type="date" value={form.qaid_date} onChange={(e) => update("qaid_date", e.target.value)} className="input" /></Field>
            <Field label="جهة الصادر"><input value={form.destination_administration} onChange={(e) => update("destination_administration", e.target.value)} className="input" /></Field>
          </div>
        </Section>

        <Section title="بيانات الكتاب">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="رقم الكتاب"><input value={form.letter_number} onChange={(e) => update("letter_number", e.target.value)} className="input" /></Field>
            <Field label="تاريخ الكتاب"><input type="date" value={form.letter_date} onChange={(e) => update("letter_date", e.target.value)} className="input" /></Field>
          </div>
        </Section>

        <Section title="بيانات رئيس مجلس الإدارة">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="رقم الوارد رئيس المجلس"><input value={form.chairman_incoming_number} onChange={(e) => update("chairman_incoming_number", e.target.value)} className="input" /></Field>
            <Field label="تاريخ الوارد رئيس المجلس"><input type="date" value={form.chairman_incoming_date} onChange={(e) => update("chairman_incoming_date", e.target.value)} className="input" /></Field>
            <Field label="رقم العودة من رئيس المجلس"><input value={form.chairman_return_number} onChange={(e) => update("chairman_return_number", e.target.value)} className="input" /></Field>
            <Field label="تاريخ العودة من رئيس المجلس"><input type="date" value={form.chairman_return_date} onChange={(e) => update("chairman_return_date", e.target.value)} className="input" /></Field>
          </div>
        </Section>

        <Section title="الموضوع والملاحظات">
          <div className="grid grid-cols-1 gap-4">
            <Field label="الموضوع *"><textarea required rows={3} value={form.subject} onChange={(e) => update("subject", e.target.value)} className="input" /></Field>
            <Field label="ملاحظات"><textarea rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} className="input" /></Field>
            <Field label="عدد المرفقات"><input type="number" min={0} value={form.attachment_count} onChange={(e) => update("attachment_count", parseInt(e.target.value) || 0)} className="input w-32" /></Field>
          </div>
        </Section>

        <Section title="تصنيف الجهة">
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_ministry} onChange={(e) => update("is_ministry", e.target.checked)} /> وزارة</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_authority} onChange={(e) => update("is_authority", e.target.checked)} /> هيئة</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_other} onChange={(e) => update("is_other", e.target.checked)} /> أخرى</label>
          </div>
          {form.is_other && <input placeholder="تفاصيل أخرى" value={form.other_details} onChange={(e) => update("other_details", e.target.value)} className="input mt-3" />}
        </Section>

        <Section title="المرسل إليهم">
          {[1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <Field label={`المرسل إليه ${i}`}><input value={form[`sent_to${i}_name` as keyof FormData] as string} onChange={(e) => { const k = `sent_to${i}_name` as keyof FormData; update(k, e.target.value); }} className="input" /></Field>
              <Field label={`تاريخ الإرسال ${i}`}><input type="date" value={form[`sent_to${i}_delivery_date` as keyof FormData] as string} onChange={(e) => { const k = `sent_to${i}_delivery_date` as keyof FormData; update(k, e.target.value); }} className="input" /></Field>
            </div>
          ))}
        </Section>

        <Section title="التوقيع">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="حالة التوقيع">
              <select value={form.signature_status} onChange={(e) => update("signature_status", e.target.value)} className="input">
                <option value="pending">بانتظار التوقيع</option>
                <option value="signed">موقع</option>
                <option value="rejected">مرفوض</option>
              </select>
            </Field>
            <Field label="تاريخ التوقيع"><input type="date" value={form.signature_date} onChange={(e) => update("signature_date", e.target.value)} className="input" /></Field>
          </div>
        </Section>

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

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">إلغاء</button>
          <button type="submit" disabled={loading} className="btn-gold px-8 disabled:opacity-50">{loading ? "جاري الحفظ..." : isEdit ? "تحديث" : "حفظ"}</button>
        </div>
      </form>
    </div>
  );
}

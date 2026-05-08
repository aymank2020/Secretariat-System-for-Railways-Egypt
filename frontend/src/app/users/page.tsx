"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isAuthenticated,
  getUsers,
  createUser,
  type UserRecord,
  getToken,
} from "@/lib/api";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800",
  user: "bg-blue-100 text-blue-800",
  viewer: "bg-gray-100 text-gray-800",
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);

  // Form
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formFullName, setFormFullName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("user");
  const [formCanUsers, setFormCanUsers] = useState(false);
  const [formCanWarid, setFormCanWarid] = useState(false);
  const [formCanSadir, setFormCanSadir] = useState(false);
  const [formCanExcel, setFormCanExcel] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try { setUsers(await getUsers()); } catch { /* */ } finally { setLoading(false); }
  };

  const checkAdmin = () => {
    try {
      const payload = JSON.parse(atob(getToken()!.split(".")[1]));
      return payload.role === "admin";
    } catch { return false; }
  };

  const openCreate = () => {
    setEditUser(null);
    setFormUsername(""); setFormPassword(""); setFormFullName(""); setFormEmail("");
    setFormRole("user"); setFormCanUsers(false); setFormCanWarid(true); setFormCanSadir(true); setFormCanExcel(false);
    setFormError(""); setShowModal(true);
  };

  const openEdit = (u: UserRecord) => {
    setEditUser(u);
    setFormUsername(u.username); setFormPassword(""); setFormFullName(u.full_name || "");
    setFormEmail(u.email || ""); setFormRole(u.role); setFormCanUsers(u.can_manage_users);
    setFormCanWarid(u.can_manage_warid); setFormCanSadir(u.can_manage_sadir); setFormCanExcel(u.can_import_excel);
    setFormError(""); setShowModal(true);
  };

  const handleSave = async () => {
    if (!editUser && !formPassword) { setFormError("كلمة المرور مطلوبة"); return; }
    try {
      const data: Record<string, unknown> = {
        username: formUsername, full_name: formFullName, email: formEmail,
        role: formRole, can_manage_users: formCanUsers,
        can_manage_warid: formCanWarid, can_manage_sadir: formCanSadir, can_import_excel: formCanExcel,
      };
      if (formPassword) data.password = formPassword;

      if (editUser) {
        // Update via PUT /users/{id} — need token
        const res = await fetch(`http://localhost:8000/api/users/${editUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error((await res.json()).detail || "فشل التحديث");
      } else {
        data.is_active = true;
        await createUser(data);
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "حدث خطأ");
    }
  };

  const handleToggleActive = async (user: UserRecord) => {
    try {
      await fetch(`http://localhost:8000/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      loadUsers();
    } catch { /* */ }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`http://localhost:8000/api/users/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setDeleteTarget(null);
      loadUsers();
    } catch { /* */ }
  };

  if (!checkAdmin()) {
    return <div className="p-6 text-center text-red-500">عذرًا، هذه الصفحة للمشرفين فقط</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a365d] dark:text-white">المستخدمين</h1>
          <p className="text-gray-500 text-sm">إدارة المستخدمين والصلاحيات</p>
        </div>
        <button onClick={openCreate} className="btn-gold">+ مستخدم جديد</button>
      </div>

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <th className="p-3 text-right">اسم المستخدم</th>
              <th className="p-3 text-right">الاسم الكامل</th>
              <th className="p-3 text-right">البريد</th>
              <th className="p-3 text-right">الدور</th>
              <th className="p-3 text-right">الحالة</th>
              <th className="p-3 text-right">الصلاحيات</th>
              <th className="p-3 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-3 font-medium">{u.username}</td>
                <td className="p-3">{u.full_name || "-"}</td>
                <td className="p-3 text-gray-500">{u.email || "-"}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[u.role] || ROLE_BADGE.user}`}>{u.role === "admin" ? "مدير" : u.role === "user" ? "مستخدم" : "مشاهد"}</span></td>
                <td className="p-3">
                  <button onClick={() => handleToggleActive(u)} className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {u.is_active ? "نشط" : "موقوف"}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex gap-1 flex-wrap">
                    {u.can_manage_warid && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">وارد</span>}
                    {u.can_manage_sadir && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px]">صادر</span>}
                    {u.can_manage_users && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px]">مستخدمين</span>}
                    {u.can_import_excel && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px]">Excel</span>}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(u)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">تعديل</button>
                    <button onClick={() => setDeleteTarget(u)} className="text-red-600 hover:text-red-800 text-xs font-medium">حذف</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editUser ? "تعديل مستخدم" : "مستخدم جديد"}>
        {formError && <div className="bg-red-50 text-red-600 p-2 rounded text-sm mb-3">{formError}</div>}
        <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">اسم المستخدم</label><input value={formUsername} onChange={(e) => setFormUsername(e.target.value)} className="input w-full" /></div>
          <div><label className="block text-sm font-medium mb-1">{editUser ? "كلمة مرور جديدة (اترك فارغًا إن لم ترد التغيير)" : "كلمة المرور *"}</label><input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} className="input w-full" /></div>
          <div><label className="block text-sm font-medium mb-1">الاسم الكامل</label><input value={formFullName} onChange={(e) => setFormFullName(e.target.value)} className="input w-full" /></div>
          <div><label className="block text-sm font-medium mb-1">البريد الإلكتروني</label><input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="input w-full" /></div>
          <div><label className="block text-sm font-medium mb-1">الدور</label>
            <select value={formRole} onChange={(e) => setFormRole(e.target.value)} className="input w-full">
              <option value="admin">مدير</option>
              <option value="user">مستخدم</option>
              <option value="viewer">مشاهد</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">الصلاحيات</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2"><input type="checkbox" checked={formCanWarid} onChange={(e) => setFormCanWarid(e.target.checked)} /> إدارة الوارد</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={formCanSadir} onChange={(e) => setFormCanSadir(e.target.checked)} /> إدارة الصادر</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={formCanUsers} onChange={(e) => setFormCanUsers(e.target.checked)} /> إدارة المستخدمين</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={formCanExcel} onChange={(e) => setFormCanExcel(e.target.checked)} /> استيراد Excel</label>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">إلغاء</button>
            <button onClick={handleSave} className="btn-gold px-6">حفظ</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={deleteTarget !== null} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)}
        title="حذف مستخدم" message="هل أنت متأكد من حذف هذا المستخدم؟" confirmText="حذف" danger />
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken, clearToken, isAuthenticated } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/", label: "لوحة التحكم", icon: "📊" },
  { href: "/warid", label: "الوارد", icon: "📨" },
  { href: "/sadir", label: "الصادر", icon: "📤" },
  { href: "/users", label: "المستخدمين", icon: "👥" },
  { href: "/deleted", label: "المحذوفات", icon: "🗑️" },
  { href: "/settings", label: "الإعدادات", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check connection status
    const check = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/health");
        const data = await res.json();
        setConnected(data.db === "connected");
      } catch {
        setConnected(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  // Theme
  useEffect(() => {
    const saved = localStorage.getItem("railway_theme");
    if (saved === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("railway_theme", next ? "dark" : "light");
  };

  const handleLogout = () => {
    clearToken();
    router.push("/login");
  };

  // Hide sidebar on login page
  if (!mounted || pathname === "/login") return null;

  if (!isAuthenticated()) return null;

  return (
    <aside
      className={`fixed top-0 right-0 h-screen bg-[#1a365d] text-white transition-all duration-300 z-50 flex flex-col ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo & Collapse */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-[#d4a843]">سكك حديد مصر</h1>
            <p className="text-xs text-white/60">نظام السكرتارية</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-white/60 hover:text-white p-1"
        >
          {collapsed ? "☰" : "✕"}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                active
                  ? "bg-[#d4a843] text-[#1a365d] font-bold"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4 space-y-2">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full text-white/70 hover:text-white text-sm"
        >
          <span>{dark ? "☀️" : "🌙"}</span>
          {!collapsed && <span>{dark ? "فاتح" : "داكن"}</span>}
        </button>

        <div className="flex items-center gap-2 text-xs text-white/60">
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-green-400" : "bg-red-400"
            }`}
          />
          {!collapsed && <span>{connected ? "متصل" : "غير متصل"}</span>}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full text-red-300 hover:text-red-200 text-sm"
        >
          <span>🚪</span>
          {!collapsed && <span>تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
}

"use client";

import Sidebar from "@/components/Sidebar";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Apply saved theme
    const saved = localStorage.getItem("railway_theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  const isLogin = pathname === "/login";

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className={`flex-1 transition-all duration-300 ${
          isLogin ? "mr-0" : "mr-16 md:mr-64"
        }`}
      >
        {children}
      </main>
    </div>
  );
}

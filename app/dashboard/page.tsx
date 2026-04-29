"use client";

export const dynamic = "force-dynamic"; // 🔥 WAJIB untuk dashboard

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/* ===================== TYPES ===================== */
type FeatureId = "ringkasan" | "materi" | "simulasi" | "progress" | "admin";
type UserRole = "" | "admin" | "dosen" | "mahasiswa";

/* ===================== MAIN PAGE ===================== */
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}

/* ===================== LOADING ===================== */
function DashboardLoading() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p>Memuat dashboard...</p>
    </main>
  );
}

/* ===================== MAIN CONTENT ===================== */
function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 🔥 FIX searchParams biar aman saat build
  const panel =
    typeof window !== "undefined" ? searchParams.get("panel") : null;

  const [activeFeature, setActiveFeature] =
    useState<FeatureId>("ringkasan");
  const [userRole, setUserRole] = useState<UserRole>("");
  const [userEmail, setUserEmail] = useState("");
  const [ready, setReady] = useState(false);

  /* ===================== LOAD SESSION ===================== */
  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
          cache: "no-store", // 🔥 penting
        });

        if (!response.ok) {
          if (typeof window !== "undefined") {
            router.push("/login"); // 🔥 aman
          }
          return;
        }

        const result = await response.json();

        if (!result?.success || !result?.data) {
          if (typeof window !== "undefined") {
            router.push("/login");
          }
          return;
        }

        if (!isMounted) return;

        setUserEmail(result.data.email);
        setUserRole(result.data.role);

        // contoh sederhana mapping feature
        const feature =
          panel === "materi" ||
          panel === "simulasi" ||
          panel === "progress" ||
          panel === "admin"
            ? panel
            : "ringkasan";

        setActiveFeature(feature as FeatureId);
        setReady(true);
      } catch (err) {
        console.error("Session error:", err);
        if (typeof window !== "undefined") {
          router.push("/login");
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [router, panel]);

  /* ===================== LOGOUT ===================== */
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error(err);
    } finally {
      if (typeof window !== "undefined") {
        router.push("/login");
      }
    }
  };

  /* ===================== LOADING STATE ===================== */
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  /* ===================== UI ===================== */
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <p>Email: {userEmail}</p>
      <p>Role: {userRole}</p>
      <p>Panel: {activeFeature}</p>

      <div className="mt-4 space-x-2">
        <button onClick={() => setActiveFeature("ringkasan")}>
          Ringkasan
        </button>
        <button onClick={() => setActiveFeature("materi")}>
          Materi
        </button>
        <button onClick={() => setActiveFeature("simulasi")}>
          Simulasi
        </button>
        <button onClick={() => setActiveFeature("progress")}>
          Progress
        </button>
      </div>

      <div className="mt-6">
        {activeFeature === "ringkasan" && <p>Halaman Ringkasan</p>}
        {activeFeature === "materi" && <p>Halaman Materi</p>}
        {activeFeature === "simulasi" && <p>Halaman Simulasi</p>}
        {activeFeature === "progress" && <p>Halaman Progress</p>}
      </div>

      <button
        onClick={handleLogout}
        className="mt-6 bg-black text-white px-4 py-2"
      >
        Logout
      </button>
    </div>
  );
}
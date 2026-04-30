"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { validateLoginInput } from "@/lib/validation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  const router = useRouter();

  const getDashboardPathByRole = (role: string) => {
    if (role === "admin") return "/dashboard?panel=admin";
    if (role === "dosen") return "/dashboard?panel=materi";
    return "/dashboard?panel=ringkasan";
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});
    setErrorAlert(null);
    setMessage("");

    // Validate input
    const validation = validateLoginInput(email, password);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
        data?: {
          email: string;
          role: string;
        };
      };

      if (!response.ok || !result.success || !result.data) {
        setErrorAlert(result.message ?? "Email atau password salah");
        setIsLoading(false);
        return;
      }

      const loginData = result.data;

      setMessage(`Selamat datang, ${loginData.role} (${loginData.email})!`);

      setTimeout(() => {
        router.replace(getDashboardPathByRole(loginData.role));
      }, 1500);
    } catch (error) {
      console.error("Login error:", error);
      setErrorAlert("Terjadi kesalahan saat login. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef4ff,_#fef2f2_45%,_#fff7ed)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="hidden rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-2xl shadow-slate-200/60 backdrop-blur lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">
            Portal E-Learning
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-900">
            Satu pintu login untuk admin, dosen, dan mahasiswa.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
            Gunakan akun sesuai peran Anda untuk masuk ke dashboard yang tepat:
            admin untuk pengelolaan sistem, dosen untuk materi dan penilaian,
            serta mahasiswa untuk latihan simulasi customer service.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                Admin
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Kelola user, skenario, dan rubrik penilaian.
              </p>
            </div>
            <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
                Dosen
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Susun materi dan beri evaluasi latihan mahasiswa.
              </p>
            </div>
            <div className="rounded-3xl border border-sky-100 bg-sky-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
                Mahasiswa
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Latihan simulasi dan pantau progres komunikasi.
              </p>
            </div>
          </div>
        </section>

        <div className="w-full overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-2xl shadow-slate-200/60 backdrop-blur sm:p-8 lg:p-10">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">
            Login
          </p>
          <h2 className="mt-3 text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Masuk ke Portal E-Learning
          </h2>
          <p className="mt-3 text-center text-sm leading-6 text-slate-500 sm:text-base">
            Login dengan akun admin, dosen, atau mahasiswa, lalu lanjutkan ke
            dashboard sesuai peran akun Anda.
          </p>

          <div className="mt-8">
            {errorAlert && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div className="flex items-start gap-3">
                  <svg
                    className="h-5 w-5 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{errorAlert}</span>
                </div>
              </div>
            )}

            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (errors.email) setErrors({ ...errors, email: "" });
                  }}
                  className={`mt-1 block w-full rounded-2xl border ${
                    errors.email ? "border-red-300" : "border-slate-300"
                  } bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900`}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Kata Sandi
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (errors.password) setErrors({ ...errors, password: "" });
                  }}
                  className={`mt-1 block w-full rounded-2xl border ${
                    errors.password ? "border-red-300" : "border-slate-300"
                  } bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900`}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sedang login...
                  </>
                ) : (
                  "Masuk"
                )}
              </button>
            </form>

            {message && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-start gap-3">
                <svg
                  className="h-5 w-5 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{message}</span>
              </div>
            )}

            <div className="mt-6 text-center text-xs text-slate-500">
              <p className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left leading-6 text-slate-600">
                Akun demo:
                <br />
                Admin `admin@elearning.local` / `Admin123`
                <br />
                Dosen `dosen@elearning.local` / `Dosen123`
                <br />
                Mahasiswa `mahasiswa@elearning.local` / `Mahasiswa123`
              </p>
              <Link
                href="/"
                className="font-semibold text-rose-600 transition-colors hover:text-rose-700"
              >
                Kembali ke Beranda
              </Link>{" "}
              | Belum punya akun?{" "}
              <Link
                href="/register"
                className="font-semibold text-amber-600 transition-colors hover:text-amber-700"
              >
                Daftar sekarang
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

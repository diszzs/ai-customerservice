"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@/lib/auth";
import { validateRegistrationInput } from "@/lib/validation";

const registerRoles: Array<{ value: Extract<UserRole, "dosen" | "mahasiswa">; label: string }> = [
  { value: "mahasiswa", label: "Mahasiswa" },
  { value: "dosen", label: "Dosen" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Extract<UserRole, "dosen" | "mahasiswa">>(
    "mahasiswa",
  );
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });

  const updatePasswordRequirements = (pass: string) => {
    setPasswordRequirements({
      length: pass.length >= 6,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
    });
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});
    setErrorAlert(null);
    setMessage("");

    // Validate password match
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Password tidak cocok" });
      return;
    }

    // Validate input
    const validation = validateRegistrationInput(name, email, password);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
        data?: {
          name: string;
          role: string;
        };
      };

      if (!response.ok || !result.success || !result.data) {
        setErrorAlert(result.message ?? "Pendaftaran gagal");
        setIsLoading(false);
        return;
      }

      setMessage(
        `Akun berhasil dibuat untuk ${result.data.name}, role: ${result.data.role}. Silakan login sekarang.`,
      );

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      console.error("Register error:", error);
      setErrorAlert("Terjadi kesalahan saat pendaftaran. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef4ff,_#fff7ed_38%,_#fff1f2_72%,_#f8fafc)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="hidden rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-2xl shadow-orange-100/50 backdrop-blur lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
            Registrasi Portal
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-900">
            Buat akun untuk mulai latihan customer service berbasis AI.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
            Halaman ini terhubung langsung dengan landing page dan login agar
            pengguna baru bisa masuk ke alur aplikasi tanpa bingung.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                Alur cepat
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Daftar, pilih role, lalu lanjut otomatis ke halaman login.
              </p>
            </div>
            <div className="rounded-3xl border border-rose-100 bg-rose-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
                Role
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Mendukung administrator, dosen, dan mahasiswa.
              </p>
            </div>
            <div className="rounded-3xl border border-sky-100 bg-sky-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
                Tujuan
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Akses simulasi pelanggan, scoring, dan dashboard progres.
              </p>
            </div>
          </div>
        </section>

        <main className="w-full overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-2xl shadow-slate-200/60 backdrop-blur sm:p-8 lg:p-10">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
            Register
          </p>
          <h2 className="mt-3 text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Daftar Akun Baru
          </h2>
          <p className="mt-3 text-center text-sm leading-6 text-slate-500 sm:text-base">
            Buat akun Anda lalu lanjutkan ke login untuk masuk ke portal
            e-learning customer service. Anda bisa mendaftar sebagai mahasiswa
            atau dosen.
          </p>

          {errorAlert && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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

          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700"
              >
                Nama Lengkap
              </label>
              <input
                id="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                required
                disabled={isLoading}
                className={`mt-1 block w-full rounded-2xl border ${
                  errors.name ? "border-red-300" : "border-slate-300"
                } bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                required
                disabled={isLoading}
                className={`mt-1 block w-full rounded-2xl border ${
                  errors.email ? "border-red-300" : "border-slate-300"
                } bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900`}
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
                type="password"
                minLength={6}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  updatePasswordRequirements(event.target.value);
                  if (errors.password) setErrors({ ...errors, password: "" });
                }}
                required
                disabled={isLoading}
                className={`mt-1 block w-full rounded-2xl border ${
                  errors.password ? "border-red-300" : "border-slate-300"
                } bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900`}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
              {password && (
                <div className="mt-2 space-y-1">
                  <RequirementItem
                    met={passwordRequirements.length}
                    text="Minimal 6 karakter"
                  />
                  <RequirementItem
                    met={passwordRequirements.uppercase}
                    text="Mengandung huruf besar (A-Z)"
                  />
                  <RequirementItem
                    met={passwordRequirements.lowercase}
                    text="Mengandung huruf kecil (a-z)"
                  />
                  <RequirementItem
                    met={passwordRequirements.number}
                    text="Mengandung angka (0-9)"
                  />
                </div>
              )}
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700"
              >
                Konfirmasi Kata Sandi
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  if (errors.confirmPassword)
                    setErrors({ ...errors, confirmPassword: "" });
                }}
                required
                disabled={isLoading}
                className={`mt-1 block w-full rounded-2xl border ${
                  errors.confirmPassword ? "border-red-300" : "border-slate-300"
                } bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900`}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-slate-700"
              >
                Role akun
              </label>
              <select
                id="role"
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target.value as Extract<UserRole, "dosen" | "mahasiswa">,
                  )
                }
                disabled={isLoading}
                className="mt-1 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900"
              >
                {registerRoles.map((registerRole) => (
                  <option key={registerRole.value} value={registerRole.value}>
                    {registerRole.label}
                  </option>
                ))}
              </select>
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
                  Sedang daftar...
                </>
              ) : (
                "Buat Akun"
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
            <Link
              href="/"
              className="font-semibold text-amber-600 transition-colors hover:text-amber-700"
            >
              Kembali ke Beranda
            </Link>{" "}
            | Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-rose-600 transition-colors hover:text-rose-700"
            >
              Masuk di sini
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div
      className={`flex items-center gap-2 text-xs ${met ? "text-emerald-600" : "text-slate-500"}`}
    >
      <svg
        className={`h-4 w-4 flex-shrink-0 ${met ? "block" : "hidden"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
      <svg
        className={`h-4 w-4 flex-shrink-0 ${!met ? "block" : "hidden"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <circle
          cx="10"
          cy="10"
          r="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        ></circle>
      </svg>
      <span>{text}</span>
    </div>
  );
}

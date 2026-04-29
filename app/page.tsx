import Link from "next/link";

const featureCards = [
  {
    title: "Simulasi pelanggan realistis",
    description:
      "Latih respons terhadap komplain, refund, dan pertanyaan produk lewat skenario yang terasa seperti percakapan sungguhan.",
  },
  {
    title: "Skor otomatis 3 aspek",
    description:
      "Sistem menilai empati, ketepatan, dan penyelesaian agar peserta tahu bagian mana yang perlu diperkuat.",
  },
  {
    title: "Panel latihan yang mudah dipakai",
    description:
      "Mahasiswa, dosen, dan admin punya jalur masuk yang jelas untuk belajar, memantau progres, dan mengelola skenario.",
  },
];

const highlights = [
  "5 skenario latihan customer service siap pakai",
  "Feedback cepat setelah 4 balasan trainee",
  "Dashboard progres untuk memantau perkembangan",
];

const steps = [
  {
    label: "01",
    title: "Masuk ke portal",
    description:
      "Pengguna login sesuai role lalu masuk ke ruang latihan yang sudah disiapkan.",
  },
  {
    label: "02",
    title: "Pilih skenario",
    description:
      "Trainee memilih situasi pelanggan yang ingin dilatih, dari komplain sampai kendala teknis.",
  },
  {
    label: "03",
    title: "Terima evaluasi",
    description:
      "Setelah sesi selesai, sistem memberi skor dan saran perbaikan yang langsung bisa dipraktikkan.",
  },
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden bg-[#f5efe4] text-slate-900">
      <div className="absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.22),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.22),_transparent_30%),linear-gradient(180deg,_#fff8ef_0%,_#f5efe4_65%,_#efe5d2_100%)]" />
      <div className="absolute left-[-8rem] top-28 -z-10 h-72 w-72 rounded-full bg-[#d35d47]/10 blur-3xl" />
      <div className="absolute right-[-6rem] top-16 -z-10 h-80 w-80 rounded-full bg-[#d9a441]/20 blur-3xl" />

      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-full border border-white/60 bg-white/55 px-5 py-4 shadow-lg shadow-orange-100/40 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#b45309]">
              E-Learning CS
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Platform latihan layanan pelanggan berbasis AI
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
            <Link
              href="/register"
              className="rounded-full border border-slate-300/80 px-4 py-2 text-slate-700 transition hover:border-slate-900 hover:bg-white"
            >
              Register
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-slate-300/80 px-4 py-2 text-slate-700 transition hover:border-slate-900 hover:bg-white"
            >
              Login
            </Link>
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <section>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d9a441]/30 bg-white/65 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-[#9a3412] shadow-sm backdrop-blur">
              AI Chatbot Simulasi Pelanggan
            </div>

            <h1 className="mt-6 max-w-4xl font-serif text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-[#1f2937] sm:text-6xl lg:text-7xl">
              Bangun tim customer service yang tenang, empatik, dan siap
              menghadapi pelanggan sulit.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Landing page ini mengantar pengguna langsung ke pengalaman
              latihan: simulasi chat pelanggan, penilaian otomatis, dan progres
              belajar yang mudah dipantau dalam satu portal.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-[#d35d47] px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-orange-200 transition hover:bg-[#b94e3a]"
              >
                Mulai dari Login
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:bg-white"
              >
                Buat Akun Baru
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.5rem] border border-white/70 bg-white/65 px-4 py-4 text-sm leading-6 text-slate-700 shadow-lg shadow-orange-100/30 backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <aside className="relative">
            <div className="absolute -left-5 top-10 hidden h-24 w-24 rounded-full border border-white/70 bg-white/45 blur-[1px] lg:block" />
            <div className="absolute -right-3 top-0 hidden h-16 w-16 rounded-full bg-[#d35d47]/15 lg:block" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(160deg,_rgba(255,255,255,0.9),_rgba(255,247,237,0.85),_rgba(254,226,226,0.75))] p-6 shadow-2xl shadow-orange-200/40 backdrop-blur sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#b45309]">
                    Preview Portal
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    Ruang latihan yang fokus ke hasil
                  </h2>
                </div>
                <div className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow">
                  Live Practice
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-[1.5rem] bg-slate-900 p-5 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                    Skenario aktif
                  </p>
                  <p className="mt-3 text-lg font-semibold">
                    Pesanan digital belum diterima
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/75">
                    Trainee diminta menenangkan pelanggan, mengecek status, lalu
                    memberi solusi yang konkret.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-[#fecaca] bg-[#fff1f2] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-600">
                      Penilaian
                    </p>
                    <p className="mt-3 text-3xl font-bold text-slate-900">
                      87/100
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Empati kuat, detail solusi perlu sedikit dipertegas.
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] border border-[#fde68a] bg-[#fffbeb] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                      Progres
                    </p>
                    <p className="mt-3 text-3xl font-bold text-slate-900">
                      5/5
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Semua skenario utama sudah bisa diuji dari satu dashboard.
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/70 bg-white/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Mengapa cocok untuk pembelajaran
                  </p>
                  <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
                    <li>
                      Respons trainee langsung dibandingkan dengan rubric aktif.
                    </li>
                    <li>
                      Admin bisa menyesuaikan skenario dan keyword penilaian.
                    </li>
                    <li>Tampilan ramah mobile dan tetap jelas di desktop.</li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {featureCards.map((card, index) => (
            <article
              key={card.title}
              className={`rounded-[2rem] border p-6 shadow-xl backdrop-blur ${
                index === 0
                  ? "border-[#fed7aa] bg-[#fff7ed]"
                  : index === 1
                    ? "border-[#fecdd3] bg-[#fff1f2]"
                    : "border-[#e9d5ff] bg-[#faf5ff]"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Fitur 0{index + 1}
              </p>
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-slate-900">
                {card.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-8 rounded-[2.5rem] border border-white/70 bg-white/60 p-6 shadow-2xl shadow-orange-100/40 backdrop-blur lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#9a3412]">
              Alur Penggunaan
            </p>
            <h2 className="mt-4 max-w-xl font-serif text-4xl font-semibold leading-tight tracking-[-0.03em] text-slate-900">
              Satu portal untuk latihan, evaluasi, dan tindak lanjut
              pembelajaran.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600">
              Struktur aplikasinya sudah mendukung onboarding cepat. Landing
              page ini tinggal mengarahkan pengguna ke jalur yang tepat tanpa
              membuat mereka bingung saat pertama kali masuk.
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step) => (
              <div
                key={step.label}
                className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                    {step.label}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] bg-slate-900 px-6 py-8 text-white shadow-2xl shadow-slate-300 sm:px-8 sm:py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-orange-200">
            Siap Dipakai
          </p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="max-w-3xl font-serif text-4xl font-semibold leading-tight tracking-[-0.03em] text-white">
                Arahkan pengguna dari halaman depan langsung ke latihan customer
                service berbasis AI.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">
                Cocok untuk demo produk, onboarding mahasiswa, atau pintu masuk
                utama sebelum login ke dashboard simulasi.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Daftar Akun
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-orange-50"
              >
                Masuk Sekarang
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

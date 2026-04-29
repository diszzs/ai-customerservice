
"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type FeatureId = "ringkasan" | "materi" | "simulasi" | "progress" | "admin";
type UserRole = "" | "admin" | "dosen" | "mahasiswa";
type AspectKey = "empati" | "ketepatan" | "penyelesaian";

type Rubric = {
  empatiKeywords: string[];
  accuracyKeywords: string[];
  resolutionKeywords: string[];
  minimumResponseLength: number;
};

type Scenario = {
  id: string;
  title: string;
  category: string;
  emotion: string;
  product: string;
  urgency: string;
  opening: string;
  followUps: string[];
  goodResponseHint: string;
};

type Message = {
  id: number;
  sender: "bot" | "user";
  text: string;
};

type AiAssistantMessage = {
  id: number;
  sender: "assistant" | "user";
  text: string;
};

type Evaluation = {
  empati: number;
  ketepatan: number;
  penyelesaian: number;
  average: number;
  comments: Record<AspectKey, string>;
  suggestions: string[];
  rewrite: string;
};

type AttemptRecord = {
  id: number;
  scenarioId: string;
  scenarioTitle: string;
  date: string;
  studentEmail: string;
  average: number;
  empati: number;
  ketepatan: number;
  penyelesaian: number;
  finalReply: string;
};

type LecturerEvaluation = {
  attemptId: number;
  score: string;
  notes: string;
  updatedAt: string;
};

type Material = {
  id: number;
  title: string;
  course: string;
  week: string;
  summary: string;
  content: string;
  link: string;
  attachment?: MaterialAttachment;
  sentAt: string;
  sentBy: string;
};

type MaterialAttachment = {
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
};

type MaterialDraft = {
  title: string;
  course: string;
  week: string;
  summary: string;
  content: string;
  link: string;
};

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: Exclude<UserRole, "">;
  status: "aktif" | "nonaktif";
  createdAt: string;
};

type UserDraft = {
  name: string;
  email: string;
  role: Exclude<UserRole, "">;
  password: string;
};

const materialsStorageKey = "dashboardMaterials";
const attemptsStorageKey = "dashboardAttempts";
const evaluationsStorageKey = "dashboardLecturerEvaluations";
const usersStorageKey = "dashboardUsers";
const maxMaterialAttachmentSizeBytes = 2 * 1024 * 1024;

const defaultRubric: Rubric = {
  empatiKeywords: ["maaf", "mengerti", "paham", "mohon maaf", "terima kasih sudah memberi tahu"],
  accuracyKeywords: ["cek", "langkah", "detail", "konfirmasi", "akun", "pesanan", "link"],
  resolutionKeywords: ["refund", "kirim ulang", "solusi", "selesai", "hari ini", "5 menit", "10 menit"],
  minimumResponseLength: 18,
};

const defaultScenarios: Scenario[] = [
  {
    id: "s1",
    title: "Pesanan digital belum diterima",
    category: "Komplain",
    emotion: "Marah",
    product: "Template catatan digital",
    urgency: "Tinggi",
    opening:
      "Saya sudah bayar template catatan digital dari tadi malam, tapi file belum masuk juga. Jangan bikin saya menunggu terus.",
    followUps: [
      "Saya tidak butuh jawaban umum. Kapan tepatnya file itu Anda kirim?",
      "Kalau hari ini tetap tidak ada, saya minta refund.",
      "Baik, saya tunggu tindak lanjut Anda sekarang.",
    ],
    goodResponseHint: "Mulai dengan empati, cek status, beri waktu tindak lanjut yang pasti.",
  },
  {
    id: "s2",
    title: "Pembeli bingung akses mini course",
    category: "Informasi produk",
    emotion: "Bingung",
    product: "Mini course persiapan ujian",
    urgency: "Sedang",
    opening:
      "Saya sudah dapat link mini course, tapi setelah dibuka malah diminta login. Saya harus masuk pakai akun apa ya?",
    followUps: [
      "Saya masih belum paham, bisa jelaskan step by step?",
      "Setelah login, saya klik menu yang mana?",
      "Oke, mulai jelas. Saya coba dulu langkah yang Anda jelaskan.",
    ],
    goodResponseHint: "Gunakan bahasa sederhana, bertahap, dan konfirmasi titik masalah pembeli.",
  },
  {
    id: "s3",
    title: "Permintaan refund karena produk tidak sesuai",
    category: "Refund",
    emotion: "Marah",
    product: "Paket latihan wawancara",
    urgency: "Tinggi",
    opening:
      "Isi paket latihan wawancara ini tidak sesuai deskripsi. Saya kecewa dan ingin uang saya kembali.",
    followUps: [
      "Kenapa dari awal tidak dijelaskan kalau kontennya berbeda?",
      "Jangan putar-putar, apakah refund bisa diproses atau tidak?",
      "Kalau ada solusi yang jelas, saya masih mau dengar.",
    ],
    goodResponseHint: "Validasi keluhan, jelaskan SOP refund, dan beri next step yang tegas.",
  },
  {
    id: "s4",
    title: "Link produk rusak",
    category: "Teknis",
    emotion: "Bingung",
    product: "E-book panduan layanan pelanggan",
    urgency: "Sedang",
    opening:
      "Link e-book yang saya terima tidak bisa dibuka. Muncul error terus dan saya tidak tahu harus bagaimana.",
    followUps: [
      "Kalau saya coba dari HP tetap tidak bisa, apa ada link cadangan?",
      "Tolong jelaskan singkat saja supaya saya bisa langsung coba.",
      "Baik, saya cek ulang dengan instruksi Anda.",
    ],
    goodResponseHint: "Minta detail error, berikan langkah cek dasar, lalu tawarkan pengiriman ulang link.",
  },
  {
    id: "s5",
    title: "Komplain admin lambat membalas",
    category: "SOP layanan",
    emotion: "Marah",
    product: "Konsultasi tugas akhir",
    urgency: "Tinggi",
    opening:
      "Saya sudah chat dari kemarin soal konsultasi tugas akhir, tapi baru dibalas sekarang. Pelayanannya mengecewakan.",
    followUps: [
      "Apa jaminannya saya tidak diabaikan lagi setelah ini?",
      "Saya butuh kepastian jadwal, bukan sekadar minta maaf.",
      "Oke, kalau Anda benar-benar follow up saya akan tunggu.",
    ],
    goodResponseHint: "Akui keterlambatan, minta maaf, dan tawarkan jadwal tindak lanjut yang jelas.",
  },
];

const defaultMaterialDraft: MaterialDraft = {
  title: "",
  course: "",
  week: "Minggu 1",
  summary: "",
  content: "",
  link: "",
};

const defaultMaterials: Material[] = [
  {
    id: 1,
    title: "Dasar Empati Dalam Layanan Pelanggan",
    course: "Komunikasi Customer Service",
    week: "Minggu 1",
    summary: "Pengenalan cara menyapa pelanggan, mengakui masalah, dan menjaga nada bicara tetap tenang.",
    content:
      "Pelajari tiga langkah dasar saat pelanggan menyampaikan keluhan: dengarkan inti masalah, validasi emosi pelanggan, lalu sampaikan tindakan yang akan dilakukan secara spesifik.",
    link: "",
    sentAt: "9 Apr 2026, 08.00",
    sentBy: "Dosen Pengampu",
  },
];

const defaultUsers: UserRecord[] = [
  {
    id: 1,
    name: "Administrator Sistem",
    email: "admin@elearning.local",
    role: "admin",
    status: "aktif",
    createdAt: "9 Apr 2026, 08.00",
  },
  {
    id: 2,
    name: "Dosen Pengampu",
    email: "dosen@elearning.local",
    role: "dosen",
    status: "aktif",
    createdAt: "9 Apr 2026, 08.15",
  },
  {
    id: 3,
    name: "Mahasiswa Demo",
    email: "mahasiswa@elearning.local",
    role: "mahasiswa",
    status: "aktif",
    createdAt: "9 Apr 2026, 08.30",
  },
];

const defaultUserDraft: UserDraft = {
  name: "",
  email: "",
  role: "mahasiswa",
  password: "",
};

const defaultAiAssistantMessages: AiAssistantMessage[] = [
  {
    id: 1,
    sender: "assistant",
    text:
      "Halo, saya AI dosen. Saya bisa bantu menyusun materi, ide tugas, ringkasan topik, dan contoh instruksi untuk mahasiswa. Tulis kebutuhan Anda.",
  },
];

function getScenarioById(scenarios: Scenario[], id: string) {
  return scenarios.find((scenario) => scenario.id === id) ?? scenarios[0];
}

function formatToday() {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("File tidak bisa dibaca"));
    };

    reader.onerror = () => {
      reject(new Error("Terjadi kesalahan saat membaca file"));
    };

    reader.readAsDataURL(file);
  });
}

function scoreFromKeywords(text: string, keywords: string[], base: number) {
  const hits = keywords.filter((keyword) => text.includes(keyword)).length;
  return Math.min(10, base + hits * 2);
}

function evaluateReply(reply: string, rubric: Rubric): Evaluation {
  const normalized = reply.toLowerCase();
  const lengthBonus = reply.trim().length >= rubric.minimumResponseLength ? 1 : 0;

  const empati = Math.min(10, scoreFromKeywords(normalized, rubric.empatiKeywords, 3) + lengthBonus);
  const ketepatan = Math.min(10, scoreFromKeywords(normalized, rubric.accuracyKeywords, 3) + lengthBonus);
  const penyelesaian = Math.min(10, scoreFromKeywords(normalized, rubric.resolutionKeywords, 3) + lengthBonus);
  const average = Number(((empati + ketepatan + penyelesaian) / 3).toFixed(1));

  const comments: Record<AspectKey, string> = {
    empati:
      empati >= 8
        ? "Empati kuat. Anda mengakui emosi pelanggan dengan baik."
        : empati >= 6
          ? "Empati cukup terlihat, tetapi masih bisa dibuat lebih hangat."
          : "Empati masih lemah. Pelanggan belum merasa benar-benar dipahami.",
    ketepatan:
      ketepatan >= 8
        ? "Jawaban cukup tepat dan relevan dengan masalah pelanggan."
        : ketepatan >= 6
          ? "Arah jawaban sudah benar, tetapi detailnya masih kurang spesifik."
          : "Jawaban belum tepat sasaran dan belum menjawab inti masalah.",
    penyelesaian:
      penyelesaian >= 8
        ? "Penyelesaian jelas, konkret, dan mudah diikuti."
        : penyelesaian >= 6
          ? "Sudah ada solusi, tetapi kepastian tindak lanjut masih kurang."
          : "Solusi belum cukup konkret atau belum ada penutupan yang meyakinkan.",
  };

  const suggestions: string[] = [];
  if (empati < 8) {
    suggestions.push("Awali jawaban dengan empati, misalnya mengakui kekesalan atau kebingungan pelanggan.");
  }
  if (ketepatan < 8) {
    suggestions.push("Gunakan informasi yang lebih spesifik, seperti status pesanan, akun, atau langkah pengecekan.");
  }
  if (penyelesaian < 8) {
    suggestions.push("Tawarkan langkah penyelesaian yang jelas disertai estimasi waktu atau opsi refund/kirim ulang.");
  }
  if (suggestions.length === 0) {
    suggestions.push("Pertahankan kualitas jawaban ini karena sudah empatik, tepat, dan solutif.");
  }

  const rewrite = [
    "Mohon maaf atas ketidaknyamanan ini.",
    "Saya mengerti situasi Anda dan akan membantu mengecek sekarang.",
    "Saya akan konfirmasi statusnya dan memberi update paling lambat 5 menit lagi.",
    "Jika kendala belum selesai hari ini, kami siapkan opsi refund atau pengiriman ulang.",
  ].join(" ");

  return { empati, ketepatan, penyelesaian, average, comments, suggestions, rewrite };
}

function buildBotReply(scenario: Scenario, userReply: string, turn: number) {
  const normalized = userReply.toLowerCase();
  const hasEmpathy = ["maaf", "mengerti", "paham", "mohon maaf"].some((term) => normalized.includes(term));
  const hasAction = ["cek", "refund", "kirim", "solusi", "jadwal", "langkah"].some((term) => normalized.includes(term));
  const followUp = scenario.followUps[Math.min(turn - 1, scenario.followUps.length - 1)];

  if (!hasEmpathy && !hasAction) return `Saya masih belum merasa dibantu. ${followUp}`;
  if (hasEmpathy && !hasAction) return `Saya menghargai penjelasan Anda, tapi saya tetap butuh tindakan nyata. ${followUp}`;
  if (!hasEmpathy && hasAction) return `Solusinya mulai terlihat, tapi cara Anda menyampaikan masih terasa dingin. ${followUp}`;
  return `Baik, saya mulai merasa lebih tenang. ${followUp}`;
}

function containsAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function cleanPromptTopic(prompt: string) {
  return prompt
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[?.!]+$/g, "");
}

function buildGenericAssistantReply(prompt: string) {
  const normalized = prompt.toLowerCase().trim();
  const topic = cleanPromptTopic(prompt);
  const responseParts: string[] = [`Saya menangkap topik Anda: "${topic}".`];

  if (containsAny(normalized, ["apa itu", "apa ", "jelaskan", "pengertian", "definisi"])) {
    responseParts.push(
      "Secara umum, topik ini bisa dijelaskan dari tiga sisi: definisi inti, tujuan atau fungsi, lalu contoh penerapannya dalam konteks nyata.",
    );
  }

  if (containsAny(normalized, ["bagaimana", "cara", "langkah", "proses", "alur"])) {
    responseParts.push(
      "Untuk menjawabnya, pendekatan yang paling jelas adalah memecahnya menjadi langkah bertahap: mulai dari tujuan, persiapan yang dibutuhkan, pelaksanaan inti, lalu evaluasi hasil.",
    );
  }

  if (containsAny(normalized, ["kenapa", "mengapa", "alasan"])) {
    responseParts.push(
      "Jika dilihat dari sudut alasan, biasanya ada tiga faktor utama yang perlu dijelaskan: penyebab inti, dampaknya, dan apa yang perlu dilakukan setelah itu.",
    );
  }

  if (containsAny(normalized, ["buat", "buatkan", "susun", "tuliskan", "generate"])) {
    responseParts.push(
      "Jika Anda ingin langsung dibuatkan, format terbaiknya adalah menentukan tujuan, target pengguna, struktur output, dan contoh hasil akhir agar jawabannya siap dipakai.",
    );
  }

  if (containsAny(normalized, ["contoh", "sample", "misal"])) {
    responseParts.push(
      "Agar lebih mudah dipahami, sebaiknya jawaban juga disertai contoh konkret, baik dalam bentuk skenario singkat, template, maupun hasil akhir yang bisa langsung diadaptasi.",
    );
  }

  if (containsAny(normalized, ["bandingkan", "perbedaan", "vs", "kelebihan", "kekurangan"])) {
    responseParts.push(
      "Untuk perbandingan, susun pembahasan berdasarkan tujuan, kelebihan, keterbatasan, dan situasi kapan masing-masing opsi paling tepat digunakan.",
    );
  }

  if (containsAny(normalized, ["materi", "modul", "ringkasan", "bahan ajar", "ajar"])) {
    responseParts.push(
      "Kalau diarahkan ke materi ajar, saya sarankan isi jawaban terdiri dari tujuan belajar, konsep inti, contoh kasus, dan tugas refleksi agar mudah dipakai di kelas.",
    );
  }

  if (containsAny(normalized, ["tugas", "latihan", "praktik", "assignment"])) {
    responseParts.push(
      "Kalau diarahkan ke tugas, hasil akhirnya bisa dibuat dalam bentuk instruksi, studi kasus, rubrik singkat, dan indikator penilaian agar mahasiswa tahu standar yang diharapkan.",
    );
  }

  if (containsAny(normalized, ["kuis", "quiz", "soal", "pertanyaan"])) {
    responseParts.push(
      "Kalau diarahkan ke kuis, kombinasikan soal pemahaman konsep, analisis kasus, dan pemilihan respons terbaik supaya hasilnya lebih seimbang.",
    );
  }

  if (containsAny(normalized, ["nilai", "rubrik", "evaluasi", "penilaian", "assessment"])) {
    responseParts.push(
      "Kalau diarahkan ke evaluasi, gunakan indikator yang terukur, komentar singkat per aspek, dan saran perbaikan agar hasil penilaian lebih mudah ditindaklanjuti.",
    );
  }

  if (containsAny(normalized, ["admin", "akun", "user", "pengguna", "dashboard"])) {
    responseParts.push(
      "Kalau diarahkan ke kebutuhan admin dashboard, fokuskan jawaban pada pengelolaan data, alur kerja pengguna, visibilitas status, dan tindakan yang paling sering dilakukan.",
    );
  }

  if (containsAny(normalized, ["pelanggan", "komplain", "chatbot", "customer service", "cs"])) {
    responseParts.push(
      "Kalau diarahkan ke konteks layanan pelanggan, jawaban ideal biasanya menekankan empati, kejelasan langkah, kepastian tindak lanjut, dan nada komunikasi yang menenangkan.",
    );
  }

  if (responseParts.length === 1) {
    responseParts.push(
      "Saya bisa bantu mengembangkannya lebih jauh dengan struktur yang lebih spesifik, misalnya versi penjelasan singkat, langkah kerja, contoh, template, atau format siap pakai.",
    );
  } else {
    responseParts.push(
      "Kalau Anda mau, saya bisa lanjut ubah topik ini menjadi versi yang lebih spesifik seperti ringkasan, langkah kerja, template, contoh jawaban, atau format siap pakai.",
    );
  }

  return responseParts.join(" ");
}

function buildLecturerAssistantReply(prompt: string) {
  const normalized = prompt.toLowerCase();
  const sections: string[] = [];

  if (containsAny(normalized, ["halo", "hai", "hi", "selamat"])) {
    sections.push("Saya siap bantu. Tulis kebutuhan Anda, dan saya akan jawab sejelas mungkin untuk konteks admin atau dosen.");
  }

  if (containsAny(normalized, ["materi", "modul", "ringkasan", "bahan ajar", "ajar"])) {
    sections.push(
      "Untuk materi, saya sarankan susun jawaban dalam 4 bagian: tujuan belajar, konsep inti, contoh kasus, dan latihan refleksi agar mahasiswa langsung bisa praktik.",
    );
  }

  if (containsAny(normalized, ["tugas", "latihan", "assignment", "praktik"])) {
    sections.push(
      "Untuk tugas, format yang paling aman adalah studi kasus singkat, instruksi langkah kerja, kriteria penilaian, lalu output akhir yang harus dikumpulkan mahasiswa.",
    );
  }

  if (containsAny(normalized, ["quiz", "kuis", "soal", "pertanyaan"])) {
    sections.push(
      "Untuk kuis, buat kombinasi soal identifikasi masalah, pilihan respons terbaik, dan satu soal analisis singkat supaya pemahaman konsep dan penerapan sama-sama terukur.",
    );
  }

  if (containsAny(normalized, ["rps", "pertemuan", "rundown", "sesi", "jadwal"])) {
    sections.push(
      "Untuk satu pertemuan, alur yang efektif adalah pembukaan tujuan, penjelasan inti materi, analisis contoh, latihan terarah, lalu penutup dengan umpan balik dan tindak lanjut.",
    );
  }

  if (containsAny(normalized, ["nilai", "rubrik", "evaluasi", "penilaian", "assessment"])) {
    sections.push(
      "Untuk evaluasi, gunakan rubric yang menilai empati, ketepatan solusi, dan kualitas penutupan jawaban, lalu tambahkan komentar singkat agar mahasiswa tahu area perbaikannya.",
    );
  }

  if (containsAny(normalized, ["admin", "akun", "user", "pengguna", "mahasiswa", "dosen"])) {
    sections.push(
      "Untuk kebutuhan admin, pisahkan tindakan menjadi 3 kelompok: pengelolaan akun, pengaturan konten/skenario, dan pemantauan aktivitas agar dashboard lebih mudah dioperasikan.",
    );
  }

  if (containsAny(normalized, ["skenario", "komplain", "chatbot", "pelanggan", "cs", "customer service"])) {
    sections.push(
      "Untuk skenario chatbot pelanggan, pastikan ada pemicu emosi, masalah inti, tuntutan pelanggan, dan indikator jawaban ideal supaya latihan terasa realistis dan bisa dinilai.",
    );
  }

  if (containsAny(normalized, ["laporan", "rekap", "progress", "progres", "dashboard"])) {
    sections.push(
      "Untuk rekap dashboard, tampilkan metrik ringkas, tren performa, dan tindak lanjut yang disarankan agar data tidak berhenti di angka saja.",
    );
  }

  if (sections.length > 0) {
    return [`Saya menangkap kebutuhan Anda tentang: "${prompt.trim()}".`, ...sections, "Kalau Anda mau, saya bisa lanjut ubah ini menjadi format siap pakai seperti materi, tugas, kuis, rubric, atau langkah implementasi."].join(" ");
  }

  return buildGenericAssistantReply(prompt);
}

function getDefaultFeatureByRole(role: Exclude<UserRole, "">): FeatureId {
  if (role === "admin") return "admin";
  if (role === "dosen") return "materi";
  return "ringkasan";
}

function getAllowedFeaturesByRole(role: Exclude<UserRole, "">): FeatureId[] {
  if (role === "admin") {
    return ["ringkasan", "materi", "simulasi", "progress", "admin"];
  }

  if (role === "dosen") {
    return ["ringkasan", "materi", "simulasi", "progress"];
  }

  return ["ringkasan", "materi", "simulasi", "progress"];
}

function resolveFeatureFromPanel(
  panel: string | null,
  role: Exclude<UserRole, "">,
): FeatureId {
  const requestedFeature = panel as FeatureId | null;
  const allowedFeatures = getAllowedFeaturesByRole(role);

  if (requestedFeature && allowedFeatures.includes(requestedFeature)) {
    return requestedFeature;
  }

  return getDefaultFeatureByRole(role);
}

function getPortalLabel(role: Exclude<UserRole, "">) {
  if (role === "admin") return "Portal Admin";
  if (role === "dosen") return "Portal Dosen";
  return "Portal Mahasiswa";
}

function getMenuHeading(role: Exclude<UserRole, "">) {
  if (role === "admin") return "Menu admin";
  return "Menu belajar";
}

function getMenuDescription(role: Exclude<UserRole, "">) {
  if (role === "admin") {
    return "Kelola akun, skenario latihan, rubrik penilaian, dan gunakan panel admin sebagai pusat pengaturan sistem.";
  }

  if (role === "dosen") {
    return "Kelola materi, gunakan chatbot AI untuk bantu persiapan, dan pantau aktivitas pembelajaran.";
  }

  return "Navigasikan skenario, latihan chat, cek skor, dan pantau progres trainee.";
}

function getHeaderDescription(role: Exclude<UserRole, "">, email: string) {
  if (role === "admin") {
    return `Login sebagai ${email}. Kelola data pengguna, skenario chatbot, dan rubric penilaian dari dashboard admin.`;
  }

  if (role === "dosen") {
    return `Login sebagai ${email}. Sistem ini membantu pengelolaan materi, chat AI pendamping, dan evaluasi hasil latihan mahasiswa.`;
  }

  return `Login sebagai ${email}. Sistem ini menyediakan chat trainee vs pelanggan, penilaian otomatis 3 aspek, saran perbaikan, dan progres latihan end-to-end.`;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm font-medium text-slate-600 shadow-sm">
          Memuat dashboard...
        </div>
      </div>
    </main>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeFeature, setActiveFeature] = useState<FeatureId>("ringkasan");
  const [userRole, setUserRole] = useState<UserRole>("");
  const [userEmail, setUserEmail] = useState("");
  const [ready, setReady] = useState(false);
  const [rubric, setRubric] = useState<Rubric>(defaultRubric);
  const [scenarios, setScenarios] = useState<Scenario[]>(defaultScenarios);
  const [selectedScenarioId, setSelectedScenarioId] = useState(defaultScenarios[0].id);
  const [messages, setMessages] = useState<Message[]>([{ id: 1, sender: "bot", text: defaultScenarios[0].opening }]);
  const [reply, setReply] = useState("");
  const [turn, setTurn] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [adminDraft, setAdminDraft] = useState<Scenario>(defaultScenarios[0]);
  const [materials, setMaterials] = useState<Material[]>(defaultMaterials);
  const [materialDraft, setMaterialDraft] = useState<MaterialDraft>(defaultMaterialDraft);
  const [materialAttachment, setMaterialAttachment] = useState<MaterialAttachment | null>(null);
  const [materialAttachmentError, setMaterialAttachmentError] = useState("");
  const [users, setUsers] = useState<UserRecord[]>(defaultUsers);
  const [userDraft, setUserDraft] = useState<UserDraft>(defaultUserDraft);
  const [userActionMessage, setUserActionMessage] = useState("");
  const [userActionError, setUserActionError] = useState("");
  const [lecturerEvaluations, setLecturerEvaluations] = useState<Record<number, LecturerEvaluation>>({});
  const [aiAssistantMessages, setAiAssistantMessages] = useState<AiAssistantMessage[]>(defaultAiAssistantMessages);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponding, setAiResponding] = useState(false);
  const messageIdRef = useRef(2);
  const aiMessageIdRef = useRef(2);

  useEffect(() => {
    const storedMaterials = localStorage.getItem(materialsStorageKey);
    const storedAttempts = localStorage.getItem(attemptsStorageKey);
    const storedEvaluations = localStorage.getItem(evaluationsStorageKey);
    const storedUsers = localStorage.getItem(usersStorageKey);
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        });

        if (!response.ok) {
          router.push("/login");
          return;
        }

        const result = (await response.json()) as {
          success: boolean;
          data?: {
            email: string;
            role: Exclude<UserRole, "">;
          };
        };

        if (!result.success || !result.data) {
          router.push("/login");
          return;
        }

        if (!isMounted) return;

        const nextMaterials = storedMaterials
          ? (JSON.parse(storedMaterials) as Material[])
          : defaultMaterials;
        const nextAttempts = storedAttempts
          ? (JSON.parse(storedAttempts) as AttemptRecord[])
          : [];
        const nextEvaluations = storedEvaluations
          ? (JSON.parse(storedEvaluations) as Record<number, LecturerEvaluation>)
          : {};
        const nextUsers = storedUsers
          ? (JSON.parse(storedUsers) as UserRecord[])
          : defaultUsers;
        const sessionData = result.data;

        if (sessionData.role === "admin") {
          const usersResponse = await fetch("/api/admin/users", {
            credentials: "include",
          });

          if (usersResponse.ok) {
            const usersResult = (await usersResponse.json()) as {
              success: boolean;
              data?: UserRecord[];
            };

            if (usersResult.success && usersResult.data) {
              nextUsers.splice(0, nextUsers.length, ...usersResult.data);
            }
          }
        }

        if (
          !nextUsers.some((user) => user.email === sessionData.email)
        ) {
          nextUsers.unshift({
            id: Date.now(),
            name: sessionData.email.split("@")[0],
            email: sessionData.email,
            role: sessionData.role,
            status: "aktif",
            createdAt: formatToday(),
          });
        }

        setUserEmail(sessionData.email);
        setUserRole(sessionData.role);
        setMaterials(nextMaterials);
        setAttempts(nextAttempts);
        setLecturerEvaluations(nextEvaluations);
        setUsers(nextUsers);
        setActiveFeature(resolveFeatureFromPanel(searchParams.get("panel"), sessionData.role));
        setReady(true);
      } catch (error) {
        console.error("Session error:", error);
        router.push("/login");
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(materialsStorageKey, JSON.stringify(materials));
  }, [materials, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(attemptsStorageKey, JSON.stringify(attempts));
  }, [attempts, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(evaluationsStorageKey, JSON.stringify(lecturerEvaluations));
  }, [lecturerEvaluations, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(usersStorageKey, JSON.stringify(users));
  }, [users, ready]);

  const selectedScenario = useMemo(() => getScenarioById(scenarios, selectedScenarioId), [scenarios, selectedScenarioId]);
  const scenarioCoverage = useMemo(() => new Set(attempts.map((attempt) => attempt.scenarioId)).size, [attempts]);
  const averageProgress = useMemo(() => {
    if (attempts.length === 0) return 0;
    return Math.round(attempts.reduce((sum, attempt) => sum + attempt.average, 0) / attempts.length);
  }, [attempts]);

  const resetSimulation = (scenario = selectedScenario) => {
    messageIdRef.current += 1;
    setMessages([{ id: messageIdRef.current, sender: "bot", text: scenario.opening }]);
    setReply("");
    setTurn(0);
    setEvaluation(null);
    setIsTyping(false);
  };

  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    const scenario = getScenarioById(scenarios, scenarioId);
    setAdminDraft(scenario);
    resetSimulation(scenario);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userRole");
      router.push("/login");
    }
  };

  const submitMaterial = () => {
    const title = materialDraft.title.trim();
    const course = materialDraft.course.trim();
    const summary = materialDraft.summary.trim();
    const content = materialDraft.content.trim();
    const link = materialDraft.link.trim();

    if (!title || !course || !summary || !content) return;

    setMaterials((current) => [
      {
        id: Date.now(),
        title,
        course,
        week: materialDraft.week.trim() || "Minggu umum",
        summary,
        content,
        link,
        attachment: materialAttachment ?? undefined,
        sentAt: formatToday(),
        sentBy: userEmail || "Dosen",
      },
      ...current,
    ]);
    setMaterialDraft(defaultMaterialDraft);
    setMaterialAttachment(null);
    setMaterialAttachmentError("");
    setActiveFeature("materi");
  };

  const handleMaterialFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      setMaterialAttachment(null);
      setMaterialAttachmentError("");
      return;
    }

    if (file.size > maxMaterialAttachmentSizeBytes) {
      setMaterialAttachment(null);
      setMaterialAttachmentError("Ukuran file maksimal 2 MB agar bisa disimpan di dashboard.");
      event.target.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setMaterialAttachment({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        dataUrl,
      });
      setMaterialAttachmentError("");
    } catch (error) {
      console.error("Material file error:", error);
      setMaterialAttachment(null);
      setMaterialAttachmentError("File gagal dibaca. Silakan coba file lain.");
      event.target.value = "";
    }
  };

  const submitReply = () => {
    const trimmed = reply.trim();
    if (!trimmed || evaluation || isTyping) return;

    messageIdRef.current += 1;
    const nextTurn = turn + 1;
    const userMessage: Message = {
      id: messageIdRef.current,
      sender: "user",
      text: trimmed,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setReply("");
    setTurn(nextTurn);

    if (nextTurn >= 4) {
      const result = evaluateReply(trimmed, rubric);
      setEvaluation(result);
      setAttempts((current) => [
        {
          id: current.length + 1,
          scenarioId: selectedScenario.id,
          scenarioTitle: selectedScenario.title,
          date: formatToday(),
          average: result.average,
          studentEmail: userEmail || "mahasiswa",
          empati: result.empati,
          ketepatan: result.ketepatan,
          penyelesaian: result.penyelesaian,
          finalReply: trimmed,
        },
        ...current,
      ]);
      return;
    }

    setIsTyping(true);

    void (async () => {
      try {
        const response = await fetch("/api/ai/customer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            scenario: selectedScenario,
            messages: nextMessages.map((message) => ({
              sender: message.sender,
              text: message.text,
            })),
          }),
        });

        const result = (await response.json()) as {
          success: boolean;
          message?: string;
          data?: {
            reply: string;
          };
        };

        messageIdRef.current += 1;
        setMessages((current) => [
          ...current,
          {
            id: messageIdRef.current,
            sender: "bot",
            text:
              response.ok && result.success && result.data?.reply
                ? result.data.reply
                : result.message ?? buildBotReply(selectedScenario, trimmed, nextTurn),
          },
        ]);
      } catch (error) {
        console.error("Customer AI fetch error:", error);
        messageIdRef.current += 1;
        setMessages((current) => [
          ...current,
          {
            id: messageIdRef.current,
            sender: "bot",
            text: buildBotReply(selectedScenario, trimmed, nextTurn),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    })();
  };

  const submitAiPrompt = () => {
    const trimmed = aiPrompt.trim();
    if (!trimmed || aiResponding) return;

    aiMessageIdRef.current += 1;
    const userMessage: AiAssistantMessage = {
      id: aiMessageIdRef.current,
      sender: "user",
      text: trimmed,
    };
    const nextMessages = [...aiAssistantMessages, userMessage];

    setAiAssistantMessages(nextMessages);
    setAiPrompt("");
    setAiResponding(true);

    void (async () => {
      try {
        const response = await fetch("/api/ai/admin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            messages: nextMessages.map((message) => ({
              sender: message.sender,
              text: message.text,
            })),
          }),
        });

        const result = (await response.json()) as {
          success: boolean;
          message?: string;
          data?: {
            reply: string;
          };
        };

        aiMessageIdRef.current += 1;
        setAiAssistantMessages((current) => [
          ...current,
          {
            id: aiMessageIdRef.current,
            sender: "assistant",
            text:
              response.ok && result.success && result.data?.reply
                ? result.data.reply
                : result.message ?? buildLecturerAssistantReply(trimmed),
          },
        ]);
      } catch (error) {
        console.error("Admin AI fetch error:", error);
        aiMessageIdRef.current += 1;
        setAiAssistantMessages((current) => [
          ...current,
          {
            id: aiMessageIdRef.current,
            sender: "assistant",
            text: buildLecturerAssistantReply(trimmed),
          },
        ]);
      } finally {
        setAiResponding(false);
      }
    })();
  };

  const saveAdminScenario = () => {
    setScenarios((current) => current.map((scenario) => (scenario.id === adminDraft.id ? adminDraft : scenario)));
    if (selectedScenarioId === adminDraft.id) resetSimulation(adminDraft);
  };

  const saveLecturerEvaluation = (attempt: AttemptRecord, score: string, notes: string) => {
    setLecturerEvaluations((current) => ({
      ...current,
      [attempt.id]: {
        attemptId: attempt.id,
        score,
        notes,
        updatedAt: formatToday(),
      },
    }));
  };

  const saveUser = async () => {
    const name = userDraft.name.trim();
    const email = userDraft.email.trim().toLowerCase();
    const password = userDraft.password.trim();

    if (!name || !email) return;

    setUserActionError("");
    setUserActionMessage("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          role: userDraft.role,
          password: password || undefined,
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
        data?: UserRecord;
      };

      if (!response.ok || !result.success || !result.data) {
        setUserActionError(result.message ?? "User gagal disimpan");
        return;
      }

      setUsers((current) => {
        const existingUser = current.find((user) => user.email === email);

        if (existingUser) {
          return current.map((user) =>
            user.email === email ? result.data as UserRecord : user,
          );
        }

        return [result.data as UserRecord, ...current];
      });

      setUserActionMessage(
        password
          ? `User ${email} tersimpan dan bisa login dengan password yang diisi.`
          : `User ${email} diperbarui dan tetap memakai password lama.`,
      );
      setUserDraft(defaultUserDraft);
    } catch (error) {
      console.error("Save user error:", error);
      setUserActionError("Terjadi kesalahan saat menyimpan user.");
    }
  };

  const toggleUserStatus = async (userId: number) => {
    const targetUser = users.find((user) => user.id === userId);

    if (!targetUser) return;

    const nextStatus = targetUser.status === "aktif" ? "nonaktif" : "aktif";
    setUserActionError("");
    setUserActionMessage("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: userId,
          status: nextStatus,
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
        data?: UserRecord;
      };

      if (!response.ok || !result.success || !result.data) {
        setUserActionError(result.message ?? "Status user gagal diperbarui");
        return;
      }

      setUsers((current) =>
        current.map((user) => (user.id === userId ? result.data as UserRecord : user)),
      );
      setUserActionMessage(`Status ${targetUser.email} diubah menjadi ${nextStatus}.`);
    } catch (error) {
      console.error("Toggle user status error:", error);
      setUserActionError("Terjadi kesalahan saat memperbarui status user.");
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#eef4ff,_#fef2f2_45%,_#fff7ed)]">
        <div className="rounded-[2rem] border border-white/60 bg-white/80 px-8 py-6 shadow-2xl shadow-slate-200/60 backdrop-blur">
          <p className="text-sm font-medium text-slate-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const features: Array<{ id: FeatureId; label: string; short: string }> = [
    { id: "ringkasan", label: "Ringkasan", short: "RS" },
    { id: "materi", label: "Materi", short: "MT" },
    {
      id: "simulasi",
      label: userRole === "dosen" || userRole === "admin" ? "Chat AI" : "Chat Pelanggan",
      short: "AI",
    },
    { id: "progress", label: userRole === "dosen" ? "Nilai & Evaluasi" : "Progress", short: "PG" },
    ...(userRole === "admin" ? [{ id: "admin" as FeatureId, label: "Admin Editor", short: "AD" }] : []),
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef4ff,_#fef2f2_45%,_#fff7ed)]">
      <header className="border-b border-white/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-start justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">Aplikasi E-Learning CS</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">AI Chatbot Simulasi Pelanggan</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {getHeaderDescription(userRole as Exclude<UserRole, "">, userEmail)}
            </p>
          </div>
          <button onClick={handleLogout} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_2.95fr] lg:px-8">
        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-white/60 bg-white/70 p-5 shadow-2xl shadow-slate-200/60 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">{getPortalLabel(userRole as Exclude<UserRole, "">)}</p>
            <h2 className="mt-3 text-xl font-bold text-slate-900">{getMenuHeading(userRole as Exclude<UserRole, "">)}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {getMenuDescription(userRole as Exclude<UserRole, "">)}
            </p>
            <nav className="mt-5 space-y-2">
              {features.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                    activeFeature === feature.id ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-700 hover:bg-rose-50"
                  }`}
                >
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold ${activeFeature === feature.id ? "bg-white/15 text-white" : "bg-rose-100 text-rose-600"}`}>
                    {feature.short}
                  </span>
                  {feature.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="rounded-[2rem] border border-white/60 bg-white/70 p-5 shadow-2xl shadow-slate-200/60 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Metrik Uji Minimum</p>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">Dialog coverage: {scenarioCoverage}/5 skenario</div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">Skor rata-rata trainee: {averageProgress}/10</div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">Konsistensi: ulangi skenario yang sama untuk membandingkan skor.</div>
            </div>
          </div>
        </aside>

        <main className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-2xl shadow-slate-200/60 backdrop-blur sm:p-8">
          {activeFeature === "ringkasan" && <OverviewPanel scenarios={scenarios} selectedScenario={selectedScenario} handleScenarioSelect={handleScenarioSelect} rubric={rubric} materials={materials} userRole={userRole} />}
          {activeFeature === "materi" && <MaterialPanel userRole={userRole} userEmail={userEmail} materials={materials} materialDraft={materialDraft} setMaterialDraft={setMaterialDraft} materialAttachment={materialAttachment} materialAttachmentError={materialAttachmentError} handleMaterialFileChange={handleMaterialFileChange} clearMaterialAttachment={() => { setMaterialAttachment(null); setMaterialAttachmentError(""); }} submitMaterial={submitMaterial} />}
          {activeFeature === "simulasi" &&
            (userRole === "dosen" || userRole === "admin" ? (
              <LecturerAiPanel
                messages={aiAssistantMessages}
                prompt={aiPrompt}
                setPrompt={setAiPrompt}
                submitPrompt={submitAiPrompt}
                isResponding={aiResponding}
              />
            ) : (
              <SimulationPanel scenarios={scenarios} selectedScenario={selectedScenario} handleScenarioSelect={handleScenarioSelect} messages={messages} reply={reply} setReply={setReply} submitReply={submitReply} evaluation={evaluation} isTyping={isTyping} turn={turn} rubric={rubric} resetSimulation={() => resetSimulation(selectedScenario)} />
            ))}
          {activeFeature === "progress" &&
            (userRole === "dosen" ? (
              <LecturerEvaluationPanel
                attempts={attempts}
                evaluations={lecturerEvaluations}
                saveEvaluation={saveLecturerEvaluation}
              />
            ) : (
              <ProgressPanel attempts={attempts} evaluations={lecturerEvaluations} currentUserEmail={userEmail} />
            ))}
          {activeFeature === "admin" && userRole === "admin" && <AdminPanel scenarios={scenarios} rubric={rubric} adminDraft={adminDraft} setAdminDraft={setAdminDraft} setRubric={setRubric} saveAdminScenario={saveAdminScenario} handleScenarioSelect={handleScenarioSelect} users={users} userDraft={userDraft} setUserDraft={setUserDraft} saveUser={saveUser} toggleUserStatus={toggleUserStatus} userActionMessage={userActionMessage} userActionError={userActionError} />}
        </main>
      </div>
    </div>
  );
}

function OverviewPanel({
  scenarios,
  selectedScenario,
  handleScenarioSelect,
  rubric,
  materials,
  userRole,
}: {
  scenarios: Scenario[];
  selectedScenario: Scenario;
  handleScenarioSelect: (scenarioId: string) => void;
  rubric: Rubric;
  materials: Material[];
  userRole: UserRole;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">Deskripsi Singkat</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          {userRole === "admin"
            ? "Ringkasan dashboard admin"
            : userRole === "dosen"
              ? "Ringkasan dashboard dosen"
              : "Latihan menghadapi pelanggan yang sedang komplain"}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          {userRole === "admin"
            ? "Administrator dapat memantau konten pembelajaran, memeriksa skenario simulasi, dan membuka panel admin untuk mengelola user serta rubrik penilaian dari satu tempat."
            : userRole === "dosen"
              ? "Pantau materi yang sudah dibagikan ke mahasiswa, siapkan aktivitas pembelajaran, dan lanjutkan evaluasi hasil chat pelanggan mahasiswa dari satu dashboard."
              : "Peserta berlatih dialog dengan chatbot pelanggan untuk menghadapi komplain, refund, dan permintaan informasi produk. Setelah uji 5 dialog, sistem memberi skor otomatis untuk empati, ketepatan solusi, dan penyelesaian berikut komentar."}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard label="Skenario CS" value={`${scenarios.length}`} tone="rose" />
        <StatCard label="Rubrik Penilaian" value="3 aspek" tone="amber" />
        <StatCard label={userRole === "dosen" ? "Materi Terkirim" : "Materi Masuk"} value={`${materials.length} item`} tone="sky" />
      </div>

      {userRole === "dosen" ? (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Materi terkirim ke mahasiswa</p>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                {materials.length} materi
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {materials.slice(0, 4).map((material) => (
                <div key={material.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-700">
                      {material.week}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                      {material.course}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-slate-900">{material.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{material.summary}</p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    Dikirim {material.sentAt}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Status dashboard dosen</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Materi yang muncul di sini adalah materi yang sama dengan yang tampil pada dashboard mahasiswa, sehingga dosen bisa mengecek kiriman terbaru dengan cepat.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Rubrik aktif</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-900">
                <li>Empati keywords: {rubric.empatiKeywords.join(", ")}</li>
                <li>Ketepatan keywords: {rubric.accuracyKeywords.join(", ")}</li>
                <li>Penyelesaian keywords: {rubric.resolutionKeywords.join(", ")}</li>
                <li>Panjang minimal jawaban: {rubric.minimumResponseLength} karakter</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Daftar skenario CS</p>
            <div className="mt-4 space-y-3">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handleScenarioSelect(scenario.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${scenario.id === selectedScenario.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-rose-50"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">{scenario.title}</h3>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${scenario.id === selectedScenario.id ? "bg-white/10 text-white" : "bg-amber-100 text-amber-700"}`}>
                      {scenario.category}
                    </span>
                  </div>
                  <p className={`mt-2 text-sm ${scenario.id === selectedScenario.id ? "text-white/80" : "text-slate-500"}`}>{scenario.opening}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Peran AI</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                AI berperan sebagai pelanggan yang sedang komplain dengan variasi emosi dan urgensi. Tugas mahasiswa adalah merespons keluhan itu dengan empati,
                solusi yang tepat, dan penutupan yang meyakinkan.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Rubrik aktif</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-900">
                <li>Empati keywords: {rubric.empatiKeywords.join(", ")}</li>
                <li>Ketepatan keywords: {rubric.accuracyKeywords.join(", ")}</li>
                <li>Penyelesaian keywords: {rubric.resolutionKeywords.join(", ")}</li>
                <li>Panjang minimal jawaban: {rubric.minimumResponseLength} karakter</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MaterialPanel({
  userRole,
  userEmail,
  materials,
  materialDraft,
  setMaterialDraft,
  materialAttachment,
  materialAttachmentError,
  handleMaterialFileChange,
  clearMaterialAttachment,
  submitMaterial,
}: {
  userRole: UserRole;
  userEmail: string;
  materials: Material[];
  materialDraft: MaterialDraft;
  setMaterialDraft: (value: MaterialDraft) => void;
  materialAttachment: MaterialAttachment | null;
  materialAttachmentError: string;
  handleMaterialFileChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => Promise<void>;
  clearMaterialAttachment: () => void;
  submitMaterial: () => void;
}) {
  const canSendMaterial = userRole === "dosen";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">
            Materi Pembelajaran
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            {canSendMaterial ? "Kirim materi ke dashboard mahasiswa" : "Materi dari dosen"}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {canSendMaterial
              ? "Dosen dapat membagikan ringkasan materi, instruksi latihan, dan tautan pendukung. Setiap kiriman akan langsung muncul di dashboard mahasiswa."
              : "Mahasiswa dapat membaca materi terbaru dari dosen, membuka tautan pendukung, dan memakai instruksinya sebagai bekal sebelum simulasi."}
          </p>
        </div>
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          {materials.length} materi tersedia
        </div>
      </div>

      <div className={`grid gap-4 ${canSendMaterial ? "xl:grid-cols-[1.08fr_1.92fr]" : "xl:grid-cols-[1fr]"}`}>
        {canSendMaterial && (
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Form kirim materi
            </p>
            <div className="mt-4 grid gap-4">
              <input
                value={materialDraft.title}
                onChange={(event) => setMaterialDraft({ ...materialDraft, title: event.target.value })}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                placeholder="Judul materi"
              />
              <input
                value={materialDraft.course}
                onChange={(event) => setMaterialDraft({ ...materialDraft, course: event.target.value })}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                placeholder="Mata kuliah atau topik"
              />
              <input
                value={materialDraft.week}
                onChange={(event) => setMaterialDraft({ ...materialDraft, week: event.target.value })}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                placeholder="Contoh: Minggu 3"
              />
              <textarea
                value={materialDraft.summary}
                onChange={(event) => setMaterialDraft({ ...materialDraft, summary: event.target.value })}
                className="min-h-24 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                placeholder="Ringkasan singkat materi"
              />
              <textarea
                value={materialDraft.content}
                onChange={(event) => setMaterialDraft({ ...materialDraft, content: event.target.value })}
                className="min-h-36 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                placeholder="Isi materi atau instruksi pembelajaran"
              />
              <input
                value={materialDraft.link}
                onChange={(event) => setMaterialDraft({ ...materialDraft, link: event.target.value })}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                placeholder="Link pendukung (opsional)"
              />
              <div className="rounded-2xl border border-slate-300 bg-white px-4 py-4">
                <label className="block text-sm font-medium text-slate-700">
                  File materi untuk mahasiswa
                </label>
                <input
                  type="file"
                  onChange={(event) => {
                    void handleMaterialFileChange(event);
                  }}
                  className="mt-3 block w-full text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Format umum seperti PDF, Word, PowerPoint, Excel, TXT, JPG, dan PNG didukung. Maksimal 2 MB.
                </p>
                {materialAttachment && (
                  <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">
                        {materialAttachment.name}
                      </p>
                      <p className="mt-1 text-xs text-emerald-700">
                        {formatFileSize(materialAttachment.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearMaterialAttachment}
                      className="rounded-xl border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-white"
                    >
                      Hapus file
                    </button>
                  </div>
                )}
                {materialAttachmentError && (
                  <p className="mt-3 text-sm text-red-600">{materialAttachmentError}</p>
                )}
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                Pengirim aktif: {userEmail || "Dosen"}.
                Materi akan tersimpan di browser ini agar mahasiswa bisa langsung melihatnya dari dashboard.
              </div>
              <button
                onClick={submitMaterial}
                disabled={
                  !materialDraft.title.trim() ||
                  !materialDraft.course.trim() ||
                  !materialDraft.summary.trim() ||
                  !materialDraft.content.trim()
                }
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Kirim materi ke mahasiswa
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {materials.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-slate-300 p-10 text-center text-slate-500">
              Belum ada materi. {canSendMaterial ? "Silakan kirim materi pertama untuk mahasiswa." : "Tunggu dosen mengirim materi baru."}
            </div>
          ) : (
            materials.map((material) => (
              <article key={material.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-700">
                        {material.week}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                        {material.course}
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-slate-900">{material.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{material.summary}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                    {material.sentAt}
                  </div>
                </div>

                <div className="mt-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm leading-7 text-slate-700">{material.content}</p>
                </div>

                {material.attachment && (
                  <div className="mt-4 rounded-[1.5rem] border border-sky-100 bg-sky-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                      File Materi
                    </p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {material.attachment.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatFileSize(material.attachment.size)}
                        </p>
                      </div>
                      <a
                        href={material.attachment.dataUrl}
                        download={material.attachment.name}
                        className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                      >
                        Unduh file materi
                      </a>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">Dikirim oleh {material.sentBy}</p>
                  {material.link ? (
                    <a
                      href={material.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:bg-slate-50"
                    >
                      Buka link materi
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400">Tidak ada link tambahan</span>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function LecturerAiPanel({
  messages,
  prompt,
  setPrompt,
  submitPrompt,
  isResponding,
}: {
  messages: AiAssistantMessage[];
  prompt: string;
  setPrompt: (value: string) => void;
  submitPrompt: () => void;
  isResponding: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">Asisten Dosen</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Chat Bot AI untuk admin dan dosen</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Gunakan asisten ini untuk menjawab kebutuhan admin maupun dosen, seperti materi, tugas, kuis, evaluasi, skenario chatbot, pengelolaan user, sampai ide pengembangan dashboard.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Siap bantu berbagai kebutuhan
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_1.95fr]">
        <div className="space-y-4">
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Contoh perintah</p>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <button onClick={() => setPrompt("Bantu saya buat ringkasan materi komunikasi empatik untuk mahasiswa semester 3")} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:bg-rose-50">
                Buat ringkasan materi komunikasi empatik
              </button>
              <button onClick={() => setPrompt("Tolong buat ide tugas studi kasus layanan pelanggan untuk minggu 2")} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:bg-rose-50">
                Buat ide tugas studi kasus
              </button>
              <button onClick={() => setPrompt("Bantu susun alur pertemuan 90 menit untuk topik penanganan komplain")} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:bg-rose-50">
                Susun alur pertemuan 90 menit
              </button>
              <button onClick={() => setPrompt("Bantu saya buat rubric penilaian latihan chat pelanggan untuk mahasiswa")} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:bg-rose-50">
                Buat rubric penilaian
              </button>
              <button onClick={() => setPrompt("Tolong beri saran fitur dashboard admin yang perlu diprioritaskan")} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:bg-rose-50">
                Beri saran fitur dashboard admin
              </button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">Saran penggunaan</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
              <li>Tuliskan topik atau masalah secara langsung, karena AI sekarang bisa menanggapi permintaan yang lebih umum.</li>
              <li>Minta output spesifik seperti ringkasan, tugas, kuis, rubric, alur kerja admin, atau rekomendasi fitur.</li>
              <li>Jika jawaban awal masih umum, lanjutkan dengan detail target pengguna, format output, dan tujuan akhirnya.</li>
            </ul>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,_#fff7ed,_#fff,_#eff6ff)] p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Chat bot AI</p>
            <p className="mt-1 text-sm text-slate-600">Tanyakan kebutuhan admin atau dosen Anda, lalu AI akan memberi saran yang bisa langsung dipakai.</p>
          </div>

          <div className="h-[26rem] overflow-y-auto rounded-[1.5rem] border border-white/70 bg-white/80 p-4">
            {messages.map((message) => (
              <div key={message.id} className={`mb-4 flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[86%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${message.sender === "user" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
                  {message.text}
                </div>
              </div>
            ))}

            {isResponding && (
              <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                AI sedang menyiapkan jawaban...
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitPrompt();
              }}
              placeholder="Contoh: bantu buat rubric penilaian atau saran fitur dashboard admin"
              className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900"
            />
            <button
              onClick={submitPrompt}
              disabled={!prompt.trim() || isResponding}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Kirim ke AI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SimulationPanel({
  scenarios,
  selectedScenario,
  handleScenarioSelect,
  messages,
  reply,
  setReply,
  submitReply,
  evaluation,
  isTyping,
  turn,
  rubric,
  resetSimulation,
}: {
  scenarios: Scenario[];
  selectedScenario: Scenario;
  handleScenarioSelect: (scenarioId: string) => void;
  messages: Message[];
  reply: string;
  setReply: (value: string) => void;
  submitReply: () => void;
  evaluation: Evaluation | null;
  isTyping: boolean;
  turn: number;
  rubric: Rubric;
  resetSimulation: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">Use-case Utama</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Chat dengan AI pelanggan yang komplain</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Pilih skenario komplain, balas sebagai customer service trainee, lalu sistem menilai otomatis setelah 4 balasan.</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Dialog uji: {turn}/4</div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1.9fr]">
        <div className="space-y-4">
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Pilih skenario</p>
            <div className="mt-4 space-y-3">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handleScenarioSelect(scenario.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${selectedScenario.id === scenario.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-rose-50"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">{scenario.title}</h3>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${selectedScenario.id === scenario.id ? "bg-white/10 text-white" : "bg-sky-100 text-sky-700"}`}>
                      {scenario.emotion}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Detail skenario</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="font-semibold text-slate-900">Produk</dt><dd className="text-slate-600">{selectedScenario.product}</dd></div>
              <div><dt className="font-semibold text-slate-900">Peran AI</dt><dd className="text-slate-600">Pelanggan yang sedang menyampaikan komplain</dd></div>
              <div><dt className="font-semibold text-slate-900">Urgensi</dt><dd className="text-slate-600">{selectedScenario.urgency}</dd></div>
              <div><dt className="font-semibold text-slate-900">Hint</dt><dd className="text-slate-600">{selectedScenario.goodResponseHint}</dd></div>
            </dl>
          </div>

          <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">SOP layanan</p>
            <p className="mt-3 text-sm leading-6 text-emerald-900">Gunakan empati, jawaban spesifik, dan penutupan solusi. Minimal {rubric.minimumResponseLength} karakter.</p>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,_#fff7ed,_#fff,_#eff6ff)] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Chat pelanggan komplain</p>
              <p className="mt-1 text-sm text-slate-600">AI bertindak sebagai pelanggan yang mengeluh. Anda membalas sebagai customer service trainee.</p>
            </div>
            <button onClick={resetSimulation} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-900">Reset dialog</button>
          </div>

          <div className="h-[26rem] overflow-y-auto rounded-[1.5rem] border border-white/70 bg-white/80 p-4">
            {messages.map((message) => (
              <div key={message.id} className={`mb-4 flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[86%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${message.sender === "user" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
                  {message.text}
                </div>
              </div>
            ))}

            {isTyping && <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Pelanggan yang komplain sedang mengetik...</div>}

            {evaluation && (
              <div className="mt-6 rounded-[1.5rem] border border-sky-200 bg-sky-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Hasil skor + feedback</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">Skor akhir: {Math.round(evaluation.average * 10)}/100</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <ScoreCard label="Empati" score={evaluation.empati} tone="rose" />
                  <ScoreCard label="Ketepatan" score={evaluation.ketepatan} tone="amber" />
                  <ScoreCard label="Penyelesaian" score={evaluation.penyelesaian} tone="sky" />
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <CommentCard title="Empati" text={evaluation.comments.empati} />
                  <CommentCard title="Ketepatan" text={evaluation.comments.ketepatan} />
                  <CommentCard title="Penyelesaian" text={evaluation.comments.penyelesaian} />
                </div>
                <div className="mt-4 rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Rekomendasi kalimat perbaikan</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{evaluation.rewrite}</p>
                </div>
                <div className="mt-4 rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Saran per aspek</p>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                    {evaluation.suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {!evaluation && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input type="text" value={reply} onChange={(event) => setReply(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitReply(); }} placeholder="Balas komplain pelanggan. Contoh: mohon maaf, saya cek pesanan Anda sekarang dan akan update dalam 5 menit." className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 caret-slate-950 placeholder:font-normal placeholder:text-slate-500 outline-none transition focus:border-slate-900 focus:bg-white" />
              <button onClick={submitReply} disabled={!reply.trim() || isTyping} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300">Kirim jawaban</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LecturerEvaluationPanel({
  attempts,
  evaluations,
  saveEvaluation,
}: {
  attempts: AttemptRecord[];
  evaluations: Record<number, LecturerEvaluation>;
  saveEvaluation: (attempt: AttemptRecord, score: string, notes: string) => void;
}) {
  const sortedAttempts = [...attempts].sort((left, right) => right.id - left.id);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">Penilaian Dosen</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Input nilai dan evaluasi mahasiswa</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Dosen dapat melihat hasil chat pelanggan mahasiswa, memberi nilai akhir, lalu menuliskan evaluasi yang akan muncul kembali di dashboard mahasiswa.
        </p>
      </div>

      {sortedAttempts.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 p-10 text-center text-slate-500">
          Belum ada hasil chat pelanggan dari mahasiswa di browser ini.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedAttempts.map((attempt) => (
            <LecturerEvaluationCard
              key={`${attempt.id}-${evaluations[attempt.id]?.updatedAt ?? "draft"}`}
              attempt={attempt}
              savedEvaluation={evaluations[attempt.id]}
              saveEvaluation={saveEvaluation}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LecturerEvaluationCard({
  attempt,
  savedEvaluation,
  saveEvaluation,
}: {
  attempt: AttemptRecord;
  savedEvaluation?: LecturerEvaluation;
  saveEvaluation: (attempt: AttemptRecord, score: string, notes: string) => void;
}) {
  const [score, setScore] = useState(savedEvaluation?.score ?? "");
  const [notes, setNotes] = useState(savedEvaluation?.notes ?? "");

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{attempt.date}</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{attempt.scenarioTitle}</h3>
          <p className="mt-2 text-sm text-slate-600">Mahasiswa: {attempt.studentEmail}</p>
        </div>
        <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
          Skor AI: {attempt.average}/10
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ScoreCard label="Empati" score={attempt.empati} tone="rose" />
        <ScoreCard label="Ketepatan" score={attempt.ketepatan} tone="amber" />
        <ScoreCard label="Penyelesaian" score={attempt.penyelesaian} tone="sky" />
      </div>

      <div className="mt-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Jawaban akhir mahasiswa</p>
        <p className="mt-3 text-sm leading-7 text-slate-700">{attempt.finalReply}</p>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nilai dosen</label>
          <input
            value={score}
            onChange={(event) => setScore(event.target.value)}
            placeholder="Contoh: 85"
            className="mt-2 block w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Evaluasi dosen</label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Tulis evaluasi untuk mahasiswa"
            className="mt-2 min-h-28 block w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => saveEvaluation(attempt, score.trim(), notes.trim())}
          disabled={!score.trim() || !notes.trim()}
          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Simpan nilai dan evaluasi
        </button>
        {savedEvaluation && (
          <p className="text-sm text-slate-500">Terakhir diperbarui: {savedEvaluation.updatedAt}</p>
        )}
      </div>
    </div>
  );
}

function ProgressPanel({
  attempts,
  evaluations,
  currentUserEmail,
}: {
  attempts: AttemptRecord[];
  evaluations: Record<number, LecturerEvaluation>;
  currentUserEmail: string;
}) {
  const userAttempts = attempts.filter((attempt) => attempt.studentEmail === currentUserEmail);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">Rekap performa trainee</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Progress latihan</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Log percakapan digunakan untuk evaluasi konsistensi, peningkatan skor, dan umpan balik dosen dari hasil chat pelanggan Anda.</p>
      </div>

      {userAttempts.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 p-10 text-center text-slate-500">Belum ada log percakapan. Mulai satu simulasi terlebih dahulu.</div>
      ) : (
        <div className="space-y-4">
          {userAttempts.map((attempt) => (
            <div key={attempt.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{attempt.date}</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{attempt.scenarioTitle}</h3>
                </div>
                <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Skor rata-rata: {attempt.average}/10</div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <ScoreCard label="Empati" score={attempt.empati} tone="rose" />
                <ScoreCard label="Ketepatan" score={attempt.ketepatan} tone="amber" />
                <ScoreCard label="Penyelesaian" score={attempt.penyelesaian} tone="sky" />
              </div>
              {evaluations[attempt.id] ? (
                <div className="mt-4 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-emerald-900">Nilai dosen: {evaluations[attempt.id].score}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">{evaluations[attempt.id].updatedAt}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-emerald-900">{evaluations[attempt.id].notes}</p>
                </div>
              ) : (
                <div className="mt-4 rounded-[1.5rem] border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  Belum ada evaluasi dosen untuk sesi ini.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminPanel({
  scenarios,
  rubric,
  adminDraft,
  setAdminDraft,
  setRubric,
  saveAdminScenario,
  handleScenarioSelect,
  users,
  userDraft,
  setUserDraft,
  saveUser,
  toggleUserStatus,
  userActionMessage,
  userActionError,
}: {
  scenarios: Scenario[];
  rubric: Rubric;
  adminDraft: Scenario;
  setAdminDraft: (value: Scenario) => void;
  setRubric: (value: Rubric) => void;
  saveAdminScenario: () => void;
  handleScenarioSelect: (scenarioId: string) => void;
  users: UserRecord[];
  userDraft: UserDraft;
  setUserDraft: (value: UserDraft) => void;
  saveUser: () => void;
  toggleUserStatus: (userId: number) => void;
  userActionMessage: string;
  userActionError: string;
}) {
  const activeUsers = users.filter((user) => user.status === "aktif").length;
  const lecturerCount = users.filter((user) => user.role === "dosen").length;
  const studentCount = users.filter((user) => user.role === "mahasiswa").length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">Panel Admin</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Manajemen user, skenario, dan rubrik</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Administrator dapat mengelola akun pengguna, mengubah skenario CS, kalimat pembuka, follow-up pelanggan, dan kata kunci rubrik penilaian.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard label="User Aktif" value={`${activeUsers}`} tone="rose" />
        <StatCard label="Dosen" value={`${lecturerCount}`} tone="amber" />
        <StatCard label="Mahasiswa" value={`${studentCount}`} tone="sky" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Tambah atau update user</p>
          <div className="mt-4 grid gap-4">
            <input
              value={userDraft.name}
              onChange={(event) => setUserDraft({ ...userDraft, name: event.target.value })}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900"
              placeholder="Nama lengkap"
            />
            <input
              value={userDraft.email}
              onChange={(event) => setUserDraft({ ...userDraft, email: event.target.value })}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900"
              placeholder="Email user"
            />
            <select
              value={userDraft.role}
              onChange={(event) => setUserDraft({ ...userDraft, role: event.target.value as Exclude<UserRole, ""> })}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
            >
              <option value="admin">Administrator</option>
              <option value="dosen">Dosen</option>
              <option value="mahasiswa">Mahasiswa</option>
            </select>
            <input
              type="password"
              value={userDraft.password}
              onChange={(event) => setUserDraft({ ...userDraft, password: event.target.value })}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900"
              placeholder="Password untuk user baru atau reset password"
            />
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
              User yang dibuat di sini langsung tersambung ke halaman login. Untuk user baru, password wajib diisi. Jika email sudah ada, kosongkan password agar password lama tetap dipakai.
            </div>
            {userActionError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                {userActionError}
              </div>
            )}
            {userActionMessage && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                {userActionMessage}
              </div>
            )}
            <button
              onClick={saveUser}
              disabled={!userDraft.name.trim() || !userDraft.email.trim()}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Simpan user
            </button>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Daftar user</p>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
              {users.length} akun
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">
                        {user.role}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${user.status === "aktif" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                        {user.status}
                      </span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-slate-900">{user.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">{user.email}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">Terdaftar {user.createdAt}</p>
                  </div>
                  <button
                    onClick={() => toggleUserStatus(user.id)}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:bg-white"
                  >
                    {user.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Pilih skenario</p>
          <div className="mt-4 space-y-3">
            {scenarios.map((scenario) => (
              <button key={scenario.id} onClick={() => handleScenarioSelect(scenario.id)} className={`w-full rounded-2xl border px-4 py-4 text-left transition ${adminDraft.id === scenario.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-rose-50"}`}>
                {scenario.title}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Editor skenario</p>
            <div className="mt-4 grid gap-4">
              <input value={adminDraft.title} onChange={(event) => setAdminDraft({ ...adminDraft, title: event.target.value })} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900" placeholder="Judul skenario" />
              <textarea value={adminDraft.opening} onChange={(event) => setAdminDraft({ ...adminDraft, opening: event.target.value })} className="min-h-28 rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900" placeholder="Pembuka pelanggan" />
              <textarea value={adminDraft.followUps.join("\n")} onChange={(event) => setAdminDraft({ ...adminDraft, followUps: event.target.value.split("\n").filter(Boolean) })} className="min-h-32 rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900" placeholder="Satu follow-up per baris" />
              <button onClick={saveAdminScenario} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">Simpan skenario</button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Editor rubrik scoring</p>
            <div className="mt-4 grid gap-4">
              <textarea value={rubric.empatiKeywords.join(", ")} onChange={(event) => setRubric({ ...rubric, empatiKeywords: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} className="min-h-24 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500" placeholder="Keyword empati dipisah koma" />
              <textarea value={rubric.accuracyKeywords.join(", ")} onChange={(event) => setRubric({ ...rubric, accuracyKeywords: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} className="min-h-24 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500" placeholder="Keyword ketepatan dipisah koma" />
              <textarea value={rubric.resolutionKeywords.join(", ")} onChange={(event) => setRubric({ ...rubric, resolutionKeywords: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} className="min-h-24 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500" placeholder="Keyword penyelesaian dipisah koma" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "rose" | "amber" | "sky" }) {
  const toneClasses = {
    rose: "border-rose-100 bg-rose-50 text-rose-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    sky: "border-sky-100 bg-sky-50 text-sky-700",
  };

  return (
    <div className={`rounded-[1.75rem] border p-5 ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}

function ScoreCard({ label, score, tone }: { label: string; score: number; tone: "rose" | "amber" | "sky" }) {
  const toneClasses = {
    rose: "border-rose-100 bg-rose-50 text-rose-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    sky: "border-sky-100 bg-sky-50 text-sky-700",
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-2 text-2xl font-bold">{score}/10</p>
    </div>
  );
}

function CommentCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

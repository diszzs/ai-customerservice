import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, type StoredUser, type UserRole } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { getSessionByToken } from "@/lib/session-store";
import {
  findUserByEmail,
  getUsers,
  updateUserStatus,
  upsertUser,
} from "@/lib/user-store";
import {
  isValidEmail,
  isValidName,
  validatePasswordStrength,
} from "@/lib/validation";

/* ===================== TYPES ===================== */
type UserDto = {
  id: string; // 🔥 FIX: dari number → string
  name: string;
  email: string;
  role: UserRole;
  status: StoredUser["status"];
  createdAt: string;
};

const userRoles: UserRole[] = ["admin", "dosen", "mahasiswa"];

/* ===================== MAPPER ===================== */
function toUserDto(user: any): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };
}

/* ===================== AUTH ===================== */
async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await getSessionByToken(token);
  if (!session) return null;

  const user = await findUserByEmail(session.email);

  if (!user || user.status !== "aktif" || user.role !== "admin") {
    return null;
  }

  return user;
}

/* ===================== GET USERS ===================== */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Akses admin diperlukan" },
      { status: 403 }
    );
  }

  const users = await getUsers();

  return NextResponse.json({
    success: true,
    data: users.map(toUserDto),
  });
}

/* ===================== CREATE / UPDATE USER ===================== */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Akses admin diperlukan" },
      { status: 403 }
    );
  }

  const body = await request.json();

  const name = body.name ?? "";
  const email = body.email ?? "";
  const password = body.password ?? "";

  const role = userRoles.includes(body.role)
    ? body.role
    : "mahasiswa";

  const existingUser = await findUserByEmail(email);

  /* VALIDASI */
  if (!isValidName(name)) {
    return NextResponse.json(
      { success: false, message: "Nama tidak valid" },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { success: false, message: "Email tidak valid" },
      { status: 400 }
    );
  }

  if (!existingUser && !password) {
    return NextResponse.json(
      { success: false, message: "Password wajib untuk user baru" },
      { status: 400 }
    );
  }

  let passwordHash: string | undefined;

  if (password) {
    const validation = validatePasswordStrength(password);

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: validation.errors[0] },
        { status: 400 }
      );
    }

    passwordHash = await hashPassword(password);
  }

  const savedUser = await upsertUser({
    name,
    email,
    role,
    passwordHash,
  });

  if (!savedUser) {
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan user" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: toUserDto(savedUser),
  });
}

/* ===================== UPDATE STATUS ===================== */
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request);

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Akses admin diperlukan" },
      { status: 403 }
    );
  }

  const body = await request.json();

  const id = body.id;
  const status = body.status;

  if (!id || (status !== "aktif" && status !== "nonaktif")) {
    return NextResponse.json(
      { success: false, message: "Data tidak valid" },
      { status: 400 }
    );
  }

  // 🔥 FIX: id sekarang string
  if (id === admin.id && status === "nonaktif") {
    return NextResponse.json(
      { success: false, message: "Tidak bisa nonaktifkan diri sendiri" },
      { status: 400 }
    );
  }

  const updatedUser = await updateUserStatus({
    id,
    status,
  });

  if (!updatedUser) {
    return NextResponse.json(
      { success: false, message: "User tidak ditemukan" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: toUserDto(updatedUser),
  });
}
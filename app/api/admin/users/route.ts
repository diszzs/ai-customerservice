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

type UserDto = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: StoredUser["status"];
  createdAt: string;
};

const userRoles: UserRole[] = ["admin", "dosen", "mahasiswa"];

function toUserDto(user: StoredUser): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };
}

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

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Akses admin diperlukan" },
      { status: 403 },
    );
  }

  const users = await getUsers();

  return NextResponse.json({
    success: true,
    data: users.map(toUserDto),
  });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Akses admin diperlukan" },
      { status: 403 },
    );
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    role?: UserRole;
    password?: string;
  };
  const name = body.name ?? "";
  const email = body.email ?? "";
  const password = body.password ?? "";
  const role = userRoles.includes(body.role as UserRole)
    ? (body.role as UserRole)
    : "mahasiswa";
  const existingUser = await findUserByEmail(email);

  if (!isValidName(name)) {
    return NextResponse.json(
      {
        success: false,
        message: "Nama harus 3-100 karakter, hanya huruf/spasi/tanda baca",
      },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { success: false, message: "Format email tidak valid" },
      { status: 400 },
    );
  }

  if (!existingUser && !password) {
    return NextResponse.json(
      { success: false, message: "Password wajib diisi untuk user baru" },
      { status: 400 },
    );
  }

  let passwordHash: string | undefined;

  if (password) {
    const passwordValidation = validatePasswordStrength(password);

    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { success: false, message: passwordValidation.errors[0] },
        { status: 400 },
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
      { success: false, message: "User gagal disimpan" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    data: toUserDto(savedUser),
  });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request);

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Akses admin diperlukan" },
      { status: 403 },
    );
  }

  const body = (await request.json()) as {
    id?: number;
    status?: StoredUser["status"];
  };

  if (!body.id || (body.status !== "aktif" && body.status !== "nonaktif")) {
    return NextResponse.json(
      { success: false, message: "Data status user tidak valid" },
      { status: 400 },
    );
  }

  if (body.id === admin.id && body.status === "nonaktif") {
    return NextResponse.json(
      { success: false, message: "Admin yang sedang login tidak bisa dinonaktifkan" },
      { status: 400 },
    );
  }

  const updatedUser = await updateUserStatus({
    id: body.id,
    status: body.status,
  });

  if (!updatedUser) {
    return NextResponse.json(
      { success: false, message: "User tidak ditemukan" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    data: toUserDto(updatedUser),
  });
}

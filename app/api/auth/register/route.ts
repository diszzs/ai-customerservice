import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/crypto";
import type { UserRole } from "@/lib/auth";
import { createUser } from "@/lib/user-store";
import { validateRegistrationInput } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body as {
      name?: string;
      email?: string;
      password?: string;
      role?: UserRole;
    };
    const allowedRoles: UserRole[] = ["dosen", "mahasiswa"];
    const selectedRole = allowedRoles.includes(body.role as UserRole)
      ? (body.role as UserRole)
      : "mahasiswa";

    // Validate input
    const validation = validateRegistrationInput(
      name ?? "",
      email ?? "",
      password ?? "",
    );
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          errors: validation.errors,
          message: "Validasi input gagal",
        },
        { status: 400 },
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password ?? "");

    const newUser = await createUser({
      name: name ?? "",
      email: email ?? "",
      passwordHash,
      role: selectedRole,
    });

    if (!newUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Email sudah terdaftar",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
        message: "Pendaftaran berhasil",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server",
      },
      { status: 500 },
    );
  }
}

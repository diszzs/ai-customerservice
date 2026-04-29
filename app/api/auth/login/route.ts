import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/crypto";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { createSession } from "@/lib/session-store";
import { findUserByEmail } from "@/lib/user-store";
import { validateLoginInput } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as {
      email?: string;
      password?: string;
    };

    // Validate input
    const validation = validateLoginInput(email ?? "", password ?? "");
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

    const user = await findUserByEmail(email ?? "");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Email atau password salah",
        },
        { status: 401 },
      );
    }

    if (user.status !== "aktif") {
      return NextResponse.json(
        {
          success: false,
          message: "Akun Anda sedang nonaktif",
        },
        { status: 403 },
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(
      password ?? "",
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Email atau password salah",
        },
        { status: 401 },
      );
    }

    const session = await createSession(user);

    // Return user data (without password hash)
    const response = NextResponse.json(
      {
        success: true,
        data: {
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 200 },
    );

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: session.token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(session.expiresAt),
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server",
      },
      { status: 500 },
    );
  }
}

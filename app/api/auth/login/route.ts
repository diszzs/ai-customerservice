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

    const validation = validateLoginInput(email ?? "", password ?? "");
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, errors: validation.errors },
        { status: 400 }
      );
    }

    console.log("Finding user:", email);
    const user = await findUserByEmail(email!);
    console.log("User found:", user ? "yes" : "no", "passwordHash:", user?.passwordHash ? "exists" : "missing");
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
      );
    }

    if (user.status !== "aktif") {
      return NextResponse.json(
        { success: false, message: "Akun nonaktif" },
        { status: 403 }
      );
    }

    console.log("Verifying password...");
    const valid = await verifyPassword(password!, user.passwordHash);
    console.log("Password valid:", valid);
    
    if (!valid) {
      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
      );
    }

    console.log("Creating session...");
    const session = await createSession(user);

    const res = NextResponse.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    res.cookies.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(session.expiresAt),
    });

    return res;
  } catch (err) {
    console.error("Login error:", err);
    console.error("Login error stack:", err instanceof Error ? err.stack : String(err));
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
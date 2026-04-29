import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { deleteSession, getSessionByToken } from "@/lib/session-store";
import { findUserByEmail } from "@/lib/user-store";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "Belum login",
      },
      { status: 401 },
    );
  }

  const session = await getSessionByToken(token);

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        message: "Sesi tidak valid",
      },
      { status: 401 },
    );
  }

  const user = await findUserByEmail(session.email);

  if (!user || user.status !== "aktif") {
    await deleteSession(token);

    return NextResponse.json(
      {
        success: false,
        message: "Sesi tidak valid",
      },
      { status: 401 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        email: user.email,
        role: user.role,
        name: user.name,
      },
    },
    { status: 200 },
  );
}

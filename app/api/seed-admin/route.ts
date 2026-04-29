import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/crypto";
import { createUser } from "@/lib/user-store";

export async function GET() {
  const passwordHash = await hashPassword("Admin123");

  const user = await createUser({
    name: "Administrator",
    email: "admin@elearning.local",
    passwordHash,
    role: "admin",
  });

  return NextResponse.json({
    success: true,
    data: user,
  });
}
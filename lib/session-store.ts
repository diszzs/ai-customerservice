import { connectDB } from "@/lib/mongodb";
import Session from "./models/Session";
import { randomUUID } from "node:crypto";
import { SESSION_DURATION_MS, type StoredUser } from "@/lib/auth";

/* ===================== CREATE SESSION ===================== */
export async function createSession(user: StoredUser) {
  await connectDB();

  const session = await Session.create({
    token: randomUUID(),
    email: user.email,
    role: user.role,
    name: user.name,
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
  });

  return {
    token: session.token,
    email: session.email,
    role: session.role,
    name: session.name,
    expiresAt: session.expiresAt.toISOString(),
  };
}

/* ===================== GET SESSION ===================== */
export async function getSessionByToken(token: string) {
  await connectDB();

  const session = await Session.findOne({ token });

  if (!session) return null;

  // cek expired
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await Session.deleteOne({ token });
    return null;
  }

  return {
    token: session.token,
    email: session.email,
    role: session.role,
    name: session.name,
    expiresAt: session.expiresAt.toISOString(),
  };
}

/* ===================== DELETE SESSION ===================== */
export async function deleteSession(token: string) {
  await connectDB();

  await Session.deleteOne({ token });
}
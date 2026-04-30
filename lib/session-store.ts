import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import Session from "@/lib/models/Session";
import { SESSION_DURATION_MS } from "@/lib/auth";

export type SessionData = {
  token: string;
  email: string;
  role: string;
  name: string;
  expiresAt: string; // ISO string
};

/* ================= CREATE SESSION ================= */
export async function createSession(user: {
  email: string;
  role: string;
  name: string;
}): Promise<SessionData> {
  await connectDB();

  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await Session.create({
    token,
    email: user.email,
    role: user.role,
    name: user.name,
    expiresAt,
  });

  return {
    token,
    email: user.email,
    role: user.role,
    name: user.name,
    expiresAt: expiresAt.toISOString(),
  };
}

/* ================= GET SESSION BY TOKEN ================= */
export async function getSessionByToken(
  token: string
): Promise<SessionData | null> {
  await connectDB();

  const session = await Session.findOne({
    token,
    expiresAt: { $gt: new Date() }, // belum expired
  });

  if (!session) return null;

  return {
    token: session.token,
    email: session.email,
    role: session.role,
    name: session.name,
    expiresAt: session.expiresAt.toISOString(),
  };
}

/* ================= DELETE SESSION ================= */
export async function deleteSession(token: string): Promise<void> {
  await connectDB();
  await Session.deleteOne({ token });
}

/* ================= DELETE ALL SESSIONS BY EMAIL ================= */
export async function deleteAllSessionsByEmail(email: string): Promise<void> {
  await connectDB();
  await Session.deleteMany({ email });
}
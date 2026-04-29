import { connectDB } from "@/lib/mongodb";
import Session from "@/lib/models/Session"; // <-- pakai alias biar konsisten
import { randomUUID } from "node:crypto";
import { SESSION_DURATION_MS, type StoredUser } from "@/lib/auth";

/* CREATE */
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

/* GET */
export async function getSessionByToken(token: string) {
  await connectDB();

  const session = await Session.findOne({ token });
  if (!session) return null;

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

/* DELETE */
export async function deleteSession(token: string) {
  await connectDB();
  await Session.deleteOne({ token });
}
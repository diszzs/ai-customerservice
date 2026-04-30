// v2
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import Session from "@/lib/models/Session";
import { SESSION_DURATION_MS } from "@/lib/auth";

export type SessionData = {
  token: string;
  email: string;
  role: string;
  name: string;
  expiresAt: string;
};

export async function createSession(user: {
  email: string;
  role: string;
  name: string;
}): Promise<SessionData> {
  await connectDB();

  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  console.log("Creating session for:", user.email);
  const doc = await Session.create({
    token,
    email: user.email,
    role: user.role,
    name: user.name,
    expiresAt,
  });
  console.log("Session doc created:", doc._id?.toString());

  return {
    token,
    email: user.email,
    role: user.role,
    name: user.name,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function getSessionByToken(
  token: string
): Promise<SessionData | null> {
  await connectDB();

  const session = await Session.findOne({
    token,
    expiresAt: { $gt: new Date() },
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

export async function deleteSession(token: string): Promise<void> {
  await connectDB();
  await Session.deleteOne({ token });
}

export async function deleteAllSessionsByEmail(email: string): Promise<void> {
  await connectDB();
  await Session.deleteMany({ email });
}
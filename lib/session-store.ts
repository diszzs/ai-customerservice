import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  SESSION_DURATION_MS,
  type SessionRecord,
  type StoredUser,
} from "@/lib/auth";

const dataDirectory = path.join(process.cwd(), "data");
const sessionsFilePath = path.join(dataDirectory, "sessions.json");

async function ensureSessionsFile() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(sessionsFilePath, "utf8");
  } catch {
    await writeFile(sessionsFilePath, JSON.stringify([], null, 2), "utf8");
  }
}

async function getSessions() {
  await ensureSessionsFile();
  const content = await readFile(sessionsFilePath, "utf8");
  return JSON.parse(content) as SessionRecord[];
}

async function saveSessions(sessions: SessionRecord[]) {
  await ensureSessionsFile();
  await writeFile(sessionsFilePath, JSON.stringify(sessions, null, 2), "utf8");
}

function isExpired(session: SessionRecord) {
  return new Date(session.expiresAt).getTime() <= Date.now();
}

export async function createSession(user: StoredUser) {
  const sessions = await getSessions();
  const activeSessions = sessions.filter((session) => !isExpired(session));
  const session: SessionRecord = {
    token: randomUUID(),
    email: user.email,
    role: user.role,
    name: user.name,
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
  };

  activeSessions.push(session);
  await saveSessions(activeSessions);
  return session;
}

export async function getSessionByToken(token: string) {
  const sessions = await getSessions();
  const activeSessions = sessions.filter((session) => !isExpired(session));

  if (activeSessions.length !== sessions.length) {
    await saveSessions(activeSessions);
  }

  return activeSessions.find((session) => session.token === token) ?? null;
}

export async function deleteSession(token: string) {
  const sessions = await getSessions();
  const nextSessions = sessions.filter((session) => session.token !== token);
  await saveSessions(nextSessions);
}

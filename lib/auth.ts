export type UserRole = "admin" | "dosen" | "mahasiswa";

export type StoredUser = {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: "aktif" | "nonaktif";
  createdAt: string;
};

export type SessionRecord = {
  token: string;
  email: string;
  role: UserRole;
  name: string;
  expiresAt: string;
};

export const SESSION_COOKIE_NAME = "elearning-session";
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

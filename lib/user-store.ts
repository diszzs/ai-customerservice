// v3
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import type { UserRole } from "@/lib/auth";

/* ================= FIND USER ================= */
export async function findUserByEmail(email: string) {
  await connectDB();

  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  }).lean();

  if (!user) return null;

  return {
    id: (user._id as any).toString(),
    name: user.name as string,
    email: user.email as string,
    passwordHash: user.passwordHash as string,
    role: user.role as string,
    status: user.status as string,
    createdAt: user.createdAt,
  };
}

/* ================= CREATE USER ================= */
export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
}) {
  await connectDB();

  const normalizedEmail = input.email.trim().toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail }).lean();
  if (existing) return null;

  const user = await User.create({
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash: input.passwordHash,
    role: input.role ?? "mahasiswa",
    status: "aktif",
  });

  return {
    id: (user._id as any).toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

/* ================= UPSERT USER ================= */
export async function upsertUser(input: {
  name: string;
  email: string;
  role: UserRole;
  passwordHash?: string;
}) {
  await connectDB();

  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    existing.name = input.name.trim();
    existing.role = input.role;
    existing.status = "aktif";

    if (input.passwordHash) {
      existing.passwordHash = input.passwordHash;
    }

    const saved = await existing.save();

    return {
      id: (saved._id as any).toString(),
      name: saved.name,
      email: saved.email,
      role: saved.role,
      status: saved.status,
      createdAt: saved.createdAt,
    };
  }

  if (!input.passwordHash) return null;

  const user = await User.create({
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash: input.passwordHash,
    role: input.role,
    status: "aktif",
  });

  return {
    id: (user._id as any).toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };
}

/* ================= UPDATE STATUS ================= */
export async function updateUserStatus(input: {
  id: string;
  status: "aktif" | "nonaktif";
}) {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(input.id)) return null;

  const user = await User.findById(input.id);
  if (!user) return null;

  user.status = input.status;
  const saved = await user.save();

  return {
    id: (saved._id as any).toString(),
    name: saved.name,
    email: saved.email,
    role: saved.role,
    status: saved.status,
    createdAt: saved.createdAt,
  };
}

/* ================= GET ALL ================= */
export async function getUsers() {
  await connectDB();

  const users = await User.find().sort({ createdAt: -1 }).lean();

  return users.map((u) => ({
    id: (u._id as any).toString(),
    name: u.name as string,
    email: u.email as string,
    role: u.role as string,
    status: u.status as string,
    createdAt: u.createdAt,
  }));
}
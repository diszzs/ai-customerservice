// v2
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import type { UserRole } from "@/lib/auth";

/* ================= FIND USER ================= */
export async function findUserByEmail(email: string) {
  await connectDB();

  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  });

  if (!user) return null;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role,
    status: user.status,
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

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) return null;

  const user = await User.create({
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash: input.passwordHash,
    role: input.role ?? "mahasiswa",
    status: "aktif",
  });

  return {
    id: user._id.toString(),
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

    await existing.save();

    return {
      id: existing._id.toString(),
      name: existing.name,
      email: existing.email,
      role: existing.role,
      status: existing.status,
      createdAt: existing.createdAt,
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
    id: user._id.toString(),
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
  await user.save();

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };
}

/* ================= GET ALL ================= */
export async function getUsers() {
  await connectDB();

  const users = await User.find().sort({ createdAt: -1 });

  return users.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
  }));
}
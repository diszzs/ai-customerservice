import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { hashPassword } from "@/lib/crypto";
import type { StoredUser, UserRole } from "@/lib/auth";

const dataDirectory = path.join(process.cwd(), "data");
const usersFilePath = path.join(dataDirectory, "users.json");

type SeedUser = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

const seedUsers: SeedUser[] = [
  {
    name: "Administrator Sistem",
    email: "admin@elearning.local",
    password: "Admin123",
    role: "admin",
  },
  {
    name: "Dosen Pengampu",
    email: "dosen@elearning.local",
    password: "Dosen123",
    role: "dosen",
  },
  {
    name: "Mahasiswa Demo",
    email: "mahasiswa@elearning.local",
    password: "Mahasiswa123",
    role: "mahasiswa",
  },
];

async function createSeedUsers(): Promise<StoredUser[]> {
  const now = new Date().toISOString();

  return Promise.all(
    seedUsers.map(async (user, index) => ({
      id: index + 1,
      name: user.name,
      email: user.email,
      passwordHash: await hashPassword(user.password),
      role: user.role,
      status: "aktif",
      createdAt: now,
    })),
  );
}

async function syncAdminUser(users: StoredUser[]) {
  const existingAdminIndex = users.findIndex((user) => user.role === "admin");
  const adminPasswordHash = await hashPassword(seedUsers[0].password);
  const nextAdminUser: StoredUser = {
    id:
      existingAdminIndex >= 0 ? users[existingAdminIndex].id : Date.now(),
    name: seedUsers[0].name,
    email: seedUsers[0].email.toLowerCase(),
    passwordHash: adminPasswordHash,
    role: "admin",
    status: "aktif",
    createdAt:
      existingAdminIndex >= 0
        ? users[existingAdminIndex].createdAt
        : new Date().toISOString(),
  };

  if (existingAdminIndex >= 0) {
    users[existingAdminIndex] = nextAdminUser;
  } else {
    users.unshift(nextAdminUser);
  }

  return users;
}

async function ensureUsersFile() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    const content = await readFile(usersFilePath, "utf8");
    const users = JSON.parse(content) as StoredUser[];
    const syncedUsers = await syncAdminUser(users);
    await writeFile(usersFilePath, JSON.stringify(syncedUsers, null, 2), "utf8");
  } catch {
    const seededUsers = await createSeedUsers();
    await writeFile(usersFilePath, JSON.stringify(seededUsers, null, 2), "utf8");
  }
}

export async function getUsers(): Promise<StoredUser[]> {
  await ensureUsersFile();
  const content = await readFile(usersFilePath, "utf8");
  return JSON.parse(content) as StoredUser[];
}

export async function saveUsers(users: StoredUser[]) {
  await ensureUsersFile();
  await writeFile(usersFilePath, JSON.stringify(users, null, 2), "utf8");
}

export async function findUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const users = await getUsers();
  return users.find((user) => user.email === normalizedEmail);
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
}) {
  const users = await getUsers();
  const normalizedEmail = input.email.trim().toLowerCase();

  if (users.some((user) => user.email === normalizedEmail)) {
    return null;
  }

  const newUser: StoredUser = {
    id: Date.now(),
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash: input.passwordHash,
    role: input.role ?? "mahasiswa",
    status: "aktif",
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await saveUsers(users);
  return newUser;
}

export async function upsertUser(input: {
  name: string;
  email: string;
  role: UserRole;
  passwordHash?: string;
}) {
  const users = await getUsers();
  const normalizedEmail = input.email.trim().toLowerCase();
  const existingUserIndex = users.findIndex(
    (user) => user.email === normalizedEmail,
  );

  if (existingUserIndex >= 0) {
    const existingUser = users[existingUserIndex];
    users[existingUserIndex] = {
      ...existingUser,
      name: input.name.trim(),
      role: input.role,
      status: "aktif",
      passwordHash: input.passwordHash ?? existingUser.passwordHash,
    };

    await saveUsers(users);
    return users[existingUserIndex];
  }

  if (!input.passwordHash) {
    return null;
  }

  const newUser: StoredUser = {
    id: Date.now(),
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash: input.passwordHash,
    role: input.role,
    status: "aktif",
    createdAt: new Date().toISOString(),
  };

  users.unshift(newUser);
  await saveUsers(users);
  return newUser;
}

export async function updateUserStatus(input: {
  id: number;
  status: StoredUser["status"];
}) {
  const users = await getUsers();
  const existingUserIndex = users.findIndex((user) => user.id === input.id);

  if (existingUserIndex < 0) {
    return null;
  }

  users[existingUserIndex] = {
    ...users[existingUserIndex],
    status: input.status,
  };

  await saveUsers(users);
  return users[existingUserIndex];
}

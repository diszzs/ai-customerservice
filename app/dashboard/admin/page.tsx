import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { getSessionByToken } from "@/lib/session-store";
import { findUserByEmail } from "@/lib/user-store";

export default async function AdminDashboardEntryPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  const session = await getSessionByToken(token);

  if (!session) {
    redirect("/login");
  }

  const user = await findUserByEmail(session.email);

  if (!user || user.status !== "aktif") {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  redirect("/dashboard?panel=admin");
}

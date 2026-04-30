import { redirect } from "next/navigation";

export default function AdminDashboardEntryPage() {
  redirect("/dashboard?panel=admin");
}

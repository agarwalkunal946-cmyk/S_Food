import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import AdminConsole from "@/components/admin-console";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  return <AdminConsole admin={admin} />;
}

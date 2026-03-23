import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/server";
import { SettingsClient } from "@/components/dashboard/settings-client";

export const metadata = { title: "Configuración | BellezaTurno" };

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, plan, custom_domain")
    .eq("owner_clerk_id", userId)
    .single();

  if (!tenant) redirect("/onboarding");

  return <SettingsClient tenant={tenant} />;
}

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/server";
import { BillingClient } from "@/components/dashboard/billing-client";

export const metadata = { title: "Planes y Facturación" };

export default async function BillingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, plan, mp_subscription_id, plan_expires_at")
    .eq("owner_clerk_id", userId)
    .single();

  if (!tenant) redirect("/onboarding");

  return <BillingClient tenant={tenant} />;
}

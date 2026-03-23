import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { WhatsAppClient } from "@/components/dashboard/whatsapp-client";

export default async function WhatsAppPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const supabase = createAdminClient();

  // Obtener tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("owner_clerk_id", userId)
    .single();

  if (!tenant) redirect("/onboarding");

  // Obtener config de WhatsApp
  const { data: config } = await supabase
    .from("whatsapp_config")
    .select("*")
    .eq("tenant_id", tenant.id)
    .single();

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <WhatsAppClient tenant={tenant} initialConfig={config} />
    </div>
  );
}

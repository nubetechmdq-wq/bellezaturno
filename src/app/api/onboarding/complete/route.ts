import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

// Paso final: marca el onboarding como completado
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { tenantId, whatsapp_number, whatsapp_enabled } = await req.json();
  const admin = createAdminClient();

  await admin
    .from("tenants")
    .update({
      whatsapp_number,
      whatsapp_enabled,
      onboarding_step: 6,
      onboarding_completed: true,
    })
    .eq("id", tenantId);

  // Crear registro de configuración WhatsApp si no existe
  await admin
    .from("whatsapp_config")
    .upsert({ tenant_id: tenantId }, { onConflict: "tenant_id" });

  // Obtener el slug del tenant para devolver la URL
  const { data: tenant } = await admin
    .from("tenants")
    .select("slug")
    .eq("id", tenantId)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const landingUrl = `${appUrl}/s/${tenant?.slug}`;

  return NextResponse.json({ ok: true, landingUrl });
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

// Paso 5: testimonios
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { tenantId, testimonials } = await req.json();
  const admin = createAdminClient();

  // Eliminar testimonios anteriores y recrear
  await admin.from("testimonials").delete().eq("tenant_id", tenantId);

  if (testimonials?.length > 0) {
    await admin.from("testimonials").insert(
      testimonials.map((t: any) => ({
        tenant_id: tenantId,
        client_name: t.client_name,
        content: t.content,
        rating: t.rating,
        is_active: true,
        is_approved: true,
      }))
    );
  }

  await admin.from("tenants").update({ onboarding_step: 5 }).eq("id", tenantId);
  return NextResponse.json({ ok: true });
}

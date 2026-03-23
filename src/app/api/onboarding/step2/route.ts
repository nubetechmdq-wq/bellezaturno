import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { tenantId, services } = await req.json();
  const admin = createAdminClient();

  try {
    // Eliminar servicios existentes del tenant y recrearlos
    await admin.from("services").delete().eq("tenant_id", tenantId);

    if (services?.length > 0) {
      await admin.from("services").insert(
        services.map((s: any, i: number) => ({
          tenant_id: tenantId,
          name: s.name,
          description: s.description ?? "",
          duration_minutes: s.duration_minutes,
          price: s.price,
          sort_order: i,
          is_active: true,
        }))
      );
    }

    await admin
      .from("tenants")
      .update({ onboarding_step: 2 })
      .eq("id", tenantId);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

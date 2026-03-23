import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

// Paso 4: colores y estilo
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { tenantId, primary_color, secondary_color, style_preset } = await req.json();
  const admin = createAdminClient();

  await admin
    .from("tenants")
    .update({ primary_color, secondary_color, style_preset, onboarding_step: 4 })
    .eq("id", tenantId);

  return NextResponse.json({ ok: true });
}

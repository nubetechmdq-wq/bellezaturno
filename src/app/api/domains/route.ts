import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { domain } = await req.json();
  if (!domain) return NextResponse.json({ error: "Dominio requerido" }, { status: 400 });

  const admin = createAdminClient();

  // 1. Verificar tenant actual y si tiene Plan Pro (Gatekeeping)
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, plan, custom_domain")
    .eq("owner_clerk_id", userId)
    .single();

  if (!tenant) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  if (tenant.plan !== "pro") return NextResponse.json({ error: "El dominio personalizado requiere el Plan Pro" }, { status: 403 });

  // 2. Comunicarse con Vercel API para registrar el dominio
  const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
  const VERCEL_AUTH_TOKEN = process.env.VERCEL_AUTH_TOKEN;

  if (!VERCEL_PROJECT_ID || !VERCEL_AUTH_TOKEN) {
    return NextResponse.json({ error: "La API de Vercel no está configurada" }, { status: 500 });
  }

  try {
    const res = await fetch(`https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_AUTH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain }),
    });

    const data = await res.json();
    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    // 3. Guardar en Supabase
    await admin.from("tenants").update({ custom_domain: domain }).eq("id", tenant.id);

    return NextResponse.json({ ok: true, domain });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

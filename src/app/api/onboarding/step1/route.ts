import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const admin = createAdminClient();

  try {
    // Chequear si ya tiene tenant (para el caso de "volver y editar")
    const { data: existing } = await admin
      .from("tenants")
      .select("id, slug")
      .eq("owner_clerk_id", userId)
      .single();

    let slug = body.slug ?? generateSlug(body.name);

    if (existing) {
      // Actualizar tenant existente
      await admin
        .from("tenants")
        .update({
          name: body.name,
          type: body.type,
          address: body.address,
          city: body.city,
          phone: body.phone,
          whatsapp_number: body.whatsapp_number,
          email: body.email,
          onboarding_step: 1,
        })
        .eq("id", existing.id);

      return NextResponse.json({ tenantId: existing.id, slug: existing.slug });
    }

    // Verificar que el slug no esté tomado
    let finalSlug = slug;
    const { data: slugCheck } = await admin
      .from("tenants")
      .select("id")
      .eq("slug", finalSlug)
      .single();

    if (slugCheck) {
      finalSlug = `${slug}-${Math.floor(Math.random() * 9000) + 1000}`;
    }

    // Crear nuevo tenant
    const { data: tenant, error } = await admin
      .from("tenants")
      .insert({
        owner_clerk_id: userId,
        name: body.name,
        slug: finalSlug,
        type: body.type,
        address: body.address,
        city: body.city,
        phone: body.phone,
        whatsapp_number: body.whatsapp_number,
        email: body.email,
        onboarding_step: 1,
      })
      .select("id, slug")
      .single();

    if (error) throw error;

    return NextResponse.json({ tenantId: tenant.id, slug: tenant.slug });
  } catch (err: any) {
    console.error("[onboarding/step1]", err);
    return NextResponse.json(
      { error: "Error al crear el salón", detail: err.message },
      { status: 500 }
    );
  }
}

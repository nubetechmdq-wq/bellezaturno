import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const body = await request.json();

  // Obtener tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_clerk_id", userId)
    .single();

  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  // Actualizar configuración
  const { data, error } = await supabase
    .from("whatsapp_config")
    .update({
      greeting_message: body.greeting_message,
      booking_success_message: body.booking_success_message,
      ai_instructions: body.ai_instructions,
      is_active: body.is_active,
    })
    .eq("tenant_id", tenant.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

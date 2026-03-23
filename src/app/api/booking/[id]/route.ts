import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

// PATCH /api/booking/[id] — actualizar el estado de un turno
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();

  const validStatuses = ["confirmed", "cancelled", "completed", "no_show"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verificar que el booking pertenece al tenant del usuario
  const { data: booking } = await admin
    .from("bookings")
    .select("tenant_id, tenants(owner_clerk_id)")
    .eq("id", id)
    .single();

  if (!booking || (booking.tenants as any)?.owner_clerk_id !== userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { error } = await admin.from("bookings").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

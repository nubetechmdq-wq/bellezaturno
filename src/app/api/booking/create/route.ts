import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { addMinutes } from "date-fns";

// POST /api/booking/create
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    tenant_id,
    service_id,
    client_name,
    client_phone,
    client_email,
    starts_at,
    ends_at,
    source,
    notes,
  } = body;

  if (!tenant_id || !service_id || !client_name || !client_phone || !starts_at) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verificar disponibilidad del slot (doble check server-side)
  const { data: conflicts } = await admin
    .from("bookings")
    .select("id")
    .eq("tenant_id", tenant_id)
    .neq("status", "cancelled")
    .or(
      `and(starts_at.lt.${ends_at},ends_at.gt.${starts_at})`
    );

  if (conflicts && conflicts.length > 0) {
    return NextResponse.json(
      { error: "El horario ya no está disponible. Por favor elegí otro." },
      { status: 409 }
    );
  }

  // Crear el turno
  const { data: booking, error } = await admin
    .from("bookings")
    .insert({
      tenant_id,
      service_id,
      client_name,
      client_phone,
      client_email: client_email || null,
      starts_at,
      ends_at,
      status: "confirmed",
      source: source ?? "landing",
      notes: notes ?? null,
    })
    .select("*, services(name, duration_minutes, price)")
    .single();

  if (error) {
    console.error("[booking/create]", error);
    return NextResponse.json({ error: "Error al crear la reserva" }, { status: 500 });
  }

  // Registrar evento de analytics
  await admin.from("analytics_events").insert({
    tenant_id,
    event_type: "booking_completed",
    properties: { service_id, source: source ?? "landing" },
  });

  // Enviar confirmación por WhatsApp (Tarea 6)
  try {
    const { data: config } = await admin
      .from("whatsapp_config")
      .select("*")
      .eq("tenant_id", tenant_id)
      .eq("is_active", true)
      .single();

    if (config && config.evolution_instance_name && process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY) {
      const msg = (config.booking_success_message || "✅ ¡Tu turno está confirmado! Te esperamos el {date} a las {time}.")
        .replace("{date}", new Date(starts_at).toLocaleDateString("es-AR"))
        .replace("{time}", new Date(starts_at).toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit' }));

      await fetch(`${process.env.EVOLUTION_API_URL}/message/sendText/${config.evolution_instance_name}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          number: client_phone,
          text: msg
        })
      });
    }
  } catch (waError) {
    console.error("[WA Confirmation Error]:", waError);
    // No bloqueamos la respuesta exitosa si falla el WA
  }

  return NextResponse.json({ booking, ok: true });
}

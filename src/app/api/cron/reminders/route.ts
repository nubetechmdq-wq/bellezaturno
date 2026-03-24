import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { addHours, addMinutes, format } from "date-fns";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

export async function GET(req: NextRequest) {
  // Proteger el cron con un secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  
  // Buscar turnos que suceden dentro de 24h a 24h 15m y no se envió recordatorio
  const start24h = addHours(now, 24).toISOString();
  const end24h = addMinutes(addHours(now, 24), 15).toISOString();

  // Buscar turnos que suceden dentro de 1h a 1h 15m y no se envió recordatorio
  const start1h = addHours(now, 1).toISOString();
  const end1h = addMinutes(addHours(now, 1), 15).toISOString();

  const { data: bookings24h } = await admin
    .from("bookings")
    .select("*, tenants(name, slug), whatsapp_config!inner(*), services(name)")
    .eq("status", "confirmed")
    .eq("reminder_24h_sent", false)
    .gte("starts_at", start24h)
    .lt("starts_at", end24h);

  const { data: bookings1h } = await admin
    .from("bookings")
    .select("*, tenants(name, slug), whatsapp_config!inner(*), services(name)")
    .eq("status", "confirmed")
    .eq("reminder_1h_sent", false)
    .gte("starts_at", start1h)
    .lt("starts_at", end1h);

  const pendingMessages = [];

  // Función para rellenar variables de los mensajes almacenados
  const parseMsg = (template: string, b: any) => {
    return template
      .replace("{salon_name}", b.tenants?.name || "el salón")
      .replace("{date}", format(new Date(b.starts_at), "dd/MM/yyyy"))
      .replace("{time}", format(new Date(b.starts_at), "HH:mm"))
      .replace("{booking_url}", `${process.env.NEXT_PUBLIC_APP_URL}/s/${b.tenants?.slug}`);
  };

  // Procesar 24h
  for (const b of (bookings24h || [])) {
    const wc = b.whatsapp_config[0];
    if (!wc || !wc.is_active || !wc.evolution_instance_name) continue;

    const msg = `¡Hola ${b.client_name}! 👋 Te recordamos que mañana a las ${format(new Date(b.starts_at), "HH:mm")} tenés tu turno reservado en ${b.tenants?.name} para el servicio: ${b.services?.name}. Si necesitás cancelar, por favor hacelo ingresando aquí: ${process.env.NEXT_PUBLIC_APP_URL}/s/${b.tenants?.slug}`;
    
    pendingMessages.push({
      id: b.id,
      type: "24h",
      instance: wc.evolution_instance_name,
      phone: b.client_phone,
      text: msg
    });
  }

  // Procesar 1h
  for (const b of (bookings1h || [])) {
    const wc = b.whatsapp_config[0];
    if (!wc || !wc.is_active || !wc.evolution_instance_name) continue;

    const msg = `¡Hola ${b.client_name}! ⏳ Falta solo 1 hora para tu turno en ${b.tenants?.name}. ¡Te esperamos!`;
    
    pendingMessages.push({
      id: b.id,
      type: "1h",
      instance: wc.evolution_instance_name,
      phone: b.client_phone,
      text: msg
    });
  }

  // Enviar mensajes en paralelo
  const results = await Promise.allSettled(
    pendingMessages.map(async (msg) => {
      if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return;
      
      const res = await fetch(`${EVOLUTION_API_URL}/send/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": EVOLUTION_API_KEY },
        body: JSON.stringify({ 
          instanceName: msg.instance,
          number: msg.phone, 
          text: msg.text 
        })
      });
      
      if (res.ok) {
        // Actualizar flag en BD
        await admin.from("bookings").update(
          msg.type === "24h" ? { reminder_24h_sent: true } : { reminder_1h_sent: true }
        ).eq("id", msg.id);
      } else {
        throw new Error(`Error enviando WA a ${msg.phone} via ${msg.instance}`);
      }
    })
  );

  return NextResponse.json({ 
    processed: results.length,
    successes: results.filter(r => r.status === "fulfilled").length,
    failures: results.filter(r => r.status === "rejected").length
  });
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { addMinutes, format, parseISO, setHours, setMinutes } from "date-fns";

// GET /api/booking/availability?tenantId=&serviceId=&date=
// Devuelve los slots disponibles para un día dado
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tenantId = searchParams.get("tenantId");
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date"); // "yyyy-MM-dd"

  if (!tenantId || !serviceId || !date) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 1. Obtener horario del salón
  const { data: tenant } = await admin
    .from("tenants")
    .select("schedule, slot_duration_minutes")
    .eq("id", tenantId)
    .single();

  if (!tenant) {
    return NextResponse.json({ slots: [] });
  }

  // 2. Obtener duración del servicio
  const { data: service } = await admin
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .single();

  if (!service) {
    return NextResponse.json({ slots: [] });
  }

  // 3. Determinar horario del día según schedule del tenant
  const schedule = tenant.schedule as any;
  const dayName = format(parseISO(date + "T12:00:00"), "eeee").toLowerCase();
  // date-fns en inglés: monday, tuesday, etc.
  const DAY_MAP: Record<string, string> = {
    monday: "monday",
    tuesday: "tuesday",
    wednesday: "wednesday",
    thursday: "thursday",
    friday: "friday",
    saturday: "saturday",
    sunday: "sunday",
  };
  const dayKey = DAY_MAP[dayName];
  const dayConfig = schedule?.[dayKey];

  if (!dayConfig || !dayConfig.enabled) {
    return NextResponse.json({ slots: [] });
  }

  // 4. Generar todos los slots del día
  const [openH, openM] = (dayConfig.open ?? "09:00").split(":").map(Number);
  const [closeH, closeM] = (dayConfig.close ?? "18:00").split(":").map(Number);

  const slotDuration = service.duration_minutes;
  const allSlots: string[] = [];
  let current = new Date(date + "T12:00:00");
  current.setHours(openH, openM, 0, 0);
  const closeTime = new Date(date + "T12:00:00");
  closeTime.setHours(closeH, closeM, 0, 0);

  // No mostrar slots en el pasado (si es hoy)
  const now = new Date();
  const isToday = format(now, "yyyy-MM-dd") === date;

  while (current < closeTime) {
    const slotEnd = addMinutes(current, slotDuration);
    if (slotEnd <= closeTime) {
      if (!isToday || current > addMinutes(now, 30)) {
        allSlots.push(format(current, "HH:mm"));
      }
    }
    current = addMinutes(current, slotDuration);
  }

  // 5. Obtener turnos existentes para ese día
  const dayStart = new Date(date + "T00:00:00");
  const dayEnd = new Date(date + "T23:59:59");

  const { data: existingBookings } = await admin
    .from("bookings")
    .select("starts_at, ends_at")
    .eq("tenant_id", tenantId)
    .neq("status", "cancelled")
    .gte("starts_at", dayStart.toISOString())
    .lte("starts_at", dayEnd.toISOString());

  // 6. Filtrar slots ocupados
  const availableSlots = allSlots.filter((slot) => {
    const [h, m] = slot.split(":").map(Number);
    const slotStart = new Date(date + "T12:00:00");
    slotStart.setHours(h, m, 0, 0);
    const slotEnd = addMinutes(slotStart, slotDuration);

    // Verificar que no se superponga con ningún turno existente
    const isOccupied = (existingBookings ?? []).some((booking) => {
      const bookingStart = new Date(booking.starts_at);
      const bookingEnd = new Date(booking.ends_at);
      return slotStart < bookingEnd && slotEnd > bookingStart;
    });

    return !isOccupied;
  });

  return NextResponse.json({ slots: availableSlots });
}

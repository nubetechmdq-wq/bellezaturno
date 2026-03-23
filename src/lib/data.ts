import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { Tenant, Service, Booking } from "@/types/database";

// ------------------------------------------------------------------
// Tenants (Salones)
// ------------------------------------------------------------------

/** Obtiene el tenant del usuario autenticado */
export async function getMyTenant(): Promise<Tenant | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("tenants")
    .select("*")
    .eq("owner_clerk_id", user.id)
    .single();

  return data;
}

/** Obtiene un tenant por su slug (para landing pages públicas) */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  return data;
}

/** Obtiene un tenant por su custom domain */
export async function getTenantByDomain(domain: string): Promise<Tenant | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenants")
    .select("*")
    .eq("custom_domain", domain)
    .eq("is_active", true)
    .single();

  return data;
}

/** Crea un nuevo tenant durante el onboarding */
export async function createTenant(
  ownerClerkId: string,
  data: {
    name: string;
    slug: string;
    type: Tenant["type"];
    city: string;
    phone?: string;
    whatsapp_number?: string;
  }
): Promise<Tenant | null> {
  const admin = createAdminClient();
  const { data: tenant, error } = await admin
    .from("tenants")
    .insert({
      owner_clerk_id: ownerClerkId,
      ...data,
      onboarding_step: 1,
    })
    .select()
    .single();

  if (error) throw error;
  return tenant;
}

/** Actualiza el step del onboarding del tenant */
export async function updateTenantOnboarding(
  tenantId: string,
  step: number,
  data: Partial<Tenant>
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("tenants")
    .update({ ...data, onboarding_step: step })
    .eq("id", tenantId);

  if (error) throw error;
}

// ------------------------------------------------------------------
// Servicios
// ------------------------------------------------------------------

/** Obtiene todos los servicios activos de un tenant */
export async function getServices(tenantId: string): Promise<Service[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("services")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return data ?? [];
}

/** Crea múltiples servicios para un tenant */
export async function createServices(
  tenantId: string,
  services: Array<{
    name: string;
    description?: string;
    duration_minutes: number;
    price: number;
  }>
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("services").insert(
    services.map((s, i) => ({
      tenant_id: tenantId,
      ...s,
      sort_order: i,
    }))
  );
  if (error) throw error;
}

// ------------------------------------------------------------------
// Bookings (Turnos)
// ------------------------------------------------------------------

/** Obtiene turnos del día para el dashboard */
export async function getTodayBookings(tenantId: string): Promise<Booking[]> {
  const admin = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data } = await admin
    .from("bookings")
    .select("*, services(name, duration_minutes, price)")
    .eq("tenant_id", tenantId)
    .gte("starts_at", today.toISOString())
    .lt("starts_at", tomorrow.toISOString())
    .order("starts_at", { ascending: true });

  return (data ?? []) as Booking[];
}

/** Verifica si un slot está disponible */
export async function checkSlotAvailability(
  tenantId: string,
  startsAt: Date,
  endsAt: Date
): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin.rpc("is_slot_available", {
    p_tenant_id: tenantId,
    p_service_id: null,
    p_starts_at: startsAt.toISOString(),
    p_ends_at: endsAt.toISOString(),
  });

  return data ?? false;
}

/** Crea un nuevo turno */
export async function createBooking(booking: {
  tenant_id: string;
  service_id: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  starts_at: string;
  ends_at: string;
  source: "landing" | "whatsapp" | "dashboard";
  notes?: string;
}): Promise<Booking> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("bookings")
    .insert({ ...booking, status: "confirmed" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

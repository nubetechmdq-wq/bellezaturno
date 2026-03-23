import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const admin = createAdminClient();

  // Cargar tenant del usuario
  const { data: tenant } = await admin
    .from("tenants")
    .select("*")
    .eq("owner_clerk_id", userId)
    .single();

  if (!tenant) redirect("/onboarding");
  if (!tenant.onboarding_completed) redirect("/onboarding");

  // Cargar datos del dashboard en paralelo
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const monthStart = startOfMonth(today).toISOString();
  const monthEnd = endOfMonth(today).toISOString();

  const [
    todayBookingsResult,
    monthBookingsResult,
    servicesResult,
  ] = await Promise.all([
    admin
      .from("bookings")
      .select("*, services(name, duration_minutes, price)")
      .eq("tenant_id", tenant.id)
      .gte("starts_at", `${todayStr}T00:00:00`)
      .lte("starts_at", `${todayStr}T23:59:59`)
      .order("starts_at", { ascending: true }),
    admin
      .from("bookings")
      .select("id, status, source, created_at")
      .eq("tenant_id", tenant.id)
      .gte("starts_at", monthStart)
      .lte("starts_at", monthEnd),
    admin
      .from("services")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  const todayBookings = todayBookingsResult.data ?? [];
  const monthBookings = monthBookingsResult.data ?? [];
  const services = servicesResult.data ?? [];

  // Calcular métricas
  const stats = {
    todayCount: todayBookings.length,
    monthCount: monthBookings.length,
    whatsappCount: monthBookings.filter((b) => b.source === "whatsapp").length,
    cancelledCount: monthBookings.filter((b) => b.status === "cancelled").length,
    conversionRate:
      monthBookings.length > 0
        ? Math.round(
            ((monthBookings.length - monthBookings.filter((b) => b.status === "cancelled").length) /
              monthBookings.length) *
              100
          )
        : 0,
  };

  return (
    <DashboardClient
      tenant={tenant}
      todayBookings={todayBookings as any}
      services={services}
      stats={stats}
    />
  );
}

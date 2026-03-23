import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { SalonLanding } from "@/components/landing/salon-landing";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain } = await params;
  const decodedDomain = decodeURIComponent(domain);
  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("meta_title, meta_description, name")
    .eq("custom_domain", decodedDomain)
    .single();

  if (!tenant) return { title: "Salón no encontrado" };

  return {
    title: tenant.meta_title || `${tenant.name} | Reservas`,
    description: tenant.meta_description || `Reserva tu turno en ${tenant.name}`,
  };
}

export default async function CustomDomainPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const decodedDomain = decodeURIComponent(domain);
  const admin = createAdminClient();

  // Buscar el tenant por custom_domain
  const { data: tenant } = await admin
    .from("tenants")
    .select("*, services(*), testimonials(*)")
    .eq("custom_domain", decodedDomain)
    .eq("is_active", true)
    .single();

  if (!tenant) notFound();

  // Asegurar que solo pasamos servicios/testimonios activos
  const activeServices = (tenant.services as any[]).filter(s => s.is_active);
  const activeTestimonials = (tenant.testimonials as any[]).filter(t => t.is_active && t.is_approved);

  return (
    <SalonLanding 
      tenant={tenant} 
      services={activeServices} 
      testimonials={activeTestimonials} 
    />
  );
}

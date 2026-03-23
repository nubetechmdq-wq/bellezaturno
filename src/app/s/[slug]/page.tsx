import { notFound } from "next/navigation";
import { getTenantBySlug, getServices } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/server";
import { SalonLanding } from "@/components/landing/salon-landing";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
}

// Metadata SEO dinámica por salón
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return { title: "Salón no encontrado" };

  return {
    // CAMBIO FÁCIL: Títulos y descripciones SEO por defecto si el salón no los configuró
    title: tenant.meta_title ?? `${tenant.name} - Reservas Online`,
    description:
      tenant.meta_description ??
      `Reservá online en ${tenant.name}. ${tenant.description ?? ""}`,
    openGraph: {
      title: tenant.name,
      description: tenant.meta_description ?? tenant.description ?? "",
      images: tenant.hero_image_url ? [tenant.hero_image_url] : [],
      type: "website",
    },
  };
}

export default async function SalonPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { service: preselectedService } = await searchParams;

  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const admin = createAdminClient();

  // Cargar datos del salón en paralelo
  const [services, testimonialsResult] = await Promise.all([
    getServices(tenant.id),
    admin
      .from("testimonials")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  const testimonials = testimonialsResult.data ?? [];

  return (
    <SalonLanding
      tenant={tenant}
      services={services}
      testimonials={testimonials}
      preselectedServiceId={preselectedService}
    />
  );
}

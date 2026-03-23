"use client";

// Store de estado del wizard de onboarding usando localStorage + React state
// Se persiste entre pasos para no perder datos si el usuario navega

export interface OnboardingData {
  tenantId?: string;
  // Paso 1
  name?: string;
  type?: "barberia" | "peluqueria" | "spa" | "salon";
  address?: string;
  city?: string;
  phone?: string;
  whatsapp_number?: string;
  email?: string;
  // Paso 2 - Servicios
  services?: Array<{
    name: string;
    description: string;
    duration_minutes: number;
    price: number;
  }>;
  // Paso 3 - Fotos
  hero_image_url?: string;
  gallery_urls?: string[];
  logo_url?: string;
  // Paso 4 - Colores y estilo
  primary_color?: string;
  secondary_color?: string;
  style_preset?: "glassmorphism" | "minimal" | "bold" | "classic";
  // Paso 5 - Testimonios
  testimonials?: Array<{
    client_name: string;
    content: string;
    rating: number;
  }>;
  // Paso 6 - WhatsApp
  whatsapp_enabled?: boolean;
  whatsapp_verified?: boolean;
  slug?: string;
}

const STORAGE_KEY = "bellezaturno_onboarding";

export function saveOnboardingData(data: Partial<OnboardingData>): void {
  try {
    const current = getOnboardingData();
    const merged = { ...current, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // localStorage no disponible (SSR)
  }
}

export function getOnboardingData(): OnboardingData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function clearOnboardingData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

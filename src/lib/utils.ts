import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utilidad para combinar clases de Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// CAMBIO FÁCIL: Símbolo de moneda y configuración regional (es-AR = Argentina, ARS = Pesos)
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price);
}

// Formatear duración de servicios
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}min`;
}

// Formatear número de teléfono para WhatsApp
export function formatWhatsAppNumber(phone: string): string {
  // Eliminar espacios, guiones y paréntesis
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  // Si empieza con 0, reemplazar con código de país de Argentina (+54)
  if (cleaned.startsWith("0")) return `54${cleaned.slice(1)}`;
  // Si ya tiene el código de país, retornar limpio
  if (cleaned.startsWith("54")) return cleaned;
  // Asumir número argentino sin código de país
  return `54${cleaned}`;
}

// Generar slug de URL desde texto
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Obtener iniciales para avatares
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

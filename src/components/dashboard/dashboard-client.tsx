"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { UserButton } from "@clerk/nextjs";
import {
  Calendar,
  Scissors,
  MessageCircle,
  TrendingUp,
  Settings,
  ExternalLink,
  Clock,
  User,
  Phone,
  CheckCircle,
  XCircle,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import type { Tenant, Service, Booking } from "@/types/database";
import { formatPrice, formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

// CAMBIO FÁCIL: estado de los colores de badge por status
const STATUS_STYLES = {
  confirmed: { label: "Confirmado", class: "bg-emerald-100 text-emerald-700" },
  pending: { label: "Pendiente", class: "bg-yellow-100 text-yellow-700" },
  cancelled: { label: "Cancelado", class: "bg-red-100 text-red-600" },
  completed: { label: "Completado", class: "bg-blue-100 text-blue-700" },
  no_show: { label: "No asistió", class: "bg-gray-100 text-gray-500" },
} as const;

interface Props {
  tenant: Tenant;
  todayBookings: Array<Booking & { services: { name: string; duration_minutes: number; price: number } }>;
  services: Service[];
  stats: {
    todayCount: number;
    monthCount: number;
    whatsappCount: number;
    cancelledCount: number;
    conversionRate: number;
  };
}

const METRICS: Array<{
  key: keyof typeof stats_placeholder;
  label: string;
  icon: React.ElementType;
  color: string;
  suffix?: string;
}> = [
  { key: "todayCount", label: "Turnos hoy", icon: Calendar, color: "indigo" },
  { key: "monthCount", label: "Este mes", icon: TrendingUp, color: "emerald" },
  { key: "whatsappCount", label: "Vía WhatsApp", icon: MessageCircle, color: "green" },
  { key: "conversionRate", label: "% asistencia", icon: BarChart3, color: "violet", suffix: "%" },
];
const stats_placeholder = { todayCount: 0, monthCount: 0, whatsappCount: 0, cancelledCount: 0, conversionRate: 0 };

export function DashboardClient({ tenant, todayBookings, services, stats }: Props) {
  const [bookings, setBookings] = useState(todayBookings);
  const landingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/s/${tenant.slug}`;

  const updateBookingStatus = async (bookingId: string, status: string) => {
    // Optimistic update
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: status as any } : b))
    );
    await fetch(`/api/booking/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TOP NAV */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">{tenant.name}</p>
              <p className="text-xs text-gray-400 capitalize">{tenant.type}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={landingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 transition font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Ver landing</span>
            </a>
            <Link href="/dashboard/settings">
              <Settings className="w-5 h-5 text-gray-400 hover:text-gray-600 transition" />
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* SALUDO */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Buen día 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>

        {/* MÉTRICAS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {METRICS.map((metric, i) => (
            <motion.div
              key={metric.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500">{metric.label}</p>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", {
                  "bg-indigo-100": metric.color === "indigo",
                  "bg-emerald-100": metric.color === "emerald",
                  "bg-green-100": metric.color === "green",
                  "bg-violet-100": metric.color === "violet",
                })}>
                  <metric.icon className={cn("w-4 h-4", {
                    "text-indigo-600": metric.color === "indigo",
                    "text-emerald-600": metric.color === "emerald",
                    "text-green-600": metric.color === "green",
                    "text-violet-600": metric.color === "violet",
                  })} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">
                {stats[metric.key]}{metric.suffix ?? ""}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* TURNOS DEL DÍA */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Turnos de hoy
              </h2>
              <Link
                href="/dashboard/bookings"
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                Ver todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay turnos para hoy.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Compartí tu link para recibir reservas.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => {
                  const statusInfo = STATUS_STYLES[booking.status] ?? STATUS_STYLES.pending;
                  return (
                    <motion.div
                      key={booking.id}
                      layout
                      className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{booking.client_name}</p>
                            <p className="text-sm text-gray-500">{booking.services?.name}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(booking.starts_at), "HH:mm")} hs
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {booking.client_phone}
                              </span>
                              <span className="capitalize rounded-full px-2 py-0.5 text-xs font-medium"
                                style={{
                                  backgroundColor: booking.source === "whatsapp" ? "#d1fae5" : "#e0e7ff",
                                  color: booking.source === "whatsapp" ? "#065f46" : "#3730a3",
                                }}>
                                {booking.source}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.class}`}>
                            {statusInfo.label}
                          </span>
                          {booking.status === "confirmed" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => updateBookingStatus(booking.id, "completed")}
                                className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition"
                                title="Marcar como completado"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateBookingStatus(booking.id, "cancelled")}
                                className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"
                                title="Cancelar turno"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-4">
            {/* Link de la landing */}
            <div className="bg-gradient-to-br from-indigo-600 to-emerald-500 rounded-2xl p-5 text-white">
              <p className="text-sm font-semibold text-indigo-100 mb-1">Tu link de reservas</p>
              <p className="font-mono text-xs text-white/80 truncate mb-4">
                /s/{tenant.slug}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(landingUrl)}
                  className="flex-1 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition font-medium"
                >
                  Copiar
                </button>
                <a
                  href={landingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 bg-white text-indigo-600 text-sm rounded-lg transition font-medium text-center hover:bg-indigo-50"
                >
                  Abrir
                </a>
              </div>
            </div>

            {/* Servicios */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Servicios activos</h3>
                <Link href="/dashboard/services" className="text-xs text-indigo-600 hover:text-indigo-800">
                  Gestionar
                </Link>
              </div>
              <div className="space-y-2">
                {services.slice(0, 4).map((service) => (
                  <div key={service.id} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-700 truncate flex-1">{service.name}</span>
                    <span className="text-indigo-600 font-semibold ml-2 flex-shrink-0">
                      {formatPrice(service.price)}
                    </span>
                  </div>
                ))}
                {services.length === 0 && (
                  <p className="text-sm text-gray-400">No hay servicios. &nbsp;
                    <Link href="/dashboard/services" className="text-indigo-600">Agregar</Link>
                  </p>
                )}
              </div>
            </div>

            {/* Accesos rápidos */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4">Accesos rápidos</h3>
              <div className="space-y-2">
                {[
                  { href: `/s/${tenant.slug}`, icon: ExternalLink, label: "Ver mi landing" },
                  { href: "/dashboard/bookings", icon: Calendar, label: "Todos los turnos" },
                  { href: "/dashboard/services", icon: Scissors, label: "Gestionar servicios" },
                  { href: "/dashboard/whatsapp", icon: MessageCircle, label: "Bot de WhatsApp (IA)" },
                  { href: "/dashboard/settings", icon: Settings, label: "Configuración" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    target={item.href.startsWith("/s/") ? "_blank" : undefined}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 transition text-gray-700 hover:text-gray-900 text-sm"
                  >
                    <item.icon className="w-4 h-4 text-gray-400" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

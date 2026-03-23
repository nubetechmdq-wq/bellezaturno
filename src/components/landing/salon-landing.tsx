"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Calendar,
  MessageCircle,
  MapPin,
  Phone,
  Star,
  Clock,
  ChevronRight,
  Scissors,
} from "lucide-react";
import type { Tenant, Service, Testimonial } from "@/types/database";
import { formatPrice, formatDuration, formatWhatsAppNumber } from "@/lib/utils";
import { BookingModal } from "@/components/landing/booking-modal";

interface SalonLandingProps {
  tenant: Tenant;
  services: Service[];
  testimonials: Testimonial[];
  preselectedServiceId?: string;
}

// CAMBIO FÁCIL: Textos de la landing que podés editar para todos los salones
const LABEL = {
  bookNow: "Reservar ahora",
  bookViaWhatsApp: "Reservar por WhatsApp",
  ourServices: "Nuestros servicios",
  howItWorks: "¿Cómo reservar?",
  testimonials: "Lo que dicen nuestros clientes",
  bookToday: "¡Reservá hoy!",
};

const HOW_IT_WORKS = [
  { icon: "1️⃣", title: "Elegí el servicio", desc: "Seleccioná el servicio que querés reservar." },
  { icon: "2️⃣", title: "Elegí el día y hora", desc: "Mirá la disponibilidad en tiempo real." },
  { icon: "✅", title: "¡Listo!", desc: "Recibís confirmación al instante por WhatsApp y email." },
];

export function SalonLanding({
  tenant,
  services,
  testimonials,
  preselectedServiceId,
}: SalonLandingProps) {
  const [bookingOpen, setBookingOpen] = useState(!!preselectedServiceId);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(
    preselectedServiceId
  );

  // Construir URL de WhatsApp
  const waNumber = tenant.whatsapp_number
    ? formatWhatsAppNumber(tenant.whatsapp_number)
    : null;
  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(
        `Hola! Quiero reservar un turno en ${tenant.name}`
      )}`
    : null;

  const primaryColor = tenant.primary_color ?? "#6366f1";
  const secondaryColor = tenant.secondary_color ?? "#10b981";

  const openBooking = (serviceId?: string) => {
    setSelectedServiceId(serviceId);
    setBookingOpen(true);
  };

  return (
    <>
      {/* Estilos dinámicos (colores del tenant) */}
      <style>{`
        :root {
          --salon-primary: ${primaryColor};
          --salon-secondary: ${secondaryColor};
        }
        .btn-primary {
          background: var(--salon-primary);
        }
        .btn-primary:hover {
          opacity: 0.9;
        }
        .gradient-salon {
          background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
        }
        .text-salon-primary { color: ${primaryColor}; }
        .border-salon-primary { border-color: ${primaryColor}; }
      `}</style>

      <main className="min-h-screen bg-white">
        {/* ======================== HERO ======================== */}
        <section className="relative min-h-[85vh] flex flex-col justify-center overflow-hidden">
          {/* Fondo: foto del salón o gradiente */}
          {tenant.hero_image_url ? (
            <div className="absolute inset-0">
              <Image
                src={tenant.hero_image_url}
                alt={tenant.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black/55" />
            </div>
          ) : (
            <div className="absolute inset-0 gradient-salon opacity-90" />
          )}

          {/* Contenido del hero */}
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white pt-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Logo o icono */}
              {tenant.logo_url ? (
                <Image
                  src={tenant.logo_url}
                  alt={tenant.name}
                  width={80}
                  height={80}
                  className="mx-auto mb-6 rounded-2xl shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <Scissors className="w-8 h-8 text-white" />
                </div>
              )}

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-4 drop-shadow-lg">
                {tenant.name}
              </h1>

              {tenant.description && (
                <p className="text-xl sm:text-2xl text-white/85 mb-10 max-w-2xl mx-auto leading-relaxed">
                  {tenant.description}
                </p>
              )}

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => openBooking()}
                  className="btn-primary text-white text-lg font-bold h-16 px-10 rounded-2xl shadow-2xl flex items-center justify-center gap-2"
                >
                  <Calendar className="w-6 h-6" />
                  {LABEL.bookNow}
                </motion.button>

                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#25D366] text-white text-lg font-bold h-16 px-8 rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:bg-[#20bb5a] transition"
                  >
                    <MessageCircle className="w-6 h-6" />
                    {LABEL.bookViaWhatsApp}
                  </a>
                )}
              </div>

              {/* Info rápida */}
              <div className="flex flex-wrap justify-center gap-6 mt-10 text-white/80 text-sm">
                {tenant.address && tenant.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {tenant.address}, {tenant.city}
                  </span>
                )}
                {tenant.phone && (
                  <a
                    href={`tel:${tenant.phone}`}
                    className="flex items-center gap-1 hover:text-white transition"
                  >
                    <Phone className="w-4 h-4" />
                    {tenant.phone}
                  </a>
                )}
              </div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60"
          >
            <ChevronRight className="w-6 h-6 rotate-90" />
          </motion.div>
        </section>

        {/* ======================== SERVICIOS ======================== */}
        <section id="servicios" className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-3">
                {LABEL.ourServices}
              </h2>
              <div
                className="w-16 h-1 rounded-full mx-auto"
                style={{ backgroundColor: primaryColor }}
              />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, i) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-salon-primary hover:shadow-lg transition-all cursor-pointer"
                  style={{ "--tw-border-opacity": 1 } as any}
                  onClick={() => openBooking(service.id)}
                >
                  {service.image_url && (
                    <Image
                      src={service.image_url}
                      alt={service.name}
                      width={400}
                      height={200}
                      className="w-full h-36 object-cover rounded-xl mb-4"
                    />
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      {formatDuration(service.duration_minutes)}
                    </div>
                    <span
                      className="text-lg font-extrabold"
                      style={{ color: primaryColor }}
                    >
                      {formatPrice(service.price)}
                    </span>
                  </div>
                  <button
                    className="mt-4 w-full py-2.5 text-sm font-semibold text-white rounded-xl btn-primary transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      openBooking(service.id);
                    }}
                  >
                    Reservar →
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ======================== CÓMO RESERVAR ======================== */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-3">
                {LABEL.howItWorks}
              </h2>
              <div
                className="w-16 h-1 rounded-full mx-auto"
                style={{ backgroundColor: secondaryColor }}
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-8">
              {HOW_IT_WORKS.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-5xl mb-4">{step.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-500">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ======================== TESTIMONIOS ======================== */}
        {testimonials.length > 0 && (
          <section className="py-20 bg-white">
            <div className="max-w-5xl mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-3">
                  {LABEL.testimonials}
                </h2>
                <div
                  className="w-16 h-1 rounded-full mx-auto"
                  style={{ backgroundColor: primaryColor }}
                />
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
                  >
                    <div className="flex mb-3">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star
                          key={j}
                          className="w-4 h-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 italic mb-4">"{t.content}"</p>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {t.client_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {t.client_name}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ======================== CTA FINAL ======================== */}
        <section
          className="py-24 gradient-salon text-white text-center"
        >
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-6">
              {LABEL.bookToday}
            </h2>
            <p className="text-white/80 text-xl mb-10">
              Reservas online, rápido y sin llamadas. En 2 minutos tenés tu turno confirmado.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => openBooking()}
              className="bg-white text-lg font-bold h-16 px-12 rounded-2xl shadow-2xl flex items-center gap-2 mx-auto hover:shadow-3xl transition-shadow"
              style={{ color: primaryColor }}
            >
              <Calendar className="w-6 h-6" />
              {LABEL.bookNow}
            </motion.button>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-10 bg-gray-900 text-gray-400 text-center">
          <p className="text-sm">
            © 2026 {tenant.name} ·{" "}
            <span className="text-gray-500">
              Powered by{" "}
              <Link
                href="/"
                className="hover:text-white transition"
                target="_blank"
              >
                BellezaTurno
              </Link>
            </span>
          </p>
        </footer>
      </main>

      {/* BOTÓN STICKY DE WHATSAPP */}
      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-[#25D366] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Reservar por WhatsApp"
        >
          <MessageCircle className="w-8 h-8" />
        </a>
      )}

      {/* MODAL DE RESERVAS */}
      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        tenant={tenant}
        services={services}
        preselectedServiceId={selectedServiceId}
      />
    </>
  );
}

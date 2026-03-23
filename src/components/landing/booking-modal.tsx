"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, User, Phone, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tenant, Service } from "@/types/database";
import { formatPrice, formatDuration } from "@/lib/utils";
import { addDays, format, startOfDay, isBefore, isAfter, addMinutes, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  tenant: Tenant;
  services: Service[];
  preselectedServiceId?: string;
}

type Step = "service" | "datetime" | "client" | "confirm";

export function BookingModal({
  open,
  onClose,
  tenant,
  services,
  preselectedServiceId,
}: BookingModalProps) {
  const [step, setStep] = useState<Step>(preselectedServiceId ? "datetime" : "service");
  const [selectedService, setSelectedService] = useState<Service | undefined>(
    services.find((s) => s.id === preselectedServiceId)
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const primaryColor = tenant.primary_color ?? "#6366f1";

  // Generar próximos 30 días disponibles
  const futureDates = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(new Date(), i + 1);
    return format(date, "yyyy-MM-dd");
  });

  const fetchSlots = async (date: string) => {
    if (!selectedService) return;
    setLoadingSlots(true);
    setAvailableSlots([]);
    setSelectedTime("");
    try {
      const res = await fetch(
        `/api/booking/availability?tenantId=${tenant.id}&serviceId=${selectedService.id}&date=${date}`
      );
      const data = await res.json();
      setAvailableSlots(data.slots ?? []);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    fetchSlots(date);
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone)
      return;
    setIsSubmitting(true);
    try {
      const [h, m] = selectedTime.split(":").map(Number);
      const startsAt = new Date(selectedDate);
      startsAt.setHours(h, m, 0, 0);
      const endsAt = addMinutes(startsAt, selectedService.duration_minutes);

      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant.id,
          service_id: selectedService.id,
          client_name: clientName,
          client_phone: clientPhone,
          client_email: clientEmail,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          source: "landing",
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
        setStep("confirm");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setStep(preselectedServiceId ? "datetime" : "service");
    setSelectedService(services.find((s) => s.id === preselectedServiceId));
    setSelectedDate("");
    setSelectedTime("");
    setClientName("");
    setClientPhone("");
    setClientEmail("");
    setIsSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={reset}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 w-full"
          >
            <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
              {/* Header */}
              <div
                className="p-6 text-white rounded-t-3xl sm:rounded-t-2xl"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${tenant.secondary_color ?? "#10b981"})` }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">Reservar turno</h3>
                    <p className="text-white/80 text-sm mt-1">{tenant.name}</p>
                  </div>
                  <button onClick={reset} className="p-1 hover:bg-white/20 rounded-lg transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Stepper */}
                {!isSuccess && (
                  <div className="flex gap-2 mt-4">
                    {(["service", "datetime", "client"] as Step[]).map((s, i) => (
                      <div
                        key={s}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          step === s || (step === "confirm" && i <= 2)
                            ? "bg-white"
                            : "bg-white/30"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {/* PASO 1: Selección de servicio */}
                  {step === "service" && (
                    <motion.div
                      key="service"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-3"
                    >
                      <h4 className="font-semibold text-gray-800 mb-2">¿Qué servicio querés?</h4>
                      {services.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => {
                            setSelectedService(service);
                            setStep("datetime");
                          }}
                          className="w-full text-left p-4 rounded-xl border-2 hover:shadow-sm transition-all"
                          style={{
                            borderColor: selectedService?.id === service.id ? primaryColor : "#e5e7eb",
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-gray-900">{service.name}</p>
                              <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {formatDuration(service.duration_minutes)}
                              </p>
                            </div>
                            <span
                              className="text-lg font-bold"
                              style={{ color: primaryColor }}
                            >
                              {formatPrice(service.price)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {/* PASO 2: Fecha y hora */}
                  {step === "datetime" && (
                    <motion.div
                      key="datetime"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      {selectedService && (
                        <div className="p-3 rounded-xl border text-sm flex justify-between items-center"
                          style={{ borderColor: primaryColor + "40", backgroundColor: primaryColor + "08" }}>
                          <span className="font-semibold text-gray-800">{selectedService.name}</span>
                          <span style={{ color: primaryColor }} className="font-bold">
                            {formatPrice(selectedService.price)}
                          </span>
                        </div>
                      )}

                      <div>
                        <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                          Elegí la fecha
                        </p>
                        <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto">
                          {futureDates.map((date) => {
                            const d = new Date(date + "T12:00:00");
                            return (
                              <button
                                key={date}
                                onClick={() => handleDateSelect(date)}
                                className="p-2 rounded-lg border text-center text-xs transition-all"
                                style={{
                                  borderColor: selectedDate === date ? primaryColor : "#e5e7eb",
                                  backgroundColor: selectedDate === date ? primaryColor : "white",
                                  color: selectedDate === date ? "white" : "#374151",
                                  fontWeight: selectedDate === date ? "700" : "400",
                                }}
                              >
                                <div className="font-bold">
                                  {format(d, "d", { locale: es })}
                                </div>
                                <div className="uppercase">
                                  {format(d, "MMM", { locale: es })}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Horarios */}
                      {selectedDate && (
                        <div>
                          <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4" style={{ color: primaryColor }} />
                            Elegí el horario
                          </p>
                          {loadingSlots ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                            </div>
                          ) : availableSlots.length === 0 ? (
                            <p className="text-center text-gray-400 py-4 text-sm">
                              No hay turnos disponibles para este día.
                            </p>
                          ) : (
                            <div className="grid grid-cols-4 gap-2">
                              {availableSlots.map((slot) => (
                                <button
                                  key={slot}
                                  onClick={() => setSelectedTime(slot)}
                                  className="p-2 rounded-lg border text-sm font-medium transition-all"
                                  style={{
                                    borderColor: selectedTime === slot ? primaryColor : "#e5e7eb",
                                    backgroundColor: selectedTime === slot ? primaryColor : "white",
                                    color: selectedTime === slot ? "white" : "#374151",
                                  }}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => setStep("service")}
                          className="flex-1 py-3 border rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                        >
                          Atrás
                        </button>
                        <button
                          onClick={() => setStep("client")}
                          disabled={!selectedDate || !selectedTime}
                          className="flex-1 py-3 text-white rounded-xl text-sm font-semibold transition disabled:opacity-40"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Continuar →
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* PASO 3: Datos del cliente */}
                  {step === "client" && (
                    <motion.div
                      key="client"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <h4 className="font-semibold text-gray-800">Tus datos</h4>

                      <div className="space-y-1.5">
                        <Label htmlFor="client-name" className="flex items-center gap-1.5 text-sm">
                          <User className="w-3.5 h-3.5" /> Nombre completo *
                        </Label>
                        <Input
                          id="client-name"
                          placeholder="Juan García"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="client-phone" className="flex items-center gap-1.5 text-sm">
                          <Phone className="w-3.5 h-3.5" /> WhatsApp / Teléfono *
                        </Label>
                        <Input
                          id="client-phone"
                          placeholder="+54 9 223 500-1234"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="client-email" className="flex items-center gap-1.5 text-sm">
                          <Mail className="w-3.5 h-3.5" /> Email (opcional)
                        </Label>
                        <Input
                          id="client-email"
                          type="email"
                          placeholder="juan@email.com"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                        />
                      </div>

                      {/* Resumen */}
                      {selectedService && selectedDate && selectedTime && (
                        <div className="p-4 rounded-xl text-sm space-y-1.5"
                          style={{ backgroundColor: primaryColor + "08", borderColor: primaryColor + "30", border: "1px solid" }}>
                          <p className="font-semibold text-gray-800">Resumen del turno:</p>
                          <p className="text-gray-600">📋 {selectedService.name}</p>
                          <p className="text-gray-600">
                            📅 {format(new Date(selectedDate + "T12:00:00"), "EEEE d 'de' MMMM", { locale: es })}
                          </p>
                          <p className="text-gray-600">🕐 {selectedTime} hs</p>
                          <p className="font-bold" style={{ color: primaryColor }}>
                            💰 {formatPrice(selectedService.price)}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => setStep("datetime")}
                          className="flex-1 py-3 border rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                        >
                          Atrás
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={isSubmitting || !clientName || !clientPhone}
                          className="flex-1 py-3 text-white rounded-xl text-sm font-semibold transition disabled:opacity-40 flex justify-center items-center gap-2"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                          Confirmar turno
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* PASO 4: Confirmación */}
                  {step === "confirm" && (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6"
                    >
                      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                      </div>
                      <h4 className="text-2xl font-extrabold text-gray-900 mb-2">
                        ¡Turno confirmado! 🎉
                      </h4>
                      <p className="text-gray-500 mb-6">
                        Te esperamos el{" "}
                        <strong>
                          {selectedDate &&
                            format(new Date(selectedDate + "T12:00:00"), "EEEE d 'de' MMMM", { locale: es })}
                        </strong>{" "}
                        a las <strong>{selectedTime} hs</strong>.
                      </p>
                      <p className="text-sm text-gray-400 mb-8">
                        Recibirás un recordatorio por WhatsApp 24hs antes.
                      </p>
                      <button
                        onClick={reset}
                        className="w-full py-3 text-white rounded-xl font-semibold"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Cerrar
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

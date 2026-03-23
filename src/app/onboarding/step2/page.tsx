"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Clock, DollarSign, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WizardCard, StepIndicator } from "@/components/onboarding/wizard-components";
import { saveOnboardingData, getOnboardingData } from "@/lib/onboarding-store";
import { formatPrice, formatDuration } from "@/lib/utils";

// CAMBIO FÁCIL: servicios predefinidos según el tipo de salón
const SERVICE_TEMPLATES = {
  barberia: [
    { name: "Corte de pelo", duration_minutes: 30, price: 4500 },
    { name: "Barba", duration_minutes: 20, price: 3000 },
    { name: "Corte + Barba", duration_minutes: 45, price: 6500 },
  ],
  peluqueria: [
    { name: "Corte de pelo", duration_minutes: 45, price: 5500 },
    { name: "Tintura completa", duration_minutes: 90, price: 12000 },
    { name: "Mechas", duration_minutes: 120, price: 15000 },
  ],
  spa: [
    { name: "Masaje relajante", duration_minutes: 60, price: 8000 },
    { name: "Facial completo", duration_minutes: 75, price: 10000 },
    { name: "Manicure + Pedicure", duration_minutes: 90, price: 7000 },
  ],
  salon: [
    { name: "Maquillaje social", duration_minutes: 60, price: 9000 },
    { name: "Peinado", duration_minutes: 45, price: 6000 },
    { name: "Manicure", duration_minutes: 30, price: 3500 },
  ],
};

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
}

function ServiceRow({
  service,
  onChange,
  onDelete,
}: {
  service: Service;
  onChange: (id: string, key: keyof Service, value: string | number) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="bg-gray-50 rounded-xl p-4 border border-gray-200"
    >
      <div className="flex gap-3 items-start">
        <GripVertical className="w-5 h-5 text-gray-400 mt-2 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1">Nombre del servicio</Label>
              <Input
                placeholder="Ej: Corte de pelo"
                value={service.name}
                onChange={(e) => onChange(service.id, "name", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Duración
                </Label>
                <select
                  value={service.duration_minutes}
                  onChange={(e) =>
                    onChange(service.id, "duration_minutes", Number(e.target.value))
                  }
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                  {[15, 20, 30, 45, 60, 75, 90, 120].map((m) => (
                    <option key={m} value={m}>
                      {formatDuration(m)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Precio $
                </Label>
                <Input
                  type="number"
                  placeholder="4500"
                  value={service.price}
                  onChange={(e) =>
                    onChange(service.id, "price", Number(e.target.value))
                  }
                  min={0}
                />
              </div>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1">Descripción (opcional)</Label>
            <Input
              placeholder="Descripción breve del servicio"
              value={service.description}
              onChange={(e) => onChange(service.id, "description", e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => onDelete(service.id)}
          className="mt-2 text-red-400 hover:text-red-600 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default function OnboardingStep2() {
  const router = useRouter();
  const saved = getOnboardingData();
  const tenantType = saved.type ?? "barberia";

  const initServices = (): Service[] => {
    if (saved.services?.length) {
      return saved.services.map((s, i) => ({ ...s, id: String(i), description: s.description ?? "" }));
    }
    return (SERVICE_TEMPLATES[tenantType] ?? SERVICE_TEMPLATES.salon).map((s, i) => ({
      ...s,
      id: String(i),
      description: "",
    }));
  };

  const [services, setServices] = useState<Service[]>(initServices);
  const [isLoading, setIsLoading] = useState(false);

  const addService = () => {
    setServices((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", description: "", duration_minutes: 30, price: 0 },
    ]);
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const handleChange = (id: string, key: keyof Service, value: string | number) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [key]: value } : s))
    );
  };

  const handleNext = async () => {
    const valid = services.filter((s) => s.name.trim().length > 0);
    if (valid.length === 0) {
      alert("Agregá al menos un servicio");
      return;
    }
    setIsLoading(true);
    try {
      saveOnboardingData({ services: valid });
      // Guardar servicios en DB
      await fetch("/api/onboarding/step2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: saved.tenantId, services: valid }),
      });
      router.push("/onboarding/step3");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-4">
      <StepIndicator currentStep={2} />
      <WizardCard
        currentStep={2}
        title="Tus servicios"
        description="Agregá o editá los servicios que ofrecés. Podés cambiarlos después."
        isLoading={isLoading}
        onNext={handleNext}
        onBack={() => router.push("/onboarding/step1")}
        nextLabel="Continuar →"
      >
        <div className="space-y-3">
          <AnimatePresence>
            {services.map((service) => (
              <ServiceRow
                key={service.id}
                service={service}
                onChange={handleChange}
                onDelete={deleteService}
              />
            ))}
          </AnimatePresence>

          <button
            onClick={addService}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Agregar servicio
          </button>

          {/* Preview de precios */}
          {services.filter((s) => s.name).length > 0 && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-xs font-semibold text-indigo-600 mb-2">
                Vista previa de la landing:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {services
                  .filter((s) => s.name)
                  .slice(0, 4)
                  .map((s) => (
                    <div
                      key={s.id}
                      className="bg-white rounded-lg p-2 text-xs border border-indigo-100"
                    >
                      <p className="font-semibold text-gray-800 truncate">
                        {s.name}
                      </p>
                      <p className="text-indigo-600">
                        {formatPrice(s.price)} ·{" "}
                        {formatDuration(s.duration_minutes)}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </WizardCard>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Plus, Trash2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WizardCard, StepIndicator } from "@/components/onboarding/wizard-components";
import { saveOnboardingData, getOnboardingData } from "@/lib/onboarding-store";

// CAMBIO FÁCIL: testimonios de ejemplo para pre-llenar
const DEFAULT_TESTIMONIALS = [
  {
    id: "1",
    client_name: "Martín G.",
    content: "Excelente atención y el resultado quedó perfecto. Muy recomendable.",
    rating: 5,
  },
  {
    id: "2",
    client_name: "Lucas R.",
    content: "El mejor lugar de la zona. Siempre salgo conforme con el trabajo.",
    rating: 5,
  },
  {
    id: "3",
    client_name: "Diego M.",
    content: "Muy prolijo y profesional. Ya reservé para la semana que viene.",
    rating: 5,
  },
];

interface Testimonial {
  id: string;
  client_name: string;
  content: string;
  rating: number;
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition"
        >
          <Star
            className={`w-5 h-5 ${
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function OnboardingStep5() {
  const router = useRouter();
  const saved = getOnboardingData();
  const [testimonials, setTestimonials] = useState<Testimonial[]>(
    saved.testimonials?.length
      ? saved.testimonials.map((t, i) => ({ ...t, id: String(i) }))
      : DEFAULT_TESTIMONIALS
  );
  const [isLoading, setIsLoading] = useState(false);

  const add = () => {
    setTestimonials((prev) => [
      ...prev,
      { id: Date.now().toString(), client_name: "", content: "", rating: 5 },
    ]);
  };

  const remove = (id: string) => {
    setTestimonials((prev) => prev.filter((t) => t.id !== id));
  };

  const update = (id: string, key: keyof Testimonial, val: string | number) => {
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [key]: val } : t))
    );
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
      const valid = testimonials.filter(
        (t) => t.client_name.trim() && t.content.trim()
      );
      saveOnboardingData({ testimonials: valid });
      await fetch("/api/onboarding/step5", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: saved.tenantId, testimonials: valid }),
      });
      router.push("/onboarding/step6");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-4">
      <StepIndicator currentStep={5} />
      <WizardCard
        currentStep={5}
        title="Testimonios"
        description="Las reseñas generan confianza. Agregá algunas de tus mejores clientes."
        isLoading={isLoading}
        onNext={handleNext}
        onBack={() => router.push("/onboarding/step4")}
        nextLabel="Continuar →"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              Ya pre-cargamos 3 testimonios de ejemplo. Editálos con reseñas reales de tus clientes.
            </p>
          </div>

          <AnimatePresence>
            {testimonials.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Input
                    placeholder="Nombre del cliente"
                    value={t.client_name}
                    onChange={(e) => update(t.id, "client_name", e.target.value)}
                    className="max-w-[200px] bg-white"
                  />
                  <div className="flex items-center gap-3">
                    <StarRating
                      value={t.rating}
                      onChange={(v) => update(t.id, "rating", v)}
                    />
                    <button
                      onClick={() => remove(t.id)}
                      className="text-red-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <Textarea
                  placeholder="¿Qué dijo el cliente?"
                  value={t.content}
                  onChange={(e) => update(t.id, "content", e.target.value)}
                  rows={2}
                  className="bg-white resize-none"
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {testimonials.length < 5 && (
            <button
              onClick={add}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" /> Agregar reseña
            </button>
          )}
        </div>
      </WizardCard>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { WizardCard, StepIndicator } from "@/components/onboarding/wizard-components";
import { saveOnboardingData, getOnboardingData } from "@/lib/onboarding-store";

// CAMBIO FÁCIL: paletas de colores disponibles para los salones
const COLOR_PALETTES = [
  {
    id: "indigo-emerald",
    name: "Clásico Premium",
    primary: "#6366f1",
    secondary: "#10b981",
    preview: "from-indigo-500 to-emerald-500",
  },
  {
    id: "rose-amber",
    name: "Cálido y Elegante",
    primary: "#f43f5e",
    secondary: "#f59e0b",
    preview: "from-rose-500 to-amber-500",
  },
  {
    id: "violet-cyan",
    name: "Moderno Fresco",
    primary: "#8b5cf6",
    secondary: "#06b6d4",
    preview: "from-violet-500 to-cyan-500",
  },
  {
    id: "slate-gold",
    name: "Masculino Oscuro",
    primary: "#334155",
    secondary: "#eab308",
    preview: "from-slate-600 to-yellow-500",
  },
  {
    id: "pink-purple",
    name: "Femenino Suave",
    primary: "#ec4899",
    secondary: "#a855f7",
    preview: "from-pink-500 to-purple-500",
  },
  {
    id: "custom",
    name: "Personalizado",
    primary: "#6366f1",
    secondary: "#10b981",
    preview: "from-gray-400 to-gray-600",
  },
];

const STYLE_PRESETS = [
  {
    id: "glassmorphism",
    name: "Glassmorphism",
    description: "Moderno con efectos de cristal",
    emoji: "✨",
  },
  {
    id: "minimal",
    name: "Minimalista",
    description: "Limpio y simple, sin distracciones",
    emoji: "🤍",
  },
  {
    id: "bold",
    name: "Bold",
    description: "Colores fuertes y tipografía grande",
    emoji: "⚡",
  },
  {
    id: "classic",
    name: "Clásico",
    description: "Tradicional y profesional",
    emoji: "🎩",
  },
];

export default function OnboardingStep4() {
  const router = useRouter();
  const saved = getOnboardingData();
  const [selectedPalette, setSelectedPalette] = useState(
    COLOR_PALETTES[0]
  );
  const [customPrimary, setCustomPrimary] = useState(
    saved.primary_color ?? "#6366f1"
  );
  const [customSecondary, setCustomSecondary] = useState(
    saved.secondary_color ?? "#10b981"
  );
  const [stylePreset, setStylePreset] = useState<
    "glassmorphism" | "minimal" | "bold" | "classic"
  >((saved.style_preset as any) ?? "glassmorphism");
  const [isLoading, setIsLoading] = useState(false);

  const effectivePrimary =
    selectedPalette.id === "custom" ? customPrimary : selectedPalette.primary;
  const effectiveSecondary =
    selectedPalette.id === "custom" ? customSecondary : selectedPalette.secondary;

  const handleNext = async () => {
    setIsLoading(true);
    try {
      saveOnboardingData({
        primary_color: effectivePrimary,
        secondary_color: effectiveSecondary,
        style_preset: stylePreset,
      });
      await fetch("/api/onboarding/step4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: saved.tenantId,
          primary_color: effectivePrimary,
          secondary_color: effectiveSecondary,
          style_preset: stylePreset,
        }),
      });
      router.push("/onboarding/step5");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-4">
      <StepIndicator currentStep={4} />
      <WizardCard
        currentStep={4}
        title="Estilo y colores"
        description="Personalizá cómo lucirá tu landing page."
        isLoading={isLoading}
        onNext={handleNext}
        onBack={() => router.push("/onboarding/step3")}
        nextLabel="Continuar →"
      >
        <div className="space-y-6">
          {/* Preview de colores */}
          <div
            className="h-24 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-inner transition-all duration-500"
            style={{
              background: `linear-gradient(135deg, ${effectivePrimary} 0%, ${effectiveSecondary} 100%)`,
            }}
          >
            {saved.name ?? "Tu Salón"} ✂️
          </div>

          {/* Paletas */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Paleta de colores
            </p>
            <div className="grid grid-cols-3 gap-3">
              {COLOR_PALETTES.map((palette) => (
                <motion.button
                  key={palette.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedPalette(palette)}
                  className={`p-3 rounded-xl border-2 transition text-left ${
                    selectedPalette.id === palette.id
                      ? "border-indigo-500 ring-2 ring-indigo-200"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`h-8 rounded-lg mb-2 bg-gradient-to-r ${palette.preview}`}
                  />
                  <p className="text-xs font-medium text-gray-700 truncate">
                    {palette.name}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Color custom */}
          {selectedPalette.id === "custom" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Color primario
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customPrimary}
                    onChange={(e) => setCustomPrimary(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <span className="text-sm text-gray-500 font-mono">
                    {customPrimary}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Color secundario
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customSecondary}
                    onChange={(e) => setCustomSecondary(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <span className="text-sm text-gray-500 font-mono">
                    {customSecondary}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Estilo de diseño */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Estilo de diseño
            </p>
            <div className="grid grid-cols-2 gap-3">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setStylePreset(preset.id as any)}
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    stylePreset === preset.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl">{preset.emoji}</span>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {preset.name}
                  </p>
                  <p className="text-xs text-gray-500">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </WizardCard>
    </div>
  );
}

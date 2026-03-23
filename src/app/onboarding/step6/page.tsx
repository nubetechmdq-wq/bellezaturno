"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MessageCircle,
  CheckCircle2,
  Rocket,
  ExternalLink,
  Copy,
  Info,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WizardCard, StepIndicator } from "@/components/onboarding/wizard-components";
import { saveOnboardingData, getOnboardingData, clearOnboardingData } from "@/lib/onboarding-store";
import { formatWhatsAppNumber } from "@/lib/utils";

export default function OnboardingStep6() {
  const router = useRouter();
  const saved = getOnboardingData();
  const [whatsappNumber, setWhatsappNumber] = useState(
    saved.whatsapp_number ?? ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [landingUrl, setLandingUrl] = useState("");

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      const formattedNumber = whatsappNumber
        ? formatWhatsAppNumber(whatsappNumber)
        : null;

      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: saved.tenantId,
          whatsapp_number: formattedNumber,
          whatsapp_enabled: !!formattedNumber,
          onboarding_completed: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLandingUrl(data.landingUrl);
        setIsComplete(true);
        clearOnboardingData();
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto pt-4">
        <StepIndicator currentStep={6} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </motion.div>

            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              ¡Tu salón está listo! 🎉
            </h2>
            <p className="text-gray-600 mb-8">
              Tu landing page ya está online. Compartila con tus clientes y
              empezá a recibir reservas.
            </p>

            {/* URL de la landing */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
              <p className="text-xs text-indigo-500 font-semibold mb-2">
                TU LINK DE RESERVAS
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-indigo-700 font-mono text-sm truncate">
                  {landingUrl}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(landingUrl)}
                  className="text-indigo-500 hover:text-indigo-700 transition"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={landingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
              >
                <ExternalLink className="w-4 h-4" /> Ver mi landing
              </a>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                <Rocket className="w-4 h-4" /> Ir al dashboard
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pt-4">
      <StepIndicator currentStep={6} />
      <WizardCard
        currentStep={6}
        title="Conectar WhatsApp"
        description="Activá el bot de WhatsApp para recibir reservas automáticas."
        isLoading={isLoading}
        onNext={handleFinish}
        onBack={() => router.push("/onboarding/step5")}
        nextLabel={isLoading ? "Finalizando..." : "¡Publicar mi salón!"}
      >
        <div className="space-y-6">
          {/* Ícono WhatsApp */}
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          {/* Número de WhatsApp */}
          <div className="space-y-2">
            <Label htmlFor="wa-number">Número de WhatsApp Business</Label>
            <Input
              id="wa-number"
              placeholder="+54 9 223 500-1234"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
            />
            <p className="text-xs text-gray-400">
              Este es el número al que tus clientes van a escribir. Debe ser
              una cuenta de WhatsApp Business.
            </p>
          </div>

          {/* Cómo funciona el bot */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
            <p className="text-sm font-semibold text-gray-700">
              ¿Cómo funciona el bot?
            </p>
            {[
              {
                icon: "1️⃣",
                text: 'El cliente escribe "Hola, quiero un turno"',
              },
              {
                icon: "2️⃣",
                text: "El bot responde con tu menú de servicios",
              },
              {
                icon: "3️⃣",
                text: "Envía el link directo para reservar online",
              },
              {
                icon: "✅",
                text: "El turno queda confirmado automáticamente",
              },
            ].map((step) => (
              <div key={step.icon} className="flex items-center gap-3">
                <span className="text-lg">{step.icon}</span>
                <p className="text-sm text-gray-600">{step.text}</p>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 text-xs text-gray-400 bg-blue-50 p-3 rounded-xl border border-blue-100">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p>
              Podés configurar la conexión completa con Meta Business desde el
              Dashboard después de publicar tu salón. Por ahora solo guardamos tu número.
            </p>
          </div>
        </div>
      </WizardCard>
    </div>
  );
}

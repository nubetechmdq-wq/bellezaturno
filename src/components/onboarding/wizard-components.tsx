"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { number: 1, label: "Datos básicos" },
  { number: 2, label: "Servicios" },
  { number: 3, label: "Fotos" },
  { number: 4, label: "Estilo" },
  { number: 5, label: "Reseñas" },
  { number: 6, label: "WhatsApp" },
];

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-10">
      {/* Progress bar */}
      <div className="relative mb-4">
        <div className="h-2 bg-gray-200 rounded-full">
          <motion.div
            className="h-2 rounded-full gradient-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Step numbers */}
      <div className="flex justify-between">
        {STEPS.map((step) => {
          const isDone = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          return (
            <div key={step.number} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                  isDone && "bg-emerald-500 text-white",
                  isCurrent && "bg-indigo-600 text-white ring-4 ring-indigo-100",
                  !isDone && !isCurrent && "bg-gray-200 text-gray-500"
                )}
              >
                {isDone ? <CheckCircle className="w-4 h-4" /> : step.number}
              </div>
              <span
                className={cn(
                  "text-xs hidden sm:block",
                  isCurrent ? "text-indigo-600 font-semibold" : "text-gray-400"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface WizardCardProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  currentStep: number;
  totalSteps?: number;
  isLoading?: boolean;
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
  hideNext?: boolean;
}

export function WizardCard({
  children,
  title,
  description,
  currentStep,
  totalSteps = 6,
  isLoading = false,
  onNext,
  onBack,
  nextLabel = "Continuar",
  backLabel = "Atrás",
  hideNext = false,
}: WizardCardProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl mx-auto"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-emerald-50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                Paso {currentStep} de {totalSteps}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {description && (
              <p className="text-gray-600 mt-1">{description}</p>
            )}
          </div>

          {/* Content */}
          <div className="p-6">{children}</div>

          {/* Footer con botones */}
          <div className="px-6 pb-6 flex justify-between gap-3">
            {currentStep > 1 ? (
              <button
                onClick={onBack}
                disabled={isLoading}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium disabled:opacity-50"
              >
                {backLabel}
              </button>
            ) : (
              <div />
            )}
            {!hideNext && (
              <button
                onClick={onNext}
                disabled={isLoading}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-200"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {nextLabel}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

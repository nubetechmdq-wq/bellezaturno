import type { Metadata } from "next";
import { Scissors } from "lucide-react";

export const metadata: Metadata = {
  title: "Configurá tu salón | BellezaTurno",
  description: "Completá el wizard de configuración para tener tu salón online en minutos.",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
      {/* Header simple */}
      <header className="py-6 px-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
          <Scissors className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-xl text-gray-900">
          Belleza<span className="gradient-text">Turno</span>
        </span>
      </header>
      <main className="px-4 pb-16">{children}</main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Zap, Check, Shield, MessageCircle, CalendarClock } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  tenant: {
    id: string;
    name: string;
    plan: string;
    mp_subscription_id: string | null;
  };
}

export function BillingClient({ tenant }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPro = tenant.plan === "pro";

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/checkout", { method: "POST" });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Error al generar el pago");
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Planes y Facturación</h1>
        <p className="text-gray-500 mt-1">
          Gestiona tu suscripción y accedé a funcionalidades premium para tu salón.
        </p>
      </div>

      {isPro && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
          <div className="bg-emerald-100 p-2 rounded-xl">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text- emerald-800 font-bold text-lg">Suscripción Pro Activa</h3>
            <p className="text-emerald-700 text-sm mt-1">
              Estás disfrutando de todas las ventajas Premium, incluyendo el Bot de WhatsApp y recordatorios automáticos.
            </p>
            {tenant.mp_subscription_id && (
              <p className="text-emerald-600/80 text-xs mt-3 font-mono">
                Sub ID: {tenant.mp_subscription_id}
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* PLAN FREE */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 relative">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900">Plan Free</h3>
            <div className="mt-3 flex items-baseline text-4xl font-extrabold text-gray-900">
              $0
              <span className="ml-1 text-xl font-medium text-gray-500">/mes</span>
            </div>
          </div>
          <ul className="space-y-4 mb-8">
            <li className="flex gap-3 text-sm text-gray-600">
              <Check className="w-5 h-5 text-indigo-600 shrink-0" />
              Landing Page personalizada
            </li>
            <li className="flex gap-3 text-sm text-gray-600">
              <Check className="w-5 h-5 text-indigo-600 shrink-0" />
              Turnos web ilimitados
            </li>
            <li className="flex gap-3 text-sm text-gray-600">
              <Check className="w-5 h-5 text-indigo-600 shrink-0" />
              Gestión básica de servicios
            </li>
            <li className="flex gap-3 text-sm text-gray-400 opacity-60">
              <MessageCircle className="w-5 h-5 shrink-0" />
              Asistente virtual por WhatsApp
            </li>
            <li className="flex gap-3 text-sm text-gray-400 opacity-60">
              <CalendarClock className="w-5 h-5 shrink-0" />
              Recordatorios automáticos a clientes
            </li>
          </ul>
          
          <button 
            disabled
            className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-500 font-bold cursor-not-allowed"
          >
            {isPro ? "Bajar de plan" : "Plan actual"}
          </button>
        </div>

        {/* PLAN PRO */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-gray-900 rounded-3xl p-8 relative shadow-xl overflow-hidden"
        >
          {/* Badge */}
          <div className="absolute top-0 right-8 -mt-1">
            <span className="bg-gradient-to-r from-emerald-400 to-indigo-400 text-white text-xs font-bold px-3 py-1 rounded-b-lg uppercase tracking-wider">
              Recomendado
            </span>
          </div>
          
          <div className="mb-6 relative z-10">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Plan Pro <Zap className="w-5 h-5 text-yellow-400" />
            </h3>
            <div className="mt-3 flex items-baseline text-4xl font-extrabold text-white">
              $15.000
              <span className="ml-1 text-xl font-medium text-gray-400">/mes</span>
            </div>
            <p className="text-gray-400 text-sm mt-2">Pagá con Mercado Pago (suscripción)</p>
          </div>
          <ul className="space-y-4 mb-8 relative z-10">
            <li className="flex gap-3 text-sm text-gray-300">
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              Todo lo del plan Free
            </li>
            <li className="flex gap-3 text-sm text-white font-medium">
              <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              Asistente de IA en WhatsApp 24/7
            </li>
            <li className="flex gap-3 text-sm text-white font-medium">
              <CalendarClock className="w-5 h-5 text-emerald-400 shrink-0" />
              Recordatorios anti-ausencias (1h y 24hs)
            </li>
            <li className="flex gap-3 text-sm text-gray-300">
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              Estadísticas avanzadas
            </li>
          </ul>
          
          {!isPro && (
            <button 
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-500 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed z-10 relative flex justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Mejorar a Pro"
              )}
            </button>
          )}
        </motion.div>

      </div>
    </div>
  );
}

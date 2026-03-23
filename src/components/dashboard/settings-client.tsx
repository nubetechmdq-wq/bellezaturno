"use client";

import { useState } from "react";
import { Globe, Lock } from "lucide-react";

interface Props {
  tenant: {
    id: string;
    name: string;
    plan: string;
    custom_domain: string | null;
  };
}

export function SettingsClient({ tenant }: Props) {
  const [domain, setDomain] = useState(tenant.custom_domain || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPro = tenant.plan === "pro";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al conectar el dominio");

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 mt-1">Administra las preferencias y la marca de tu negocio.</p>
      </div>

      {/* CUSTOM DOMAIN CARD */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" /> Dominio Personalizado
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Conecta tu propio dominio (ej: misalon.com) a tu página de reservas.
            </p>
          </div>
          {!isPro && (
            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" /> Solo Plan Pro
            </span>
          )}
        </div>

        <div className="p-6 bg-gray-50">
          <form onSubmit={handleSave} className="flex gap-4 items-start max-w-xl">
            <div className="flex-1">
              <input
                type="text"
                placeholder="ej: misalon.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value.toLowerCase())}
                disabled={!isPro || loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-100 shadow-sm"
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              {success && (
                <div className="text-emerald-600 text-sm mt-2 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                  <p className="font-semibold">¡Dominio conectado exitosamente!</p>
                  <p className="mt-1 opacity-90">Por favor, ahora configurá los registros DNS en tu proveedor apuntando un CNAME a <code>cname.vercel-dns.com</code> o un A record a <code>76.76.21.21</code>.</p>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!isPro || loading || !domain.trim() || domain === tenant.custom_domain}
              className="bg-gray-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Conectando..." : "Guardar"}
            </button>
          </form>

          {!isPro && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Para utilizar un dominio propio, debés estar suscrito al Plan Pro. 
                Podés mejorarlo en la sección de <a href="/dashboard/billing" className="text-indigo-600 font-semibold hover:underline">Planes y Facturación</a>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

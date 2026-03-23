"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  QrCode, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw, 
  LogOut, 
  Save, 
  Sparkles,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  tenant: { id: string; name: string; slug: string };
  initialConfig: any;
}

export function WhatsAppClient({ tenant, initialConfig }: Props) {
  const [config, setConfig] = useState(initialConfig);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState(initialConfig?.instance_status || "disconnected");

  // Verificar estado al cargar
  useEffect(() => {
    checkStatus();
    // Poll cada 10 segundos si está conectando
    const interval = setInterval(() => {
      if (status === "connecting" || status === "disconnected") {
        checkStatus();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [status]);

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/whatsapp/instance");
      const data = await res.json();
      if (data.instance?.state) {
        setStatus(data.instance.state);
      } else {
        setStatus("disconnected");
      }
    } catch (e) {
      console.error("Error checking status", e);
    }
  };

  const connect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/instance", { method: "POST" });
      const data = await res.json();
      
      console.log("Respuesta de connect:", data);
      
      if (!res.ok) {
        alert(`Error del servidor: ${data.details || data.error || "Desconocido"}`);
        return;
      }
      
      if (data.base64) {
        setQrCode(data.base64);
        setStatus("connecting");
      } else {
        alert("No se recibió QR en la respuesta: " + JSON.stringify(data));
      }
    } catch (e: any) {
      alert(`Error de red al conectar: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!confirm("¿Estás seguro de que querés desconectar este WhatsApp?")) return;
    setLoading(true);
    try {
      await fetch("/api/whatsapp/instance", { method: "DELETE" });
      setStatus("disconnected");
      setQrCode(null);
    } catch (e) {
      alert("Error al desconectar");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) alert("Configuración guardada");
    } catch (e) {
      alert("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-8 h-8 text-emerald-500" />
            Configuración de WhatsApp
          </h1>
          <p className="text-gray-500 mt-2">
            Vinculá tu número y personalizá cómo tu asistente de IA responde a los clientes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={cn("px-4 py-1.5 text-sm font-medium", {
            "bg-emerald-100 text-emerald-700 border-emerald-200": status === "open",
            "bg-yellow-100 text-yellow-700 border-yellow-200": status === "connecting",
            "bg-gray-100 text-gray-500 border-gray-200": status === "disconnected",
          })}>
            {status === "open" ? "Conectado" : status === "connecting" ? "Esperando QR..." : "Desconectado"}
          </Badge>
          <Button variant="ghost" size="icon" onClick={checkStatus} disabled={checking}>
            <RefreshCw className={cn("w-4 h-4", { "animate-spin": checking })} />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* COLUMNA 1: CONEXIÓN QR */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
            <div className="p-6 bg-gray-50/50 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-gray-400" />
                Vincular Dispositivo
              </h2>
            </div>
            
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-6">
              {status === "open" ? (
                <div className="py-12">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">¡WhatsApp Vinculado!</h3>
                  <p className="text-gray-500 text-sm mt-2">
                    Tu asistente ya está listo para responder mensajes.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-8 text-red-500 border-red-100 hover:bg-red-50 hover:text-red-600"
                    onClick={logout}
                    disabled={loading}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              ) : qrCode ? (
                <div className="space-y-6 w-full">
                  <div className="relative aspect-square w-full max-w-[240px] mx-auto bg-white border-8 border-gray-50 rounded-2xl shadow-inner flex items-center justify-center">
                    <img 
                      src={qrCode} 
                      alt="WhatsApp QR" 
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-2xl text-left">
                    <p className="text-xs font-bold text-indigo-700 mb-2 flex items-center gap-1">
                      <Info className="w-3 h-3" /> PASOS PARA VINCULAR:
                    </p>
                    <ol className="text-xs text-indigo-600 space-y-1 list-decimal pl-4">
                      <li>Abrí WhatsApp en tu celu</li>
                      <li>Tocá Dispositivos vinculados</li>
                      <li>Escaneá este código QR</li>
                    </ol>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-gray-400"
                    onClick={() => { setQrCode(null); setStatus("disconnected"); }}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <MessageCircle className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 text-sm mb-8">
                    Para que el bot funcione, necesitás vincular un número de WhatsApp (igual que en WhatsApp Web).
                  </p>
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-lg shadow-lg shadow-emerald-100"
                    onClick={connect}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="animate-spin mr-2" /> : <QrCode className="mr-2" />}
                    Generar Código QR
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMNA 2-3: CONFIGURACIÓN DE IA */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={saveConfig} className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
            <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Personalización de la IA
              </h2>
              <Button type="submit" size="sm" className="gradient-primary" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            </div>

            <div className="p-8 space-y-8">
              {/* Instrucciones de la IA */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Instrucciones para Gemini (Prompt Principal)
                  </label>
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-0">
                    Pro
                  </Badge>
                </div>
                <Textarea 
                  placeholder="Ej: Sos una barbería moderna y relajada. Usá emojis y hablá de 'vos'. Priorizá ofrecer el corte de pelo clásico..."
                  className="min-h-[150px] text-base leading-relaxed border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-2xl p-4 transition-all"
                  value={config?.ai_instructions || ""}
                  onChange={(e) => setConfig({ ...config, ai_instructions: e.target.value })}
                />
                <p className="text-xs text-gray-400">
                  Estas instrucciones dictan cómo se comportará la Inteligencia Artificial al chatear con tus clientes.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Saludo inicial */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700">Mensaje de Bienvenida</label>
                  <Textarea 
                    className="min-h-[100px] text-sm border-gray-100 rounded-xl"
                    value={config?.greeting_message || ""}
                    onChange={(e) => setConfig({ ...config, greeting_message: e.target.value })}
                  />
                  <p className="text-[10px] text-gray-400 italic">Usá {"{salon_name}"} para texto dinámico.</p>
                </div>

                {/* Confirmación de reserva */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700">Mensaje de Confirmación</label>
                  <Textarea 
                    className="min-h-[100px] text-sm border-gray-100 rounded-xl"
                    value={config?.booking_success_message || ""}
                    onChange={(e) => setConfig({ ...config, booking_success_message: e.target.value })}
                  />
                  <p className="text-[10px] text-gray-400 italic">Usá {"{date}"} y {"{time}"} para los datos del turno.</p>
                </div>
              </div>

              {/* Toggle de Bot Activo */}
              <div className="bg-gray-50 rounded-2xl p-6 flex items-center justify-between border border-gray-100 mt-4">
                <div className="flex items-center gap-4">
                  <div 
                    className={cn("w-14 h-7 rounded-full transition-all duration-300 relative cursor-pointer shadow-inner", {
                      "bg-emerald-500": config?.is_active,
                      "bg-gray-300": !config?.is_active,
                    })}
                    onClick={() => setConfig({ ...config, is_active: !config.is_active })}
                  >
                    <div className={cn("absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm", {
                      "left-8": config?.is_active,
                      "left-1": !config?.is_active,
                    })} />
                  </div>
                  <div className="cursor-pointer" onClick={() => setConfig({ ...config, is_active: !config.is_active })}>
                    <p className="font-bold text-gray-900 text-sm">Activar Respuestas Automáticas</p>
                    <p className="text-[11px] text-gray-500">Si lo apagás, el bot no responderá pero los recordatorios seguirán funcionando.</p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Helper para clases CSS
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

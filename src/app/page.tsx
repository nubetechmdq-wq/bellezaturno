"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useAuth,
} from "@clerk/nextjs";
import {
  Scissors,
  Calendar,
  MessageCircle,
  Star,
  ArrowRight,
  CheckCircle,
  Zap,
  Globe,
  TrendingUp,
} from "lucide-react";

// CAMBIO FÁCIL PARA BellezaTurno: ajustá los textos de marketing aquí
const MARKETING = {
  hero: {
    badge: "🚀 Plataforma #1 para salones en Argentina",
    title: "Tu salón merece",
    titleHighlight: "reservas automáticas",
    description:
      "Creá tu landing page profesional en minutos. Tus clientes reservan desde WhatsApp o tu web. Automatizá recordatorios y olvidate de los turnos perdidos.",
    cta: "Comenzar gratis",
    secondary: "Ver demo",
  },
  stats: [
    { label: "Salones activos", value: "500+" },
    { label: "Turnos gestionados", value: "50K+" },
    { label: "Tasa de asistencia", value: "94%" },
  ],
  features: [
    {
      icon: Globe,
      title: "Landing Page Profesional",
      description:
        "Tu salón con su propia URL y diseño personalizado. Listo en 5 minutos.",
      color: "indigo",
    },
    {
      icon: MessageCircle,
      title: "Bot de WhatsApp con IA",
      description:
        "El cliente escribe 'quiero un turno' y el bot responde automáticamente con tu link de reserva.",
      color: "emerald",
    },
    {
      icon: Calendar,
      title: "Calendario Inteligente",
      description:
        "Gestión visual de turnos sin superposiciones. Recordatorios automáticos por WhatsApp.",
      color: "violet",
    },
    {
      icon: TrendingUp,
      title: "Analytics en tiempo real",
      description:
        "Sabé cuántos turnos tuviste este mes, qué servicios se reservan más y más.",
      color: "amber",
    },
  ],
  pricing: [
    {
      name: "Gratis",
      price: "0",
      description: "Para empezar",
      features: [
        "1 landing page",
        "Bot WhatsApp básico",
        "Hasta 50 turnos/mes",
        "Recordatorios automáticos",
      ],
      cta: "Empezar gratis",
      featured: false,
    },
    {
      name: "Pro",
      price: "9.900",
      period: "/mes",
      description: "Para crecer",
      features: [
        "Turnos ilimitados",
        "Custom domain propio",
        "Analytics avanzados",
        "Múltiples empleados",
        "Soporte prioritario",
        "Bot IA con Gemini",
      ],
      cta: "Probar 14 días gratis",
      featured: true,
    },
  ],
};

export default function HomePage() {
  const { userId, isLoaded } = useAuth();

  return (
    <main className="min-h-screen bg-white">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">
              Belleza<span className="gradient-text">Turno</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {!isLoaded ? null : !userId ? (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm">
                    Ingresar
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Empezar gratis
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-indigo-200 text-indigo-600"
                >
                  Ir al Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-32 overflow-hidden">
        {/* Fondo degradado */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 -z-10" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-200 rounded-full blur-3xl opacity-30 -z-10" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-emerald-200 rounded-full blur-3xl opacity-30 -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-6 bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100">
              {MARKETING.hero.badge}
            </Badge>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight mb-6">
              {MARKETING.hero.title}
              <br />
              <span className="gradient-text">
                {MARKETING.hero.titleHighlight}
              </span>
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              {MARKETING.hero.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isLoaded ? null : !userId ? (
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className="text-lg h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                  >
                    {MARKETING.hero.cta}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="text-lg h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                  >
                    Ir a mi Dashboard
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              )}
              <Link href="/s/demo">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg h-14 px-8 border-gray-300"
                >
                  {MARKETING.hero.secondary}
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto"
          >
            {MARKETING.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold gradient-text">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Todo lo que tu salón necesita
            </h2>
            <p className="text-xl text-gray-600">
              Sin complicaciones. Sin técnicos. Vos solo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {MARKETING.features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Precios simples y transparentes
            </h2>
            <p className="text-xl text-gray-600">
              Empezá gratis. Crecé cuando estés listo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {MARKETING.pricing.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border-2 relative ${
                  plan.featured
                    ? "border-indigo-500 shadow-xl shadow-indigo-100"
                    : "border-gray-200"
                }`}
              >
                {plan.featured && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white border-0">
                    ⭐ Más popular
                  </Badge>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {plan.name}
                </h3>
                <p className="text-gray-500 mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-gray-500 text-sm">$</span>
                  <span className="text-5xl font-extrabold text-gray-900">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-500">{plan.period}</span>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up">
                  <Button
                    className={`w-full h-12 text-base ${
                      plan.featured
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : ""
                    }`}
                    variant={plan.featured ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 gradient-primary">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <div className="flex justify-center mb-6">
            <Zap className="w-12 h-12 text-yellow-300" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-6">
            ¿Listo para automatizar tu salón?
          </h2>
          <p className="text-xl text-indigo-100 mb-10">
            Unís a más de 500 salones que ya gestionan sus turnos con
            BellezaTurno.
          </p>
          <Link href="/sign-up">
            <Button
              size="lg"
              className="h-14 px-10 text-lg bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl"
            >
              Crear mi salón gratis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded gradient-primary flex items-center justify-center">
              <Scissors className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-gray-700">BellezaTurno</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2026 BellezaTurno. Hecho con ❤️ en Argentina.
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <Link
              href="/terminos"
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Términos
            </Link>
            <Link
              href="/privacidad"
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

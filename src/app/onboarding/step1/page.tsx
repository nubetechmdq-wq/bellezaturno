"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WizardCard, StepIndicator } from "@/components/onboarding/wizard-components";
import { saveOnboardingData, getOnboardingData } from "@/lib/onboarding-store";
import { generateSlug } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

// CAMBIO FÁCIL: ciudades disponibles en el select
const CIUDADES = [
  "Mar del Plata",
  "Buenos Aires",
  "Córdoba",
  "Rosario",
  "La Plata",
  "Mendoza",
  "San Miguel de Tucumán",
  "Otra",
];

const schema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  type: z.enum(["barberia", "peluqueria", "spa", "salon"]),
  address: z.string().optional(),
  city: z.string().min(2, "Seleccioná una ciudad"),
  phone: z.string().optional(),
  whatsapp_number: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const TIPOS = [
  { value: "barberia", label: "✂️ Barbería" },
  { value: "peluqueria", label: "💇 Peluquería" },
  { value: "spa", label: "💆 Spa / Centro de bienestar" },
  { value: "salon", label: "💅 Salón de belleza" },
];

export default function OnboardingStep1() {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const saved = getOnboardingData();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: saved.name ?? "",
      type: saved.type ?? "barberia",
      address: saved.address ?? "",
      city: saved.city ?? "Mar del Plata",
      phone: saved.phone ?? "",
      whatsapp_number: saved.whatsapp_number ?? "",
      email: saved.email ?? user?.primaryEmailAddress?.emailAddress ?? "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const slug = generateSlug(values.name);
      saveOnboardingData({ ...values, slug });
      
      // Crear el tenant en la base de datos
      const res = await fetch("/api/onboarding/step1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, slug }),
      });
      
      if (!res.ok) throw new Error("Error creando el salón");
      const { tenantId } = await res.json();
      saveOnboardingData({ tenantId });
      
      router.push("/onboarding/step2");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-4">
      <StepIndicator currentStep={1} />
      <WizardCard
        currentStep={1}
        title="Datos de tu salón"
        description="Contanos lo básico para armar tu perfil."
        isLoading={isLoading}
        onNext={handleSubmit(onSubmit)}
        nextLabel="Continuar →"
        onBack={() => {}}
      >
        <div className="space-y-5">
          {/* Nombre del salón */}
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Nombre del salón <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ej: Barbería El Estilo"
              {...register("name")}
              className={errors.name ? "border-red-400" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Tipo */}
          <div className="space-y-1.5">
            <Label>
              Tipo de negocio <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {TIPOS.map((tipo) => (
                <label
                  key={tipo.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    watch("type") === tipo.value
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    value={tipo.value}
                    {...register("type")}
                    className="hidden"
                  />
                  <span className="text-sm font-medium">{tipo.label}</span>
                </label>
              ))}
            </div>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          {/* Dirección y Ciudad en fila */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                placeholder="Ej: Av. Colón 1234"
                {...register("address")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Ciudad <span className="text-red-500">*</span>
              </Label>
              <Select
                defaultValue={watch("city")}
                onValueChange={(v) => setValue("city", v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná" />
                </SelectTrigger>
                <SelectContent>
                  {CIUDADES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.city && (
                <p className="text-sm text-red-500">{errors.city.message}</p>
              )}
            </div>
          </div>

          {/* Teléfono y WhatsApp */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                placeholder="+54 9 223 500-1234"
                {...register("phone")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp_number">WhatsApp</Label>
              <Input
                id="whatsapp_number"
                placeholder="+54 9 223 500-1234"
                {...register("whatsapp_number")}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email de contacto</Label>
            <Input
              id="email"
              type="email"
              placeholder="mi-salon@email.com"
              {...register("email")}
              className={errors.email ? "border-red-400" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
        </div>
      </WizardCard>
    </div>
  );
}

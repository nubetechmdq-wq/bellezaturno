"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Image as ImageIcon, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WizardCard, StepIndicator } from "@/components/onboarding/wizard-components";
import { saveOnboardingData, getOnboardingData } from "@/lib/onboarding-store";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  isHero?: boolean;
}

export default function OnboardingStep3() {
  const router = useRouter();
  const saved = getOnboardingData();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newImages = Array.from(files)
      .slice(0, 5 - images.length)
      .filter((f) => f.type.startsWith("image/"))
      .map((file, i) => ({
        id: Date.now().toString() + i,
        file,
        preview: URL.createObjectURL(file),
        isHero: images.length === 0 && i === 0,
      }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      // Si se elimina el hero, asignar el primero como hero
      if (filtered.length > 0 && !filtered.some((i) => i.isHero)) {
        filtered[0].isHero = true;
      }
      return filtered;
    });
  };

  const setHero = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({ ...img, isHero: img.id === id }))
    );
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("tenantId", saved.tenantId ?? "");

      const heroImg = images.find((i) => i.isHero) ?? images[0];
      const galleryImgs = images.filter((i) => !i.isHero);

      if (heroImg) formData.append("hero", heroImg.file);
      galleryImgs.forEach((img) => formData.append("gallery", img.file));

      let heroUrl = saved.hero_image_url;
      let galleryUrls = saved.gallery_urls ?? [];

      if (images.length > 0) {
        const res = await fetch("/api/onboarding/step3", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          heroUrl = data.heroUrl;
          galleryUrls = data.galleryUrls;
        }
      }

      saveOnboardingData({ hero_image_url: heroUrl, gallery_urls: galleryUrls });
      router.push("/onboarding/step4");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-4">
      <StepIndicator currentStep={3} />
      <WizardCard
        currentStep={3}
        title="Fotos de tu salón"
        description="Subí una foto principal y hasta 4 fotos del ambiente. Hacen que los clientes confíen más."
        isLoading={isLoading}
        onNext={handleNext}
        onBack={() => router.push("/onboarding/step2")}
        nextLabel={images.length > 0 ? "Continuar →" : "Saltar por ahora →"}
      >
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">
              Arrastrá fotos aquí o{" "}
              <span className="text-indigo-600">hacé clic para seleccionar</span>
            </p>
            <p className="text-sm text-gray-400 mt-1">
              JPG, PNG o WebP · Máx 5 fotos · 5MB por foto
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {/* Grid de imágenes seleccionadas */}
          <AnimatePresence>
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((img) => (
                  <motion.div
                    key={img.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative aspect-square rounded-xl overflow-hidden group"
                  >
                    <img
                      src={img.preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay de acciones */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        onClick={() => setHero(img.id)}
                        title="Foto principal"
                        className="p-2 bg-white/90 rounded-full hover:bg-white transition"
                      >
                        <Star
                          className={`w-4 h-4 ${img.isHero ? "text-yellow-500 fill-yellow-500" : "text-gray-600"}`}
                        />
                      </button>
                      <button
                        onClick={() => removeImage(img.id)}
                        className="p-2 bg-white/90 rounded-full hover:bg-white transition"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                    {/* Badge de foto principal */}
                    {img.isHero && (
                      <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-900" /> Hero
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          <p className="text-xs text-gray-400 text-center">
            La foto marcada con ⭐ se usará como imagen principal de tu landing page.
            Pasá el cursor sobre una foto para cambiarla.
          </p>
        </div>
      </WizardCard>
    </div>
  );
}

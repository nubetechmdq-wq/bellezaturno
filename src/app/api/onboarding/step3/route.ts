import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createAdminClient();

  try {
    const formData = await req.formData();
    const tenantId = formData.get("tenantId") as string;
    const heroFile = formData.get("hero") as File | null;
    const galleryFiles = formData.getAll("gallery") as File[];

    let heroUrl: string | undefined;
    const galleryUrls: string[] = [];

    // Subir foto hero a Supabase Storage
    if (heroFile) {
      const ext = heroFile.name.split(".").pop();
      const path = `${tenantId}/hero.${ext}`;
      const { data, error } = await admin.storage
        .from("salon-images")
        .upload(path, heroFile, { upsert: true, contentType: heroFile.type });

      if (!error) {
        const { data: urlData } = admin.storage
          .from("salon-images")
          .getPublicUrl(path);
        heroUrl = urlData.publicUrl;
      }
    }

    // Subir fotos de galería
    for (let i = 0; i < galleryFiles.length; i++) {
      const file = galleryFiles[i];
      const ext = file.name.split(".").pop();
      const path = `${tenantId}/gallery-${i}.${ext}`;
      const { error } = await admin.storage
        .from("salon-images")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (!error) {
        const { data: urlData } = admin.storage
          .from("salon-images")
          .getPublicUrl(path);
        galleryUrls.push(urlData.publicUrl);
      }
    }

    // Actualizar el tenant con las URLs
    await admin
      .from("tenants")
      .update({
        hero_image_url: heroUrl,
        gallery_urls: galleryUrls,
        onboarding_step: 3,
      })
      .eq("id", tenantId);

    return NextResponse.json({ heroUrl, galleryUrls });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

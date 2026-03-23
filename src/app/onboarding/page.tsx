import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Si ya tiene tenant y completó el onboarding, ir al dashboard
  const supabase = createAdminClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, onboarding_step, onboarding_completed")
    .eq("owner_clerk_id", userId)
    .single();

  if (tenant?.onboarding_completed) {
    redirect("/dashboard");
  }

  // Redirigir al paso correspondiente según el progreso
  if (tenant) {
    const step = Math.min(Math.max((tenant.onboarding_step ?? 0) + 1, 1), 6);
    redirect(`/onboarding/step${step}`);
  }

  redirect("/onboarding/step1");
}

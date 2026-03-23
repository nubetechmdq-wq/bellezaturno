import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

// Cliente Supabase para uso en el SERVIDOR (Server Components, Route Handlers)
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignorar en Server Components (no pueden modificar cookies)
          }
        },
      },
    }
  );
}

// Cliente con service_role para operaciones admin (sin RLS)
export function createAdminClient() {
  // Importación dinámica tipada para cliente admin
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

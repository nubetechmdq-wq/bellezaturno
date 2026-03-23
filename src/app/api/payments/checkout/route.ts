import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/server";
import { MercadoPagoConfig, PreApproval } from "mercadopago";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createAdminClient();

  // Obtener tenant del usuario actual
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, plan")
    .eq("owner_clerk_id", userId)
    .single();

  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  if (tenant.plan === "pro") return NextResponse.json({ error: "Ya estás suscrito al plan Pro" }, { status: 400 });

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress || "email@test.com";

  try {
    const client = new MercadoPagoConfig({ 
      accessToken: process.env.MP_ACCESS_TOKEN || "", 
      options: { timeout: 10000 } 
    });

    const preapproval = new PreApproval(client);
    
    // CAMBIO FÁCIL: Configuración del precio de la suscripción mensual
    const result = await preapproval.create({
      body: {
        reason: `Plan Pro Mensual - ${tenant.name}`,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          // CAMBIO FÁCIL: Precio mensual de tu SaaS BellezaTurno
          transaction_amount: 15000, 
          currency_id: "ARS"
        },
        back_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?status=success`,
        payer_email: email,
        external_reference: tenant.id, // VITAL: nos permite identificar por webhook
        status: "pending"
      }
    });

    return NextResponse.json({ init_point: result.init_point });
  } catch (error: any) {
    console.error("[MP Checkout Error]:", error);
    return NextResponse.json({ error: "Error al crear la suscripción" }, { status: 500 });
  }
}

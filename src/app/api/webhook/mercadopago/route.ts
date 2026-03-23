import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { MercadoPagoConfig, PreApproval } from "mercadopago";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, type, data } = body;

    // Solo nos interesan las notificaciones de suscripciones (preapproval)
    if (type !== 'subscription_preapproval' && !action?.includes("subscription")) {
      return NextResponse.json({ ok: true, status: "ignored" });
    }

    const { id } = data || {};
    if (!id) return NextResponse.json({ ok: true });

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || "" });
    const preapprovalClient = new PreApproval(client);
    
    // Obtener info completa de la suscripción para leer el status y el external_reference
    const subscription = await preapprovalClient.get({ id });

    if (!subscription || !subscription.external_reference) {
      return NextResponse.json({ ok: true, status: "missing_reference" });
    }

    const tenantId = subscription.external_reference;
    const admin = createAdminClient();

    // Actualizar tenant acorde al estado de la suscripción
    if (subscription.status === "authorized") {
      // Suscripción activa
      await admin.from("tenants").update({
        plan: "pro",
        mp_subscription_id: id,
        mp_payer_id: subscription.payer_id?.toString()
      }).eq("id", tenantId);
    } else if (subscription.status === "cancelled" || subscription.status === "paused") {
      // Suscripción dada de baja o pausada, pasar a freemium
      await admin.from("tenants").update({
        plan: "free"
      }).eq("id", tenantId);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[MP Webhook Error]:", error);
    // Retornamos 200 porque Mercado Pago reintenta si el webhook falla o tarda mucho, 
    // y no queremos infinitos reintentos por un desajuste temporal.
    return NextResponse.json({ ok: true, error: error.message });
  }
}

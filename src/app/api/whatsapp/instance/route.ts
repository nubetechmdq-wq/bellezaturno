import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/server";

const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;

/**
 * API para gestionar instancias de WhatsApp por Salón
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, slug")
    .eq("owner_clerk_id", userId)
    .single();

  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const instanceName = `bt-${tenant.slug}`;

  try {
    // Consultar estado en Evolution API
    const response = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, {
      headers: { "apikey": EVOLUTION_KEY || "" },
    });

    if (!response.ok) {
        return NextResponse.json({ status: "disconnected" });
    }

    const data = await response.json();
    
    // Actualizar estado en DB de forma automática
    await supabase
      .from("whatsapp_config")
      .upsert({ 
        tenant_id: tenant.id,
        evolution_instance_name: instanceName,
        instance_status: data.instance?.state || "disconnected"
      }, { onConflict: "tenant_id" });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Failed to connect to WhatsApp service" });
  }
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, slug")
    .eq("owner_clerk_id", userId)
    .single();

  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const instanceName = `bt-${tenant.slug}`;

  try {
    // 1. Crear instancia si no existe
    const createRes = await fetch(`${EVOLUTION_URL}/instance/create`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "apikey": EVOLUTION_KEY || "" 
      },
      body: JSON.stringify({
        instanceName,
        token: tenant.slug, // Un token simple basado en el slug
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      })
    });

    const createData = await createRes.json();
    console.log("[Evolution Create]", createData);

    let connectData = createData?.qrcode;

    if (!connectData?.base64) {
      // 3. Obtener el QR (Evolution v2 /connect)
      const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
          headers: { "apikey": EVOLUTION_KEY || "" },
      });
      connectData = await connectRes.json();
      console.log("[Evolution Connect fallback]", connectData);
    }

    // 4. Configurar el Webhook para recibir mensajes. Usamos NEXT_PUBLIC_APP_URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
      const webhookUrl = `${appUrl}/api/webhook/whatsapp`;
      await fetch(`${EVOLUTION_URL}/webhook/set/${instanceName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": EVOLUTION_KEY || ""
        },
        body: JSON.stringify({
          webhook: {
            url: webhookUrl,
            byEvents: false,
            base64: false,
            events: ["MESSAGES_UPSERT"]
          }
        })
      });
      console.log(`[Webhook] Configure for ${instanceName} pointing to ${webhookUrl}`);
    }

    await supabase
      .from("whatsapp_config")
      .upsert({ 
        tenant_id: tenant.id,
        evolution_instance_name: instanceName,
        instance_status: "connecting"
      }, { onConflict: "tenant_id" });

    return NextResponse.json(connectData);
  } catch (error: any) {
    console.error("[Evolution Fatal Error]", error);
    return NextResponse.json({ error: "Failed to create instance", details: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, slug")
    .eq("owner_clerk_id", userId)
    .single();

  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const instanceName = `bt-${tenant.slug}`;

  try {
    // Cerrar sesión y borrar instancia
    await fetch(`${EVOLUTION_URL}/instance/logout/${instanceName}`, {
      method: "DELETE",
      headers: { "apikey": EVOLUTION_KEY || "" },
    });

    await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, {
        method: "DELETE",
        headers: { "apikey": EVOLUTION_KEY || "" },
    });

    await supabase
      .from("whatsapp_config")
      .update({ 
        instance_status: "disconnected"
      })
      .eq("tenant_id", tenant.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}

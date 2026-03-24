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
    // 1. Intentar crear instancia
    const createRes = await fetch(`${EVOLUTION_URL}/instance/create`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "apikey": EVOLUTION_KEY || "" 
      },
      body: JSON.stringify({
        instanceName,
        token: tenant.slug, 
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      })
    });

    const createData = await createRes.json();
    console.log("[Evolution Create Response]", createRes.status, createData);

    let connectData = null;

    if (createRes.status === 201) {
      // Éxito en creación, buscamos el QR en la respuesta
      connectData = createData?.qrcode || createData?.instance?.qrcode;
    } else if (createRes.status === 403 || createRes.status === 401) {
       return NextResponse.json({ error: "Error de API Key en Evolution API" }, { status: 403 });
    } else {
      // Si ya existe (409) o falló de otra forma, intentamos /connect
      console.log(`[Evolution] Create returned ${createRes.status}, attempting /connect fallback...`);
      const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
          headers: { "apikey": EVOLUTION_KEY || "" },
      });
      connectData = await connectRes.json();
      console.log("[Evolution Connect Result]", connectRes.status, connectData);
    }

    // Si llegamos acá y no tenemos QR base64, hay un problema real
    if (!connectData?.base64 && !connectData?.qrcode?.base64) {
      return NextResponse.json({ 
        error: "No se pudo obtener el QR de Evolution API", 
        details: connectData 
      }, { status: 400 });
    }

    // 4. Configurar el Webhook para recibir mensajes (Refuerzo v2)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
      const webhookUrl = `${appUrl}/api/webhook/whatsapp`;
      console.log(`[Webhook] Configuring for ${instanceName} pointing to ${webhookUrl}`);
      
      const webhookRes = await fetch(`${EVOLUTION_URL}/webhook/instance/${instanceName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": EVOLUTION_KEY || ""
        },
        body: JSON.stringify({
          url: webhookUrl,
          enabled: true,
          webhook_by_events: false,
          events: ["MESSAGES_UPSERT", "messages.upsert"]
        })
      });

      const webhookData = await webhookRes.json();
      console.log(`[Webhook Response]`, webhookRes.status, webhookData);

      // LOG DE DIAGNÓSTICO EN DB - Muy importante para depuración remota
      await supabase.from("analytics_events").insert({
        tenant_id: tenant.id,
        event_type: "webhook_registration_attempt",
        properties: {
          status: webhookRes.status,
          response: webhookData,
          url_used: webhookUrl,
          instance: instanceName
        }
      });
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

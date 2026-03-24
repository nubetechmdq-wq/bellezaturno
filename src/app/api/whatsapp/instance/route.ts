import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/server";

const WHATSAPP_SERVER_URL = process.env.EVOLUTION_API_URL;
const WHATSAPP_SERVER_KEY = process.env.EVOLUTION_API_KEY;

/**
 * API para gestionar instancias de WhatsApp por Salón (Baileys Server)
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
    // Consultar estado en el nuevo servidor Baileys
    const response = await fetch(`${WHATSAPP_SERVER_URL}/instance/status/${instanceName}`, {
      headers: { "apikey": WHATSAPP_SERVER_KEY || "" },
    });

    if (!response.ok) {
        return NextResponse.json({ status: "disconnected" });
    }

    const data = await response.json();
    const state = data.instance?.state || "disconnected";
    
    // Actualizar estado en DB de forma automática
    await supabase
      .from("whatsapp_config")
      .upsert({ 
        tenant_id: tenant.id,
        evolution_instance_name: instanceName,
        instance_status: state
      }, { onConflict: "tenant_id" });

    return NextResponse.json({ instance: { state } });
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bellezaturno.com";
  const webhookUrl = `${appUrl}/api/webhook/whatsapp`;

  try {
    // 1. Crear instancia (el nuevo servidor devuelve el QR en el 201)
    const createRes = await fetch(`${WHATSAPP_SERVER_URL}/instance/create`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "apikey": WHATSAPP_SERVER_KEY || ""
      },
      body: JSON.stringify({
        instanceName,
        webhookUrl
      })
    });

    const createData = await createRes.json();
    
    if (!createRes.ok) {
       return NextResponse.json({ error: `Error en WhatsApp Server`, detail: createData }, { status: createRes.status });
    }

    // El servidor devuelve { status, base64 } (donde base64 es el QR) o { status: "open" }
    const connectData = createData.status === "open" ? { status: "open" } : { base64: createData.base64 };

    // Log para analytics
    await supabase.from("analytics_events").insert({
      tenant_id: tenant.id,
      event_type: "whatsapp_creation_log",
      properties: { step: "create", status: createRes.status, success: !!createData.base64 || createData.status === "open" }
    });

    await supabase
      .from("whatsapp_config")
      .upsert({ 
        tenant_id: tenant.id,
        evolution_instance_name: instanceName,
        instance_status: createData.status || "connecting"
      }, { onConflict: "tenant_id" });

    return NextResponse.json(connectData);
  } catch (error: any) {
    console.error("[WhatsApp Server Error]", error);
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
    // Borrar instancia con una sola llamada
    await fetch(`${WHATSAPP_SERVER_URL}/instance/delete/${instanceName}`, {
      method: "DELETE",
      headers: { "apikey": WHATSAPP_SERVER_KEY || "" },
    });

    await supabase
      .from("whatsapp_config")
      .update({ 
        instance_status: "disconnected"
      })
      .eq("tenant_id", tenant.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete instance" }, { status: 500 });
  }
}

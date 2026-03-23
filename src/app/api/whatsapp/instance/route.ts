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
      .update({ 
        instance_name: instanceName,
        instance_status: data.instance?.state || "disconnected"
      })
      .eq("tenant_id", tenant.id);

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
        qrcode: true
      })
    });

    const createData = await createRes.json();

    // 2. Si ya existe o se creó, el objeto devuelto suele tener el QR si qrcode: true
    // Si no, Evolution API lo devuelve en el siguiente paso o al consultar connect
    
    // 3. Obtener el QR (Evolution v2 /connect)
    const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        headers: { "apikey": EVOLUTION_KEY || "" },
    });
    
    const connectData = await connectRes.json();

    await supabase
      .from("whatsapp_config")
      .update({ 
        instance_name: instanceName,
        instance_status: "connecting"
      })
      .eq("tenant_id", tenant.id);

    return NextResponse.json(connectData);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create instance" }, { status: 500 });
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

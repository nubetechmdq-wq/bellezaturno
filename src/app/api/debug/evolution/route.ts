import { NextResponse } from "next/server";

const WHATSAPP_URL = process.env.EVOLUTION_API_URL;
const WHATSAPP_KEY = process.env.EVOLUTION_API_KEY;

export async function GET() {
  const results: any = {
    env: {
      url: WHATSAPP_URL || "NOT SET",
      keyLength: WHATSAPP_KEY?.length || 0,
      keyPreview: WHATSAPP_KEY ? WHATSAPP_KEY.substring(0, 8) + "..." : "NOT SET",
    },
    tests: {}
  };

  // Test 1: Verificar el servidor (health)
  try {
    const r = await fetch(`${WHATSAPP_URL}/health`);
    const body = await r.json();
    results.tests.health = { status: r.status, data: body };
  } catch (e: any) {
    results.tests.health = { error: e.message };
  }

  // Test 2: Intentar consultar una instancia de prueba
  try {
    const r = await fetch(`${WHATSAPP_URL}/instance/status/debug-test`, {
      headers: { "apikey": WHATSAPP_KEY || "" },
    });
    const body = await r.text();
    results.tests.instanceStatus = { status: r.status, body: body.substring(0, 500) };
  } catch (e: any) {
    results.tests.instanceStatus = { error: e.message };
  }

  return NextResponse.json(results);
}

import { NextResponse } from "next/server";

const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;

export async function GET() {
  const results: any = {
    env: {
      url: EVOLUTION_URL || "NOT SET",
      keyLength: EVOLUTION_KEY?.length || 0,
      keyPreview: EVOLUTION_KEY ? EVOLUTION_KEY.substring(0, 8) + "..." : "NOT SET",
    },
    tests: {}
  };

  // Test 1: fetchInstances
  try {
    const r = await fetch(`${EVOLUTION_URL}/instance/fetchInstances`, {
      headers: { "apikey": EVOLUTION_KEY || "" },
    });
    const body = await r.text();
    results.tests.fetchInstances = { status: r.status, body: body.substring(0, 500) };
  } catch (e: any) {
    results.tests.fetchInstances = { error: e.message };
  }

  // Test 2: create con la instancia real
  try {
    const r = await fetch(`${EVOLUTION_URL}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": EVOLUTION_KEY || "",
      },
      body: JSON.stringify({
        instanceName: "bt-debug-test",
        qrcode: false,
        integration: "WHATSAPP-BAILEYS"
      })
    });
    const body = await r.text();
    results.tests.createInstance = { status: r.status, body: body.substring(0, 500) };
  } catch (e: any) {
    results.tests.createInstance = { error: e.message };
  }

  return NextResponse.json(results);
}

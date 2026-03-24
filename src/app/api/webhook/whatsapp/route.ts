import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const admin = createAdminClient();
    const body = await req.json();
    console.log("[Webhook Received]", JSON.stringify(body, null, 2));

    const event = body.event || body.type || body.event_type;
    const instanceName = body.instance || body.instanceName || body.instance_name;
    if (event !== "MESSAGES_UPSERT" && event !== "messages.upsert") {
      return NextResponse.json({ ok: true, ignored: true, event });
    }

    // Extraemos los datos principales de forma flexible (v1 vs v2)
    const data = body.data || body;
    const messageData = data.message || data.messages?.[0]?.message || data.messages?.[0];
    const key = data.key || data.messages?.[0]?.key;
    const remoteJid = key?.remoteJid;
    const fromMe = key?.fromMe;

    if (fromMe) return NextResponse.json({ ok: true, message: "Ignored: From Me" });
    if (!remoteJid || !messageData) return NextResponse.json({ ok: true, message: "Missing data", hasJid: !!remoteJid, hasMsg: !!messageData });
    if (remoteJid.includes("@g.us")) return NextResponse.json({ ok: true, message: "Ignored: Group chat" });

    const clientName = data.pushName || data.messages?.[0]?.pushName || "Cliente";

    console.log(`[Webhook] Processing message from ${remoteJid} (${clientName}) for instance ${instanceName}`);

    // Extraer texto (puede venir en diferentes propiedades según Evolution Mappings)
    const textMsg =
      messageData.conversation ||
      messageData.extendedTextMessage?.text ||
      messageData.text ||
      messageData.caption ||
      messageData.message?.conversation ||
      "";

    if (!textMsg.trim()) return NextResponse.json({ ok: true });

    // 1. Identificar el Tenant vía instanceName
    // Buscamos primero el tenant_id sin importar si está activo o no para poder loguear el hit
    const { data: configCheck } = await admin
      .from("whatsapp_config")
      .select("tenant_id, is_active")
      .eq("evolution_instance_name", instanceName)
      .single();

    if (configCheck) {
      await admin.from("analytics_events").insert({
        tenant_id: configCheck.tenant_id,
        event_type: "webhook_hit",
        properties: { instance: instanceName, remoteJid, bot_active: configCheck.is_active }
      });
    }

    // 2. Ahora sí, buscar la config completa solo si está activa
    const { data: config } = await admin
      .from("whatsapp_config")
      .select("*, tenants(*, services(name, description, duration_minutes, price))")
      .eq("evolution_instance_name", instanceName)
      .eq("is_active", true)
      .single();

    if (!config || !config.tenants) {
      console.log(`No se encontró config activa para la instancia: ${instanceName}`);
      return NextResponse.json({ ok: true });
    }

    const tenant = config.tenants as any;
    const landingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/s/${tenant.slug}`;

    // 2. Obtener o crear conversación (contexto)
    const { data: conv, error: convError } = await admin
      .from("whatsapp_conversations")
      .select("*")
      .eq("tenant_id", config.tenant_id)
      .eq("client_phone", remoteJid)
      .single();

    let conversationContext = [];
    if (!conv) {
      await admin.from("whatsapp_conversations").insert({
        tenant_id: config.tenant_id,
        client_phone: remoteJid,
        client_name: clientName,
        message_count: 1,
        last_message: textMsg,
        context: { history: [] }
      });
    } else {
      conversationContext = (conv.context as any)?.history || [];
      await admin.from("whatsapp_conversations").update({
        message_count: conv.message_count + 1,
        last_message: textMsg,
      }).eq("id", conv.id);
    }

    // 3. Preparar el Prompt del Asistente (Sistema)
    const systemPrompt = `Eres el asistente virtual amable y profesional de "${tenant.name}" (${tenant.type}), un negocio ubicado en ${tenant.city}.
Tu trabajo es responder preguntas sobre el salón, los servicios, precios y horarios.

REGLAS DE PERSONALIDAD (IMPORTANTE):
${config.ai_instructions || "Sé amable y servicial."}

IMPORTANTE SOBRE RESERVAS:
- Tú NO debes agendar turnos explícitamente conversando con el cliente ya que no tienes acceso en tiempo real al calendario para bloquear espacios.
- Si el cliente quiere reservar, solicitar un turno o ver disponibilidad, SIEMPRE dale una respuesta breve y proporcionale ESTE ENLACE OBLIGATORIO para que el mismo acceda a la agenda online 24/7: ${landingUrl}
- Nunca intentes adivinar horarios libres ni registrar el turno por ti mismo.

DATOS DEL SALÓN:
- Dirección: ${tenant.address || "Consultar"}
- Horarios: El negocio cuenta con disponibilidad configurada. (Derivar al link para ver slots libres de hoy o mañana).
- Servicios Ofrecidos:
${tenant.services.map((s: any) => `  * ${s.name} - $${s.price} (${s.duration_minutes} min)`).join("\n")}

INSTRUCCIONES FINALES:
- Habla en español de Argentina (voseo: decí "podés", "tenés", "entrá").
- Sé breve y conciso, máximo 3 o 4 renglones por mensaje de WhatsApp.
- Evita párrafos largos, usa emojis sutiles.
`;

    // 4. Llamar a Gemini
    let replyText = "";
    try {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "tu_gemini_api_key") {
        throw new Error("GEMINI_API_KEY no configurada correctamente en Vercel.");
      }

      const history = conversationContext.slice(-4).map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }]
      }));

      // Usamos la sintaxis original esperada por la librería instalada
      // @ts-ignore
      const chatSession = await ai.chats.create({
        model: "gemini-1.5-flash", 
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3,
        },
        history
      });

      const response = await chatSession.sendMessage({ message: textMsg });
      replyText = response.text || "Lo siento, no pude procesar tu mensaje.";

      // Guardar historial
      const newHistory = [
        ...conversationContext,
        { role: "user", content: textMsg },
        { role: "assistant", content: replyText }
      ].slice(-10);
      
      await admin.from("whatsapp_conversations").update({
        context: { history: newHistory }
      }).eq("tenant_id", config.tenant_id).eq("client_phone", remoteJid);

    } catch (aiError: any) {
      console.error("[Gemini Error]", aiError);
      replyText = `Lo siento, estoy teniendo un inconveniente técnico (Error IA). Por favor, reservá directamente acá: ${landingUrl}`;
    }

    // 5. Enviar mensaje de vuelta vía Evolution API
    if (EVOLUTION_API_URL && EVOLUTION_API_KEY) {
      const sendRes = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": EVOLUTION_API_KEY,
          "apiKey": EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          number: remoteJid,
          text: replyText
        })
      });
      console.log("[Evolution Send]", sendRes.status, await sendRes.text());
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error(`[Webhook] Error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

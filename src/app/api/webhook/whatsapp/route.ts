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

    const instanceName = body.instance;
    const data = body.data;
    
    if (!instanceName || !data) {
      return NextResponse.json({ ok: true, ignored: true, reason: "Missing instance or data" });
    }

    const key = data.key;
    const messageData = data.message;
    const remoteJid = key?.remoteJid;
    const fromMe = key?.fromMe;

    if (fromMe) return NextResponse.json({ ok: true, message: "Ignored: From Me" });
    if (!remoteJid || !messageData) return NextResponse.json({ ok: true, message: "Missing data", hasJid: !!remoteJid, hasMsg: !!messageData });
    if (remoteJid.includes("@g.us")) return NextResponse.json({ ok: true, message: "Ignored: Group chat" });

    const clientName = body.pushName || data.pushName || "Cliente";

    console.log(`[Webhook] Processing message from ${remoteJid} (${clientName}) for instance ${instanceName}`);

    // Extraer texto del mensaje de forma robusta para Baileys
    const textMsg =
      messageData.conversation ||
      messageData.extendedTextMessage?.text ||
      messageData.imageMessage?.caption ||
      messageData.videoMessage?.caption ||
      "";

    if (!textMsg.trim()) return NextResponse.json({ ok: true });

    // 1. Identificar el Tenant vía instanceName
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
    const { data: conv } = await admin
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
        throw new Error("GEMINI_API_KEY no configurada correctamente.");
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
      replyText = `Lo siento, estoy teniendo un inconveniente técnico. Por favor, reservá directamente acá: ${landingUrl}`;
    }

    // 5. Enviar mensaje de vuelta vía el nuevo servidor Baileys
    if (EVOLUTION_API_URL && EVOLUTION_API_KEY) {
      try {
        const sendRes = await fetch(`${EVOLUTION_API_URL}/send/text`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": EVOLUTION_API_KEY
          },
          body: JSON.stringify({
            instanceName: instanceName,
            number: remoteJid,
            text: replyText
          })
        });
        if (!sendRes.ok) {
          console.error("[WhatsApp Send Error]", sendRes.status, await sendRes.text());
        }
      } catch (err: any) {
        console.error("[WhatsApp Send Fatal]", err.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error(`[Webhook] Error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

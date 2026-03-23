-- Migración: Añadir instrucciones de IA y estado de instancia a whatsapp_config
ALTER TABLE public.whatsapp_config 
ADD COLUMN IF NOT EXISTS ai_instructions TEXT DEFAULT 'Eres un asistente amable de una barbería/estética. Tu objetivo es saludar al cliente y proporcionarle el link de reserva si lo solicita.',
ADD COLUMN IF NOT EXISTS instance_name TEXT,
ADD COLUMN IF NOT EXISTS instance_status TEXT DEFAULT 'disconnected';

-- Actualizar comentario de la tabla
COMMENT ON COLUMN public.whatsapp_config.ai_instructions IS 'Instrucciones específicas para el bot de Gemini';
COMMENT ON COLUMN public.whatsapp_config.instance_name IS 'Nombre de la instancia en Evolution API';
COMMENT ON COLUMN public.whatsapp_config.instance_status IS 'Estado de la conexión (open, connecting, disconnected)';

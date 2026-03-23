-- ============================================================
-- BELLEZATURNO - Schema completo de base de datos
-- Aplicar en: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsqueda de texto

-- ============================================================
-- TABLA: tenants (un tenant = un salón)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tenants (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_clerk_id        TEXT NOT NULL UNIQUE,   -- ID del usuario en Clerk
  clerk_org_id          TEXT,                   -- Org de Clerk (opcional para multi-seat)
  
  -- Datos básicos
  name                  TEXT NOT NULL,
  slug                  TEXT NOT NULL UNIQUE,   -- URL: bellezaturno.com/s/mi-salon
  type                  TEXT NOT NULL DEFAULT 'barberia' 
                          CHECK (type IN ('barberia', 'peluqueria', 'spa', 'salon')),
  description           TEXT,
  address               TEXT,
  city                  TEXT NOT NULL DEFAULT 'Mar del Plata',
  phone                 TEXT,
  whatsapp_number       TEXT,
  email                 TEXT,
  website               TEXT,
  
  -- Apariencia (CAMBIO FÁCIL: paleta de colores del salón)
  primary_color         TEXT NOT NULL DEFAULT '#6366f1',   -- Indigo default
  secondary_color       TEXT NOT NULL DEFAULT '#10b981',   -- Emerald default
  accent_color          TEXT NOT NULL DEFAULT '#f59e0b',
  hero_image_url        TEXT,
  logo_url              TEXT,
  gallery_urls          TEXT[] DEFAULT '{}',
  style_preset          TEXT DEFAULT 'glassmorphism'
                          CHECK (style_preset IN ('glassmorphism', 'minimal', 'bold', 'classic')),
  
  -- Horarios (JSON con estructura de disponibilidad)
  -- Ejemplo: {"monday": {"open": "09:00", "close": "18:00", "enabled": true}, ...}
  schedule              JSONB DEFAULT '{
    "monday":    {"open": "09:00", "close": "19:00", "enabled": true},
    "tuesday":   {"open": "09:00", "close": "19:00", "enabled": true},
    "wednesday": {"open": "09:00", "close": "19:00", "enabled": true},
    "thursday":  {"open": "09:00", "close": "19:00", "enabled": true},
    "friday":    {"open": "09:00", "close": "19:00", "enabled": true},
    "saturday":  {"open": "09:00", "close": "14:00", "enabled": true},
    "sunday":    {"open": "09:00", "close": "13:00", "enabled": false}
  }'::jsonb,
  
  -- Configuración de reservas
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  max_advance_days      INTEGER NOT NULL DEFAULT 30,
  cancellation_hours    INTEGER NOT NULL DEFAULT 2,
  
  -- Plan y suscripción (CAMBIO FÁCIL: precios de planes)
  plan                  TEXT NOT NULL DEFAULT 'free' 
                          CHECK (plan IN ('free', 'pro')),
  plan_expires_at       TIMESTAMPTZ,
  mp_subscription_id    TEXT,  -- ID de suscripción en Mercado Pago
  mp_payer_id           TEXT,
  
  -- WhatsApp
  whatsapp_enabled      BOOLEAN NOT NULL DEFAULT false,
  whatsapp_verified     BOOLEAN NOT NULL DEFAULT false,
  
  -- SEO automático
  meta_title            TEXT,
  meta_description      TEXT,
  
  -- Custom domain (plan Pro)
  custom_domain         TEXT,
  
  -- Onboarding progress (0-6 steps)
  onboarding_step       INTEGER NOT NULL DEFAULT 0,
  onboarding_completed  BOOLEAN NOT NULL DEFAULT false,
  
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: services (servicios que ofrece el salón)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.services (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  name              TEXT NOT NULL,
  description       TEXT,
  duration_minutes  INTEGER NOT NULL DEFAULT 30,
  price             NUMERIC(10, 2) NOT NULL DEFAULT 0,
  image_url         TEXT,
  
  is_active         BOOLEAN NOT NULL DEFAULT true,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: bookings (turnos reservados)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  service_id        UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  
  -- Datos del cliente
  client_name       TEXT NOT NULL,
  client_phone      TEXT NOT NULL,
  client_email      TEXT,
  client_clerk_id   TEXT,    -- Si el cliente está registrado en Clerk
  
  -- Tiempo del turno
  starts_at         TIMESTAMPTZ NOT NULL,
  ends_at           TIMESTAMPTZ NOT NULL,
  
  -- Estado del turno
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  
  notes             TEXT,
  admin_notes       TEXT,
  
  -- Origen de la reserva para analytics
  source            TEXT NOT NULL DEFAULT 'landing'
                      CHECK (source IN ('landing', 'whatsapp', 'dashboard')),
  
  -- Recordatorios enviados
  reminder_24h_sent BOOLEAN NOT NULL DEFAULT false,
  reminder_1h_sent  BOOLEAN NOT NULL DEFAULT false,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: testimonials (reseñas del salón)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.testimonials (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  client_name   TEXT NOT NULL,
  content       TEXT NOT NULL,
  rating        INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  avatar_url    TEXT,
  service_name  TEXT,  -- Qué servicio usó (opcional)
  
  is_active     BOOLEAN NOT NULL DEFAULT true,
  is_approved   BOOLEAN NOT NULL DEFAULT true,
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: whatsapp_config (configuración del bot por salón)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                 UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Meta / Evolution API
  phone_number_id           TEXT,    -- ID del número en Meta
  access_token              TEXT,    -- Token de acceso (encriptado en prod)
  evolution_instance_name   TEXT,    -- Nombre de la instancia en Evolution API
  
  -- Mensajes personalizados del bot (CAMBIO FÁCIL)
  greeting_message          TEXT NOT NULL DEFAULT '¡Hola! 👋 Soy el asistente virtual de {salon_name}. ¿En qué puedo ayudarte?',
  menu_message              TEXT NOT NULL DEFAULT '¿Qué servicio te interesa?\n\n{services_list}\n\nEscribí el número o el nombre del servicio.',
  booking_link_message      TEXT NOT NULL DEFAULT '¡Perfecto! 🎉 Aquí tu link para reservar:\n\n{booking_url}\n\nEs rápido y seguro. ¿Querés que te ayude con algo más?',
  booking_success_message   TEXT NOT NULL DEFAULT '✅ ¡Tu turno está confirmado! Te esperamos el {date} a las {time}.',
  cancel_message            TEXT NOT NULL DEFAULT 'Tu turno fue cancelado. ¡Cuando quieras volvé a reservar!',
  off_hours_message         TEXT NOT NULL DEFAULT 'Gracias por escribirnos 😊 Estamos fuera de horario. Nuestro horario es {schedule}. Te respondemos a la brevedad.',
  
  is_active                 BOOLEAN NOT NULL DEFAULT false,
  
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: whatsapp_conversations (contexto del bot por cliente)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  client_phone  TEXT NOT NULL,
  client_name   TEXT,
  last_message  TEXT,
  
  -- Contexto de la conversación para el bot (estado de la máquina)
  context       JSONB DEFAULT '{}'::jsonb,  
  -- Ejemplo: {"step": "menu", "selected_service_id": "uuid", "selected_date": "2024-03-20"}
  
  message_count INTEGER NOT NULL DEFAULT 0,
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(tenant_id, client_phone)
);

-- ============================================================
-- TABLA: analytics_events (eventos para métricas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  event_type  TEXT NOT NULL,  -- 'page_view', 'booking_started', 'booking_completed', 'whatsapp_click'
  properties  JSONB DEFAULT '{}'::jsonb,
  
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_owner ON public.tenants(owner_clerk_id);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON public.tenants(custom_domain) WHERE custom_domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_services_tenant ON public.services(tenant_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_bookings_tenant ON public.bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_starts_at ON public.bookings(starts_at);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_date ON public.bookings(tenant_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_reminders ON public.bookings(starts_at, reminder_24h_sent, status) 
  WHERE status IN ('pending', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_testimonials_tenant ON public.testimonials(tenant_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_whatsapp_conv ON public.whatsapp_conversations(tenant_id, client_phone);

CREATE INDEX IF NOT EXISTS idx_analytics_tenant_date ON public.analytics_events(tenant_id, created_at);

-- ============================================================
-- TRIGGERS para updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_whatsapp_config_updated_at
  BEFORE UPDATE ON public.whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_whatsapp_conv_updated_at
  BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Aislamiento por tenant
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- ---- POLÍTICAS: tenants ----
-- El dueño puede ver y editar su tenant
CREATE POLICY "tenants_owner_all" ON public.tenants
  FOR ALL USING (owner_clerk_id = auth.uid()::text);

-- Cualquiera puede leer tenants activos (para landing pages públicas)
CREATE POLICY "tenants_public_read" ON public.tenants
  FOR SELECT USING (is_active = true);

-- ---- POLÍTICAS: services ----
-- El dueño del tenant puede gestionar sus servicios
CREATE POLICY "services_owner_all" ON public.services
  FOR ALL USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_clerk_id = auth.uid()::text)
  );

-- Lectura pública de servicios activos (para landing pages)
CREATE POLICY "services_public_read" ON public.services
  FOR SELECT USING (is_active = true);

-- ---- POLÍTICAS: bookings ----
-- El dueño puede ver todos los turnos de su salón
CREATE POLICY "bookings_owner_all" ON public.bookings
  FOR ALL USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_clerk_id = auth.uid()::text)
  );

-- Clientes pueden ver sus propios turnos
CREATE POLICY "bookings_client_read" ON public.bookings
  FOR SELECT USING (client_clerk_id = auth.uid()::text);

-- Clientes pueden crear turnos (sin auth, via service role en API)
CREATE POLICY "bookings_public_insert" ON public.bookings
  FOR INSERT WITH CHECK (true);

-- ---- POLÍTICAS: testimonials ----
CREATE POLICY "testimonials_owner_all" ON public.testimonials
  FOR ALL USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_clerk_id = auth.uid()::text)
  );

CREATE POLICY "testimonials_public_read" ON public.testimonials
  FOR SELECT USING (is_active = true AND is_approved = true);

-- ---- POLÍTICAS: whatsapp_config ----
CREATE POLICY "whatsapp_config_owner_all" ON public.whatsapp_config
  FOR ALL USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_clerk_id = auth.uid()::text)
  );

-- ---- POLÍTICAS: whatsapp_conversations ----
CREATE POLICY "whatsapp_conv_owner_read" ON public.whatsapp_conversations
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_clerk_id = auth.uid()::text)
  );

-- ---- POLÍTICAS: analytics_events ----
CREATE POLICY "analytics_owner_read" ON public.analytics_events
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_clerk_id = auth.uid()::text)
  );

-- Inserción pública (desde landing pages y bots)
CREATE POLICY "analytics_public_insert" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- FUNCIÓN HELPER: verificar disponibilidad de slot
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_slot_available(
  p_tenant_id UUID,
  p_service_id UUID,
  p_starts_at TIMESTAMPTZ,
  p_ends_at TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE tenant_id = p_tenant_id
      AND status NOT IN ('cancelled')
      AND (starts_at, ends_at) OVERLAPS (p_starts_at, p_ends_at)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- DATOS INICIALES: tenant de demo
-- ============================================================
-- Este tenant sirve como página de demo en /s/demo
INSERT INTO public.tenants (
  owner_clerk_id, name, slug, type, description,
  address, city, phone, whatsapp_number,
  primary_color, secondary_color,
  onboarding_step, onboarding_completed, is_active,
  meta_title, meta_description
) VALUES (
  'demo_user_placeholder',
  'Barbería El Estilo',
  'demo',
  'barberia',
  'La barbería más moderna de Mar del Plata. Cortes, barba y tratamientos premium.',
  'Av. Colón 1234',
  'Mar del Plata',
  '+5492235001234',
  '5492235001234',
  '#6366f1',
  '#10b981',
  6,
  true,
  true,
  'Barbería El Estilo - Mar del Plata | BellezaTurno',
  'Reservá tu turno online en Barbería El Estilo. Cortes de pelo, barba y más en Mar del Plata.'
) ON CONFLICT (slug) DO NOTHING;

-- Insertar servicios de demo
WITH demo_tenant AS (SELECT id FROM public.tenants WHERE slug = 'demo')
INSERT INTO public.services (tenant_id, name, description, duration_minutes, price, sort_order)
SELECT dt.id, svc.name, svc.description, svc.duration, svc.price, svc.ord
FROM demo_tenant dt, (VALUES
  ('Corte de Pelo', 'Corte clásico o moderno, lavado incluido', 30, 4500, 1),
  ('Barba', 'Arreglo y perfilado de barba con navaja', 20, 3000, 2),
  ('Corte + Barba', 'El combo más pedido. Ahorrás $1000', 45, 6500, 3),
  ('Tintura', 'Coloración completa con productos premium', 90, 12000, 4),
  ('Tratamiento Capilar', 'Hidratación profunda y keratina', 60, 8500, 5)
) AS svc(name, description, duration, price, ord)
ON CONFLICT DO NOTHING;

-- Insertar testimonios de demo
WITH demo_tenant AS (SELECT id FROM public.tenants WHERE slug = 'demo')
INSERT INTO public.testimonials (tenant_id, client_name, content, rating, service_name)
SELECT dt.id, t.name, t.content, t.rating, t.service
FROM demo_tenant dt, (VALUES
  ('Martín G.', 'Excelente atención y el corte quedó perfecto. Muy recomendable.', 5, 'Corte + Barba'),
  ('Lucas R.', 'El mejor barbero de Mar del Plata. Siempre salgo conforme.', 5, 'Corte de Pelo'),
  ('Diego M.', 'Muy prolijo con la barba. Ya hice mi reserva para la semana que viene.', 5, 'Barba')
) AS t(name, content, rating, service)
ON CONFLICT DO NOTHING;

-- Insertar config de WhatsApp para demo
WITH demo_tenant AS (SELECT id FROM public.tenants WHERE slug = 'demo')
INSERT INTO public.whatsapp_config (tenant_id)
SELECT id FROM demo_tenant
ON CONFLICT DO NOTHING;
